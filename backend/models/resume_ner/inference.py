"""
Resume NER Inference — DistilBERT entity extraction.
Supports DEMO_MODE (returns hardcoded entities) and real inference.
"""
import re
import logging
from typing import Dict, List, Any
from config import settings

logger = logging.getLogger("levelup")

# ── Demo Mode Response ─────────────────────────────────────────────────────────

DEMO_ENTITIES = {
    "skills": ["Python", "FastAPI", "PyTorch", "React", "TypeScript", "MongoDB", "Docker", "AWS", "SQL", "Machine Learning"],
    "job_titles": ["Software Engineer", "ML Engineer", "Full Stack Developer"],
    "certifications": ["AWS Certified Developer", "TensorFlow Developer Certificate"],
    "education": ["B.Tech Computer Engineering", "IIT Bombay"],
    "experience_years": 3.5,
}

DEMO_ATTENTION = [
    [0.8, 0.1, 0.05, 0.05],
    [0.2, 0.6, 0.1, 0.1],
    [0.1, 0.2, 0.5, 0.2],
]


def run_ner_inference(text: str) -> Dict[str, Any]:
    """
    Run NER on resume text.
    Returns entities dict and attention visualization data.
    """
    if settings.demo_mode:
        logger.info("Demo mode: returning hardcoded NER entities")
        return {
            "entities": DEMO_ENTITIES,
            "attention": DEMO_ATTENTION,
            "resume_score": 78.5,
            "demo": True,
        }

    # Real inference path
    try:
        import torch
        from models.resume_ner.model import ResumeNERModel, IDX_TO_LABEL, LABEL_TO_IDX
        from models.resume_ner.tokenizer import get_tokenizer, tokenize_and_align
        from utils.text_cleaner import clean_text

        text = clean_text(text)
        encoding = tokenize_and_align(text[:2000])  # truncate for memory

        tokenizer = get_tokenizer()
        tokens = tokenizer.convert_ids_to_tokens(encoding["input_ids"][0])

        # Without weights, use rule-based extraction
        entities = rule_based_extraction(text)
        score = compute_resume_score(entities)

        return {
            "entities": entities,
            "attention": [],
            "resume_score": score,
            "demo": False,
        }
    except Exception as e:
        logger.error(f"NER inference failed: {e}, falling back to rule-based")
        entities = rule_based_extraction(text)
        return {
            "entities": entities,
            "attention": [],
            "resume_score": compute_resume_score(entities),
            "demo": False,
        }


def rule_based_extraction(text: str) -> Dict[str, List]:
    """Regex + keyword-based entity extraction as fallback."""
    from utils.skill_taxonomy import ALL_SKILLS, JOB_ROLE_SKILLS

    text_lower = text.lower()

    # Skills: match against taxonomy
    found_skills = [s for s in ALL_SKILLS if s.lower() in text_lower]

    # Job titles: match role names
    all_roles = list(JOB_ROLE_SKILLS.keys())
    found_roles = [r for r in all_roles if r.lower() in text_lower]

    # Experience years
    exp_match = re.search(r"(\d+\.?\d*)\s*(?:\+\s*)?years?\s*(?:of\s*)?(?:experience)?", text_lower)
    exp_years = float(exp_match.group(1)) if exp_match else None

    # Education keywords
    edu_keywords = ["bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "be", "mba", "university", "college", "institute"]
    lines = text.split("\n")
    edu_lines = [line.strip() for line in lines if any(k in line.lower() for k in edu_keywords)][:3]

    # Certifications
    cert_keywords = ["certified", "certificate", "certification", "aws", "google cloud", "azure", "coursera", "udemy"]
    cert_lines = [line.strip() for line in lines if any(k in line.lower() for k in cert_keywords)][:3]

    return {
        "skills": found_skills[:20],
        "job_titles": found_roles[:5],
        "experience_years": exp_years,
        "certifications": cert_lines[:5],
        "education": edu_lines[:3],
    }


def compute_resume_score(entities: Dict) -> float:
    """Heuristic resume score from entity richness."""
    score = 0.0
    score += min(len(entities.get("skills", [])) * 3, 40)
    score += min(len(entities.get("job_titles", [])) * 5, 20)
    score += 10 if entities.get("experience_years") else 0
    score += min(len(entities.get("certifications", [])) * 5, 15)
    score += 15 if entities.get("education") else 0
    return min(round(score, 1), 100.0)
