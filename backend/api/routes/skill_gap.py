"""
Skill Gap API Routes.
POST /api/skill-gap/predict → Resume skills + target role → DNN → skill gap doc
GET  /api/skill-gap/{id}   → Fetch from MongoDB
"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime

from database.mongodb import get_database
from database import collections
from database.schemas import SkillGapRequest
from api.middleware.auth import get_optional_user
from pipelines.skill_pipeline import process_skill_gap

router = APIRouter()

DEMO_USER_ID = "demo_user_123"


def serialize_gap(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "user_id": str(doc.get("user_id", "")),
        "resume_id": str(doc.get("resume_id", "")),
        "target_role": doc.get("target_role", ""),
        "current_skills": doc.get("current_skills", []),
        "missing_skills": doc.get("missing_skills", []),
        "match_score": doc.get("match_score", 0),
        "skill_scores": doc.get("skill_scores", {}),
        "created_at": doc.get("created_at", datetime.utcnow()),
        "demo": doc.get("demo", False),
    }


@router.post("/predict")
async def predict_skill_gap(
    request: SkillGapRequest,
    current_user: dict = Depends(get_optional_user),
):
    user_id = current_user.get("sub", DEMO_USER_ID) if current_user else DEMO_USER_ID
    try:
        doc = await process_skill_gap(user_id, request.resume_id, request.target_role)
        return serialize_gap(doc)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill gap analysis failed: {e}")


@router.get("/{gap_id}")
async def get_skill_gap(gap_id: str):
    db = get_database()
    try:
        doc = await db[collections.SKILL_GAPS].find_one({"_id": ObjectId(gap_id)})
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Skill gap not found")
    return serialize_gap(doc)


@router.get("/user/{user_id}")
async def get_user_skill_gaps(user_id: str):
    db = get_database()
    cursor = db[collections.SKILL_GAPS].find({"user_id": user_id}).sort("created_at", -1).limit(10)
    gaps = []
    async for doc in cursor:
        gaps.append(serialize_gap(doc))
    return gaps
