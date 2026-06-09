"""
DistilBERT NER Tokenizer wrapper.
Handles subword tokenization and word-to-token alignment for NER.
"""
from transformers import DistilBertTokenizerFast
from typing import List, Dict

PRETRAINED_MODEL = "distilbert-base-uncased"
_tokenizer = None


def get_tokenizer() -> DistilBertTokenizerFast:
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = DistilBertTokenizerFast.from_pretrained(PRETRAINED_MODEL)
    return _tokenizer


def tokenize_and_align(
    text: str,
    max_length: int = 512,
) -> Dict:
    """
    Tokenize text and return encoding with word_ids for label alignment.
    Handles subword tokens (e.g., ##ing) for NER.
    """
    tokenizer = get_tokenizer()
    encoding = tokenizer(
        text,
        max_length=max_length,
        truncation=True,
        padding="max_length",
        return_tensors="pt",
        return_offsets_mapping=True,
        is_split_into_words=False,
    )
    return encoding
