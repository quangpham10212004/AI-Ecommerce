# Phân Tích Và Thiết Kế Hệ Thống Ecommerce AI

## 1. Mục tiêu tài liệu

Tài liệu mô tả phân tích hệ thống và thiết kế kiến trúc của project `ecommerce_ai` theo hiện trạng code (as-is), đồng thời nêu các hướng hoàn thiện (to-be) để dễ mở rộng.

## 2. Phạm vi hệ thống

- Frontend: React/Vite (`frontend`, port `3001`)
- Backend Gateway: Django proxy (`api_gateway`, port `8000`)
- Microservices nghiệp vụ:
  - `user_service` (`8101`)
  - `product_service` (`8102`)
  - `order_service` (`8103`)
  - `cart_service` (`8106`)
  - `payment_service` (`8107`)
  - `shipping_service` (`8108`)
- AI services:
  - `behavior_service` (`8104`) - gợi ý theo hành vi
  - `rag_chat_service` (`8105`) - chatbot tư vấn sản phẩm
- Hạ tầng dữ liệu:
  - `mysql_db` cho user
  - `postgres_db` cho product/order/cart/payment/shipping
  - `neo4j_db`, `vector_db (Qdrant)` cho RAG

## 3. Kiến trúc tổng thể

```mermaid
flowchart LR
    U[User]
    FE[Frontend React\nPort 3001]
    GW[API Gateway Django\nPort 8000]

    US[user_service\n8101]
    PS[product_service\n8102]
    OS[order_service\n8103]
    CS[cart_service\n8106]
    PAY[payment_service\n8107]
    SS[shipping_service\n8108]
    BS[behavior_service\n8104]
    RAG[rag_chat_service\n8105]

    MYSQL[(MySQL)]
    PG[(PostgreSQL)]
    NEO[(Neo4j)]
    QD[(Qdrant)]

    U --> FE
    FE --> GW

    GW --> US
    GW --> PS
    GW --> OS
    GW --> CS
    GW --> PAY
    GW --> SS
    GW --> BS
    GW --> RAG

    US --> MYSQL
    PS --> PG
    OS --> PG
    CS --> PG
    PAY --> PG
    SS --> PG
    RAG --> NEO
    RAG --> QD
```

### 3.1 Đặc điểm kiến trúc

- Kiến trúc microservices, giao tiếp HTTP đồng bộ qua gateway.
- Gateway đóng vai trò reverse proxy theo route prefix, chưa có auth tập trung.
- Mỗi domain service tách riêng, dễ scale độc lập theo tải.
- AI tách riêng thành 2 service: inference hành vi và retrieval/chat.

## 4. Thiết kế domain (bounded context)

```mermaid
flowchart TB
    Identity[Identity\nuser_service]
    Catalog[Catalog\nproduct_service]
    Cart[Cart\ncart_service]
    Order[Order\norder_service]
    Payment[Payment\npayment_service]
    Shipping[Shipping\nshipping_service]
    AIRec[Behavior Recommendation\nbehavior_service]
    AIChat[RAG Chat\nrag_chat_service]

    Identity --> Cart
    Identity --> Order
    Catalog --> Cart
    Cart --> Order
    Order --> Payment
    Order --> Shipping
    Catalog --> AIRec
    Catalog --> AIChat
```

## 5. Thiết kế dữ liệu mức service

### 5.1 User Service

- Nhóm thực thể: `AdminUser`, `StaffUser`, `Customer`
- Mục tiêu: đăng nhập theo role, quản lý user theo vai trò

### 5.2 Product Service

- Thực thể chính: `Product`
- Thuộc tính nổi bật: `name`, `category`, `price`, `ai_match`, `image_icon`

### 5.3 Order Service

- `Order`: `order_number`, `customer_name`, `customer_email`, `status`, `payment_status`, `shipping_status`, `total_amount`, `created_at`
- `OrderItem`: `order`, `product_id`, `product_name`, `unit_price`, `quantity`

### 5.4 Cart Service

- `Cart`: `customer_name`, `customer_email`, `item_count`, `total_amount`, `status`, `notes`, `created_at`
- `CartItem`: `cart`, `product_id`, `product_name`, `unit_price`, `quantity`

### 5.5 Payment Service

- `Payment`: `order_number`, `customer_name`, `amount`, `method`, `status`, `transaction_ref`, `created_at`

### 5.6 Shipping Service

- `Shipment`: `order_number`, `carrier`, `tracking_number`, `shipping_status`, `destination`, `eta_days`, `created_at`

## 6. Thiết kế API Gateway

Gateway map request theo prefix:

- `/api/products/**` -> `product_service`
- `/api/behavior/recommend/` -> `behavior_service`
- `/api/chat/**` -> `rag_chat_service`
- `/api/users/**` -> `user_service`
- `/api/orders/**` -> `order_service`
- `/api/carts/**` -> `cart_service`
- `/api/payments/**` -> `payment_service`
- `/api/shipments/**` -> `shipping_service`

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant GW as API Gateway
    participant SVC as Domain Service
    participant DB as Database

    UI->>GW: HTTP request /api/... 
    GW->>SVC: Forward theo route prefix
    SVC->>DB: Query/Write
    DB-->>SVC: Data
    SVC-->>GW: JSON response
    GW-->>UI: Pass-through response
```

## 7. Thiết kế AI

### 7.1 Behavior Recommendation Service

- Input: `recent_actions`
- Pipeline:
  1. Encode hành vi -> sequence `(1, 10, 1)`
  2. Inference với model LSTM (`model_lstm.h5`)
  3. Suy ra `predicted_next_action`
  4. Map action -> intent -> category -> product recommendation
- Output: `predicted_next_action`, `confidence`, `intent`, `recommended_product_ids`, `recommendations`

### 7.2 RAG Chat Service

- Ưu tiên backend truy xuất: `Neo4j` -> fallback `Qdrant` -> fallback `in_memory`
- Chức năng chính:
  - Seed knowledge graph từ products/bundles
  - Detect intent query
  - Retrieve tài liệu liên quan
  - Generate câu trả lời + nguồn tham chiếu

```mermaid
flowchart LR
    Q[User Query] --> I[Intent Detection]
    I --> R1[Retrieve from Neo4j]
    R1 -->|fail| R2[Retrieve from Qdrant]
    R2 -->|fail| R3[Retrieve in-memory]
    R1 --> G[Answer Generation]
    R2 --> G
    R3 --> G
    G --> A[Response + Sources]
```

## 8. Luồng nghiệp vụ chính

### 8.1 Luồng mua hàng hiện tại

```mermaid
sequenceDiagram
    participant C as Customer UI
    participant GW as Gateway
    participant PS as Product Service
    participant OS as Order Service
    participant PAYS as Payment Service

    C->>GW: GET /api/products/
    GW->>PS: forward
    PS-->>GW: products
    GW-->>C: products

    C->>C: Quản lý giỏ local (zustand)
    C->>GW: POST /api/orders/
    GW->>OS: create order
    OS-->>GW: order created
    GW-->>C: order response

    C->>GW: POST /api/payments/
    GW->>PAYS: create payment
    PAYS-->>GW: payment response
    GW-->>C: checkout done
```

Ghi chú: frontend hiện đang giữ cart local store, chưa orchestration đầy đủ với `cart_service` và `shipping_service` trong checkout.

## 9. Đánh giá kiến trúc As-Is

### 9.1 Điểm tốt

- Tách service theo domain khá rõ.
- Có API Gateway thống nhất entrypoint backend.
- AI được tách độc lập khỏi core commerce.
- Dễ chạy local bằng `docker-compose`.

### 9.2 Hạn chế kỹ thuật

- Gateway mới chỉ proxy, chưa có:
  - xác thực tập trung (JWT verification)
  - rate limit / circuit breaker / retry policy
  - quan sát tập trung (trace-id, metrics chuẩn)
- Checkout là chuỗi call rời, chưa có Saga/Orchestration.
- Nhất quán dữ liệu liên service phụ thuộc vào client flow.
- Frontend chưa dùng `cart_service` như source of truth.

## 10. Thiết kế mục tiêu (To-Be)

### 10.1 Kiến trúc đề xuất

```mermaid
flowchart TB
    FE[Frontend]
    APIGW[API Gateway + Auth + Rate Limit]
    ORCH[Checkout Orchestrator\n(Saga)]

    US[user_service]
    PS[product_service]
    CS[cart_service]
    OS[order_service]
    PAY[payment_service]
    SH[shipping_service]

    BUS[(Event Bus)]

    FE --> APIGW
    APIGW --> US
    APIGW --> PS
    APIGW --> CS
    APIGW --> ORCH

    ORCH --> OS
    ORCH --> PAY
    ORCH --> SH

    OS <--> BUS
    PAY <--> BUS
    SH <--> BUS
```

### 10.2 Hướng nâng cấp ưu tiên

1. Chuẩn hóa auth token xuyên gateway và services.
2. Chuyển cart từ local-only sang đồng bộ `cart_service`.
3. Tạo checkout orchestration (Saga) để đảm bảo trạng thái order/payment/shipping nhất quán.
4. Bổ sung observability: structured logs, request-id, metrics, tracing.
5. Viết contract test cho gateway và integration test cho flow checkout.

## 11. Kết luận

Project đã có nền tảng microservices + AI khá rõ ràng cho demo thực chiến. Để lên mức production-ready, trọng tâm là: auth tập trung, orchestration checkout, đồng bộ dữ liệu liên service và tăng khả năng quan sát vận hành.
