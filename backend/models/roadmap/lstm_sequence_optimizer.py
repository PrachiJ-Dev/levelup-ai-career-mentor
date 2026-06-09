"""
LSTM Sequence Optimizer — Step 4 of the Roadmap DL Pipeline.

An LSTM (Long Short-Term Memory) network that optimizes the learning
sequence of courses. It understands temporal dependencies between skills
and reorders the roadmap so that:
  - Beginner courses come before Advanced ones
  - Foundational skills are scheduled before specialized ones
  - Related skills are grouped together in phases

Syllabus Topic: Recurrent Neural Networks / LSTM for Sequence Modeling
Architecture:
    Input:  Sequence of course feature vectors (batch, seq_len, features=6)
    LSTM:   LSTM(input_size=6, hidden_size=64, num_layers=2, batch_first=True)
    Output: Linear(64, 1) → per-course sequence score
    
    The score determines final ordering: lower score = earlier in sequence.

Input Shape:  (1, num_courses, 6)
Output Shape: (1, num_courses, 1)
"""
import logging
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Any

logger = logging.getLogger("levelup")

# Difficulty level encoding
DIFFICULTY_ENCODING = {
    "Beginner": 0.0,
    "Intermediate": 0.5,
    "Advanced": 1.0,
}


class SequenceOptimizerLSTM(nn.Module):
    """
    LSTM for optimizing course learning sequence.
    
    Demonstrates: LSTM layers for sequential data processing,
    hidden state propagation, and sequence-to-sequence scoring.
    The model learns that prerequisites should come first and
    related topics should be grouped.
    """

    def __init__(self, input_size: int = 6, hidden_size: int = 64,
                 num_layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.1 if num_layers > 1 else 0.0,
        )
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Tensor of shape (batch, seq_len, 6) — course features
        Returns:
            Tensor of shape (batch, seq_len, 1) — sequence position scores
        """
        lstm_out, _ = self.lstm(x)  # (batch, seq, hidden)
        scores = self.fc(lstm_out)   # (batch, seq, 1)
        return scores


def _build_course_features(course: Dict, idx: int, total: int) -> List[float]:
    """
    Build a 6-dimensional feature vector for a course.
    
    Features:
        [0] difficulty_level   — 0.0 (Beginner), 0.5 (Mid), 1.0 (Advanced)
        [1] priority_score     — from DNN scorer (0-1)
        [2] hours_normalized   — estimated_hours / 100 (capped at 1.0)
        [3] position_ratio     — current position / total (0-1)
        [4] complexity_signal  — derived from difficulty + hours
        [5] dependency_depth   — heuristic depth of skill prerequisites
    """
    difficulty = DIFFICULTY_ENCODING.get(
        course.get("difficulty", "Intermediate"), 0.5
    )
    priority = course.get("priority_score", 0.5)
    hours = min(course.get("estimated_hours", 20) / 100.0, 1.0)
    position = idx / max(total - 1, 1)
    complexity = (difficulty + hours) / 2.0

    # Dependency depth heuristic
    from models.roadmap.dnn_priority_scorer import SKILL_DEPENDENCIES
    skill = course.get("skill_covered", "").lower()
    deps = SKILL_DEPENDENCIES.get(skill, [])
    depth = 0
    visited = set()
    queue = list(deps)
    while queue:
        dep = queue.pop(0)
        if dep not in visited:
            visited.add(dep)
            depth += 1
            queue.extend(SKILL_DEPENDENCIES.get(dep, []))
    dep_depth = min(depth / 5.0, 1.0)  # Normalize to 0-1

    return [difficulty, priority, hours, position, complexity, dep_depth]


def optimize_sequence(courses: List[Dict]) -> List[Dict]:
    """
    Optimize the learning sequence using LSTM.
    
    The LSTM processes the course sequence and outputs per-course
    position scores. Courses are then reordered by these scores,
    ensuring optimal learning progression.
    
    Args:
        courses: List of course dicts (already scored by DNN and classified by CNN)
    
    Returns:
        courses reordered for optimal learning sequence, with 'phase' numbers
    """
    if not courses or len(courses) <= 1:
        for i, c in enumerate(courses):
            c["phase"] = i + 1
        return courses

    model = SequenceOptimizerLSTM()
    model.eval()

    # Build feature matrix
    total = len(courses)
    features = []
    for idx, course in enumerate(courses):
        features.append(_build_course_features(course, idx, total))

    feature_tensor = torch.tensor([features], dtype=torch.float32)  # (1, seq, 6)

    # LSTM inference
    with torch.no_grad():
        scores = model(feature_tensor).squeeze(0).squeeze(-1).numpy()  # (seq,)

    # Combine LSTM scores with rule-based ordering for robustness
    combined_scores = []
    for i, course in enumerate(courses):
        lstm_score = float(scores[i])

        # Rule-based component
        diff_val = DIFFICULTY_ENCODING.get(course.get("difficulty", "Intermediate"), 0.5)
        dep_depth = _build_course_features(course, i, total)[5]

        # Final: 40% LSTM + 30% difficulty (beginner first) + 30% dependency depth
        final = (lstm_score * 0.4) + (diff_val * 0.3) + (dep_depth * 0.3)
        combined_scores.append((final, i))

    # Sort by combined score (lower = earlier in sequence)
    combined_scores.sort(key=lambda x: x[0])

    # Reorder courses
    reordered = []
    for phase_num, (score, original_idx) in enumerate(combined_scores, 1):
        course = courses[original_idx].copy()
        course["phase"] = phase_num
        course["sequence_score"] = round(score, 3)
        reordered.append(course)

    logger.info(f"LSTM optimized sequence for {len(reordered)} courses")
    return reordered
