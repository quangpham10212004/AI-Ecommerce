from django.urls import path
from .views import (
    ChatAPIView,
    ChatKnowledgeBaseStatusAPIView,
    ChatKnowledgeGraphStatusAPIView,
)

urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),
    path('chat/status/', ChatKnowledgeBaseStatusAPIView.as_view(), name='chat-status'),
    path('chat/graph-status/', ChatKnowledgeGraphStatusAPIView.as_view(), name='chat-graph-status'),
]
