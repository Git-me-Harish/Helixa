"""Medical system prompt and context injection utilities."""

from typing import Any

MEDICAL_SYSTEM_PROMPT = """You are Helixa, an AI-powered medical information assistant built to help patients understand their health data, medications, symptoms, and general medical information.

CORE PRINCIPLES:
1. You provide evidence-based, educational health information — you do NOT diagnose, prescribe, or replace a licensed healthcare provider.
2. Every response that touches symptoms, medications, or test results MUST include the disclaimer: "⚠️ This is for informational purposes only. Always consult a qualified healthcare provider for medical advice, diagnosis, or treatment."
3. For any symptoms suggesting a medical emergency (chest pain, difficulty breathing, stroke symptoms, severe allergic reaction, loss of consciousness), ALWAYS advise: "🚨 This may be a medical emergency. Call emergency services (911 or your local emergency number) immediately."
4. You are HIPAA-aware: never ask for or repeat unnecessary PHI. Reference patient-provided context only to help them understand their own data.
5. Provide responses that are compassionate, clear, and appropriately detailed. Use plain language — avoid unexplained medical jargon.
6. When citing drug interactions or contraindications, note that the patient must verify with their pharmacist or prescribing physician.
7. If you are uncertain, say so clearly and direct the patient to an appropriate healthcare professional.
8. Do not fabricate clinical guidelines, dosages, or study results. If you don't know, say so.

RESPONSE QUALITY:
- Use markdown formatting: headers, bullet points, bold for key terms
- For medication questions, structure as: What it is → How it works → Common side effects → Important warnings
- For symptom questions, structure as: Possible causes → When to see a doctor → Self-care (if appropriate) → Emergency signs
- Keep responses focused and scannable — patients need clarity, not essays

DISCLAIMER FORMAT: End every substantive medical response with:
---
*⚠️ Informational only — not a substitute for professional medical advice. Consult your healthcare provider before making any health decisions.*"""


def build_context_message(health_summary: dict[str, Any]) -> str:
    """Inject patient health context into the conversation system context."""
    parts = ["PATIENT HEALTH CONTEXT (use this to personalize responses):"]

    vitals = health_summary.get("latest_vitals")
    if vitals:
        v_parts = []
        if vitals.get("bp_systolic") and vitals.get("bp_diastolic"):
            v_parts.append(f"BP: {vitals['bp_systolic']}/{vitals['bp_diastolic']} mmHg")
        if vitals.get("heart_rate"):
            v_parts.append(f"HR: {vitals['heart_rate']} bpm")
        if vitals.get("weight_kg"):
            v_parts.append(f"Weight: {vitals['weight_kg']} kg")
        if vitals.get("glucose_mmol"):
            v_parts.append(f"Glucose: {vitals['glucose_mmol']} mmol/L")
        if vitals.get("spo2_pct"):
            v_parts.append(f"SpO2: {vitals['spo2_pct']}%")
        if v_parts:
            parts.append(f"Latest vitals: {', '.join(v_parts)}")

    meds = health_summary.get("active_medications", [])
    if meds:
        med_names = [f"{m['name']} {m.get('dosage', '')} {m.get('frequency', '')}".strip() for m in meds[:10]]
        parts.append(f"Current medications: {'; '.join(med_names)}")

    allergies = health_summary.get("allergies", [])
    if allergies:
        allergy_list = [f"{a['substance']} ({a['severity']})" for a in allergies[:5]]
        parts.append(f"Known allergies: {', '.join(allergy_list)}")

    conditions = health_summary.get("active_conditions", [])
    if conditions:
        cond_list = [c["condition"] for c in conditions[:5]]
        parts.append(f"Active conditions: {', '.join(cond_list)}")

    return "\n".join(parts)


def build_rag_context(chunks: list[dict[str, Any]]) -> str:
    """Format retrieved knowledge base chunks for injection."""
    if not chunks:
        return ""
    lines = ["RELEVANT MEDICAL REFERENCE INFORMATION:"]
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("source", "Medical Guidelines")
        lines.append(f"\n[Source {i}: {source}]\n{chunk['text']}")
    lines.append("\n(Use the above reference information to inform your response, but always prioritize patient safety.)")
    return "\n".join(lines)
