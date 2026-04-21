# Ecommerce AI — Hướng dẫn sử dụng

Hệ thống ecommerce demo tích hợp AI, kiến trúc microservices với Django REST Framework backend và React frontend.

---

## Yêu cầu

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## Khởi động hệ thống

```bash
# Clone repo và vào thư mục gốc
cd ecommerce_ai

# Build và chạy toàn bộ hệ thống
docker compose up --build
```

> Lần đầu build sẽ mất 5–15 phút do `behavior_service` cài TensorFlow.  
> Các lần sau chạy lại chỉ cần `docker compose up`.

---

## Truy cập sau khi khởi động

### 🌐 Frontend React (UI chính)

| URL | Mô tả |
|-----|-------|
| **http://localhost:3001/login** | ✅ Trang đăng nhập — vào đây trước |
| http://localhost:3001/customer/home | Trang chủ customer |
| http://localhost:3001/admin/dashboard | Dashboard admin |
| http://localhost:3001/staff/dashboard | Dashboard staff |

### 🔧 Backend & Tools

| URL | Mô tả |
|-----|-------|
| http://localhost:8000/ | Django Gateway UI (legacy) |
| http://localhost:15050/ | PgAdmin (quản lý PostgreSQL) |
| http://localhost:17474/ | Neo4j Browser (knowledge base RAG) |

---

## Tài khoản demo

Mật khẩu tất cả tài khoản: **`123456`**

| Role | Email |
|------|-------|
| Customer | `minhanh.customer@ecommerce.local` |
| Staff | `sales.staff@ecommerce.local` |
| Admin | `admin@ecommerce.local` |

> Trên trang login, click nhanh vào tab **Customer / Staff / Admin** để tự điền thông tin.

---

## Luồng sử dụng cơ bản

### Customer
1. Vào http://localhost:3001/login → chọn tab **Customer** → Đăng nhập
2. Duyệt sản phẩm tại `/customer/products`
3. Thêm vào giỏ → Thanh toán tại `/customer/checkout`
4. Xem đơn hàng tại `/customer/orders`
5. Click icon 🤖 góc phải để chat với AI tư vấn

### Staff
1. Đăng nhập với tab **Staff**
2. Quản lý đơn hàng tại `/staff/orders`

### Admin
1. Đăng nhập với tab **Admin**
2. Xem tổng quan tại `/admin/dashboard`
3. Quản lý sản phẩm (thêm/sửa/xóa) tại `/admin/products`
4. Quản lý người dùng tại `/admin/users`

---

## Kiến trúc hệ thống

```
frontend/          React + Vite + Tailwind (port 3001)
api_gateway/       Django proxy + legacy UI (port 8000)
user_service/      Quản lý user, MySQL (port 8101)
product_service/   Quản lý sản phẩm, PostgreSQL (port 8102)
order_service/     Quản lý đơn hàng, PostgreSQL (port 8103)
behavior_service/  LSTM recommendation model (port 8104)
rag_chat_service/  RAG chatbot, Neo4j/Qdrant (port 8105)
cart_service/      Giỏ hàng (port 8106)
payment_service/   Thanh toán (port 8107)
shipping_service/  Giao vận (port 8108)
```

---

## API chính (qua Gateway port 8000)

```bash
# Lấy danh sách sản phẩm
GET  http://localhost:8000/api/products/

# Tạo sản phẩm
POST http://localhost:8000/api/products/
{
  "name": "Sony WH-1000XM5",
  "category": "Audio",
  "price": "8990000",
  "ai_match": 95,
  "image_icon": "headphones"
}

# LSTM behavior recommendation
POST http://localhost:8000/api/behavior/recommend/
{"user_id": 1, "recent_views": [1, 2, 3]}

# RAG chat
POST http://localhost:8000/api/chat/
{"query": "tư vấn tai nghe chống ồn"}

# Đăng nhập
POST http://localhost:8000/api/users/login/
{"role": "customer", "email": "...", "password": "123456"}
```

---

## Ghi chú

- **RAG chat**: ưu tiên Neo4j → fallback Qdrant → in-memory nếu Neo4j chưa sẵn sàng
- **LSTM model**: weights lưu tại `behavior_service/api/assets/lstm_model.json`
- **Seed data**: chưa có fixture mẫu — tạo sản phẩm qua Admin portal hoặc API
- **PgAdmin**: email `admin@admin.com` / password `admin`
