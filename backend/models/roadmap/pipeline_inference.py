"""
Orchestrates the 4-step Deep Learning Roadmap Pipeline.
1. Groq Generative AI (Course Generation)
2. DNN Priority Scorer
3. CNN Difficulty Classifier
4. LSTM Sequence Optimizer
"""
import logging
import time
from typing import List, Dict, Tuple
from config import settings

from models.roadmap.groq_generator import generate_courses
from models.roadmap.dnn_priority_scorer import score_priorities
from models.roadmap.cnn_difficulty_classifier import classify_difficulty
from models.roadmap.lstm_sequence_optimizer import optimize_sequence

logger = logging.getLogger("levelup")


def run_roadmap_pipeline(
    missing_skills: List[str],
    target_role: str,
    skill_gap_scores: Dict[str, float] = None,
    current_skills: List[str] = None,
    difficulty_level: str = "Beginner",
    exclude_titles: List[str] = None
) -> Tuple[List[Dict], Dict]:
    """
    Run the full 4-step DL pipeline to generate an optimized roadmap.
    
    Args:
        missing_skills: List of skills to learn
        target_role: The role the user is targeting
        skill_gap_scores: Dict of {skill: gap_score} from skill gap analysis
        current_skills: List of user's current skills
        
    Returns:
        Tuple of (optimized_courses, pipeline_metadata)
    """
    if skill_gap_scores is None:
        skill_gap_scores = {}
    if current_skills is None:
        current_skills = []
    if exclude_titles is None:
        exclude_titles = []

    start_time = time.time()
    metadata = {
        "models_used": [],
        "execution_times_ms": {},
        "demo_mode": settings.demo_mode
    }

    # Step 1: Groq API Generation
    logger.info(f"Step 1: Generating courses (Groq LLaMA-3) - Level: {difficulty_level}")
    t0 = time.time()
    courses = generate_courses(missing_skills, target_role, difficulty_level, exclude_titles)
    t1 = time.time()
    metadata["models_used"].append("Groq LLaMA-3 (Generator)")
    metadata["execution_times_ms"]["groq"] = int((t1 - t0) * 1000)

    if not courses:
        logger.warning("Groq generation returned empty list.")
        return [], metadata

    # Step 2: DNN Priority Scoring
    logger.info("Step 2: Scoring priorities (PyTorch DNN)")
    t0 = time.time()
    courses = score_priorities(courses, skill_gap_scores, current_skills)
    t1 = time.time()
    metadata["models_used"].append("PyTorch DNN (Priority Scorer)")
    metadata["execution_times_ms"]["dnn"] = int((t1 - t0) * 1000)

    # Step 3: CNN Difficulty Classification
    logger.info("Step 3: Classifying difficulty (PyTorch CNN)")
    t0 = time.time()
    courses = classify_difficulty(courses)
    t1 = time.time()
    metadata["models_used"].append("PyTorch 1D CNN (Difficulty Classifier)")
    metadata["execution_times_ms"]["cnn"] = int((t1 - t0) * 1000)

    # Step 4: LSTM Sequence Optimization
    logger.info("Step 4: Optimizing sequence (PyTorch LSTM)")
    t0 = time.time()
    courses = optimize_sequence(courses)
    t1 = time.time()
    metadata["models_used"].append("PyTorch LSTM (Sequence Optimizer)")
    metadata["execution_times_ms"]["lstm"] = int((t1 - t0) * 1000)

    total_time = time.time() - start_time
    metadata["total_time_ms"] = int(total_time * 1000)
    logger.info(f"Roadmap pipeline completed in {metadata['total_time_ms']}ms")

    return courses, metadata
