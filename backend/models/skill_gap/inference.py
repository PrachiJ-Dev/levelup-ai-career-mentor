"""
Skill Gap DNN Inference.
Computes match_score, missing_skills, and per-skill scores.
"""
import logging
from typing import Dict, List, Any
from config import settings

logger = logging.getLogger("levelup")


def run_skill_gap_inference(
    current_skills: List[str],
    target_role: str,
) -> Dict[str, Any]:
    """
    Detect skill gap between user's current skills and target role requirements.

    Returns:
        match_score (0-100), missing_skills, skill_scores dict
    """
    if settings.demo_mode:
        return _demo_skill_gap(current_skills, target_role)

    try:
        return _dnn_skill_gap(current_skills, target_role)
    except Exception as e:
        logger.error(f"DNN skill gap failed: {e}, using heuristic")
        return _heuristic_skill_gap(current_skills, target_role)


# ── Demo Mode ──────────────────────────────────────────────────────────────────

def _demo_skill_gap(current_skills: List[str], target_role: str) -> Dict:
    from utils.skill_taxonomy import JOB_ROLE_SKILLS
    return _heuristic_skill_gap(current_skills, target_role, demo=True)


# ── Heuristic (Rule-based) ─────────────────────────────────────────────────────

def _heuristic_skill_gap(
    current_skills: List[str],
    target_role: str,
    demo: bool = False,
) -> Dict:
    from utils.skill_taxonomy import JOB_ROLE_SKILLS

    required = JOB_ROLE_SKILLS.get(target_role, [])
    if not required:
        # Default to software engineer if role not found
        required = JOB_ROLE_SKILLS["Software Engineer"]

    current_lower = {s.lower() for s in current_skills}
    required_lower = {r.lower(): r for r in required}

    # Skill scores: 1.0 if present, 0.0-0.6 if partially matched
    skill_scores = {}
    missing = []
    for r_lower, r_orig in required_lower.items():
        if r_lower in current_lower:
            skill_scores[r_orig] = round(0.75 + 0.25 * (hash(r_lower) % 10) / 10, 2)
        else:
            score = round(0.1 + 0.4 * (hash(r_lower) % 10) / 10, 2)
            skill_scores[r_orig] = score
            missing.append(r_orig)

    # Match score: percentage of required skills the user has
    matched = len(required) - len(missing)
    match_score = round((matched / len(required)) * 100, 1) if required else 0.0

    return {
        "current_skills": current_skills,
        "missing_skills": missing,
        "match_score": match_score,
        "skill_scores": skill_scores,
        "demo": demo,
    }


# ── Real DNN Path ──────────────────────────────────────────────────────────────

def _dnn_skill_gap(current_skills: List[str], target_role: str) -> Dict:
    import torch
    from models.skill_gap.model import SkillGapDNN
    from utils.skill_taxonomy import ALL_SKILLS, SKILL_TO_IDX, IDX_TO_SKILL

    n = len(ALL_SKILLS)
    # Encode current skills as binary vector
    skill_vec = torch.zeros(n)
    for skill in current_skills:
        if skill in SKILL_TO_IDX:
            skill_vec[SKILL_TO_IDX[skill]] = 1.0

    # Load model if weights available
    model = SkillGapDNN(input_size=n, output_size=n)
    import os
    ckpt_path = "ml_training/checkpoints/skill_gap_dnn.pt"
    if os.path.exists(ckpt_path):
        model.load_state_dict(torch.load(ckpt_path, map_location="cpu"))

    model.eval()
    with torch.no_grad():
        logits = model(skill_vec.unsqueeze(0))
        import torch.nn.functional as F
        scores = torch.sigmoid(logits).squeeze(0)

    # Convert to skill_scores dict
    from utils.skill_taxonomy import JOB_ROLE_SKILLS
    required = JOB_ROLE_SKILLS.get(target_role, [])
    skill_scores = {}
    missing = []
    for skill in required:
        idx = SKILL_TO_IDX.get(skill)
        score = float(scores[idx]) if idx is not None else 0.5
        skill_scores[skill] = round(score, 2)
        if skill not in current_skills and score < 0.5:
            missing.append(skill)

    matched = len(required) - len(missing)
    match_score = round((matched / len(required)) * 100, 1) if required else 0.0

    return {
        "current_skills": current_skills,
        "missing_skills": missing,
        "match_score": match_score,
        "skill_scores": skill_scores,
        "demo": False,
    }
