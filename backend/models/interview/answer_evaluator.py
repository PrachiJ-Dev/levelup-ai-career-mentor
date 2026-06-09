"""
Answer Evaluator using BERT sentence similarity.
Computes cosine similarity between user's answer and ideal answer embeddings.
"""
import logging
import math
from typing import Dict, Any
from config import settings
from models.interview.question_generator import IDEAL_ANSWERS

logger = logging.getLogger("levelup")

# ── Feedback Templates ─────────────────────────────────────────────────────────

def _generate_feedback(score: float, question: str) -> str:
    if score >= 0.90:
        return "Outstanding! Your response was precise, comprehensive, and demonstrated expert-level understanding of the topic."
    elif score >= 0.80:
        return "Excellent answer! You've clearly articulated the core concepts and provided a solid technical explanation."
    elif score >= 0.70:
        return "Good technical response. You covered the essential points, though adding more specific real-world examples could strengthen your answer."
    elif score >= 0.60:
        return "Competent attempt. You have the right idea, but the explanation could be more structured and include more technical depth."
    elif score >= 0.45:
        return "Decent start, but you missed several key technical components of the answer. Focus on clarifying the fundamental definitions."
    elif score >= 0.25:
        return "Your response touched on some relevant keywords, but lacked a cohesive explanation. We recommend reviewing the core documentation for this topic."
    else:
        return "The response did not sufficiently address the technical requirements of the question. Practice articulating the basic concepts before moving to advanced topics."


def evaluate_answer(question: str, user_answer: str, role: str = "Software Engineer") -> Dict[str, Any]:
    """
    Evaluate user's interview answer.
    Returns score (0-1), feedback, and ideal answer hint.
    """
    if not user_answer or len(user_answer.strip()) < 5:
        return {"score": 0.0, "feedback": "No answer provided.", "ideal_answer_hint": ""}

    if settings.demo_mode:
        return _demo_evaluate(question, user_answer)

    try:
        return _bert_evaluate(question, user_answer, role)
    except Exception as e:
        logger.error(f"BERT evaluation failed: {e}")
        return _heuristic_evaluate(question, user_answer)


def _demo_evaluate(question: str, user_answer: str) -> Dict:
    """Demo: score based on answer length heuristic + some randomness."""
    import random
    base = min(len(user_answer.split()) / 80.0, 0.85)
    score = min(base + random.uniform(0.05, 0.15), 1.0)
    return {
        "score": round(score * 100, 1),
        "feedback": _generate_feedback(score, question),
        "ideal_answer_hint": IDEAL_ANSWERS.get(question, "Review the core concepts and practice explaining them clearly."),
        "demo": True,
    }


def _bert_evaluate(question: str, user_answer: str, role: str) -> Dict:
    """BERT sentence embedding cosine similarity."""
    from transformers import AutoTokenizer, AutoModel
    import torch
    import torch.nn.functional as F

    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)

    # Try to get or generate ideal answer
    ideal = IDEAL_ANSWERS.get(question)
    if not ideal:
        if settings.groq_api_key:
            try:
                ideal = _generate_ideal_answer_with_groq(question, role)
                # Cache it in memory for session
                IDEAL_ANSWERS[question] = ideal
            except Exception as e:
                logger.error(f"Failed to generate ideal answer with Groq: {e}")
                ideal = question
        else:
            ideal = question

    def encode(text: str) -> torch.Tensor:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        # Mean pooling
        token_embeddings = outputs.last_hidden_state
        attention_mask = inputs["attention_mask"]
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        return (token_embeddings * input_mask_expanded).sum(1) / input_mask_expanded.sum(1)

    emb_ideal = encode(ideal)
    emb_user = encode(user_answer)
    
    # Calculate cosine similarity
    score = float(F.cosine_similarity(emb_ideal, emb_user).item())
    
    # Heuristic adjustment: if similarity is low but user provided a long enough technical response, 
    # give them a slight baseline boost so it's not demoralizing.
    if len(user_answer.split()) > 15:
        score = max(score, 0.35)
        
    score = max(0.0, min(score, 1.0))

    return {
        "score": round(score * 100, 1),
        "feedback": _generate_feedback(score, question),
        "ideal_answer_hint": ideal if score < 0.7 else None,
        "demo": False,
    }


def _generate_ideal_answer_with_groq(question: str, role: str) -> str:
    """Use Groq to generate a concise, professional answer to use as a baseline."""
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    
    prompt = (
        f"You are a senior {role} conducting an interview. "
        f"Provide a concise, technically accurate 'ideal answer' for the following question: '{question}'. "
        f"The answer should be 2-3 sentences long and cover the key technical points. "
        f"Return ONLY the answer text."
    )
    
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=200,
    )
    return completion.choices[0].message.content.strip()


def _heuristic_evaluate(question: str, user_answer: str) -> Dict:
    """Simple keyword overlap heuristic."""
    q_words = set(question.lower().split())
    a_words = set(user_answer.lower().split())
    overlap = len(q_words & a_words) / max(len(q_words), 1)
    score = min(overlap * 2 + 0.3, 1.0)
    return {
        "score": round(score * 100, 1),
        "feedback": _generate_feedback(score, question),
        "ideal_answer_hint": IDEAL_ANSWERS.get(question),
        "demo": False,
    }
