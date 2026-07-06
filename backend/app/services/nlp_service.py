"""Clinical NLP: scispaCy + medspaCy entity extraction and negation detection."""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_nlp_pipeline = None


def _get_pipeline():
    global _nlp_pipeline
    if _nlp_pipeline is not None:
        return _nlp_pipeline

    try:
        import spacy
        import medspacy

        # Try medical NER model first, fall back to base
        try:
            nlp = spacy.load("en_ner_bc5cdr_md")
            logger.info("Loaded scispaCy bc5cdr NER model")
        except OSError:
            try:
                import scispacy  # noqa: F401
                nlp = spacy.load("en_core_sci_sm")
                logger.info("Loaded scispaCy sci_sm model")
            except OSError:
                nlp = spacy.load("en_core_web_sm")
                logger.info("Loaded spaCy web_sm fallback model")

        # Add medspaCy pipeline components
        nlp.add_pipe("medspacy_pyrush")
        nlp.add_pipe("medspacy_context")
        nlp.add_pipe("medspacy_sectionizer")

        _nlp_pipeline = nlp
        return _nlp_pipeline
    except ImportError as exc:
        logger.warning("Clinical NLP unavailable: %s", exc)
        return None
    except Exception as exc:
        logger.error("NLP pipeline init failed: %s", exc)
        return None


def extract_entities(text: str) -> dict[str, Any]:
    """
    Extract medical entities from text.
    Returns dict with diseases, chemicals, negated_terms, sections.
    Gracefully degrades if NLP libraries not installed.
    """
    nlp = _get_pipeline()
    if nlp is None:
        return _regex_fallback(text)

    try:
        doc = nlp(text[:10000])  # cap input to avoid OOM
        diseases = []
        chemicals = []
        negated_terms = []
        all_entities = []

        for ent in doc.ents:
            entry = {
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
            }
            # medspaCy context attributes
            if hasattr(ent._, "is_negated") and ent._.is_negated:
                negated_terms.append(ent.text)
                entry["negated"] = True
            else:
                entry["negated"] = False

            all_entities.append(entry)

            label = ent.label_.upper()
            if label in ("DISEASE", "CONDITION", "DISORDER", "PROBLEM"):
                if not entry["negated"]:
                    diseases.append(ent.text)
            elif label in ("CHEMICAL", "DRUG", "MEDICATION", "TREATMENT"):
                if not entry["negated"]:
                    chemicals.append(ent.text)

        # Extract sections if sectionizer ran
        sections = []
        if hasattr(doc._, "sections"):
            for section in doc._.sections:
                if section.category:
                    sections.append(section.category)

        return {
            "diseases": list(dict.fromkeys(diseases)),       # dedup preserving order
            "chemicals": list(dict.fromkeys(chemicals)),
            "negated_terms": list(dict.fromkeys(negated_terms)),
            "sections": sections,
            "entity_count": len(all_entities),
            "all_entities": all_entities[:50],  # cap for storage
        }
    except Exception as exc:
        logger.error("Entity extraction failed: %s", exc)
        return _regex_fallback(text)


def _regex_fallback(text: str) -> dict[str, Any]:
    """Simple regex-based entity extraction when NLP stack isn't available."""
    common_drugs = re.findall(
        r'\b(aspirin|ibuprofen|metformin|lisinopril|atorvastatin|omeprazole|amoxicillin|'
        r'paracetamol|acetaminophen|warfarin|metoprolol|amlodipine|losartan|simvastatin)\b',
        text.lower(),
    )
    return {
        "diseases": [],
        "chemicals": list(dict.fromkeys(common_drugs)),
        "negated_terms": [],
        "sections": [],
        "entity_count": len(common_drugs),
        "all_entities": [],
    }
