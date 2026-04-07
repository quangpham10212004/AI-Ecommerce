from django.urls import path
from .views import BehaviorPredictView
urlpatterns = [
    path('recommend/', BehaviorPredictView.as_view(), name='recommend'),
]