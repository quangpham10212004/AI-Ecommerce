# Chương 3. AI Service cho tư vấn sản phẩm

## 3.1 Mục tiêu

Chương này tập trung vào lớp AI của hệ thống `ecommerce_ai`, gồm hai năng lực chính:

- gợi ý sản phẩm dựa trên hành vi người dùng
- tư vấn sản phẩm theo truy xuất tri thức và ngữ cảnh câu hỏi

Về mặt yêu cầu học phần, Chương 3 đã được tổ chức quanh đúng 3 thành phần bắt buộc:

- `Deep Learning` với mô hình `LSTM`
- `Knowledge Graph` với `Neo4j`
- `RAG` với retrieval và answer generation

Trong project hiện tại, hai năng lực này được tách thành hai service riêng:

- `behavior_service` cho recommendation theo chuỗi hành vi
- `rag_chat_service` cho chatbot tư vấn và truy xuất tri thức

Mục tiêu của thiết kế này là không nhồi toàn bộ logic AI vào một service duy nhất, mà phân tách theo đúng bài toán:

- `behavior_service` giải quyết bài toán dự đoán xu hướng tiếp theo của người dùng
- `rag_chat_service` giải quyết bài toán hỏi đáp và tư vấn theo nội dung sản phẩm / chính sách / bundle

[Hình 3.1: sơ đồ tổng quan AI Service của hệ thống, thể hiện `behavior_service` và `rag_chat_service` là hai nhánh độc lập nhưng cùng phục vụ frontend qua gateway.]
[Chụp code: có thể chụp `behavior_service/api/urls.py`, `rag_chat_service/api/urls.py` để chứng minh hai service có endpoint riêng.]

## 3.2 Kiến trúc AI Service

AI layer của hệ thống được tổ chức như một microservice độc lập, giao tiếp với các service còn lại thông qua API.

### 3.2.1 Behavior Service

`behavior_service` nhận đầu vào là chuỗi hành vi gần đây của người dùng, sau đó:

- mã hóa chuỗi hành vi
- đưa vào mô hình LSTM
- suy ra `predicted_next_action`
- ánh xạ kết quả sang `intent`
- trả về danh sách sản phẩm đề xuất

API hiện tại:

- `POST /recommend/`

Response hiện tại có các trường:

- `model_family`
- `model_architecture`
- `predicted_next_action`
- `confidence`
- `intent`
- `recommended_product_ids`
- `recommendations`
- `input_sequence`

### 3.2.2 RAG Chat Service

`rag_chat_service` là service tư vấn sản phẩm theo kiểu retrieval-based. Luồng chính gồm:

- nhận câu hỏi người dùng
- xây dựng knowledge base nếu cần
- truy xuất tài liệu liên quan
- sinh câu trả lời dựa trên docs đã truy xuất

API hiện tại:

- `POST /chat/`
- `GET /chat/status/`
- `GET /chat/graph-status/`

[Hình 3.2: sơ đồ pipeline AI, gồm input -> behavior model / retrieval -> output recommendation hoặc chatbot response.]
[Chụp code: có thể chụp `behavior_service/api/views.py` và `rag_chat_service/api/views.py` để thể hiện API đầu vào/đầu ra của hai nhánh AI.]

### 3.2.3 Nhận xét kiến trúc

Thiết kế này phù hợp vì:

- recommendation và chatbot là hai bài toán khác nhau
- behavior prediction cần sequence model
- tư vấn sản phẩm cần knowledge retrieval
- tách service giúp dễ thay model hoặc thay chiến lược truy xuất sau này

## 3.3 Thu thập dữ liệu

### 3.3.1 User Behavior Data

`behavior_service` cần dữ liệu hành vi người dùng để dự đoán ý định tiếp theo. Theo logic hiện tại, chuỗi hành vi đầu vào thường gồm:

- `view`
- `click`
- `search`
- `add_to_cart`
- `remove_from_cart`
- `wishlist`
- `purchase`
- `review`

Trong code, chuỗi này được nhận qua trường `recent_actions`.

### 3.3.2 Ví dụ dataset

Một chuỗi hành vi mẫu có thể là:

```text
recent_actions = ["view", "click", "search", "add_to_cart", "view"]
```

Khi đưa vào mô hình, service sẽ:

- map action sang chỉ số
- pad chuỗi về độ dài cố định `10`
- reshape thành tensor đầu vào `shape (1, 10, 1)`

[Hình 3.3: minh họa luồng dữ liệu behavior, từ user event -> recent_actions -> tensor -> prediction.]
[Chụp code: nên chụp `behavior_service/api/inference.py` ở phần `_encode_sequence()` và `predict_products()` để trình bày preprocessing.]

### 3.3.3 Dữ liệu tri thức cho chatbot

`rag_chat_service` dùng bộ tri thức nội bộ gồm:

- mô tả sản phẩm
- chính sách bundle
- hướng dẫn theo category
- các tài liệu tư vấn theo nhóm sản phẩm

Trong repo, knowledge base hiện tại được đóng gói thành JSON tài liệu và seed vào:

- Neo4j knowledge graph
- Qdrant vector store fallback
- cơ chế in-memory fallback nếu các backend ngoài không sẵn sàng

## 3.4 Mô hình LSTM (Sequence Modeling)

### 3.4.1 Ý tưởng

Mục tiêu của LSTM trong project là dự đoán hành động tiếp theo của người dùng dựa trên chuỗi hành vi gần đây. Đây là dạng sequence classification, không phải dự đoán giá trị liên tục.

Trong code hiện tại, mô hình được triển khai như một pipeline đơn giản:

- input sequence độ dài 10
- LSTM layer
- fully connected layer
- softmax output trên 8 lớp hành vi

### 3.4.2 Model chi tiết

Phần logic suy luận trong `behavior_service/api/inference.py` tương ứng với cấu trúc:

```python
Input(shape=(10, 1))
LSTM(64)
Dense(8, activation="softmax")
```

Trong đó 8 lớp hành vi là:

- `add_to_cart`
- `click`
- `purchase`
- `remove_from_cart`
- `review`
- `search`
- `view`
- `wishlist`

Sau khi model sinh xác suất, service chọn lớp có xác suất cao nhất làm `predicted_next_action`.

[Hình 3.4: sơ đồ kiến trúc LSTM, từ input sequence -> encoding -> LSTM -> dense -> predicted action.]
[Chụp code: nên chụp `behavior_service/api/inference.py` ở phần `load_model()` và mô hình `LSTM` để thể hiện Deep Learning component.]

### 3.4.3 Training

Ở mức triển khai trong project, phần training không được xây thành pipeline hoàn chỉnh trên server. Thay vào đó, repo đang dùng mô hình đã được đóng gói sẵn trong thư mục assets và thực hiện suy luận trực tiếp khi có request.

Điểm này phù hợp với một bài tiểu luận vì:

- tập trung vào kiến trúc và luồng xử lý
- không cần xây full training pipeline production
- vẫn thể hiện được tư duy sequence modeling

## 3.5 Knowledge Graph với Neo4j

### 3.5.1 Mô hình đồ thị

`rag_chat_service` xây knowledge graph từ catalog sản phẩm và bundle gợi ý.

Các node chính:

- `Product`
- `Category`
- `Bundle`

Các relationship chính:

- `BELONGS_TO`
- `INCLUDES`
- `SIMILAR_TO`

Trong `behavior_service`, kiến trúc recommendation cũng dùng tín hiệu tương tự về category và intent, nhưng ở mức đơn giản hơn, thiên về mapping hành vi sang nhóm sản phẩm.

[Hình 3.5: schema knowledge graph Neo4j, thể hiện Product - BELONGS_TO -> Category và Bundle - INCLUDES -> Product.]
[Chụp code: nên chụp `rag_chat_service/api/rag_engine.py` ở phần `_seed_graph()` và `_retrieve_from_graph()` để chứng minh Knowledge Graph được xây và truy vấn như thế nào.]

### 3.5.2 Ví dụ Cypher

Luồng seed graph trong code tương ứng với các thao tác Cypher như:

```cypher
MERGE (p:Product {id: 1})
MERGE (c:Category {name: "Audio"})
MERGE (p)-[:BELONGS_TO]->(c)
```

và:

```cypher
MERGE (b:Bundle {name: "work-from-home"})
MERGE (b)-[:INCLUDES]->(p)
```

### 3.5.3 Truy vấn gợi ý

Ví dụ truy vấn gợi ý theo graph:

```cypher
MATCH (b:Bundle {name: "work-from-home"})-[:INCLUDES]->(p:Product)
RETURN p
```

Trong logic hiện tại, chatbot không chỉ trả dữ liệu thô mà còn ưu tiên trả lời theo ngữ cảnh:

- bundle
- category
- so sánh
- quà tặng
- ngân sách

## 3.6 RAG (Retrieval-Augmented Generation)

### 3.6.1 Pipeline

Pipeline của `rag_chat_service` hiện tại gồm 2 pha:

- `Retrieve`: tìm tài liệu liên quan từ graph hoặc vector store
- `Generate`: ghép tài liệu vào câu trả lời phù hợp với ý định người dùng

Trong code hiện tại, generation chưa dùng LLM thật mà dùng template answer dựa trên documents đã truy xuất. Tuy nhiên, về mặt kiến trúc, đây vẫn là một RAG pipeline hợp lệ ở mức demo.

### 3.6.2 Vector Database

Service hỗ trợ nhiều backend:

- Neo4j là backend ưu tiên
- Qdrant là backend fallback
- in-memory cosine retrieval là fallback cuối

Điều này giúp service vẫn hoạt động kể cả khi một backend ngoài bị lỗi.

[Hình 3.6: pipeline RAG gồm Query -> Retrieve (Neo4j/Qdrant/In-memory) -> Compose answer -> Response.]
[Chụp code: nên chụp `rag_chat_service/api/rag_engine.py` ở các hàm `retrieve_documents()` và `generate_answer()` để thể hiện cơ chế RAG.]

### 3.6.3 Ví dụ

Ví dụ truy vấn:

```text
tôi cần laptop giá rẻ
```

Luồng xử lý tương ứng:

- detect intent là `Laptop`
- truy xuất tài liệu liên quan từ knowledge base
- tạo câu trả lời tư vấn theo bundle hoặc category phù hợp

Ví dụ response có thể là:

```text
Bạn có thể tham khảo Laptop XYZ giá 10 triệu...
```

## 3.7 Kết hợp Hybrid Model

Hệ thống đang đi theo hướng hybrid:

- LSTM để dự đoán hành vi
- Graph để khai thác quan hệ sản phẩm
- RAG để hiểu ngữ nghĩa câu hỏi

Trong bản cài đặt hiện tại, hybrid này tồn tại theo nghĩa kiến trúc hơn là một mô hình toán học hợp nhất. Điều đó vẫn phù hợp vì đề tài nhấn vào thiết kế hệ thống và khả năng phối hợp giữa các thành phần AI.

Final recommendation có thể hiểu là tổng hợp từ nhiều nguồn tín hiệu:

```text
final_score = w1 * lstm + w2 * graph + w3 * rag
```

[Hình 3.7: sơ đồ hybrid model, thể hiện 3 nhánh LSTM / Graph / RAG hội tụ về recommendation hoặc answer.]

## 3.8 Hai dạng AI Service

### 3.8.1 Recommendation List

Service gợi ý sản phẩm được dùng trong các tình huống:

- khi người dùng search
- khi người dùng add-to-cart
- khi người dùng xem sản phẩm

API hiện tại:

- `POST /recommend/`

Output trả về:

- `predicted_next_action`
- `confidence`
- `intent`
- `recommended_product_ids`
- `recommendations`

### 3.8.2 Chatbot tư vấn

Service tư vấn hỗ trợ câu hỏi tự nhiên từ người dùng như:

- nên chọn sản phẩm nào
- so sánh giữa các nhóm sản phẩm
- bundle nào phù hợp
- sản phẩm nào hợp ngân sách

API hiện tại:

- `POST /chat/`

Output trả về:

- câu trả lời dạng text
- nguồn tài liệu đã truy xuất
- backend đang được dùng

## 3.9 Triển khai AI Service

### 3.9.1 Tech stack

Tech stack hiện tại của hai service AI gồm:

- `TensorFlow` hoặc `PyTorch` cho recommendation
- `Neo4j` cho knowledge graph
- `Qdrant` cho vector retrieval fallback
- `Django` + `DRF` cho service layer

### 3.9.2 Kiến trúc

AI service được tách riêng khỏi các service ecommerce core, và chỉ giao tiếp qua API.

Điều này giúp:

- không làm ảnh hưởng luồng mua hàng nếu AI bị lỗi
- có thể thay model recommendation mà không đụng vào order/payment
- dễ mở rộng thêm một model chat mới trong tương lai

[Hình 3.8: sơ đồ triển khai AI service trong hệ thống microservices, thể hiện frontend -> gateway -> AI services -> backend AI stores.]
[Chụp code: có thể chụp `behavior_service/api/urls.py`, `rag_chat_service/api/urls.py`, và `docs/ANALYSIS_AND_DESIGN_ECOMMERCE_AI.md` phần service map để đối chiếu kiến trúc triển khai.]

## 3.10 Bài tập

Nếu triển khai theo yêu cầu học phần, phần bài tập của Chương 3 có thể hiểu là:

- xây dựng model LSTM đơn giản
- tạo graph trong Neo4j
- implement API recommendation
- xây dựng chatbot cơ bản

Trong repo hiện tại, các yêu cầu này đã được hiện thực ở mức demo đủ để minh họa kiến trúc.

## 3.11 Checklist đánh giá

Checklist để đánh giá Chương 3:

- có pipeline AI rõ ràng
- có model LSTM
- có Graph và RAG
- có API hoạt động

## 3.12 Kết luận

Chương 3 cho thấy hệ thống `ecommerce_ai` không chỉ dừng ở ecommerce microservices truyền thống mà còn tích hợp thêm lớp AI phục vụ cá nhân hóa trải nghiệm người dùng. Recommendation và chatbot được tách thành hai service riêng, mỗi service giải quyết một nhóm bài toán khác nhau nhưng cùng phục vụ mục tiêu tăng giá trị sử dụng cho hệ thống.

Về mặt thiết kế, cách triển khai hiện tại là hợp lý cho một project học phần vì vừa thể hiện được tư duy microservices, vừa thể hiện được pipeline AI gồm sequence modeling, knowledge graph và retrieval-based generation.
