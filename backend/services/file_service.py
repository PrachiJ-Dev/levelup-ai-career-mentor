"""
File service for handling resume PDF uploads.
Saves files locally under uploads/resumes/{user_id}/
Naming convention: {user_id}_{timestamp}_resume.pdf
"""
import os
import time
import shutil
import logging
from fastapi import UploadFile

from config import settings

logger = logging.getLogger("levelup")


def get_user_upload_dir(user_id: str) -> str:
    """Return the directory path for a user's uploads."""
    return os.path.join(settings.upload_dir, user_id)


def get_resume_filename(user_id: str) -> str:
    """Generate unique filename: {user_id}_{unix_timestamp}_resume.pdf"""
    timestamp = int(time.time())
    return f"{user_id}_{timestamp}_resume.pdf"


async def save_resume_file(user_id: str, upload_file: UploadFile) -> dict:
    """
    Save an uploaded PDF resume to local filesystem.

    Returns:
        dict with keys: stored_path, file_url
    """
    # Create directory
    upload_dir = get_user_upload_dir(user_id)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate filename and full path
    filename = get_resume_filename(user_id)
    full_path = os.path.join(upload_dir, filename)

    # Write file
    try:
        content = await upload_file.read()
        with open(full_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved resume: {full_path}")
    except Exception as e:
        logger.error(f"Failed to save resume: {e}")
        raise

    # Normalize to forward slashes for URLs
    stored_path = full_path.replace("\\", "/")
    # The file_url is relative to /uploads mount
    relative = os.path.join("resumes", user_id, filename).replace("\\", "/")
    file_url = f"/uploads/{relative}"

    return {
        "stored_path": stored_path,
        "file_url": file_url,
        "filename": filename,
        "content": content,
    }


def delete_resume_file(stored_path: str) -> bool:
    """Delete a resume file from the filesystem."""
    try:
        if os.path.exists(stored_path):
            os.remove(stored_path)
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete file {stored_path}: {e}")
        return False
