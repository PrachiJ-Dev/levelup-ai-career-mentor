"""
Career LSTM Inference — Predict next 2-3 career roles.
"""
import logging
from typing import List, Dict, Any
from config import settings

logger = logging.getLogger("levelup")

ALL_ROLES = [
    "Software Engineer", "Senior Software Engineer", "Staff Engineer", "Principal Engineer",
    "Data Scientist", "Senior Data Scientist", "ML Engineer", "Senior ML Engineer",
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "DevOps Engineer", "Cloud Architect", "Engineering Manager", "CTO",
]

ROLE_TO_IDX = {r: i for i, r in enumerate(ALL_ROLES)}
IDX_TO_ROLE = {i: r for r, i in ROLE_TO_IDX.items()}

# Career progression map (demo)
PROGRESSIONS = {
    "Software Engineer": ["Senior Software Engineer", "Backend Developer", "Full Stack Developer"],
    "Senior Software Engineer": ["Staff Engineer", "Engineering Manager", "Principal Engineer"],
    "Data Scientist": ["Senior Data Scientist", "ML Engineer", "AI Researcher"],
    "ML Engineer": ["Senior ML Engineer", "Cloud Architect", "Engineering Manager"],
    "Frontend Developer": ["Full Stack Developer", "Senior Software Engineer", "Engineering Manager"],
    "Backend Developer": ["Full Stack Developer", "Senior Software Engineer", "DevOps Engineer"],
    "DevOps Engineer": ["Cloud Architect", "Engineering Manager", "Staff Engineer"],
    "Full Stack Developer": ["Senior Software Engineer", "Engineering Manager", "Cloud Architect"],
}


def run_career_inference(history: List[Dict]) -> Dict[str, Any]:
    """
    Predict next career roles from career history.
    """
    if not history:
        return {
            "predicted_roles": [],
            "confidence_scores": [],
            "demo": False,
        }
    
    if settings.demo_mode:
        return _demo_career(history)

    try:
        return _lstm_career(history)
    except Exception as e:
        logger.error(f"LSTM career inference failed: {e}")
        return _demo_career(history)


def _demo_career(history: List[Dict]) -> Dict:
    """Rule-based career progression based on most recent role."""
    if not history:
        return {
            "predicted_roles": [],
            "confidence_scores": [],
            "demo": True,
        }

    last_role = history[-1].get("role", "Software Engineer")
    progressions = PROGRESSIONS.get(last_role, ["Senior Software Engineer", "Staff Engineer", "Engineering Manager"])
    scores = [round(0.75 - i * 0.08 + (hash(r) % 10) * 0.01, 2) for i, r in enumerate(progressions[:3])]

    return {
        "predicted_roles": progressions[:3],
        "confidence_scores": scores[:3],
        "demo": True,
    }


def _lstm_career(history: List[Dict]) -> Dict:
    """Real LSTM-based prediction."""
    import torch
    from models.career.lstm_model import CareerLSTM
    from utils.skill_taxonomy import SKILL_TO_IDX, ALL_SKILLS
    import os

    input_size = len(ALL_SKILLS) + len(ALL_ROLES)
    model = CareerLSTM(input_size=input_size, num_roles=len(ALL_ROLES))
    ckpt = "ml_training/checkpoints/career_lstm.pt"
    if os.path.exists(ckpt):
        model.load_state_dict(torch.load(ckpt, map_location="cpu"))

    # Encode career history as tensor sequence
    seq = []
    for step in history:
        role_vec = torch.zeros(len(ALL_ROLES))
        role_idx = ROLE_TO_IDX.get(step.get("role", ""), 0)
        role_vec[role_idx] = 1.0

        skill_vec = torch.zeros(len(ALL_SKILLS))
        for s in step.get("skills", []):
            if s in SKILL_TO_IDX:
                skill_vec[SKILL_TO_IDX[s]] = 1.0

        seq.append(torch.cat([role_vec, skill_vec]))

    x = torch.stack(seq).unsqueeze(0)  # [1, seq_len, input_size]
    indices, probs = model.predict_top_k(x, k=3)
    predicted_roles = [IDX_TO_ROLE.get(i, "Software Engineer") for i in indices]
    confidence_scores = [round(p, 2) for p in probs]

    return {
        "predicted_roles": predicted_roles,
        "confidence_scores": confidence_scores,
        "demo": False,
    }
