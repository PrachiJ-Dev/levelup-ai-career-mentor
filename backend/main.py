"""
FastAPI application entry point.
- CORS configuration
- MongoDB Atlas lifespan events
- StaticFiles for /uploads (serve local resume PDFs)
- All route registrations
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

from config import settings
from database.mongodb import connect_to_mongo, close_mongo_connection
from api.routes import resume, skill_gap, interview, roadmap, career, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("levelup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    logger.info(f"Upload directory ready: {settings.upload_dir}")
    logger.info(f"Demo mode: {settings.demo_mode}")
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="LevelUp AI Career Mentor API",
    description="Deep Learning powered career mentoring platform",
    version="1.0.0",
    lifespan=lifespan,
)

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err = traceback.format_exc()
    logger.error(f"Global exception: {err}")
    return JSONResponse(status_code=500, content={"detail": str(exc), "traceback": err})

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded resume PDFs
os.makedirs("uploads/resumes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(skill_gap.router, prefix="/api/skill-gap", tags=["skill-gap"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
app.include_router(career.router, prefix="/api/career", tags=["career"])


@app.get("/")
async def root():
    return {
        "name": "LevelUp AI Career Mentor API",
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "demo_mode": settings.demo_mode}
