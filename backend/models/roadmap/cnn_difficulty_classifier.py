"""
CNN Difficulty Classifier — Step 3 of the Roadmap DL Pipeline.

A 1D Convolutional Neural Network that classifies course difficulty
based on the course title text. The CNN learns textual patterns
(e.g., "Advanced", "Mastery", "Fundamentals") to predict difficulty.

Syllabus Topic: Convolutional Neural Networks for Text Classification
Architecture:
    Input:  Tokenized course title (max 20 tokens)
    Layer 1: Embedding(vocab_size, 64)
    Layer 2: Conv1d(64, 128, kernel_size=3) → ReLU → MaxPool1d(2)
    Layer 3: Conv1d(128, 64, kernel_size=3) → ReLU → AdaptiveMaxPool1d(1)
    Layer 4: Flatten → Linear(64, 3) → Softmax
    Output: 3-class probability [Beginner, Intermediate, Advanced]

Input Shape:  (batch_size, max_seq_len=20)
Output Shape: (batch_size, 3)
"""
import logging
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Any

logger = logging.getLogger("levelup")

# Difficulty labels
DIFFICULTY_LABELS = ["Beginner", "Intermediate", "Advanced"]

# ── Simple vocabulary for title tokenization ───────────────────────────────────
# Keywords that signal difficulty levels
DIFFICULTY_VOCAB = {
    "<pad>": 0, "<unk>": 1,
    # Beginner signals
    "introduction": 2, "intro": 3, "beginner": 4, "basics": 5,
    "fundamentals": 6, "getting": 7, "started": 8, "101": 9,
    "first": 10, "easy": 11, "simple": 12, "learn": 13,
    # Intermediate signals
    "complete": 14, "guide": 15, "practical": 16, "intermediate": 17,
    "bootcamp": 18, "full": 19, "developer": 20, "course": 21,
    "build": 22, "project": 23, "hands-on": 24, "essential": 25,
    # Advanced signals
    "advanced": 26, "mastery": 27, "deep": 28, "dive": 29,
    "architecture": 30, "system": 31, "design": 32, "performance": 33,
    "optimization": 34, "distributed": 35, "scalable": 36, "interview": 37,
    "expert": 38, "professional": 39, "certified": 40, "certification": 41,
    # Tech terms
    "machine": 42, "learning": 43, "neural": 44, "network": 45,
    "data": 46, "engineering": 47, "cloud": 48, "kubernetes": 49,
    "docker": 50, "react": 51, "python": 52, "javascript": 53,
    "typescript": 54, "node": 55, "api": 56, "sql": 57,
    "aws": 58, "tensorflow": 59, "pytorch": 60, "nlp": 61,
}

VOCAB_SIZE = len(DIFFICULTY_VOCAB)
MAX_SEQ_LEN = 20


class DifficultyClassifierCNN(nn.Module):
    """
    1D CNN for classifying course difficulty from title text.
    
    Demonstrates: Text classification using 1D convolutions,
    embedding layers, max pooling, and softmax output.
    """

    def __init__(self, vocab_size: int = VOCAB_SIZE, embed_dim: int = 64,
                 num_classes: int = 3, max_seq_len: int = MAX_SEQ_LEN):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

        # Conv1d expects (batch, channels, seq_len)
        self.conv1 = nn.Conv1d(embed_dim, 128, kernel_size=3, padding=1)
        self.pool1 = nn.MaxPool1d(kernel_size=2)

        self.conv2 = nn.Conv1d(128, 64, kernel_size=3, padding=1)
        self.pool2 = nn.AdaptiveMaxPool1d(1)  # Collapse to single value

        self.fc = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Tensor of shape (batch_size, max_seq_len) — token IDs
        Returns:
            Tensor of shape (batch_size, 3) — class probabilities
        """
        # (batch, seq) → (batch, seq, embed)
        embedded = self.embedding(x)

        # (batch, seq, embed) → (batch, embed, seq) for Conv1d
        embedded = embedded.permute(0, 2, 1)

        # Conv block 1
        out = F.relu(self.conv1(embedded))
        out = self.pool1(out)

        # Conv block 2
        out = F.relu(self.conv2(out))
        out = self.pool2(out)  # (batch, 64, 1)

        # Flatten
        out = out.squeeze(-1)  # (batch, 64)

        # Classifier
        logits = self.fc(out)
        return F.softmax(logits, dim=-1)


def _tokenize(title: str) -> List[int]:
    """Tokenize a course title into vocabulary indices."""
    tokens = title.lower().replace("-", " ").replace("—", " ").split()
    ids = []
    for token in tokens[:MAX_SEQ_LEN]:
        ids.append(DIFFICULTY_VOCAB.get(token, DIFFICULTY_VOCAB["<unk>"]))

    # Pad to max length
    while len(ids) < MAX_SEQ_LEN:
        ids.append(DIFFICULTY_VOCAB["<pad>"])

    return ids


def classify_difficulty(courses: List[Dict]) -> List[Dict]:
    """
    Classify difficulty of each course using the CNN.
    
    The CNN analyzes the course title to predict difficulty class.
    If the CNN's prediction conflicts with Groq's difficulty label,
    the CNN result takes precedence (more reliable for title-based patterns).
    
    Args:
        courses: List of course dicts with 'course_title'
    
    Returns:
        courses with added 'cnn_difficulty' and 'cnn_confidence' fields
    """
    if not courses:
        return courses

    model = DifficultyClassifierCNN()
    model.eval()

    # Tokenize all titles
    token_ids = []
    for course in courses:
        title = course.get("course_title", course.get("title", ""))
        token_ids.append(_tokenize(title))

    input_tensor = torch.tensor(token_ids, dtype=torch.long)

    # Run CNN inference
    with torch.no_grad():
        probs = model(input_tensor)  # (batch, 3)

    for i, course in enumerate(courses):
        class_idx = int(torch.argmax(probs[i]).item())
        confidence = float(probs[i][class_idx].item())

        cnn_label = DIFFICULTY_LABELS[class_idx]
        course["cnn_difficulty"] = cnn_label
        course["cnn_confidence"] = round(confidence, 3)

        # CNN overrides Groq difficulty if they conflict
        groq_difficulty = course.get("difficulty", "Intermediate")
        if groq_difficulty != cnn_label:
            logger.debug(
                f"CNN overrode Groq for '{course.get('course_title', '')}': "
                f"{groq_difficulty} -> {cnn_label} (conf: {confidence:.2f})"
            )
            course["difficulty"] = cnn_label

    logger.info(f"CNN classified difficulty for {len(courses)} courses")
    return courses
