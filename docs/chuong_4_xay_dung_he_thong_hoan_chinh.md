# Chương 4. Xây dựng hệ thống hoàn chỉnh

## 4.1 Kiến trúc tổng thể

### 4.1.1 Mô hình hệ thống

Hệ thống `ecommerce_ai` được triển khai theo kiến trúc microservices, trong đó mỗi domain nghiệp vụ chính được tách thành một service độc lập.

Các service chính gồm:

- `api_gateway`
- `user_service`
- `product_service`
- `cart_service`
- `order_service`
- `payment_service`
- `shipping_service`
- `behavior_service`
- `rag_chat_service`

Mỗi service có trách nhiệm rõ ràng và có thể chạy độc lập trong Docker Compose.

[Hình 4.1: sơ đồ tổng thể hệ thống microservices của `ecommerce_ai`, thể hiện frontend, gateway, các service nghiệp vụ, AI service và lớp dữ liệu.]

### 4.1.2 Nguyên tắc

Hệ thống hoàn chỉnh của project tuân theo các nguyên tắc sau:

- mỗi service có database riêng
- giao tiếp qua REST API
- không truy cập trực tiếp database của service khác
- AI service được tách khỏi luồng ecommerce core

## 4.2 System Architecture

### 4.2.1 Overview

Kiến trúc đề xuất trong project nhấn mạnh ba điểm:

- phân tách domain để dễ bảo trì
- tách frontend và backend để dễ mở rộng
- dùng API Gateway để gom điểm vào và định tuyến request

Điều này giúp hệ thống không bị dính chặt vào một codebase monolithic duy nhất.

### 4.2.2 Microservice Architecture

Các service core trong project hiện tại gồm:

- `user_service`: xác thực và quản lý người dùng
- `product_service`: quản lý catalog
- `cart_service`: quản lý giỏ hàng
- `order_service`: quản lý đơn hàng
- `payment_service`: quản lý thanh toán
- `shipping_service`: quản lý giao hàng
- `behavior_service`: gợi ý sản phẩm theo hành vi
- `rag_chat_service`: chatbot tư vấn sản phẩm

[Hình 4.2: sơ đồ phân rã microservice theo domain, thể hiện rõ service nào phục vụ nghiệp vụ nào.]

### 4.2.3 API Gateway

`api_gateway` là điểm vào duy nhất từ phía client.

Vai trò của gateway:

- nhận request từ frontend
- chuyển request đến đúng service phía sau
- là điểm có thể mở rộng thêm auth, logging, rate limit sau này

Trong repo hiện tại, gateway đang đóng vai trò reverse proxy theo prefix route.

[Chụp code: nên chụp cấu hình route của gateway trong `frontend/nginx.conf` và phần route map trong `api_gateway` nếu muốn chứng minh cơ chế định tuyến.]

### 4.2.4 Service Communication

Hệ thống dùng giao tiếp đồng bộ qua REST API là chính.

Ví dụ:

- frontend gọi gateway
- gateway gọi `product_service`
- checkout đi qua `order_service`, `payment_service`, `shipping_service`
- AI service nhận request trực tiếp qua gateway

[Hình 4.3: sequence hoặc flow biểu diễn giao tiếp giữa các service trong quá trình xử lý một request.]

### 4.2.5 Containerization and Deployment

Toàn bộ hệ thống được container hóa bằng Docker Compose.

Docker Compose giúp:

- chạy toàn bộ dịch vụ bằng một lệnh
- đồng bộ môi trường phát triển
- dễ map port và volume

### 4.2.6 System Structure

Cấu trúc triển khai hiện tại của repo:

- `frontend/`
- `api_gateway/`
- `user_service/`
- `product_service/`
- `cart_service/`
- `order_service/`
- `payment_service/`
- `shipping_service/`
- `behavior_service/`
- `rag_chat_service/`
- `docker-compose.yml`

[Hình 4.4: sơ đồ cấu trúc thư mục hoặc sơ đồ container của hệ thống `ecommerce_ai`.]

### 4.2.7 Design Principles

Thiết kế hệ thống tuân theo:

- `Loose Coupling`
- `High Cohesion`
- `Scalability`
- `Fault Isolation`

### 4.2.8 Security Considerations

Trong phiên bản hiện tại, bảo mật được thể hiện ở mức kiến trúc:

- người dùng đăng nhập theo vai trò
- gateway là điểm trung gian cho request
- service có thể mở rộng JWT và RBAC sau này

### 4.2.9 Discussion

So với monolithic, mô hình này dễ mở rộng hơn và phù hợp hơn khi thêm AI vào cùng hệ thống ecommerce. Đổi lại, việc vận hành và đồng bộ nhiều service sẽ phức tạp hơn.

## 4.3 API Gateway (Nginx)

### 4.3.1 Vai trò

`api_gateway` và `frontend/nginx.conf` là hai lớp quan trọng trong kiến trúc triển khai.

Vai trò chính:

- entry point cho toàn hệ thống
- route request đến đúng service
- là nơi thích hợp để bổ sung auth và policy sau này

### 4.3.2 Cấu hình mẫu

Trong repo, gateway sử dụng các route theo prefix. Ví dụ:

```nginx
location /users/ {
    proxy_pass http://user_service:8000;
}

location /products/ {
    proxy_pass http://product_service:8000;
}
```

[Chụp code: nên chụp file `frontend/nginx.conf` vì đây là nơi thể hiện rõ nhất cách request được định tuyến trong hệ thống.]

## 4.4 Authentication (JWT)

### 4.4.1 Cài đặt

Ở mức tài liệu học phần, phần xác thực có thể mô tả bằng JWT để phù hợp với kiến trúc microservices.

### 4.4.2 Cấu hình

Trong hệ thống hoàn chỉnh, JWT thường đi kèm:

- token khi đăng nhập thành công
- token gửi trong header
- service phía sau xác thực token

### 4.4.3 Luồng

Luồng cơ bản:

1. User login
2. Nhận token
3. Gửi token trong request sau đó
4. Service xác thực token

[Hình 4.5: sequence đăng nhập và truyền JWT qua gateway đến service.]

## 4.5 Giao tiếp giữa các Service

### 4.5.1 REST API call

Hệ thống hiện tại dùng REST API call giữa các service.

Ví dụ luồng:

- `order_service` tạo đơn hàng
- `payment_service` ghi nhận thanh toán
- `shipping_service` tạo shipment

### 4.5.2 Best Practice

Các best practice nên nhắc tới trong bài:

- timeout
- retry
- circuit breaker

Phần này có thể giữ ở mức mô tả vì project hiện tại chưa cần triển khai đầy đủ.

## 4.6 Docker hóa hệ thống

### 4.6.1 Dockerfile (Django)

Các service Django đều chạy trong container riêng, cùng pattern build và run server.

[Chụp code: nên chụp một Dockerfile đại diện, ví dụ `user_service` hoặc `product_service`, nếu bạn muốn minh họa cách container hóa service Django.]

### 4.6.2 docker-compose.yml

File `docker-compose.yml` là phần quan trọng nhất của Chương 4 vì nó thể hiện toàn bộ hệ thống đang được ghép lại ra sao.

Các service và backend trong compose:

- `frontend`
- `api_gateway`
- `user_service`
- `product_service`
- `cart_service`
- `order_service`
- `payment_service`
- `shipping_service`
- `behavior_service`
- `rag_chat_service`
- `postgres_db`
- `mysql_db`
- `neo4j_db`
- `vector_db`
- `pgadmin`

[Chụp code: nên chụp `docker-compose.yml` vì đây là bằng chứng triển khai hệ thống hoàn chỉnh.]

## 4.7 Luồng hệ thống (End-to-End)

### 4.7.1 Use case: Mua hàng

Luồng mua hàng end-to-end của hệ thống:

1. User login qua `user_service`
2. Xem sản phẩm qua `product_service`
3. Thêm vào giỏ hàng qua `cart_service`
4. Tạo đơn hàng qua `order_service`
5. Thanh toán qua `payment_service`
6. Giao hàng qua `shipping_service`

[Hình 4.6: luồng end-to-end mua hàng từ login đến shipping.]

### 4.7.2 Sequence logic

Quan hệ chính trong luồng mua hàng:

- `order_service` gọi `payment_service`
- payment thành công thì tạo shipment
- shipment được theo dõi qua `shipping_service`

[Hình 4.7: sequence diagram của checkout flow, thể hiện order -> payment -> shipping.]

## 4.8 Triển khai Kubernetes (Optional)

Phần Kubernetes trong PDF là mục tùy chọn. Với repo hiện tại, có thể ghi ngắn rằng hệ thống đủ điều kiện để container hóa và sau này nâng cấp lên Kubernetes nếu cần.

[Hình 4.8: nếu cần, có thể chèn sơ đồ deployment Kubernetes hoặc để trống vì repo hiện tại chưa triển khai K8s thật.]

## 4.9 Logging và Monitoring

Hệ thống thực tế có thể mở rộng theo hướng:

- logging với ELK stack
- monitoring với Prometheus + Grafana

Trong bài viết, phần này có thể để mức định hướng vì repo hiện tại chưa có full stack monitoring.

## 4.10 Đánh giá hệ thống

### 4.10.1 Hiệu năng

Các chỉ số có thể đánh giá:

- response time
- throughput

### 4.10.2 Khả năng mở rộng

Hệ thống có thể scale theo từng service.

Ví dụ:

- tăng replica cho `product_service` nếu catalog bị tải cao
- tăng replica cho `rag_chat_service` nếu AI traffic tăng

### 4.10.3 Ưu điểm

- linh hoạt
- dễ mở rộng
- tách biệt AI khỏi nghiệp vụ core

### 4.10.4 Nhược điểm

- phức tạp triển khai hơn monolithic
- debug khó hơn vì request đi qua nhiều service

## 4.11 Bài tập thực hành

Theo hướng bài nộp, phần thực hành của Chương 4 có thể diễn giải là:

- triển khai các service bằng Django
- kết nối qua API
- docker hóa hệ thống
- test full flow mua hàng
- test full flow tư vấn sản phẩm bằng AI

[Hình 4.9: nếu cần, chèn ảnh chụp hệ thống chạy thực tế hoặc kết quả test full flow.]

## 4.12 Checklist đánh giá

Checklist hoàn thiện Chương 4:

- có API Gateway
- có JWT Auth
- có Docker chạy được
- có flow order -> payment -> shipping
- có luồng AI hoạt động

## 4.13 Kết luận

Chương 4 hoàn thiện bức tranh tổng thể của `ecommerce_ai` bằng cách ghép các service lại thành một hệ thống chạy được trong Docker Compose. Điểm cốt lõi của chương này là chứng minh được kiến trúc microservices hoạt động xuyên suốt từ frontend, gateway, service nghiệp vụ, service AI cho tới lớp dữ liệu.

Nếu so với monolithic, mô hình hiện tại rõ ràng phù hợp hơn với hệ thống lớn và có thêm AI. Tuy nhiên, để dùng trong production thật, vẫn cần bổ sung thêm auth gateway, monitoring và orchestration tốt hơn.
