"""
Roadmap Embedding Matcher — Word2Vec / GloVe cosine similarity.
Matches missing skills to curated course catalog.
"""
import logging
from typing import List, Dict, Any
from config import settings

logger = logging.getLogger("levelup")

# ── Curated Course Catalog ─────────────────────────────────────────────────────

COURSE_CATALOG: List[Dict] = [
    {"title": "Python for Everybody", "platform": "Coursera", "url": "https://coursera.org/specializations/python", "skill_covered": "Python", "priority": 1, "duration_hours": 30},
    {"title": "FastAPI — Complete Guide", "platform": "Udemy", "url": "https://udemy.com/course/fastapi", "skill_covered": "FastAPI", "priority": 2, "duration_hours": 12},
    {"title": "Deep Learning Specialization", "platform": "Coursera", "url": "https://coursera.org/specializations/deep-learning", "skill_covered": "Deep Learning", "priority": 1, "duration_hours": 80},
    {"title": "PyTorch for Deep Learning", "platform": "fast.ai", "url": "https://course.fast.ai", "skill_covered": "PyTorch", "priority": 1, "duration_hours": 40},
    {"title": "TensorFlow Developer Certificate", "platform": "Google", "url": "https://tensorflow.org/certificate", "skill_covered": "TensorFlow", "priority": 2, "duration_hours": 50},
    {"title": "Natural Language Processing with Transformers", "platform": "Hugging Face", "url": "https://huggingface.co/course", "skill_covered": "NLP", "priority": 1, "duration_hours": 25},
    {"title": "React — The Complete Guide", "platform": "Udemy", "url": "https://udemy.com/course/react-the-complete-guide", "skill_covered": "React", "priority": 1, "duration_hours": 45},
    {"title": "Node.js Complete Bootcamp", "platform": "Udemy", "url": "https://udemy.com/course/nodejs-bootcamp", "skill_covered": "Node.js", "priority": 2, "duration_hours": 40},
    {"title": "Docker & Kubernetes: The Complete Guide", "platform": "Udemy", "url": "https://udemy.com/course/docker-kubernetes", "skill_covered": "Docker", "priority": 2, "duration_hours": 22},
    {"title": "AWS Certified Developer", "platform": "AWS", "url": "https://aws.amazon.com/certification/certified-developer", "skill_covered": "AWS", "priority": 2, "duration_hours": 60},
    {"title": "Machine Learning by Andrew Ng", "platform": "Coursera", "url": "https://coursera.org/specializations/machine-learning-introduction", "skill_covered": "Machine Learning", "priority": 1, "duration_hours": 60},
    {"title": "SQL Bootcamp", "platform": "Udemy", "url": "https://udemy.com/course/complete-sql-bootcamp", "skill_covered": "SQL", "priority": 2, "duration_hours": 10},
    {"title": "MongoDB — The Complete Developer's Guide", "platform": "Udemy", "url": "https://udemy.com/course/mongodb-the-complete-developers-guide", "skill_covered": "MongoDB", "priority": 3, "duration_hours": 15},
    {"title": "Kubernetes for Beginners", "platform": "KodeKloud", "url": "https://kodekloud.com/courses/kubernetes", "skill_covered": "Kubernetes", "priority": 3, "duration_hours": 20},
    {"title": "TypeScript Deep Dive", "platform": "GitBook", "url": "https://basarat.gitbook.io/typescript", "skill_covered": "TypeScript", "priority": 2, "duration_hours": 15},
    {"title": "Computer Vision with OpenCV", "platform": "Coursera", "url": "https://coursera.org/learn/computer-vision-basics", "skill_covered": "Computer Vision", "priority": 2, "duration_hours": 30},
    {"title": "Data Engineering with Apache Spark", "platform": "Databricks", "url": "https://databricks.com/learn", "skill_covered": "Spark", "priority": 3, "duration_hours": 35},
    {"title": "Go Programming Language", "platform": "Udemy", "url": "https://udemy.com/course/learn-go-the-complete-bootcamp-course-golang", "skill_covered": "Go", "priority": 3, "duration_hours": 20},
    {"title": "System Design Interview", "platform": "Educative", "url": "https://educative.io/courses/grokking-modern-system-design", "skill_covered": "System Design", "priority": 1, "duration_hours": 25},
    {"title": "Redis In-Memory Data Store", "platform": "Redis University", "url": "https://university.redis.com", "skill_covered": "Redis", "priority": 3, "duration_hours": 8},
    {"title": "Advanced CSS and Sass", "platform": "Udemy", "url": "https://udemy.com/course/advanced-css-and-sass", "skill_covered": "CSS", "priority": 2, "duration_hours": 28},
    {"title": "Tailwind CSS From Scratch", "platform": "Traversy Media", "url": "https://traversymedia.com", "skill_covered": "Tailwind CSS", "priority": 3, "duration_hours": 12},
    {"title": "Next.js 14 & React - The Complete Guide", "platform": "Udemy", "url": "https://udemy.com/course/nextjs-react-the-complete-guide", "skill_covered": "Next.js", "priority": 1, "duration_hours": 35},
    {"title": "Jenkins, From Zero To Hero", "platform": "Udemy", "url": "https://udemy.com/course/jenkins-from-zero-to-hero", "skill_covered": "CI/CD", "priority": 2, "duration_hours": 15},
    {"title": "Terraform for Beginners", "platform": "Udemy", "url": "https://udemy.com/course/terraform-for-beginners", "skill_covered": "Terraform", "priority": 2, "duration_hours": 10},
    {"title": "Linux Mastery", "platform": "ZTM", "url": "https://zerotomastery.io", "skill_covered": "Linux", "priority": 3, "duration_hours": 20},
]


def match_courses(missing_skills: List[str], target_role: str = "") -> List[Dict]:
    """
    Match missing skills to recommended courses.
    Uses word similarity in demo/heuristic mode.
    Returns up to 10 courses, sorted by priority.
    """
    if not missing_skills:
        return []

    if settings.demo_mode:
        return _match_by_keyword(missing_skills, target_role)

    try:
        return _embedding_match(missing_skills)
    except Exception as e:
        logger.error(f"Embedding match failed: {e}, using keyword match")
        return _match_by_keyword(missing_skills, target_role)


def _match_by_keyword(missing_skills: List[str], target_role: str) -> List[Dict]:
    """Keyword-based course matching with role-based fallback."""
    import random
    recommended = []
    seen = set()
    missing_lower = {s.lower() for s in missing_skills}

    # Better matching: check if missing skill is a substring of course target or vice versa
    for course in COURSE_CATALOG:
        skill = course["skill_covered"].lower()
        if any(m in skill or skill in m for m in missing_lower):
            if course["title"] not in seen:
                recommended.append(course.copy())
                seen.add(course["title"])

    # If we still don't have enough courses, pick courses related to the target_role
    if len(recommended) < 5 and target_role:
        role_map = {
            "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS", "CSS", "Node.js"],
            "backend": ["Node.js", "FastAPI", "Python", "SQL", "MongoDB", "Go", "System Design"],
            "fullstack": ["React", "Next.js", "Node.js", "MongoDB", "SQL", "Docker", "System Design"],
            "data": ["Python", "SQL", "Spark", "Machine Learning", "Deep Learning"],
            "ml": ["Deep Learning", "PyTorch", "TensorFlow", "Machine Learning", "Python", "NLP"],
            "devops": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Go"],
            "dba": ["SQL", "MongoDB", "Redis", "AWS", "Linux"],
            "systems": ["System Design", "AWS", "Kubernetes", "Go", "Docker", "Linux"]
        }
        
        # Find the best matching key
        best_key = next((k for k in role_map.keys() if k in target_role.lower().replace(" ", "")), "backend")
        preferred_skills = role_map.get(best_key, [])
        
        for course in COURSE_CATALOG:
            if course["title"] not in seen:
                skill = course["skill_covered"]
                if any(p.lower() in skill.lower() for p in preferred_skills):
                    if len(recommended) >= 5: break
                    recommended.append(course.copy())
                    seen.add(course["title"])

    # If STILL not enough, then pick randomly
    if len(recommended) < 5:
        available = [c for c in COURSE_CATALOG if c["title"] not in seen]
        random.shuffle(available)
        for course in available[:5 - len(recommended)]:
            recommended.append(course.copy())
            seen.add(course["title"])

    return sorted(recommended, key=lambda c: c["priority"])[:10]


def _embedding_match(missing_skills: List[str]) -> List[Dict]:
    """Word2Vec cosine similarity course matching (requires gensim)."""
    import gensim.downloader as api
    import numpy as np

    wv = api.load("glove-wiki-gigaword-50")

    def embed_phrase(phrase: str):
        words = phrase.lower().split()
        vecs = [wv[w] for w in words if w in wv]
        return np.mean(vecs, axis=0) if vecs else np.zeros(50)

    scored = []
    for course in COURSE_CATALOG:
        course_vec = embed_phrase(course["skill_covered"])
        scores = []
        for skill in missing_skills:
            skill_vec = embed_phrase(skill)
            norm = np.linalg.norm(course_vec) * np.linalg.norm(skill_vec)
            sim = float(np.dot(course_vec, skill_vec) / norm) if norm > 0 else 0.0
            scores.append(sim)
        best = max(scores) if scores else 0.0
        if best > 0.5:
            scored.append((best, course.copy()))

    scored.sort(key=lambda x: (-x[0], x[1]["priority"]))
    return [c for _, c in scored[:10]]
