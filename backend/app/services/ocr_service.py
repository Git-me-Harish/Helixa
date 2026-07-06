"""OCR pipeline: EasyOCR for PDFs and images (Python 3.12 compatible)."""

import logging
import mimetypes
import os
import tempfile
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_ocr_reader = None


def _get_reader():
    global _ocr_reader
    if _ocr_reader is not None:
        return _ocr_reader
    try:
        import easyocr
        _ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        logger.info("EasyOCR initialised (CPU mode)")
    except ImportError:
        logger.warning("easyocr not installed — OCR unavailable, text-native PDFs still work via pdfminer")
    return _ocr_reader


def extract_text(file_path: str | Path) -> dict[str, Any]:
    path = Path(file_path)
    mime = _guess_mime(path)
    if mime == "application/pdf":
        return _extract_pdf(path)
    if mime.startswith("image/"):
        return _extract_image(path)
    return {"text": "", "page_count": 0, "method": "unsupported", "confidence": 0.0}


def _extract_pdf(path: Path) -> dict[str, Any]:
    # Text-native PDF: pdfminer is fast and lossless — try first
    text = _pdfminer_extract(path)
    if text and len(text.strip()) > 100:
        return {
            "text": text,
            "page_count": _pdf_page_count(path),
            "method": "pdfminer",
            "confidence": 0.95,
        }
    # Scanned PDF: rasterise each page then run EasyOCR
    return _easyocr_pdf(path)


def _pdfminer_extract(path: Path) -> str:
    try:
        from pdfminer.high_level import extract_text as _extract
        return _extract(str(path))
    except Exception as exc:
        logger.debug("pdfminer failed on %s: %s", path, exc)
        return ""


def _pdf_page_count(path: Path) -> int:
    try:
        from pdfminer.pdfpage import PDFPage
        with open(path, "rb") as f:
            return sum(1 for _ in PDFPage.get_pages(f))
    except Exception:
        return 0


def _easyocr_pdf(path: Path) -> dict[str, Any]:
    reader = _get_reader()
    if reader is None:
        return {"text": "", "page_count": 0, "method": "failed", "confidence": 0.0}
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(str(path), dpi=150)
        all_text, all_conf = [], []
        for img in images:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                img.save(tmp.name, "JPEG")
                try:
                    result = reader.readtext(tmp.name)
                    all_text.extend(item[1] for item in result)
                    all_conf.extend(item[2] for item in result)
                finally:
                    os.unlink(tmp.name)
        return {
            "text": "\n".join(all_text),
            "page_count": len(images),
            "method": "easyocr_pdf",
            "confidence": round(sum(all_conf) / len(all_conf), 3) if all_conf else 0.0,
        }
    except ImportError:
        logger.warning("pdf2image not installed — cannot OCR scanned PDFs")
        return {"text": "", "page_count": 0, "method": "pdf2image_missing", "confidence": 0.0}
    except Exception as exc:
        logger.error("EasyOCR PDF extraction failed: %s", exc)
        return {"text": "", "page_count": 0, "method": "failed", "confidence": 0.0}


def _extract_image(path: Path) -> dict[str, Any]:
    reader = _get_reader()
    if reader is None:
        return {"text": "", "page_count": 1, "method": "failed", "confidence": 0.0}
    try:
        result = reader.readtext(str(path))
        lines = [item[1] for item in result]
        scores = [item[2] for item in result]
        return {
            "text": "\n".join(lines),
            "page_count": 1,
            "method": "easyocr",
            "confidence": round(sum(scores) / len(scores), 3) if scores else 0.0,
        }
    except Exception as exc:
        logger.error("EasyOCR image extraction failed: %s", exc)
        return {"text": "", "page_count": 1, "method": "failed", "confidence": 0.0}


def _guess_mime(path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "application/octet-stream"
