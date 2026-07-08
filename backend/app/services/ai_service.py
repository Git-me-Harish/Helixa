"""AI inference service: Groq primary, Ollama fallback, SSE streaming."""

import asyncio
import json
import logging
from typing import Any, AsyncIterator

import httpx
from groq import AsyncGroq, APIStatusError, RateLimitError

from app.config import settings
from app.services.medical_prompt import MEDICAL_SYSTEM_PROMPT, build_context_message, build_rag_context

logger = logging.getLogger(__name__)

_groq_client: AsyncGroq | None = None
_ollama_client: httpx.AsyncClient | None = None


def _get_groq() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=settings.groq_api_key)
    return _groq_client


def _get_ollama() -> httpx.AsyncClient:
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = httpx.AsyncClient(base_url=settings.ollama_base_url, timeout=120.0)
    return _ollama_client


_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

def _build_messages(
    history: list[dict[str, str]],
    user_message: str,
    health_context: dict[str, Any] | None = None,
    rag_chunks: list[dict[str, Any]] | None = None,
    image_data: str | None = None,
    image_media_type: str | None = None,
) -> list[dict]:
    system_parts = [MEDICAL_SYSTEM_PROMPT]
    if health_context:
        system_parts.append(build_context_message(health_context))
    if rag_chunks:
        system_parts.append(build_rag_context(rag_chunks))

    messages: list[dict] = [{"role": "system", "content": "\n\n".join(system_parts)}]
    messages.extend(history[-10:])

    if image_data and image_media_type:
        # Strip the data URI prefix if present — Groq wants raw base64
        raw_b64 = image_data.split(",", 1)[-1] if "," in image_data else image_data
        text = user_message or "Please analyze this medical image and describe any clinically relevant findings."
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{image_media_type};base64,{raw_b64}",
                    },
                },
                {"type": "text", "text": text},
            ],
        })
    else:
        messages.append({"role": "user", "content": user_message})

    return messages


async def stream_chat(
    history: list[dict[str, str]],
    user_message: str,
    health_context: dict[str, Any] | None = None,
    rag_chunks: list[dict[str, Any]] | None = None,
    image_data: str | None = None,
    image_media_type: str | None = None,
) -> AsyncIterator[tuple[str, str]]:
    """Yields (chunk_text, model_name) tuples. Falls back to Ollama, then a static message."""
    has_image = bool(image_data and image_media_type)
    messages = _build_messages(history, user_message, health_context, rag_chunks, image_data, image_media_type)

    # --- Try Groq (vision model when image present, chat model otherwise) ---
    groq_yielded = False
    try:
        async for chunk, model in _stream_groq(messages, vision=has_image):
            groq_yielded = True
            yield chunk, model
        return
    except Exception as exc:
        if groq_yielded:
            logger.error("Groq failed mid-stream after yielding content: %s", exc)
            return
        logger.warning("Groq unavailable (%s), trying Ollama fallback", exc)

    # Vision requests can't fall back to Ollama (no multimodal support in meditron)
    if has_image:
        yield (
            "I'm sorry, I couldn't process the image right now — the vision AI service is temporarily unavailable. "
            "Please try again in a moment."
        ), "unavailable"
        return

    # --- Try Ollama (text-only fallback) ---
    ollama_yielded = False
    try:
        async for chunk, model in _stream_ollama(messages):
            ollama_yielded = True
            yield chunk, model
        return
    except Exception as exc:
        if ollama_yielded:
            logger.error("Ollama failed mid-stream after yielding content: %s", exc)
            return
        logger.error("Ollama also unavailable (%s) — all AI providers failed", exc)

    yield (
        "I'm sorry, I'm temporarily unable to respond — the AI service is unavailable right now. "
        "Please make sure the backend is running and your API key is configured, then try again."
    ), "unavailable"


async def _stream_groq(messages: list[dict], vision: bool = False) -> AsyncIterator[tuple[str, str]]:
    client = _get_groq()

    # Vision requests must use the vision-capable model; no fallback to smaller model
    if vision:
        stream = await client.chat.completions.create(
            model=_VISION_MODEL, messages=messages, stream=True, temperature=0.3, max_tokens=2048,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta, f"groq/{_VISION_MODEL}"
        return

    primary = settings.groq_model
    fallback = settings.groq_fallback_model

    # Try primary model
    try:
        stream = await client.chat.completions.create(
            model=primary, messages=messages, stream=True, temperature=0.3, max_tokens=2048,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta, f"groq/{primary}"
        return
    except RateLimitError:
        logger.warning("Groq primary model rate-limited, trying fallback model %s", fallback)
    except (APIStatusError, Exception) as exc:
        logger.warning("Groq primary model failed (%s), trying fallback model %s", exc, fallback)

    # Try smaller fallback Groq model
    stream = await client.chat.completions.create(
        model=fallback, messages=messages, stream=True, temperature=0.3, max_tokens=2048,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta, f"groq/{fallback}"


async def _stream_ollama(messages: list[dict]) -> AsyncIterator[tuple[str, str]]:
    client = _get_ollama()
    model_name = settings.ollama_medical_model
    payload = {
        "model": model_name,
        "messages": messages,
        "stream": True,
        "options": {"temperature": 0.3, "num_predict": 2048},
    }
    async with client.stream("POST", "/api/chat", json=payload) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if not line:
                continue
            try:
                data = json.loads(line)
                content = data.get("message", {}).get("content", "")
                if content:
                    yield content, f"ollama/{model_name}"
            except json.JSONDecodeError:
                continue


async def complete_text(prompt: str, max_tokens: int = 1024) -> str:
    """Non-streaming completion. Tries Groq primary → Groq fallback → Ollama → empty string."""
    messages = [
        {"role": "system", "content": MEDICAL_SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
    # Try Groq primary
    try:
        client = _get_groq()
        response = await client.chat.completions.create(
            model=settings.groq_model, messages=messages, temperature=0.2, max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
    except RateLimitError:
        logger.warning("Groq primary rate-limited for complete_text, trying fallback model")
    except Exception as exc:
        logger.error("Groq primary complete_text failed: %s, trying fallback model", exc)

    # Try Groq fallback model
    try:
        client = _get_groq()
        response = await client.chat.completions.create(
            model=settings.groq_fallback_model, messages=messages, temperature=0.2, max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("Groq fallback complete_text failed: %s, trying Ollama", exc)

    # Try Ollama
    return await _ollama_complete(messages, max_tokens)


async def _ollama_complete(messages: list[dict], max_tokens: int) -> str:
    try:
        client = _get_ollama()
        payload = {
            "model": settings.ollama_medical_model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": max_tokens},
        }
        response = await client.post("/api/chat", json=payload)
        response.raise_for_status()
        return response.json().get("message", {}).get("content", "")
    except Exception as exc:
        logger.error("Ollama complete_text also failed: %s — returning empty string", exc)
        return ""


async def summarize_document(ocr_text: str, entities: dict[str, Any]) -> dict[str, Any]:
    """Structured document summary — returns JSON dict."""
    entity_summary = ""
    if entities.get("diseases"):
        entity_summary += f"\nIdentified conditions/diseases: {', '.join(entities['diseases'][:10])}"
    if entities.get("chemicals"):
        entity_summary += f"\nIdentified medications/substances: {', '.join(entities['chemicals'][:10])}"

    prompt = f"""Analyze this medical document and return a JSON object with these exact keys:
- document_type: string (e.g., "Lab Report", "Prescription", "Discharge Summary", "Radiology Report", "Unknown")
- key_findings: array of strings (up to 5 most important findings)
- medications_found: array of objects with {{name, dosage, frequency}} if any
- values_found: array of objects with {{test_name, value, unit, reference_range, status}} for any lab values
- recommended_actions: array of strings (what the patient should follow up on)
- urgency: "routine" | "soon" | "urgent" (based on content)
- summary: string (2-3 sentence plain language summary for the patient)

Medical document text:
{ocr_text[:4000]}
{entity_summary}

Return ONLY valid JSON. No markdown, no explanation."""

    raw = await complete_text(prompt, max_tokens=1500)

    try:
        # Strip markdown code blocks if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean)
    except json.JSONDecodeError:
        return {
            "document_type": "Unknown",
            "key_findings": ["Document processed but structured extraction failed"],
            "medications_found": [],
            "values_found": [],
            "recommended_actions": ["Review document manually with your healthcare provider"],
            "urgency": "routine",
            "summary": "Document was uploaded and processed. Please review the full text.",
        }


async def generate_health_insights(vitals_data: list[dict], medications: list[dict]) -> list[dict[str, str]]:
    """Generate 3 AI health insights from recent vital trends."""
    if not vitals_data:
        return []

    vitals_str = json.dumps(vitals_data[-30:], default=str)
    meds_str = json.dumps([{"name": m["name"], "dosage": m.get("dosage")} for m in medications[:5]], default=str)

    prompt = f"""Analyze this patient's recent vital signs trend and medications, then provide exactly 3 health insights as a JSON array.

Recent vitals (last 30 readings): {vitals_str}
Current medications: {meds_str}

Return a JSON array of exactly 3 objects, each with:
- title: string (brief, clear insight title)
- body: string (2-3 sentences explaining the insight in plain language)
- severity: "info" | "warning" | "positive"
- category: "vitals" | "medications" | "lifestyle" | "followup"

Focus on trends, patterns, or notable values. Be educational and supportive.
Return ONLY valid JSON array."""

    raw = await complete_text(prompt, max_tokens=800)
    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        result = json.loads(clean)
        if isinstance(result, list):
            return result[:3]
    except Exception as exc:
        logger.warning("generate_health_insights: failed to parse AI response: %s", exc)

    return [
        {
            "title": "Keep tracking your vitals",
            "body": "Regular vital sign monitoring helps your care team spot trends early. Continue logging your readings consistently.",
            "severity": "info",
            "category": "vitals",
        }
    ]


async def generate_followup_suggestions(user_message: str, ai_response: str) -> list[str]:
    """Generate 3 short follow-up question suggestions based on the conversation turn."""
    prompt = f"""Based on this health Q&A exchange, generate exactly 3 short follow-up questions the patient might want to ask next. Keep each under 10 words.

Patient asked: {user_message[:300]}
Assistant answered: {ai_response[:500]}

Return ONLY a JSON array of 3 strings. No explanation, no markdown."""

    raw = await complete_text(prompt, max_tokens=150)
    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        result = json.loads(clean)
        if isinstance(result, list):
            return [str(s) for s in result[:3]]
    except Exception:
        pass
    return []


async def generate_appointment_prep(health_summary: dict[str, Any], appointment_notes: str) -> str:
    """Generate pre-appointment talking points based on health data."""
    prompt = f"""A patient has an upcoming medical appointment. Based on their health data and appointment notes, generate 3-5 specific talking points they should raise with their doctor.

Appointment notes: {appointment_notes}
Health summary: {json.dumps(health_summary, default=str)}

Format as a concise bullet list. Focus on specific, actionable discussion points.
End with the disclaimer: *Always bring your complete medication list and any recent test results to your appointment.*"""

    return await complete_text(prompt, max_tokens=500)
