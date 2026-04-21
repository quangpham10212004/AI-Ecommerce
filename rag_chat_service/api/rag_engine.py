import csv
import math
import os
import unicodedata
from functools import lru_cache
from pathlib import Path

try:
    from neo4j import GraphDatabase
except ImportError:
    GraphDatabase = None

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import exceptions as qdrant_exceptions
    from qdrant_client.models import Distance, PointStruct, VectorParams
except ImportError:
    QdrantClient = None
    qdrant_exceptions = None
    Distance = PointStruct = VectorParams = None

# ── Paths ──────────────────────────────────────────────────────────────────
KB_CSV = Path(__file__).resolve().parent / "assets" / "kb_graph_data.csv"
EMBEDDING_SIZE = 64
COLLECTION_NAME = "kb_graph"

# ── Product catalog (mirrors product_service seed) ─────────────────────────
PRODUCTS = {
    1:  {"name": "Sony WH-1000XM5",       "category": "Audio",       "price": 8990000},
    2:  {"name": "Keychron Q1",            "category": "Accessories", "price": 4290000},
    3:  {"name": "Logitech MX Master 3S",  "category": "Accessories", "price": 2490000},
    4:  {"name": "LG UltraGear 27",        "category": "Monitor",     "price": 6790000},
    5:  {"name": "Dell XPS 13",            "category": "Laptop",      "price": 32990000},
    6:  {"name": "MacBook Air M3",         "category": "Laptop",      "price": 28990000},
    7:  {"name": "Anker 737 Power Bank",   "category": "Accessories", "price": 3190000},
    8:  {"name": "Samsung T7 Shield 1TB",  "category": "Storage",     "price": 2590000},
    9:  {"name": "JBL Flip 6",             "category": "Audio",       "price": 2590000},
    10: {"name": "Rain Design mStand",     "category": "Accessories", "price": 1590000},
}

CATEGORY_ADVICE = {
    "Audio":       "Sản phẩm âm thanh phù hợp cho người yêu nhạc, làm việc tập trung hoặc đi công tác.",
    "Laptop":      "Laptop cao cấp cho doanh nhân, lập trình viên và creative professional.",
    "Monitor":     "Màn hình chất lượng cao cho gaming, thiết kế đồ họa và làm việc đa nhiệm.",
    "Accessories": "Phụ kiện nâng cao năng suất: bàn phím, chuột, giá đỡ và sạc dự phòng.",
    "Storage":     "Lưu trữ di động tốc độ cao, an toàn cho dữ liệu quan trọng.",
}

BUNDLES = {
    "work-from-home": [1, 2, 3, 10],
    "travel":         [5, 7, 8, 1],
    "creator":        [6, 4, 8, 3],
    "gaming":         [4, 2, 3],
    "audio":          [1, 9],
}

# ── Text utilities ─────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    nfd = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn").replace("đ", "d")


def _tokenize(text: str) -> list[str]:
    t = _normalize(text)
    for ch in ",.;:!?()[]{}\"'/-_":
        t = t.replace(ch, " ")
    return [w for w in t.split() if w]


def _embed(text: str) -> list[float]:
    import hashlib
    vec = [0.0] * EMBEDDING_SIZE
    for tok in _tokenize(text):
        d = hashlib.sha256(tok.encode()).digest()
        idx = d[0] % EMBEDDING_SIZE
        sign = 1.0 if d[1] % 2 == 0 else -1.0
        vec[idx] += sign * (1.0 + d[2] / 255.0)
    mag = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / mag for v in vec]


def _cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


# ── Neo4j driver ───────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _neo4j():
    if GraphDatabase is None:
        raise RuntimeError("neo4j not installed")
    uri  = os.getenv("NEO4J_URI",      "bolt://neo4j_db:7687")
    user = os.getenv("NEO4J_USERNAME", "neo4j")
    pw   = os.getenv("NEO4J_PASSWORD", "neo4jpassword")
    return GraphDatabase.driver(uri, auth=(user, pw))


# ── Graph seeding ──────────────────────────────────────────────────────────

def _seed_graph():
    """Build KB graph from product catalog + bundle knowledge."""
    driver = _neo4j()
    with driver.session() as s:
        # Constraints
        for stmt in [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Product)  REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (b:Bundle)   REQUIRE b.name IS UNIQUE",
        ]:
            s.run(stmt)

        # Products + Categories
        for pid, info in PRODUCTS.items():
            s.run(
                """
                MERGE (p:Product {id: $id})
                SET p.name = $name, p.price = $price, p.category = $category
                MERGE (c:Category {name: $category})
                SET c.advice = $advice
                MERGE (p)-[:BELONGS_TO]->(c)
                """,
                id=pid, name=info["name"], price=info["price"],
                category=info["category"],
                advice=CATEGORY_ADVICE[info["category"]],
            )

        # Bundles
        for bundle_name, pids in BUNDLES.items():
            s.run("MERGE (b:Bundle {name: $name})", name=bundle_name)
            for pid in pids:
                s.run(
                    """
                    MATCH (b:Bundle {name: $bundle}), (p:Product {id: $pid})
                    MERGE (b)-[:INCLUDES]->(p)
                    """,
                    bundle=bundle_name, pid=pid,
                )

        # SIMILAR_TO within same category
        for pid, info in PRODUCTS.items():
            for pid2, info2 in PRODUCTS.items():
                if pid != pid2 and info["category"] == info2["category"]:
                    s.run(
                        """
                        MATCH (a:Product {id: $a}), (b:Product {id: $b})
                        MERGE (a)-[:SIMILAR_TO]->(b)
                        """,
                        a=pid, b=pid2,
                    )


def ensure_knowledge_base() -> dict:
    try:
        _seed_graph()
        stats = _graph_stats()
        return {"backend": "neo4j", "documents_indexed": stats["products"], "graph_stats": stats}
    except Exception:
        pass

    # Qdrant fallback
    try:
        client = _qdrant()
        cols = {c.name for c in client.get_collections().collections}
        if COLLECTION_NAME not in cols:
            client.create_collection(COLLECTION_NAME, vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.COSINE))
        points = [
            PointStruct(id=pid, vector=_embed(f"{info['name']} {info['category']}"),
                        payload={"name": info["name"], "category": info["category"], "price": info["price"]})
            for pid, info in PRODUCTS.items()
        ]
        client.upsert(COLLECTION_NAME, points=points, wait=True)
        return {"backend": "qdrant", "documents_indexed": len(points), "graph_stats": None}
    except Exception:
        pass

    return {"backend": "in_memory", "documents_indexed": len(PRODUCTS), "graph_stats": None}


# ── Retrieval ──────────────────────────────────────────────────────────────

def _detect_intent(query: str) -> dict:
    q = _normalize(query)
    tokens = set(_tokenize(query))

    category = None
    for cat, keywords in {
        "Audio":       {"tai nghe", "headphone", "loa", "speaker", "audio", "nhac", "music", "chong on", "anc"},
        "Laptop":      {"laptop", "macbook", "xps", "may tinh", "notebook", "may xach tay"},
        "Monitor":     {"man hinh", "monitor", "display", "screen"},
        "Accessories": {"ban phim", "keyboard", "chuot", "mouse", "phu kien", "accessories", "gia do", "stand"},
        "Storage":     {"o cung", "storage", "ssd", "backup", "luu tru"},
    }.items():
        if tokens & keywords:
            category = cat
            break

    bundle = None
    for b, kws in {
        "work-from-home": {"wfh", "lam viec", "work from home", "van phong", "office", "nha"},
        "travel":         {"di chuyen", "travel", "cong tac", "portable", "di dong"},
        "creator":        {"thiet ke", "design", "video", "photo", "sang tao", "creator"},
        "gaming":         {"game", "gaming", "choi game"},
        "audio":          {"nghe nhac", "am thanh", "audio"},
    }.items():
        if any(k in q for k in kws):
            bundle = b
            break

    is_comparison = any(w in tokens for w in {"so sanh", "compare", "khac", "hay", "tot hon", "nen mua"})
    is_gift       = any(w in tokens for w in {"qua", "tang", "gift", "present"})
    is_budget     = any(w in tokens for w in {"gia", "re", "budget", "cheap", "tiet kiem", "duoi"})
    is_guide      = any(w in tokens for w in {"tu van", "huong dan", "nen", "chon", "guide", "recommend"})

    return {
        "category": category,
        "bundle": bundle,
        "is_comparison": is_comparison,
        "is_gift": is_gift,
        "is_budget": is_budget,
        "is_guide": is_guide,
    }


def retrieve_documents(query: str, limit: int = 3) -> list[dict]:
    intent = _detect_intent(query)

    # ── Neo4j graph retrieval ──
    try:
        return _retrieve_from_graph(query, intent, limit)
    except Exception:
        pass

    # ── Qdrant fallback ──
    try:
        return _retrieve_from_qdrant(query, limit)
    except Exception:
        pass

    # ── In-memory fallback ──
    return _retrieve_in_memory(query, limit)


def _retrieve_from_graph(query: str, intent: dict, limit: int) -> list[dict]:
    driver = _neo4j()
    results = []

    with driver.session() as s:
        # 1. Bundle match
        if intent["bundle"]:
            rows = s.run(
                """
                MATCH (b:Bundle {name: $bundle})-[:INCLUDES]->(p:Product)-[:BELONGS_TO]->(c:Category)
                RETURN p.id AS id, p.name AS name, p.price AS price,
                       p.category AS category, c.advice AS advice, b.name AS bundle
                """,
                bundle=intent["bundle"],
            ).data()
            for r in rows:
                results.append({
                    "title": r["name"],
                    "content": f"{r['name']} ({r['category']}, {r['price']:,}₫) — {r['advice']} Thuộc bundle: {r['bundle']}.",
                    "source": f"graph/bundle/{r['bundle']}",
                    "score": 1.0,
                    "product_id": r["id"],
                })

        # 2. Category match
        if intent["category"] and len(results) < limit:
            rows = s.run(
                """
                MATCH (p:Product)-[:BELONGS_TO]->(c:Category {name: $cat})
                RETURN p.id AS id, p.name AS name, p.price AS price, c.advice AS advice
                ORDER BY p.price DESC
                """,
                cat=intent["category"],
            ).data()
            seen = {r["product_id"] for r in results}
            for r in rows:
                if r["id"] not in seen:
                    results.append({
                        "title": r["name"],
                        "content": f"{r['name']} ({intent['category']}, {r['price']:,}₫) — {r['advice']}",
                        "source": f"graph/category/{intent['category']}",
                        "score": 0.9,
                        "product_id": r["id"],
                    })
                    seen.add(r["id"])

        # 3. Keyword fallback across all products
        if len(results) < limit:
            q_tokens = set(_tokenize(query))
            rows = s.run(
                "MATCH (p:Product)-[:BELONGS_TO]->(c:Category) RETURN p.id AS id, p.name AS name, p.price AS price, p.category AS category, c.advice AS advice"
            ).data()
            seen = {r["product_id"] for r in results}
            scored = []
            for r in rows:
                if r["id"] in seen:
                    continue
                overlap = len(q_tokens & set(_tokenize(r["name"] + " " + r["category"])))
                if overlap > 0:
                    scored.append((overlap, r))
            for _, r in sorted(scored, key=lambda x: -x[0]):
                results.append({
                    "title": r["name"],
                    "content": f"{r['name']} ({r['category']}, {r['price']:,}₫) — {r['advice']}",
                    "source": f"graph/product/{r['id']}",
                    "score": 0.7,
                    "product_id": r["id"],
                })

    return results[:limit]


def _retrieve_from_qdrant(query: str, limit: int) -> list[dict]:
    client = _qdrant()
    vec = _embed(query)
    hits = client.query_points(COLLECTION_NAME, query=vec, limit=limit, with_payload=True)
    points = getattr(hits, "points", hits)
    return [
        {
            "title": p.payload["name"],
            "content": f"{p.payload['name']} ({p.payload['category']}, {p.payload['price']:,}₫)",
            "source": f"qdrant/{p.id}",
            "score": round(float(p.score), 4),
            "product_id": p.id,
        }
        for p in points
    ]


def _retrieve_in_memory(query: str, limit: int) -> list[dict]:
    qv = _embed(query)
    scored = []
    for pid, info in PRODUCTS.items():
        dv = _embed(f"{info['name']} {info['category']}")
        scored.append((_cosine(qv, dv), pid, info))
    scored.sort(key=lambda x: -x[0])
    return [
        {
            "title": info["name"],
            "content": f"{info['name']} ({info['category']}, {info['price']:,}₫) — {CATEGORY_ADVICE[info['category']]}",
            "source": f"in_memory/{pid}",
            "score": round(score, 4),
            "product_id": pid,
        }
        for score, pid, info in scored[:limit]
    ]


# ── Answer generation ──────────────────────────────────────────────────────

def generate_answer(query: str, docs: list[dict]) -> dict:
    intent = _detect_intent(query)

    if not docs:
        return {
            "answer": "Xin lỗi, tôi không tìm thấy thông tin phù hợp. Bạn có thể hỏi về sản phẩm cụ thể, danh mục, hoặc bundle nhé.",
            "sources": [],
        }

    product_lines = "\n".join(
        f"• {d['title']}: {d['content']}" for d in docs
    )

    # Contextual answer based on intent
    if intent["bundle"]:
        bundle_name = intent["bundle"].replace("-", " ").title()
        intro = f"Dựa trên knowledge graph, đây là các sản phẩm phù hợp cho bundle **{bundle_name}**:"
    elif intent["is_gift"]:
        intro = "Gợi ý quà tặng công nghệ phù hợp:"
    elif intent["is_budget"]:
        intro = "Các sản phẩm phù hợp với ngân sách của bạn:"
    elif intent["is_comparison"]:
        intro = "So sánh các sản phẩm liên quan:"
    elif intent["is_guide"] or intent["category"]:
        cat = intent["category"] or "sản phẩm"
        intro = f"Tư vấn {cat} dựa trên knowledge base:"
    else:
        intro = "Kết quả tìm kiếm từ knowledge graph:"

    answer = f"{intro}\n\n{product_lines}\n\nBạn cần tư vấn thêm về sản phẩm nào không?"

    return {
        "answer": answer,
        "sources": list({d["source"] for d in docs}),
    }


# ── Stats ──────────────────────────────────────────────────────────────────

def _graph_stats() -> dict:
    driver = _neo4j()
    with driver.session() as s:
        return {
            "products":      s.run("MATCH (p:Product)  RETURN count(p) AS n").single()["n"],
            "categories":    s.run("MATCH (c:Category) RETURN count(c) AS n").single()["n"],
            "bundles":       s.run("MATCH (b:Bundle)   RETURN count(b) AS n").single()["n"],
            "relationships": s.run("MATCH ()-[r]->()   RETURN count(r) AS n").single()["n"],
            "tags": 0,
        }


def get_neo4j_graph_stats() -> dict:
    return _graph_stats()


@lru_cache(maxsize=1)
def _qdrant():
    if QdrantClient is None:
        raise RuntimeError("qdrant_client not installed")
    return QdrantClient(
        host=os.getenv("QDRANT_HOST", "vector_db"),
        port=int(os.getenv("QDRANT_PORT", "6333")),
        timeout=3.0,
    )
