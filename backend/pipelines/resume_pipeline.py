"""
Resume processing pipeline: Upload → Save → Extract Text → NER → Score → MongoDB
"""
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile

from database.mongodb import get_database
from database import collections
from services.file_service import save_resume_file
from services.resume_parser import extract_text_from_pdf
from models.resume_ner.inference import run_ner_inference

logger = logging.getLogger("levelup")


async def process_resume_upload(
    user_id: str,
    upload_file: UploadFile,
) -> dict:
    """
    Full resume pipeline:
    1. Save PDF to local filesystem
    2. Extract text with pdfminer
    3. Run DistilBERT NER
    4. Save result to MongoDB Atlas resumes collection

    Returns: resume document dict
    """
    db = get_database()

    # 1. Save file locally
    file_data = await save_resume_file(user_id, upload_file)
    stored_path = file_data["stored_path"]
    file_url = file_data["file_url"]
    original_filename = upload_file.filename

    # 2. Extract text
    logger.info(f"Extracting text from: {stored_path}")
    extracted_text = extract_text_from_pdf(stored_path)
    if not extracted_text:
        # Try from bytes if file extraction failed
        from services.resume_parser import extract_text_from_bytes
        extracted_text = extract_text_from_bytes(file_data.get("content", b""))

    # 3. NER inference
    logger.info("Running NER inference...")
    ner_result = run_ner_inference(extracted_text)
    entities = ner_result["entities"]
    resume_score = ner_result.get("resume_score", 0.0)

    # 4. Build MongoDB document
    resume_doc = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "original_filename": original_filename,
        "stored_path": stored_path,
        "file_url": file_url,
        "extracted_text": extracted_text[:5000],  # Store first 5k chars
        "entities": entities,
        "resume_score": resume_score,
        "uploaded_at": datetime.utcnow(),
        "demo": ner_result.get("demo", False),
    }

    result = await db[collections.RESUMES].insert_one(resume_doc)
    resume_doc["_id"] = str(result.inserted_id)
    resume_doc["user_id"] = user_id

    logger.info(f"Resume saved: {resume_doc['_id']}")
    return resume_doc
