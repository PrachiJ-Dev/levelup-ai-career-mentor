"""
Roadmap Pipeline.
Connects the API routes to the ML inference code, coordinates with MongoDB.
"""
from typing import Dict, Any
from bson import ObjectId
from datetime import datetime
import logging

from database.mongodb import get_database
from database import collections
from models.roadmap.pipeline_inference import run_roadmap_pipeline

logger = logging.getLogger("levelup")


async def generate_roadmap(skill_gap_id: str, user_id: str) -> Dict[str, Any]:
    """
    Generate an optimized learning roadmap for a given skill gap.
    Loads skill gap from DB, runs 4-step DL pipeline, saves roadmap to DB.
    """
    db = get_database()

    # 1. Load skill gap
    try:
        gap = await db[collections.SKILL_GAPS].find_one({"_id": ObjectId(skill_gap_id)})
    except Exception:
        gap = None

    if not gap:
        # Fallback to demo data if gap not found
        missing_skills = ["PyTorch", "Docker", "AWS", "Kubernetes", "TypeScript"]
        target_role = "Machine Learning Engineer"
        skill_gap_scores = {}
        current_skills = ["Python", "Machine Learning"]
    else:
        missing_skills = gap.get("missing_skills", [])
        target_role = gap.get("target_role", "")
        skill_gap_scores = gap.get("skill_scores", {})
        current_skills = gap.get("current_skills", [])

    if not missing_skills:
        raise ValueError("No missing skills provided for roadmap generation")

    # 1.5 Check for previous roadmap completion
    difficulty_level = "Beginner"
    completed_titles = []
    
    previous_roadmaps = await db[collections.ROADMAPS].find(
        {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id, "target_role": target_role}
    ).sort("created_at", -1).to_list(length=5)

    if previous_roadmaps:
        latest = previous_roadmaps[0]
        courses = latest.get("recommended_courses", [])
        is_fully_completed = all(c.get("is_completed") for c in courses) if courses else False
        
        # Collect all previously completed course titles
        for r in previous_roadmaps:
            for c in r.get("recommended_courses", []):
                if c.get("is_completed"):
                    completed_titles.append(c.get("course_title", ""))

        if is_fully_completed:
            difficulty_level = "Advanced"
        elif any(c.get("is_completed") for c in courses):
            difficulty_level = "Intermediate"

    # 2. Run DL Pipeline
    courses, metadata = run_roadmap_pipeline(
        missing_skills=missing_skills,
        target_role=target_role,
        skill_gap_scores=skill_gap_scores,
        current_skills=current_skills,
        difficulty_level=difficulty_level,
        exclude_titles=completed_titles
    )

    # Initialize completion status
    for c in courses:
        c["is_completed"] = False

    total_hours = sum(c.get("estimated_hours", 0) for c in courses)
    timeline_weeks = max(4, round(total_hours / 10))  # Assume 10 hours/week study time

    # 3. Create roadmap document
    doc = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "skill_gap_id": ObjectId(skill_gap_id) if ObjectId.is_valid(skill_gap_id) else skill_gap_id,
        "target_role": target_role,
        "recommended_courses": courses,
        "timeline_weeks": timeline_weeks,
        "pipeline_metadata": metadata,
        "created_at": datetime.utcnow(),
    }

    # 4. Save to MongoDB
    insert = await db[collections.ROADMAPS].insert_one(doc)
    doc["_id"] = insert.inserted_id
    
    # Format for JSON response
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"])
    doc["skill_gap_id"] = str(doc["skill_gap_id"])

    return doc
