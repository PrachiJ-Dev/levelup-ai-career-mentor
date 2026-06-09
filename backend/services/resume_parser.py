"""
Resume parser using pdfminer.six for text extraction.
Falls back gracefully if pdfminer is not installed (demo mode).
"""
import io
import logging

logger = logging.getLogger("levelup")


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file using pdfminer.six."""
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(file_path)
        return text.strip()
    except ImportError:
        logger.warning("pdfminer.six not installed. Returning placeholder text.")
        return "Sample resume text. Please install pdfminer.six for real extraction."
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return ""


def extract_text_from_bytes(content: bytes) -> str:
    """Extract text from PDF bytes (in-memory)."""
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(io.BytesIO(content))
        return text.strip()
    except ImportError:
        return "Sample resume text."
    except Exception as e:
        logger.error(f"PDF extraction from bytes failed: {e}")
        return ""
