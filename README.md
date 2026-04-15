# Ecommerce AI Microservices

Project nay la he thong demo ecommerce tach theo microservice, dung Django REST Framework va `docker-compose` de chay dong bo cac thanh phan backend.

## Kien truc

- `api_gateway`: giao dien demo va proxy request vao cac service ben duoi.
- `user_service`: service nguoi dung, dung MySQL.
- `product_service`: service san pham, dung PostgreSQL.
- `order_service`: service don hang, dung PostgreSQL.
- `behavior_service`: service goi y hanh vi, hien tai suy luan bang mo hinh deep learning MLP nho.
- `rag_chat_service`: service chat/RAG demo, index tai lieu mau vao Qdrant va fallback in-memory khi can.
- `init-dbs.sql`: tao them `product_db` va `order_db` khi PostgreSQL khoi dong.

## Yeu cau

- Docker
- Docker Compose

Neu chay local khong dung Docker, moi service can cai dependency trong file `requirements.txt` rieng.

## Cach chay nhanh

Tai thu muc goc project:

```bash
docker compose up --build
```

Sau khi cac container len xong:

- Gateway UI: `http://localhost:8000/`
- User service: `http://localhost:8101/`
- Product service: `http://localhost:8102/`
- Order service: `http://localhost:8103/`
- Behavior service: `http://localhost:8104/`
- RAG chat service: `http://localhost:8105/`
- PostgreSQL: `localhost:15433`
- MySQL: `localhost:13307`
- PgAdmin: `http://localhost:15050/`

Tai khoan PgAdmin mac dinh:

- Email: `admin@admin.com`
- Password: `admin`

## API chinh qua gateway

Tat ca endpoint ben duoi co the goi qua `http://localhost:8000`.

### Product

- `GET /api/products/`
- `POST /api/products/`
- `GET /api/products/{id}/`
- `PUT/PATCH /api/products/{id}/`
- `DELETE /api/products/{id}/`

Vi du tao san pham:

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sony WH-1000XM5",
    "category": "Audio",
    "price": "8990000",
    "ai_match": 95,
    "image_icon": "headphones"
  }'
```

### Behavior recommendation

- `POST /api/behavior/recommend/`

Vi du:

```bash
curl -X POST http://localhost:8000/api/behavior/recommend/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "recent_views": [1, 2, 3]}'
```

Response hien tai la mock:

```json
{
  "model_family": "deep-learning",
  "recommended_product_ids": [1, 9, 5]
}
```

### RAG chat

- `POST /api/chat/`
- `GET /api/chat/status/`

Vi du:

```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"query":"tu van tai nghe sony wh-1000xm5"}'
```

### User va order

Gateway da khai bao proxy:

- `GET/POST /api/users/`
- `GET/POST /api/orders/`

Nhung hien tai `user_service` va `order_service` chua co endpoint nghiep vu cu the trong `api/urls.py`, nen cac route nay moi o muc khung.

## Luong du lieu hien tai

- `user_service` ket noi MySQL qua bien moi truong `DB_*`.
- `product_service` va `order_service` ket noi PostgreSQL qua bien moi truong `POSTGRES_*`.
- `behavior_service` va `rag_chat_service` dang de SQLite mac dinh cua Django cho muc dich demo/noi bo.

## Seed data

Repo hien tai khong co thu muc `fixtures/`, `seed/` hay file JSON seed mau rieng. Neu ban bo sung seed data sau nay, nen dat trong thu muc ro rang nhu `seed_data/` hoac `fixtures/` de tranh bi xoa nham khi don dep repo.

## Cau truc thu muc

```text
.
|-- api_gateway/
|-- user_service/
|-- product_service/
|-- order_service/
|-- behavior_service/
|-- rag_chat_service/
|-- docker-compose.yml
`-- init-dbs.sql
```

## Ghi chu

- `behavior_service` dang khai bao them dependency nang nhu TensorFlow va pandas; build container se ton thoi gian hon cac service con lai.
- `rag_chat_service` uu tien truy van Qdrant qua service `vector_db`; neu chua ket noi duoc thi se fallback sang retrieval in-memory de giu demo van chay.
- Gateway chi pass-through mot so header co ban va phuc vu muc dich demo/noi bo.
