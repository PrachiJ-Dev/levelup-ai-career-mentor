"""Text cleaning utilities for resume NLP preprocessing."""
import re
import unicodedata


def clean_text(text: str) -> str:
    """Remove noise from extracted resume text."""
    # Normalize unicode
    text = unicodedata.normalize("NFKD", text)
    # Remove null bytes and control chars
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    # Collapse multiple whitespace
    text = re.sub(r"\s+", " ", text)
    # Remove URLs
    text = re.sub(r"http\S+|www\.\S+", "", text)
    # Remove email addresses
    text = re.sub(r"\S+@\S+", "", text)
    # Remove excessive punctuation
    text = re.sub(r"[^\w\s.,;:()/\-+#@&]", " ", text)
    return text.strip()


def extract_sentences(text: str) -> list[str]:
    """Split text into sentences for NLP processing."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 10]


def tokenize(text: str) -> list[str]:
    """Simple whitespace tokenizer."""
    return text.lower().split()


def remove_stopwords(tokens: list[str]) -> list[str]:
    """Remove common English stop words."""
    stopwords = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "can", "i", "my", "we", "our", "you", "your",
    }
    return [t for t in tokens if t not in stopwords and len(t) > 2]
