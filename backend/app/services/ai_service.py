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


def _build_messages(
    history: list[dict[str, str]],
    user_message: str,
    health_context: dict[str, Any] | None = None,
    rag_chunks: list[dict[str, Any]] | None = None,
) -> list[dict[str, str]]:
    system_parts = [MEDICAL_SYSTEM_PROMPT]
    if health_context:
        system_parts.append(build_context_message(health_context))
    if rag_chunks:
        system_parts.append(build_rag_context(rag_chunks))

    messages = [{"role": "system", "content": "\n\n".join(system_parts)}]
    messages.extend(history[-10:])  # cap context window
    messages.append({"role": "user", "content": user_message})
    return messages


async def stream_chat(
    history: list[dict[str, str]],
    user_message: str,
    health_context: dict[str, Any] | None = None,
    rag_chunks: list[dict[str, Any]] | None = None,
) -> AsyncIterator[tuple[str, str]]:
    """Yields (chunk_text, model_name) tuples. Falls back to Ollama on Groq failure."""
    messages = _build_messages(history, user_message, health_context, rag_chunks)

    # Try Groq first
    try:
        async for chunk, model in _stream_groq(messages):
            yield chunk, model
        return
    except (RateLimitError, APIStatusError) as exc:
        logger.warning("Groq failed (%s), falling back to Ollama", exc)
    except Exception as exc:
        logger.error("Groq unexpected error: %s", exc)

    # Ollama fallback
    async for chunk, model in _stream_ollama(messages):
        yield chunk, model


async def _stream_groq(messages: list[dict]) -> AsyncIterator[tuple[str, str]]:
    client = _get_groq()
    model_name = settings.groq_model
    try:
        stream = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            stream=True,
            temperature=0.3,
            max_tokens=2048,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta, f"groq/{model_name}"
    except RateLimitError:
        # Try the smaller fallback Groq model before giving up
        stream = await client.chat.completions.create(
            model=settings.groq_fallback_model,
            messages=messages,
            stream=True,
            temperature=0.3,
            max_tokens=2048,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta, f"groq/{settings.groq_fallback_model}"


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
    """Non-streaming completion for document summarization and insights."""
    messages = [
        {"role": "system", "content": MEDICAL_SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
    try:
        client = _get_groq()
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=0.2,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("Groq complete_text failed: %s, trying Ollama", exc)
        return await _ollama_complete(messages, max_tokens)


async def _ollama_complete(messages: list[dict], max_tokens: int) -> str:
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


async def generate_appointment_prep(health_summary: dict[str, Any], appointment_notes: str) -> str:
    """Generate pre-appointment talking points based on health data."""
    prompt = f"""A patient has an upcoming medical appointment. Based on their health data and appointment notes, generate 3-5 specific talking points they should raise with their doctor.

Appointment notes: {appointment_notes}
Health summary: {json.dumps(health_summary, default=str)}

Format as a concise bullet list. Focus on specific, actionable discussion points.
End with the disclaimer: *Always bring your complete medication list and any recent test results to your appointment.*"""

    return await complete_text(prompt, max_tokens=500)
