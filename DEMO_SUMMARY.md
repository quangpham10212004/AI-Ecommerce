# Demo Summary: AI Services Trong Ecommerce AI

## 1. Mục tiêu hệ thống

Hệ thống được thiết kế theo hướng microservices cho bài toán ecommerce, trong đó nhóm AI service tập trung vào 3 năng lực chính:

- Deep learning recommendation: phân tích tín hiệu hành vi để gợi ý sản phẩm.
- Knowledge base: lưu trữ tri thức nghiệp vụ về sản phẩm, khuyến mãi, bundle và chính sách.
- RAG chat: truy xuất tài liệu liên quan trước khi tạo câu trả lời cho người dùng.

## 2. Công nghệ sử dụng

### Backend và kiến trúc

- Django và Django REST Framework cho các service API.
- Docker Compose để đóng gói và deploy toàn bộ hệ thống.
- API Gateway để hợp nhất giao diện và proxy request đến từng microservice.
- PostgreSQL cho `product_service` và `order_service`.
- MySQL cho `user_service`.
- SQLite cho các service demo cần storage nhẹ.
- Qdrant làm vector database cho `rag_chat_service`.

### AI stack

- `behavior_service` sử dụng một mô hình deep learning dạng MLP hai lớp.
- `rag_chat_service` sử dụng kỹ thuật retrieval-augmented generation.
- Knowledge documents được đóng gói thành tập tài liệu nội bộ và index vào Qdrant.
- Trong trường hợp Qdrant không sẵn sàng, service có fallback retrieval in-memory để demo vẫn tiếp tục.

## 3. Kỹ thuật được áp dụng

### Deep learning recommendation

Tại `behavior_service`, mô hình nhận vào các feature hành vi:

- preferred category
- search terms
- recent views
- cart value
- premium intent
- productivity intent
- mobility intent
- support intent

Sau đó service:

1. trích xuất feature và chuẩn hóa về dạng số
2. đưa vào MLP hai lớp
3. tính score xác suất cho danh sách sản phẩm
4. trả về top recommendation cùng với lý do và điểm score

Ý nghĩa khi demo:

- Chứng minh service không còn là mock response.
- Chứng minh đã có bước inference của deep learning model.

### Knowledge base

Tại `rag_chat_service`, tri thức không nằm cứng trong code dưới dạng `if/else` nữa mà được tách thành tập tài liệu có cấu trúc:

- thông tin tư vấn sản phẩm
- chính sách promotion
- playbook bundle
- hướng dẫn upsell

Mỗi tài liệu có:

- title
- source
- tags
- content

Ý nghĩa khi demo:

- Tri thức được quản lý thành document.
- Có thể truy vết nguồn thông tin khi sinh câu trả lời.

### RAG pipeline

Luồng RAG hiện tại:

1. Người dùng gửi câu hỏi qua giao diện chat.
2. Hệ thống chuẩn hóa query.
3. Query được embedding bằng hashing embedding nội bộ.
4. Tài liệu trong knowledge base cũng được embedding.
5. Hệ thống retrieve top document từ Qdrant.
6. Kết quả được rerank bằng lexical overlap để ưu tiên tài liệu sát query.
7. Service tạo câu trả lời dựa trên context đã retrieve.
8. Giao diện hiển thị response, sources, retrieved documents và backend retrieval.

Ý nghĩa khi demo:

- Đây là RAG thật, vì có retrieve trước generate.
- Có traceability: biết câu trả lời được xây ra từ tài liệu nào.

## 4. Luồng tổng thể của hệ thống

### Luồng recommendation

1. Người dùng nhập thông tin hành vi ở giao diện AI Advisor.
2. Gateway gọi `behavior_service`.
3. `behavior_service` suy luận bằng deep learning model.
4. Kết quả trả về gồm top product ids, scores, reasons.
5. UI đánh dấu các sản phẩm được đề xuất trong catalog.

### Luồng RAG chat

1. Người dùng đặt câu hỏi trong khung chat.
2. Gateway chuyển request đến `rag_chat_service`.
3. `rag_chat_service` đảm bảo knowledge base đã được index vào Qdrant.
4. Service retrieve các tài liệu liên quan.
5. Service generate câu trả lời dựa trên retrieved context.
6. UI hiển thị câu trả lời, tài liệu nguồn và điểm retrieve.

## 5. Điểm nhấn khi bảo vệ

- Hệ thống tách biệt rõ 3 thành phần: deep learning, knowledge base và RAG.
- Deep learning service có inference thật, không phải response hard-code.
- RAG service có vector database, retrieval, reranking và source tracing.
- UI đã được nối trực tiếp với AI service để minh họa toàn bộ luồng xử lý.
- Kiến trúc microservices giúp dễ mở rộng, thay thế và triển khai độc lập từng service.

## 6. Cách demo ngắn gọn

Bạn có thể demo theo thứ tự sau:

1. Mở trang gateway.
2. Tải danh sách sản phẩm để cho thấy catalog đã có dữ liệu.
3. Chạy AI Advisor với một tình huống cụ thể, ví dụ khách hàng có nhu cầu audio premium.
4. Cho thấy các sản phẩm được model đề xuất và vị trí của chúng trong catalog.
5. Đặt câu hỏi trong khung chat, ví dụ về `Keychron Q1` hoặc bundle làm việc tại nhà.
6. Cho thấy câu trả lời của RAG và các source tài liệu đi kèm.
7. Nếu cần, gọi endpoint status để cho thấy knowledge base đã index vào Qdrant.

## 7. Kết luận

Phiên bản hiện tại đã đáp ứng hướng demo cho nhóm AI service:

- Có deep learning recommendation.
- Có knowledge base tách biệt.
- Có RAG retrieval và answer generation.
- Có giao diện để trình bày trực quan trong lúc bảo vệ.
