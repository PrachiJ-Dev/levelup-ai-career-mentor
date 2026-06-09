"""
Career Trajectory Pipeline: Save history → LSTM → MongoDB
"""
import logging
from datetime import datetime
from bson import ObjectId
from typing import List, Dict

from database.mongodb import get_database
from database import collections
from models.career.inference import run_career_inference

logger = logging.getLogger("levelup")


async def process_career_prediction(
    user_id: str,
    history: List[Dict],
) -> dict:
    """
    1. Run LSTM career prediction
    2. Save to career_history collection
    """
    db = get_database()
    
    # If no history provided, try to extract from latest resume
    if not history:
        from database import collections
        # Query with both ObjectId and string to be robust
        user_query = {"user_id": {"$in": [ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id, user_id]}}
        latest_resume = await db[collections.RESUMES].find_one(
            user_query,
            sort=[("uploaded_at", -1)]
        )
        if latest_resume:
            entities = latest_resume.get("entities") or {}
            # Construct a baseline history step from the parsed resume
            roles = entities.get("job_titles") or ["Software Developer"]
            skills = entities.get("skills") or []
            role = roles[0] if roles else "Software Developer"
            history = [{"role": role, "year": datetime.utcnow().year, "skills": skills}]
            logger.info(f"Auto-extracted career history from resume for user {user_id}")

    result = run_career_inference(history)

    doc = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "history": history,
        "predicted_roles": result["predicted_roles"],
        "confidence_scores": result["confidence_scores"],
        "predicted_at": datetime.utcnow(),
        "demo": result.get("demo", False),
    }

    insert = await db[collections.CAREER_HISTORY].insert_one(doc)
    doc["_id"] = str(insert.inserted_id)
    doc["user_id"] = user_id
    return doc
