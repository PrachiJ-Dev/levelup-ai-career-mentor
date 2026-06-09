"""
Interview Pipeline: Save session → MongoDB
"""
import logging
from datetime import datetime
from bson import ObjectId
from typing import List, Dict

from database.mongodb import get_database
from database import collections

logger = logging.getLogger("levelup")


async def save_interview_session(
    user_id: str,
    role: str,
    difficulty: str,
    questions: List[Dict],
) -> dict:
    """Save completed interview session to MongoDB."""
    db = get_database()

    overall_score = 0.0
    if questions:
        scores = [q.get("score", 0.0) for q in questions if q.get("score") is not None]
        overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    doc = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "role": role,
        "difficulty": difficulty,
        "questions": questions,
        "overall_score": overall_score,
        "started_at": datetime.utcnow(),
        "completed_at": datetime.utcnow(),
    }

    insert = await db[collections.INTERVIEWS].insert_one(doc)
    doc["_id"] = str(insert.inserted_id)
    doc["user_id"] = user_id
    return doc
