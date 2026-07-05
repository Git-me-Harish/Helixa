"""Speech-to-text using faster-whisper (MIT license, turbo model)."""

import logging
import tempfile
import os
from pathlib import Path

logger = logging.getLogger(__name__)

_whisper_model = None


def _get_model():
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model
    try:
        from faster_whisper import WhisperModel
        # turbo: 809M params, ~8x faster than large-v2, ~6GB VRAM or runs on CPU
        _whisper_model = WhisperModel("turbo", device="cpu", compute_type="int8")
        logger.info("faster-whisper turbo model loaded")
    except ImportError:
        logger.warning("faster-whisper not installed — speech transcription disabled")
    except Exception as exc:
        logger.error("Whisper model load failed: %s", exc)
    return _whisper_model


def transcribe(audio_bytes: bytes, audio_format: str = "wav") -> dict:
    """
    Transcribe audio bytes to text.
    Returns: {text, language, duration_seconds, segments}
    """
    model = _get_model()
    if model is None:
        return {"text": "", "language": "en", "duration_seconds": 0.0, "segments": [], "error": "Whisper not available"}

    try:
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        segments, info = model.transcribe(tmp_path, beam_size=5, language="en")
        segment_list = [{"start": s.start, "end": s.end, "text": s.text} for s in segments]
        full_text = " ".join(s["text"].strip() for s in segment_list)

        return {
            "text": full_text,
            "language": info.language,
            "duration_seconds": info.duration,
            "segments": segment_list,
        }
    except Exception as exc:
        logger.error("Transcription failed: %s", exc)
        return {"text": "", "language": "en", "duration_seconds": 0.0, "segments": [], "error": str(exc)}
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
