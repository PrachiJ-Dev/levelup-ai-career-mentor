"""
Pydantic schemas for all MongoDB Atlas collections.
Used for request validation and response serialization.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom type for MongoDB ObjectId serialization."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError(f"Invalid ObjectId: {v}")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)


# ── Users ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    target_role: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    target_role: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True


# ── Resumes ────────────────────────────────────────────────────────────────────

class ResumeEntities(BaseModel):
    skills: List[str] = []
    job_titles: List[str] = []
    experience_years: Optional[float] = None
    certifications: List[str] = []
    education: List[str] = []


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    original_filename: str
    stored_path: str
    file_url: str
    extracted_text: Optional[str] = None
    entities: Optional[ResumeEntities] = None
    resume_score: Optional[float] = None
    uploaded_at: datetime


# ── Skill Gaps ─────────────────────────────────────────────────────────────────

class SkillGapRequest(BaseModel):
    resume_id: str
    target_role: str


class SkillGapResponse(BaseModel):
    id: str
    user_id: str
    resume_id: str
    target_role: str
    current_skills: List[str]
    missing_skills: List[str]
    match_score: float
    skill_scores: Dict[str, float]
    created_at: datetime


# ── Interviews ─────────────────────────────────────────────────────────────────

class InterviewQuestion(BaseModel):
    question: str
    user_answer: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    answered_at: Optional[datetime] = None


class InterviewEvaluateRequest(BaseModel):
    question: str
    answer: str
    role: Optional[str] = "Software Engineer"


class InterviewEvaluateResponse(BaseModel):
    score: float
    feedback: str
    ideal_answer_hint: Optional[str] = None


class InterviewSaveRequest(BaseModel):
    user_id: str
    role: str
    difficulty: str
    questions: List[InterviewQuestion]
    overall_score: float


class InterviewResponse(BaseModel):
    id: str
    user_id: str
    role: str
    difficulty: str
    questions: List[InterviewQuestion]
    overall_score: float
    started_at: datetime
    completed_at: Optional[datetime] = None


# ── Roadmaps ───────────────────────────────────────────────────────────────────

class Course(BaseModel):
    title: str
    platform: str
    url: str
    skill_covered: str
    priority: int
    duration_hours: float


class RoadmapResponse(BaseModel):
    id: str
    user_id: str
    skill_gap_id: str
    recommended_courses: List[Course]
    timeline_weeks: int
    created_at: datetime


# ── Career History ─────────────────────────────────────────────────────────────

class CareerStep(BaseModel):
    role: str
    year: int
    skills: List[str]


class CareerPredictRequest(BaseModel):
    user_id: str
    history: List[CareerStep]


class CareerResponse(BaseModel):
    id: str
    user_id: str
    history: List[CareerStep]
    predicted_roles: List[str]
    confidence_scores: List[float]
    predicted_at: datetime


# ── Auth ───────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
