from django.urls import path
from .views import ChatAPIView, ChatKnowledgeBaseStatusAPIView

urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),
    path('chat/status/', ChatKnowledgeBaseStatusAPIView.as_view(), name='chat-status'),
]
