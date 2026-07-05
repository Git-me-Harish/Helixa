"""
Knowledge base ingestion script.

Place medical PDF guidelines in backend/data/ then run:
    cd backend && python -m ingest.ingest_knowledge

Documents are chunked, embedded with pubmedbert, and stored in local Qdrant.
"""

import sys
import uuid
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.services import rag_service, ocr_service

CHUNK_SIZE = 700
CHUNK_OVERLAP = 70


def chunk_text(text: str, source: str) -> list[dict]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_text = text[start:end]
        if chunk_text.strip():
            chunks.append({
                "id": uuid.uuid4().int & 0xFFFFFFFFFFFFFFFF,  # Qdrant needs uint64
                "text": chunk_text,
                "source": source,
                "page": 0,
            })
        start = end - CHUNK_OVERLAP
    return chunks


def ingest_directory(data_dir: str = "data") -> None:
    data_path = Path(data_dir)
    if not data_path.exists():
        print(f"Data directory '{data_dir}' not found. Create it and add PDF files.")
        return

    pdfs = list(data_path.glob("*.pdf"))
    if not pdfs:
        print(f"No PDF files found in '{data_dir}'")
        return

    total_chunks = 0
    for pdf_path in pdfs:
        print(f"Processing: {pdf_path.name}")
        result = ocr_service.extract_text(pdf_path)
        text = result.get("text", "")
        if not text.strip():
            print(f"  ⚠ No text extracted from {pdf_path.name}")
            continue

        chunks = chunk_text(text, pdf_path.name)
        inserted = rag_service.upsert_chunks(chunks)
        total_chunks += inserted
        print(f"  ✓ {inserted} chunks indexed from {pdf_path.name}")

    info = rag_service.get_collection_info()
    print(f"\nKnowledge base: {info['count']} total vectors in collection '{settings.qdrant_collection}'")
    print(f"Ingested {total_chunks} new chunks this run.")


if __name__ == "__main__":
    ingest_directory()
