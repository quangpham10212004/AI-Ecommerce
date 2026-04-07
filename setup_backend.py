import os
import subprocess

base_dir = "/home/l/django-project/ecommerce_ai"
services = ["user_service", "product_service", "order_service", "behavior_service", "rag_chat_service"]

# Utility to add to settings
def update_settings(service):
    settings_path = os.path.join(base_dir, service, "core", "settings.py")
    if not os.path.exists(settings_path): return
    with open(settings_path, "r") as f: content = f.read()
    
    # Allow all hosts
    content = content.replace("ALLOWED_HOSTS = []", "ALLOWED_HOSTS = ['*']")
    
    # Add rest_framework and api app
    if "'rest_framework'" not in content:
        content = content.replace(
            "INSTALLED_APPS = [", 
            "INSTALLED_APPS = [\n    'rest_framework',\n    'api',\n    'corsheaders',"
        )
    
    # Add cors middleware
    if "'corsheaders.middleware.CorsMiddleware'" not in content:
        content = content.replace(
            "MIDDLEWARE = [",
            "MIDDLEWARE = [\n    'corsheaders.middleware.CorsMiddleware',"
        )
        content += "\nCORS_ALLOW_ALL_ORIGINS = True\n"
        
    with open(settings_path, "w") as f: f.write(content)

# Define models/views for each
content_map = {
    "product_service": {
        "models.py": """from django.db import models
class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.CharField(max_length=50)
    ai_match = models.IntegerField(null=True, blank=True)
    image_icon = models.CharField(max_length=50)
""",
        "serializers.py": """from rest_framework import serializers
from .models import Product
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
""",
        "views.py": """from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
"""
    },
    "rag_chat_service": {
        "views.py": """from rest_framework.views import APIView
from rest_framework.response import Response
import time
import random
class ChatAPIView(APIView):
    def post(self, request):
        query = request.data.get('query', '')
        # Mock Delay & RAG Search
        time.sleep(1)
        bot_responses = [
            "Dựa trên Database, SP có KM 10%.", 
            "Knowledge Base tìm thấy mặt hàng công thái học phù hợp.",
            f"[RAG] Tài liệu của hệ thống cho thấy bạn có thể quan tâm đến giải đáp cho: {query}"
        ]
        return Response({"response": random.choice(bot_responses)})
"""
    },
    "behavior_service": {
        "views.py": """from rest_framework.views import APIView
from rest_framework.response import Response
class BehaviorPredictView(APIView):
    def post(self, request):
        # Mocking deep learning inference
        return Response({"recommended_product_ids": [1, 2, 6]})
"""
    }
}

for service in services:
    service_path = os.path.join(base_dir, service)
    # Start app
    subprocess.run(["python3", "manage.py", "startapp", "api"], cwd=service_path)
    # Update settings
    update_settings(service)
    
    # Write files
    api_dir = os.path.join(service_path, "api")
    if service in content_map:
        for fname, content in content_map[service].items():
            with open(os.path.join(api_dir, fname), "w") as f:
                f.write(content)

    # Core URL update
    urls_path = os.path.join(service_path, "core", "urls.py")
    with open(urls_path, "w") as f:
        f.write("""from django.contrib import admin
from django.urls import path, include
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
""")

    # API URLs
    with open(os.path.join(api_dir, "urls.py"), "w") as f:
        if service == "product_service":
            f.write("""from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet
router = DefaultRouter()
router.register(r'products', ProductViewSet)
urlpatterns = [
    path('', include(router.urls)),
]""")
        elif service == "rag_chat_service":
            f.write("""from django.urls import path
from .views import ChatAPIView
urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),
]""")
        elif service == "behavior_service":
             f.write("""from django.urls import path
from .views import BehaviorPredictView
urlpatterns = [
    path('recommend/', BehaviorPredictView.as_view(), name='recommend'),
]""")
        else:
            f.write("from django.urls import path\nurlpatterns = []\n")

print("Backend populated.")
