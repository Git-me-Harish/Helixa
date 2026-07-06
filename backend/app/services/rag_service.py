"""Qdrant local vector store for medical knowledge RAG."""

import asyncio
import logging
from enum import Enum
from pathlib import Path
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_qdrant_client = None
_embedder = None

# Sticky init-failure reasons. Set once per process; avoids re-attempting (and
# re-logging) a broken import/connection on every single chat message.
_client_error: str | None = None
_embedder_error: str | None = None

VECTOR_SIZE = 768


class RAGState(str, Enum):
    READY = "ready"                # collection exists and has >=1 vector
    EMPTY = "empty"                # deps fine, collection exists, 0 vectors — never ingested
    DEPS_MISSING = "deps_missing"  # qdrant_client / sentence_transformers not installed
    INIT_ERROR = "init_error"      # unexpected failure: corrupt storage, dim mismatch, etc.


def _get_client():
    global _qdrant_client, _client_error
    if _qdrant_client is None and _client_error is None:
        try:
            from qdrant_client import QdrantClient

            Path(settings.qdrant_path).mkdir(parents=True, exist_ok=True)
            client = QdrantClient(path=settings.qdrant_path)
            _ensure_collection(client)
            _qdrant_client = client
        except ImportError as exc:
            _client_error = f"qdrant_client not installed: {exc}"
            logger.warning("RAG disabled — %s", _client_error)
        except Exception as exc:
            # Corrupt local storage, permission errors, dimension mismatch raised
            # from _ensure_collection — all previously vanished behind a bare `pass`.
            _client_error = f"Qdrant init failed: {exc}"
            logger.error("RAG disabled — %s", _client_error, exc_info=True)
    return _qdrant_client


def _get_embedder():
    global _embedder, _embedder_error
    if _embedder is None and _embedder_error is None:
        try:
            from sentence_transformers import SentenceTransformer

            _embedder = SentenceTransformer(settings.embedding_model)
        except ImportError as exc:
            _embedder_error = f"sentence_transformers not installed: {exc}"
            logger.warning("RAG disabled — %s", _embedder_error)
        except Exception as exc:
            _embedder_error = f"Embedder load failed ({settings.embedding_model}): {exc}"
            logger.error("RAG disabled — %s", _embedder_error, exc_info=True)
    return _embedder


def _ensure_collection(client) -> None:
    """Create the collection if missing; validate vector size if it already exists.

    Previously this only handled the "missing" case. A collection created under a
    different embedding model (different vector size) would pass silently here and
    then throw on the *first query* inside `search()`'s bare `except Exception`,
    which just logged-and-returned-[] — a dimension mismatch looked identical to
    "no results found."
    """
    from qdrant_client.models import Distance, VectorParams

    existing = {c.name for c in client.get_collections().collections}
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        logger.info("Created Qdrant collection: %s", settings.qdrant_collection)
        return

    info = client.get_collection(settings.qdrant_collection)
    configured_size = info.config.params.vectors.size
    if configured_size != VECTOR_SIZE:
        raise RuntimeError(
            f"Collection '{settings.qdrant_collection}' has vector size {configured_size}, "
            f"but the configured embedding model produces {VECTOR_SIZE}-dim vectors. "
            f"Delete '{settings.qdrant_path}' and re-run ingestion, or fix `embedding_model`."
        )


def get_status() -> dict[str, Any]:
    """Structured RAG subsystem status for /api/health and per-message grounding labels."""
    client = _get_client()
    embedder = _get_embedder()

    if client is None or embedder is None:
        reason = _client_error or _embedder_error or "unknown initialization failure"
        state = RAGState.DEPS_MISSING if "not installed" in reason else RAGState.INIT_ERROR
        return {"state": state, "ready": False, "vector_count": 0, "detail": reason}

    try:
        info = client.get_collection(settings.qdrant_collection)
        count = info.points_count
    except Exception as exc:
        logger.error("RAG collection lookup failed: %s", exc, exc_info=True)
        return {
            "state": RAGState.INIT_ERROR,
            "ready": False,
            "vector_count": 0,
            "detail": f"collection lookup failed: {exc}",
        }

    if count == 0:
        return {
            "state": RAGState.EMPTY,
            "ready": False,
            "vector_count": 0,
            "detail": (
                "Knowledge base is empty — place clinical guideline PDFs in backend/data/ "
                "and run `python -m ingest.ingest_knowledge`."
            ),
        }

    return {"state": RAGState.READY, "ready": True, "vector_count": count, "detail": None}


def embed(text: str) -> list[float]:
    embedder = _get_embedder()
    if embedder is None:
        return []
    return embedder.encode(text, normalize_embeddings=True).tolist()


def upsert_chunks(chunks: list[dict[str, Any]]) -> int:
    """Upsert document chunks into vector store. Returns count inserted.

    Idempotency is the caller's responsibility: pass a deterministic `id` per
    chunk (see `ingest/ingest_knowledge.py::_stable_id`) so re-running ingestion
    on unchanged source material overwrites the same points instead of piling
    up duplicates that dilute retrieval quality over time.
    """
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


def search(query: str, top_k: int | None = None, score_threshold: float | None = None) -> list[dict[str, Any]]:
    """Blocking KB search (embedding inference + local Qdrant IO).

    Called directly from ingestion/CLI contexts. From the async chat request
    path, use `asearch()` instead — this was previously called unawaited
    inside an async route handler, serializing embedding + vector-search
    latency onto the event loop for every concurrent chat message.
    """
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
            limit=top_k or settings.rag_top_k,
            score_threshold=score_threshold if score_threshold is not None else settings.rag_score_threshold,
        )
        return [
            {"text": r.payload["text"], "source": r.payload.get("source", ""), "score": r.score}
            for r in results
        ]
    except Exception as exc:
        logger.error("RAG search failed: %s", exc, exc_info=True)
        return []


async def asearch(query: str, top_k: int | None = None, score_threshold: float | None = None) -> list[dict[str, Any]]:
    """Non-blocking wrapper — offloads the sync embedding + Qdrant call to a worker thread."""
    return await asyncio.to_thread(search, query, top_k, score_threshold)


def is_initialized() -> bool:
    """Free in-memory check — no I/O. True iff both client and embedder loaded successfully."""
    return _qdrant_client is not None and _embedder is not None


async def aget_status() -> dict[str, Any]:
    """Non-blocking wrapper around get_status() for use inside async handlers."""
    return await asyncio.to_thread(get_status)


def get_collection_info() -> dict[str, Any]:
    client = _get_client()
    if client is None:
        return {"status": "unavailable", "count": 0}
    try:
        info = client.get_collection(settings.qdrant_collection)
        return {"status": "ok", "count": info.points_count}
    except Exception as exc:
        logger.error("get_collection_info failed: %s", exc, exc_info=True)
        return {"status": "error", "count": 0}
