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
- User domain được phân rã theo DDD thành `Admin`, `Staff`, `Customer`.
- Bổ sung các service nghiệp vụ riêng cho `Cart`, `Payment`, `Shipping`.
- PostgreSQL cho `product_service` và `order_service`.
- MySQL cho `user_service`.
- SQLite cho các service demo cần storage nhẹ.
- Neo4j làm graph database cho knowledge base.
- Qdrant làm vector database hỗ trợ retrieval fallback.

### AI stack

- `behavior_service` sử dụng một mô hình deep learning dạng MLP hai lớp.
- `rag_chat_service` sử dụng kỹ thuật retrieval-augmented generation.
- Knowledge documents được đóng gói thành tập tài liệu nội bộ và nạp vào Neo4j dưới dạng graph.
- Trong trường hợp Neo4j chưa sẵn sàng, service có fallback sang Qdrant, sau đó là retrieval in-memory để demo vẫn tiếp tục.

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

Tại `rag_chat_service`, tri thức không nằm cứng trong code dưới dạng `if/else` nữa mà được tách thành tập tài liệu có cấu trúc và nạp vào Neo4j:

- thông tin tư vấn sản phẩm
- chính sách promotion
- playbook bundle
- hướng dẫn upsell

Mỗi tài liệu có:

- title
- source
- tags
- content

Trong graph knowledge base, các document được nối với:

- `Tag`
- `Topic`
- `Source`

Ý nghĩa khi demo:

- Tri thức được quản lý thành document.
- Có thể truy vết nguồn thông tin khi sinh câu trả lời.

### RAG pipeline

Luồng RAG hiện tại:

1. Người dùng gửi câu hỏi qua giao diện chat.
2. Hệ thống chuẩn hóa query.
3. Query được embedding bằng hashing embedding nội bộ.
4. Tài liệu trong knowledge base cũng được embedding.
5. Hệ thống ưu tiên retrieve từ Neo4j graph knowledge base.
6. Kết quả được rerank bằng lexical overlap để ưu tiên tài liệu sát query.
7. Nếu Neo4j chưa sẵn sàng, hệ thống fallback sang Qdrant hoặc in-memory retrieval.
8. Service tạo câu trả lời dựa trên context đã retrieve.
9. Giao diện hiển thị response, sources, retrieved documents và backend retrieval.

Ý nghĩa khi demo:

- Đây là RAG thật, vì có retrieve trước generate.
- Có traceability: biết câu trả lời được xây ra từ tài liệu nào.

## 4. Luồng tổng thể của hệ thống

### Luồng DDD và commerce services

1. `user_service` tách người dùng theo vai trò nghiệp vụ gồm `admin`, `staff`, `customer`.
2. `product_service` cung cấp catalog với tối thiểu 10 mặt hàng mẫu.
3. `cart_service` quản lý giỏ hàng trước khi checkout.
4. `payment_service` quản lý giao dịch thanh toán theo từng đơn.
5. `shipping_service` quản lý vận chuyển và tracking.
6. `order_service` giữ thông tin đơn hàng tổng hợp.
7. UI gateway hiển thị dữ liệu của từng service thành các panel riêng để demo bounded context rõ ràng.

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
- Ngoài AI, phần nghiệp vụ ecommerce cũng được tách bounded context rõ ràng theo DDD.
- Deep learning service có inference thật, không phải response hard-code.
- RAG service có graph knowledge base trên Neo4j, retrieval, reranking và source tracing.
- UI đã được nối trực tiếp với AI service để minh họa toàn bộ luồng xử lý.
- Kiến trúc microservices giúp dễ mở rộng, thay thế và triển khai độc lập từng service.

## 6. Cách demo ngắn gọn

Bạn có thể demo theo thứ tự sau:

1. Mở trang gateway.
2. Cho thấy `user_service` đã tách thành `admin`, `staff`, `customer`.
3. Tải danh sách sản phẩm để cho thấy catalog đã có tối thiểu 10 mặt hàng.
4. Cho thấy `cart`, `payment`, `shipping`, `order` đều đã thành service riêng và có UI tương ứng.
5. Chạy AI Advisor với một tình huống cụ thể, ví dụ khách hàng có nhu cầu audio premium.
6. Cho thấy các sản phẩm được model đề xuất và vị trí của chúng trong catalog.
7. Đặt câu hỏi trong khung chat, ví dụ về `Keychron Q1` hoặc bundle làm việc tại nhà.
8. Cho thấy câu trả lời của RAG và các source tài liệu đi kèm.
9. Nếu cần, gọi endpoint status để cho thấy knowledge base đã index vào Neo4j.

## 7. Kết luận

Phiên bản hiện tại đã đáp ứng hướng demo cho nhóm AI service:

- Có deep learning recommendation.
- Có knowledge base tách biệt.
- Có RAG retrieval và answer generation.
- Có phân rã DDD cho user domain và các service `cart`, `payment`, `shipping`.
- Có giao diện để trình bày trực quan trong lúc bảo vệ.
