"""Qdrant local vector store for medical knowledge RAG."""

import logging
from pathlib import Path
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_qdrant_client = None
_embedder = None
VECTOR_SIZE = 768


def _get_client():
    global _qdrant_client
    if _qdrant_client is None:
        try:
            from qdrant_client import QdrantClient
            Path(settings.qdrant_path).mkdir(parents=True, exist_ok=True)
            _qdrant_client = QdrantClient(path=settings.qdrant_path)
            _ensure_collection(_qdrant_client)
        except ImportError:
            logger.warning("qdrant_client not installed — RAG disabled")
    return _qdrant_client


def _get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer(settings.embedding_model)
        except ImportError:
            logger.warning("sentence_transformers not installed — RAG disabled")
    return _embedder


def _ensure_collection(client) -> None:
    from qdrant_client.models import Distance, VectorParams

    existing = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        logger.info("Created Qdrant collection: %s", settings.qdrant_collection)


def embed(text: str) -> list[float]:
    embedder = _get_embedder()
    if embedder is None:
        return []
    return embedder.encode(text, normalize_embeddings=True).tolist()


def upsert_chunks(chunks: list[dict[str, Any]]) -> int:
    """Upsert document chunks into vector store. Returns count inserted."""
    client = _get_client()
    embedder = _get_embedder()
    if client is None or embedder is None:
        return 0

    from qdrant_client.models import PointStruct

    points = []
    for chunk in chunks:
        vector = embedder.encode(chunk["text"], normalize_embeddings=True).tolist()
        points.append(
            PointStruct(
                id=chunk["id"],
                vector=vector,
                payload={"text": chunk["text"], "source": chunk.get("source", ""), "page": chunk.get("page", 0)},
            )
        )

    if points:
        client.upsert(collection_name=settings.qdrant_collection, points=points)
    return len(points)


def search(query: str, top_k: int = 4) -> list[dict[str, Any]]:
    """Search knowledge base for relevant chunks."""
    client = _get_client()
    if client is None:
        return []

    query_vector = embed(query)
    if not query_vector:
        return []

    try:
        results = client.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=0.65,
        )
        return [
            {"text": r.payload["text"], "source": r.payload.get("source", ""), "score": r.score}
            for r in results
        ]
    except Exception as exc:
        logger.error("RAG search failed: %s", exc)
        return []


def get_collection_info() -> dict[str, Any]:
    client = _get_client()
    if client is None:
        return {"status": "unavailable", "count": 0}
    try:
        info = client.get_collection(settings.qdrant_collection)
        return {"status": "ok", "count": info.points_count}
    except Exception:
        return {"status": "error", "count": 0}
