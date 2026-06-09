"""
Roadmap API Routes.
POST /api/roadmap/recommend → skill_gap_id → DL pipeline → roadmap doc
GET  /api/roadmap/{id}      → fetch roadmap
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
import logging

from database.mongodb import get_database
from database import collections
from api.middleware.auth import get_optional_user
from pipelines.roadmap_pipeline import generate_roadmap

router = APIRouter()
logger = logging.getLogger("levelup")
DEMO_USER_ID = "demo_user_123"


class RoadmapRequest(BaseModel):
    skill_gap_id: str


def serialize_roadmap(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", doc.get("id", ""))),
        "user_id": str(doc.get("user_id", "")),
        "skill_gap_id": str(doc.get("skill_gap_id", "")),
        "target_role": doc.get("target_role", "Software Engineer"),
        "recommended_courses": doc.get("recommended_courses", []),
        "timeline_weeks": doc.get("timeline_weeks", 0),
        "pipeline_metadata": doc.get("pipeline_metadata", {}),
        "created_at": doc.get("created_at", datetime.utcnow()),
    }


@router.post("/recommend")
async def recommend_roadmap(
    request: RoadmapRequest,
    current_user: dict = Depends(get_optional_user),
):
    user_id = current_user.get("sub", DEMO_USER_ID) if current_user else DEMO_USER_ID

    try:
        doc = await generate_roadmap(request.skill_gap_id, user_id)
        return serialize_roadmap(doc)
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")


@router.get("/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    db = get_database()
    try:
        doc = await db[collections.ROADMAPS].find_one({"_id": ObjectId(roadmap_id)})
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return serialize_roadmap(doc)


@router.patch("/{roadmap_id}/phase/{phase_index}/complete")
async def complete_phase(roadmap_id: str, phase_index: int):
    db = get_database()
    try:
        # Try both ObjectId and string ID formats
        query_id = roadmap_id
        try:
            query_id = ObjectId(roadmap_id)
        except Exception:
            pass
            
        roadmap = await db[collections.ROADMAPS].find_one({"_id": query_id})
        if not roadmap:
            # Try searching by string "id" field if it exists
            roadmap = await db[collections.ROADMAPS].find_one({"id": roadmap_id})
            
        if not roadmap:
            logger.error(f"Roadmap not found for ID: {roadmap_id}")
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        courses = roadmap.get("recommended_courses", [])
        if phase_index < 0 or phase_index >= len(courses):
            raise HTTPException(status_code=400, detail="Invalid phase index")
        
        # Toggle completion status
        current_status = courses[phase_index].get("is_completed", False)
        new_status = not current_status
        
        # Update in DB
        result = await db[collections.ROADMAPS].update_one(
            {"_id": query_id},
            {"$set": {f"recommended_courses.{phase_index}.is_completed": new_status}}
        )
        
        if result.modified_count == 0:
            # Try updating by string "id" field
            await db[collections.ROADMAPS].update_one(
                {"id": roadmap_id},
                {"$set": {f"recommended_courses.{phase_index}.is_completed": new_status}}
            )
        
        return {"success": True, "is_completed": new_status}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update phase completion for {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

