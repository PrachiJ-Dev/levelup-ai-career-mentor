"""
DNN Priority Scorer — Step 2 of the Roadmap DL Pipeline.

A small Feedforward Neural Network (DNN) that scores each course/skill
by learning priority based on multiple features. Higher scores mean
the skill should be learned FIRST in the roadmap.

Syllabus Topic: Feedforward Neural Networks / Multi-Layer Perceptrons
Architecture:
    Input:  4-dim feature vector per skill
            [dependency_score, gap_score, complexity, role_weight]
    Hidden: Linear(4, 32) → ReLU → Dropout(0.2)
            Linear(32, 16) → ReLU
    Output: Linear(16, 1) → Sigmoid → priority score in [0, 1]

Input Shape:  (batch_size, 4)
Output Shape: (batch_size, 1)
"""
import logging
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Any

logger = logging.getLogger("levelup")


class PriorityScorerDNN(nn.Module):
    """
    Feedforward DNN for scoring skill learning priority.
    
    Demonstrates: Multi-layer Perceptron with dropout regularization,
    ReLU activation, and sigmoid output for bounded scoring.
    """

    def __init__(self, input_size: int = 4):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Tensor of shape (batch_size, 4) — feature vectors
        Returns:
            Tensor of shape (batch_size, 1) — priority scores
        """
        return self.network(x)


# ── Skill Dependency Graph ─────────────────────────────────────────────────────
# Maps skills to their prerequisite skills (simplified)
SKILL_DEPENDENCIES = {
    "react": ["javascript", "html", "css"],
    "next.js": ["react", "javascript"],
    "typescript": ["javascript"],
    "node.js": ["javascript"],
    "fastapi": ["python"],
    "django": ["python"],
    "flask": ["python"],
    "pytorch": ["python", "deep learning"],
    "tensorflow": ["python", "deep learning"],
    "deep learning": ["machine learning", "python"],
    "machine learning": ["python", "sql"],
    "nlp": ["deep learning", "python"],
    "computer vision": ["deep learning", "python"],
    "kubernetes": ["docker"],
    "terraform": ["aws", "linux"],
    "ci/cd": ["docker", "linux"],
    "spark": ["python", "sql"],
    "redis": ["sql"],
    "mongodb": ["sql"],
    "system design": ["python", "sql"],
}

# Complexity scores (higher = harder to learn)
SKILL_COMPLEXITY = {
    "html": 0.1, "css": 0.2, "javascript": 0.3, "python": 0.2,
    "sql": 0.25, "git": 0.1, "linux": 0.3, "bash": 0.2,
    "react": 0.5, "next.js": 0.6, "typescript": 0.4, "vue.js": 0.5,
    "node.js": 0.5, "fastapi": 0.5, "django": 0.5, "express.js": 0.4,
    "docker": 0.5, "kubernetes": 0.7, "aws": 0.6, "gcp": 0.6,
    "terraform": 0.6, "ci/cd": 0.5, "ansible": 0.5, "nginx": 0.4,
    "machine learning": 0.7, "deep learning": 0.8, "pytorch": 0.7,
    "tensorflow": 0.7, "nlp": 0.8, "computer vision": 0.8,
    "system design": 0.8, "mongodb": 0.4, "redis": 0.4,
    "spark": 0.7, "kafka": 0.7, "go": 0.5,
}


def score_priorities(
    courses: List[Dict],
    skill_gap_scores: Dict[str, float],
    current_skills: List[str],
) -> List[Dict]:
    """
    Score each course's learning priority using the DNN.
    
    Args:
        courses: List of course dicts from Groq generator
        skill_gap_scores: {skill_name: gap_score} from skill gap analysis
        current_skills: List of user's current skills
    
    Returns:
        courses with added 'priority_score' field, sorted by priority (desc)
    """
    if not courses:
        return courses

    model = PriorityScorerDNN()
    model.eval()

    # Build feature vectors
    current_lower = {s.lower() for s in current_skills}
    features = []

    for course in courses:
        skill = course.get("skill_covered", "").lower()

        # Feature 1: Dependency score (0-1)
        # Higher if the user already has prerequisites for this skill
        deps = SKILL_DEPENDENCIES.get(skill, [])
        if deps:
            dep_met = sum(1 for d in deps if d in current_lower) / len(deps)
        else:
            dep_met = 1.0  # No dependencies = ready to learn

        # Feature 2: Gap score (0-1)
        # Higher gap = more important to fill
        gap = skill_gap_scores.get(course.get("skill_covered", ""), 0.5)
        gap_score = 1.0 - gap  # Invert: low match = high priority

        # Feature 3: Complexity (0-1)
        complexity = SKILL_COMPLEXITY.get(skill, 0.5)

        # Feature 4: Role weight (inverse of estimated hours, normalized)
        hours = course.get("estimated_hours", 20)
        role_weight = max(0.1, min(1.0, 1.0 - (hours / 100)))

        features.append([dep_met, gap_score, complexity, role_weight])

    # Run through DNN
    feature_tensor = torch.tensor(features, dtype=torch.float32)

    with torch.no_grad():
        scores = model(feature_tensor).squeeze(-1).numpy()

    # Combine DNN output with heuristic for robust scoring
    for i, course in enumerate(courses):
        skill = course.get("skill_covered", "").lower()
        dnn_score = float(scores[i])

        # Heuristic boost: skills with met dependencies should rank higher
        deps = SKILL_DEPENDENCIES.get(skill, [])
        dep_boost = 0.0
        if deps:
            dep_met_ratio = sum(1 for d in deps if d in current_lower) / len(deps)
            dep_boost = dep_met_ratio * 0.3

        # Combine: 60% DNN + 25% dependency + 15% gap importance
        gap = skill_gap_scores.get(course.get("skill_covered", ""), 0.5)
        final_score = (dnn_score * 0.6) + (dep_boost) + ((1 - gap) * 0.15)
        course["priority_score"] = round(min(1.0, max(0.0, final_score)), 3)

    # Sort by priority (highest first)
    courses.sort(key=lambda c: c.get("priority_score", 0), reverse=True)

    logger.info(f"DNN scored {len(courses)} courses for priority")
    return courses
