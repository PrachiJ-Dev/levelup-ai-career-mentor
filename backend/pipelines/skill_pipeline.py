"""
Skill Gap Pipeline: Reads resume skills → DNN inference → Save to MongoDB
"""
import logging
from datetime import datetime
from bson import ObjectId

from database.mongodb import get_database
from database import collections
from models.skill_gap.inference import run_skill_gap_inference

logger = logging.getLogger("levelup")


async def process_skill_gap(
    user_id: str,
    resume_id: str,
    target_role: str,
) -> dict:
    """
    1. Load resume from MongoDB (get current_skills)
    2. Run DNN skill gap detection
    3. Save to skill_gaps collection
    """
    db = get_database()

    # Load resume
    try:
        resume = await db[collections.RESUMES].find_one({"_id": ObjectId(resume_id)})
    except Exception:
        resume = await db[collections.RESUMES].find_one({"_id": resume_id})

    if not resume:
        raise ValueError(f"Resume {resume_id} not found")

    current_skills = resume.get("entities", {}).get("skills", [])

    # Run inference
    result = run_skill_gap_inference(current_skills, target_role)

    # Build document
    doc = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "resume_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id,
        "target_role": target_role,
        "current_skills": result["current_skills"],
        "missing_skills": result["missing_skills"],
        "match_score": result["match_score"],
        "skill_scores": result["skill_scores"],
        "created_at": datetime.utcnow(),
        "demo": result.get("demo", False),
    }

    insert = await db[collections.SKILL_GAPS].insert_one(doc)
    doc["_id"] = str(insert.inserted_id)
    doc["user_id"] = user_id
    doc["resume_id"] = resume_id
    return doc
