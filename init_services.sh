#!/bin/bash

SERVICES=("user_service" "product_service" "order_service" "behavior_service" "rag_chat_service")

for SERVICE in "${SERVICES[@]}"
do
  echo "Initializing $SERVICE..."
  
  # Tạo requirements.txt
  cat <<EOF > $SERVICE/requirements.txt
Django==4.2.7
djangorestframework==3.14.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
EOF

  # Bổ sung các thư viện AI/ML cho các service đặc thù
  if [ "$SERVICE" == "behavior_service" ]; then
    echo "tensorflow==2.14.0" >> $SERVICE/requirements.txt
    echo "pandas==2.1.2" >> $SERVICE/requirements.txt
  elif [ "$SERVICE" == "rag_chat_service" ]; then
    echo "langchain==0.0.334" >> $SERVICE/requirements.txt
    echo "llama-index==0.8.64" >> $SERVICE/requirements.txt
    echo "qdrant-client==1.6.4" >> $SERVICE/requirements.txt
    echo "openai==0.28.1" >> $SERVICE/requirements.txt
  fi

  # Tạo Dockerfile
  cat <<EOF > $SERVICE/Dockerfile
FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DEFAULT_TIMEOUT 1000
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --retries 10 -r requirements.txt
COPY . .
# Chạy Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]
EOF

  # Lưu ý: trong lúc chạy init, ta có thể dùng django-admin startproject luôn nếu máy host có cài django
  # Nhưng để an toàn trong docker, ta sẽ tạo sau.
  
done

# Cấu hình API Gateway (Nginx)
cat <<EOF > api_gateway/nginx.conf
events {
  worker_connections 1024;
}

http {
  server {
    listen 80;

    location /api/users {
      proxy_pass http://user_service:8000;
    }

    location /api/products {
      proxy_pass http://product_service:8000;
    }

    location /api/orders {
      proxy_pass http://order_service:8000;
    }

    location /api/behavior {
      proxy_pass http://behavior_service:8000;
    }

    location /api/chat {
      proxy_pass http://rag_chat_service:8000;
    }
  }
}
EOF

echo "Done initializing boilerplate files!"
