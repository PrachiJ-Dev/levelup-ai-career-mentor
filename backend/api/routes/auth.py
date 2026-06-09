"""
Auth routes: register, login, profile.
Supports DEMO_MODE=true to bypass MongoDB for local dev without a running DB.
"""
from fastapi import APIRouter, HTTPException, status, Depends
import bcrypt
from datetime import datetime
import uuid
import logging

from config import settings
from database.schemas import UserCreate, LoginRequest, TokenResponse, UserResponse
from api.middleware.auth import create_access_token, get_current_user

logger = logging.getLogger("levelup")
router = APIRouter()

# In-memory user store for demo mode (resets on server restart)
_demo_users: dict[str, dict] = {}


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id") or doc.get("id", "")),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "avatar": doc.get("avatar"),
        "target_role": doc.get("target_role"),
        "created_at": doc.get("created_at", datetime.utcnow()),
    }


# ── Demo Mode helpers ────────────────────────────────────────────────────────

def _demo_register(user: UserCreate) -> dict:
    """Register a user in the in-memory store (demo mode)."""
    if user.email in _demo_users:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "_id": uid,
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "avatar": f"https://api.dicebear.com/7.x/initials/svg?seed={user.name}",
        "target_role": user.target_role,
        "created_at": datetime.utcnow(),
    }
    _demo_users[user.email] = doc
    logger.info(f"[DEMO] Registered user: {user.email}")
    return doc


def _demo_login(email: str, password: str) -> dict:
    """Verify credentials against the in-memory store (demo mode)."""
    user = _demo_users.get(email)
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user: UserCreate):
    if settings.demo_mode:
        doc = _demo_register(user)
        token = create_access_token({"sub": doc["id"], "email": user.email})
        return {"access_token": token, "token_type": "bearer", "user": serialize_user(doc)}

    # Production: use MongoDB
    try:
        from database.mongodb import get_database
        from database import collections
        from bson import ObjectId
        db = get_database()
        existing = await db[collections.USERS].find_one({"email": user.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        doc = {
            "name": user.name,
            "email": user.email,
            "password": hash_password(user.password),
            "avatar": user.avatar or f"https://api.dicebear.com/7.x/initials/svg?seed={user.name}",
            "target_role": user.target_role,
            "created_at": datetime.utcnow(),
        }
        result = await db[collections.USERS].insert_one(doc)
        doc["_id"] = result.inserted_id
        token = create_access_token({"sub": str(doc["_id"]), "email": user.email})
        return {"access_token": token, "token_type": "bearer", "user": serialize_user(doc)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    if settings.demo_mode:
        # Allow the built-in demo user even in demo mode
        if credentials.email == "demo@levelup.ai" and credentials.password == "demo123":
            doc = {
                "id": "demo_user_123", "_id": "demo_user_123",
                "name": "Demo User", "email": "demo@levelup.ai",
                "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Demo",
            }
            token = create_access_token({"sub": "demo_user_123", "email": "demo@levelup.ai"})
            return {"access_token": token, "token_type": "bearer", "user": serialize_user(doc)}
        doc = _demo_login(credentials.email, credentials.password)
        token = create_access_token({"sub": doc["id"], "email": credentials.email})
        return {"access_token": token, "token_type": "bearer", "user": serialize_user(doc)}

    # Production: use MongoDB
    try:
        from database.mongodb import get_database
        from database import collections
        db = get_database()
        user = await db[collections.USERS].find_one({"email": credentials.email})
        if not user or not verify_password(credentials.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
        return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")


@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    if settings.demo_mode:
        email = current_user.get("email", "")
        if email == "demo@levelup.ai":
            return {"id": "demo_user_123", "name": "Demo User", "email": "demo@levelup.ai", "avatar": None, "target_role": None}
        user = _demo_users.get(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return serialize_user(user)

    try:
        from database.mongodb import get_database
        from database import collections
        from bson import ObjectId
        db = get_database()
        user_id = current_user.get("sub")
        try:
            user = await db[collections.USERS].find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = await db[collections.USERS].find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return serialize_user(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile error: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable.")

@router.get("/me/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Default stats
    stats = {
        "resume_score": 0,
        "skill_match": 0,
        "interviews_done": 0,
        "avg_interview_score": 0,
        "courses_completed": 0,
        "total_courses": 0,
        "skills_count": 0,
        "missing_skills_count": 0,
        "target_role": ""
    }

    if settings.demo_mode:
        return {
            "resume_score": 0,
            "skill_match": 0,
            "interviews_done": 0,
            "avg_interview_score": 0,
            "courses_completed": 0,
            "total_courses": 0,
            "skills_count": 0,
            "missing_skills_count": 0,
            "target_role": ""
        }

    try:
        from database.mongodb import get_database
        from database import collections
        from bson import ObjectId
        db = get_database()
        
        user_id_str = current_user.get("sub")
        try:
            user_id = ObjectId(user_id_str)
        except:
            user_id = user_id_str

        # Get latest resume
        latest_resume = await db[collections.RESUMES].find_one(
            {"user_id": {"$in": [user_id, user_id_str]}},
            sort=[("uploaded_at", -1)]
        )
        if latest_resume:
            stats["resume_score"] = latest_resume.get("resume_score", 0)
            stats["skills_count"] = len(latest_resume.get("entities", {}).get("skills", []))
            stats["latest_resume_id"] = str(latest_resume.get("_id"))

        # Get latest skill gap
        latest_gap = await db[collections.SKILL_GAPS].find_one(
            {"user_id": {"$in": [user_id, user_id_str]}},
            sort=[("created_at", -1)]
        )
        if latest_gap:
            stats["skill_match"] = latest_gap.get("match_score", 0)
            stats["missing_skills_count"] = len(latest_gap.get("missing_skills", []))
            stats["latest_gap_id"] = str(latest_gap.get("_id"))

        # Get interview count and average score
        interviews = await db[collections.INTERVIEWS].find(
            {"user_id": {"$in": [user_id, user_id_str]}}
        ).to_list(length=100)
        
        stats["interviews_done"] = len(interviews)
        if interviews:
            scores = [i.get("overall_score", 0) for i in interviews]
            stats["avg_interview_score"] = round(sum(scores) / len(scores), 1)
        else:
            stats["avg_interview_score"] = 0

        # Get roadmap progress
        latest_roadmap = await db[collections.ROADMAPS].find_one(
            {"user_id": {"$in": [user_id, user_id_str]}},
            sort=[("created_at", -1)]
        )
        if latest_roadmap:
            courses = latest_roadmap.get("recommended_courses", [])
            stats["total_courses"] = len(courses)
            stats["courses_completed"] = len([c for c in courses if c.get("is_completed")])
            stats["target_role"] = latest_roadmap.get("target_role", "")
        else:
            stats["total_courses"] = 0
            stats["courses_completed"] = 0

        return stats
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return stats
