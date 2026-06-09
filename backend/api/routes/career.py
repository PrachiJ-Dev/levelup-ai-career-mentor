"""
Career API Routes.
POST /api/career/predict → career history → LSTM → predictions
GET  /api/career/{user_id} → fetch career history
"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime

from database.mongodb import get_database
from database import collections
from database.schemas import CareerPredictRequest
from api.middleware.auth import get_optional_user
from pipelines.career_pipeline import process_career_prediction

router = APIRouter()
DEMO_USER_ID = "demo_user_123"


def serialize_career(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "user_id": str(doc.get("user_id", "")),
        "history": doc.get("history", []),
        "predicted_roles": doc.get("predicted_roles", []),
        "confidence_scores": doc.get("confidence_scores", []),
        "predicted_at": doc.get("predicted_at", datetime.utcnow()),
        "demo": doc.get("demo", False),
    }


@router.post("/predict")
async def predict_career(
    request: CareerPredictRequest,
    current_user: dict = Depends(get_optional_user),
):
    user_id = current_user.get("sub", DEMO_USER_ID) if current_user else request.user_id
    history_list = [step.model_dump() for step in request.history]
    doc = await process_career_prediction(user_id, history_list)
    return serialize_career(doc)


@router.get("/{user_id}")
async def get_career_history(user_id: str):
    db = get_database()
    doc = await db[collections.CAREER_HISTORY].find_one(
        {"user_id": user_id}, sort=[("predicted_at", -1)]
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Career history not found")
    return serialize_career(doc)
