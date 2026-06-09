"""
Resume API routes.
POST /api/resume/upload  → multipart PDF upload → pipeline → response
GET  /api/resume/{id}    → fetch from MongoDB
GET  /api/resume/user/{user_id} → all resumes for user
GET  /api/jobs/roles     → supported job roles list
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from bson import ObjectId
from datetime import datetime

from database.mongodb import get_database
from database import collections
from api.middleware.auth import get_optional_user
from pipelines.resume_pipeline import process_resume_upload
from utils.skill_taxonomy import ALL_ROLES
from config import settings

router = APIRouter()

DEMO_USER_ID = "demo_user_123"


def serialize_resume(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "user_id": str(doc.get("user_id", "")),
        "original_filename": doc.get("original_filename", ""),
        "stored_path": doc.get("stored_path", ""),
        "file_url": doc.get("file_url", ""),
        "extracted_text": doc.get("extracted_text", ""),
        "entities": doc.get("entities", {}),
        "resume_score": doc.get("resume_score", 0),
        "uploaded_at": doc.get("uploaded_at", datetime.utcnow()),
        "demo": doc.get("demo", False),
    }


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Form(default=DEMO_USER_ID),
    current_user: dict = Depends(get_optional_user),
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Check file size
    content = await file.read()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.max_file_size_mb}MB")
    await file.seek(0)  # Reset after read

    # Use authenticated user_id if available
    effective_user_id = current_user.get("sub", user_id) if current_user else user_id

    resume_doc = await process_resume_upload(effective_user_id, file)
    return serialize_resume(resume_doc)


@router.get("/{resume_id}")
async def get_resume(resume_id: str):
    db = get_database()
    try:
        doc = await db[collections.RESUMES].find_one({"_id": ObjectId(resume_id)})
    except Exception:
        doc = await db[collections.RESUMES].find_one({"_id": resume_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    return serialize_resume(doc)


@router.get("/user/{user_id}")
async def get_user_resumes(user_id: str):
    db = get_database()
    cursor = db[collections.RESUMES].find({"user_id": user_id}).sort("uploaded_at", -1).limit(10)
    resumes = []
    async for doc in cursor:
        resumes.append(serialize_resume(doc))
    return resumes


@router.get("/jobs/roles")
async def get_all_roles():
    return {"roles": ALL_ROLES}
