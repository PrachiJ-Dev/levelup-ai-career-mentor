"""Interview inference wrapper."""
from models.interview.question_generator import generate_questions
from models.interview.answer_evaluator import evaluate_answer

__all__ = ["generate_questions", "evaluate_answer"]
