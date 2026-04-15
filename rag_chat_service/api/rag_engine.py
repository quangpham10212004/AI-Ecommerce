import hashlib
import json
import math
import os
import unicodedata
from functools import lru_cache
from pathlib import Path

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import exceptions as qdrant_exceptions
    from qdrant_client.models import Distance, PointStruct, VectorParams
except ImportError:  # pragma: no cover - exercised indirectly by fallback tests
    QdrantClient = None
    qdrant_exceptions = None
    Distance = None
    PointStruct = None
    VectorParams = None


EMBEDDING_SIZE = 64
COLLECTION_NAME = "knowledge_base"
KNOWLEDGE_PATH = Path(__file__).resolve().parent / "assets" / "knowledge_documents.json"


def normalize_text(value):
    normalized = unicodedata.normalize("NFD", str(value).lower())
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return " ".join(without_accents.replace("đ", "d").split())


def tokenize(text):
    cleaned = normalize_text(text)
    for char in ",.:;!?()[]{}\"'/-_":
        cleaned = cleaned.replace(char, " ")
    return [token for token in cleaned.split() if token]


def embed_text(text):
    vector = [0.0] * EMBEDDING_SIZE
    tokens = tokenize(text)
    if not tokens:
        return vector

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = digest[0] % EMBEDDING_SIZE
        sign = 1.0 if digest[1] % 2 == 0 else -1.0
        weight = 1.0 + (digest[2] / 255.0)
        vector[index] += sign * weight

    magnitude = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / magnitude for value in vector]


def cosine_similarity(left, right):
    return sum(x * y for x, y in zip(left, right))


@lru_cache(maxsize=1)
def load_documents():
    with KNOWLEDGE_PATH.open("r", encoding="utf-8") as knowledge_file:
        return json.load(knowledge_file)


@lru_cache(maxsize=1)
def get_qdrant_client():
    if QdrantClient is None:
        raise RuntimeError("qdrant_client is not installed")
    host = os.getenv("QDRANT_HOST", "vector_db")
    port = int(os.getenv("QDRANT_PORT", "6333"))
    return QdrantClient(host=host, port=port, timeout=3.0)


def _document_payload(document):
    return {
        "title": document["title"],
        "content": document["content"],
        "source": document["source"],
        "tags": document["tags"],
    }


def score_document(query, title, content, base_score):
    normalized_query = normalize_text(query)
    query_tokens = set(tokenize(query))
    doc_tokens = set(tokenize(f"{title} {content}"))
    overlap = len(query_tokens & doc_tokens)
    exact_title_bonus = 2.0 if normalize_text(title) in normalized_query else 0.0
    return float(base_score) + (overlap * 0.2) + exact_title_bonus


def ensure_knowledge_base():
    documents = load_documents()

    try:
        client = get_qdrant_client()
        existing_collections = {
            collection.name for collection in client.get_collections().collections
        }
        if COLLECTION_NAME not in existing_collections:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.COSINE),
            )

        points = [
            PointStruct(
                id=document["id"],
                vector=embed_text(f"{document['title']} {document['content']}"),
                payload=_document_payload(document),
            )
            for document in documents
        ]
        client.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)
        return {"backend": "qdrant", "documents_indexed": len(points)}
    except _fallback_exceptions():
        return {"backend": "in_memory", "documents_indexed": len(documents)}


def retrieve_documents(query, limit=3):
    documents = load_documents()
    query_vector = embed_text(query)

    try:
        client = get_qdrant_client()
        search_result = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=max(limit, 5),
            with_payload=True,
        )
        points = getattr(search_result, "points", search_result)
        ranked = [
            {
                "title": point.payload["title"],
                "content": point.payload["content"],
                "source": point.payload["source"],
                "score": score_document(
                    query,
                    point.payload["title"],
                    point.payload["content"],
                    point.score,
                ),
            }
            for point in points
        ]
        ranked.sort(key=lambda item: item["score"], reverse=True)
        return [
            {
                **item,
                "score": round(float(item["score"]), 4),
            }
            for item in ranked[:limit]
        ]
    except _fallback_exceptions():
        ranked = []
        for document in documents:
            doc_vector = embed_text(f"{document['title']} {document['content']}")
            ranked.append(
                {
                    "title": document["title"],
                    "content": document["content"],
                    "source": document["source"],
                    "score": score_document(
                        query,
                        document["title"],
                        document["content"],
                        cosine_similarity(query_vector, doc_vector),
                    ),
                }
            )
        ranked.sort(key=lambda item: item["score"], reverse=True)
        return [
            {
                **item,
                "score": round(float(item["score"]), 4),
            }
            for item in ranked[:limit]
        ]


def generate_answer(query, retrieved_documents):
    if not retrieved_documents:
        return {
            "answer": (
                "I could not retrieve a relevant document from the knowledge base. "
                f"Please refine the question with a product, category, or policy topic. Query: {query}"
            ),
            "sources": [],
        }

    top_document = retrieved_documents[0]
    supporting_titles = ", ".join(document["title"] for document in retrieved_documents[:2])
    answer = (
        f"Based on the retrieved knowledge base, {top_document['content']} "
        f"Supporting context came from: {supporting_titles}."
    )
    return {
        "answer": answer,
        "sources": [document["source"] for document in retrieved_documents],
    }


def _fallback_exceptions():
    base = [OSError, ValueError, RuntimeError]
    if qdrant_exceptions is not None:
        base.append(qdrant_exceptions.UnexpectedResponse)
    return tuple(base)
