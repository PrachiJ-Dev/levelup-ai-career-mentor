"""
Interview API Routes.
GET  /api/interview/questions → generate questions
POST /api/interview/evaluate  → BERT score answer
POST /api/interview/save      → save session to MongoDB
"""
from fastapi import APIRouter, HTTPException, Depends
from database.schemas import InterviewEvaluateRequest, InterviewSaveRequest
from api.middleware.auth import get_optional_user
from config import settings
from models.interview.question_generator import generate_questions
from models.interview.answer_evaluator import evaluate_answer
from pipelines.interview_pipeline import save_interview_session

router = APIRouter()
DEMO_USER_ID = "demo_user_123"


@router.get("/questions")
async def get_questions(
    role: str = "Software Engineer",
    difficulty: str = "medium",
    count: int = 5,
):
    questions = generate_questions(role, difficulty, count)
    return {"role": role, "difficulty": difficulty, "questions": questions}


@router.post("/evaluate")
async def evaluate(request: InterviewEvaluateRequest):
    result = evaluate_answer(request.question, request.answer, request.role or "Software Engineer")
    return result


@router.get("/history")
async def get_history(current_user: dict = Depends(get_optional_user)):
    user_id = current_user.get("sub", DEMO_USER_ID) if current_user else DEMO_USER_ID
    
    if settings.demo_mode:
        # Mock history for demo mode
        return [
            {"date": "2024-05-01", "score": 65, "role": "Frontend Developer", "difficulty": "easy"},
            {"date": "2024-05-02", "score": 72, "role": "Backend Engineer", "difficulty": "medium"},
            {"date": "2024-05-03", "score": 85, "role": "Data Scientist", "difficulty": "hard"},
        ]

    try:
        from database.mongodb import get_database
        from database import collections
        from bson import ObjectId
        db = get_database()
        
        # Support both ObjectId and string IDs
        query_ids = [user_id]
        try:
            query_ids.append(ObjectId(user_id))
        except:
            pass
            
        cursor = db[collections.INTERVIEWS].find({"user_id": {"$in": query_ids}}).sort("created_at", -1)
        sessions = await cursor.to_list(length=50)
        
        # Serialize for frontend
        formatted = []
        for s in sessions:
            # Calculate overall score if not present
            q_list = s.get("questions", [])
            avg_score = 0
            if q_list:
                avg_score = sum(q.get("score", 0) for q in q_list) / len(q_list)
                
            formatted.append({
                "id": str(s["_id"]),
                "date": s.get("created_at", "").isoformat() if hasattr(s.get("created_at"), "isoformat") else str(s.get("created_at")),
                "score": round(avg_score, 1),
                "role": s.get("role", "Unknown"),
                "difficulty": s.get("difficulty", "medium"),
                "questions_count": len(q_list)
            })
        return formatted
    except Exception as e:
        logger.error(f"Failed to fetch interview history: {e}")
        return []


@router.post("/save")
async def save_session(
    request: InterviewSaveRequest,
    current_user: dict = Depends(get_optional_user),
):
    user_id = current_user.get("sub", DEMO_USER_ID) if current_user else request.user_id
    questions_list = [q.model_dump() for q in request.questions]
    doc = await save_interview_session(user_id, request.role, request.difficulty, questions_list)
    doc["_id"] = str(doc.get("_id", ""))
    return doc
