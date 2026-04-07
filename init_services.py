import os

SERVICES = ["user_service", "product_service", "order_service", "behavior_service", "rag_chat_service"]

REQUIREMENTS_BASE = """Django==4.2.7
djangorestframework==3.14.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
"""

DOCKERFILE_BASE = """FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DEFAULT_TIMEOUT 1000
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --retries 10 -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]
"""

NGINX_CONF = """events {
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
"""

def init_services():
    for service in SERVICES:
        # Create directories if they don't exist
        os.makedirs(service, exist_ok=True)
        
        # Requirements
        req_content = REQUIREMENTS_BASE
        if service == "behavior_service":
            req_content += "tensorflow==2.14.0\npandas==2.1.2\n"
        elif service == "rag_chat_service":
            req_content += "langchain==0.0.334\nllama-index==0.8.64\nqdrant-client==1.6.4\nopenai==0.28.1\n"
            
        with open(os.path.join(service, "requirements.txt"), "w") as f:
            f.write(req_content)
            
        # Dockerfile
        with open(os.path.join(service, "Dockerfile"), "w") as f:
            f.write(DOCKERFILE_BASE)
            
    # API Gateway
    os.makedirs("api_gateway", exist_ok=True)
    with open(os.path.join("api_gateway", "nginx.conf"), "w") as f:
        f.write(NGINX_CONF)
        
if __name__ == "__main__":
    init_services()
    print("Services initialized via python.")
