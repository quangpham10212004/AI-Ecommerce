from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserViewSet,
    CustomerViewSet,
    StaffUserViewSet,
    UserLoginAPIView,
    UserDomainSummaryAPIView,
)

router = DefaultRouter()
router.register(r"admins", AdminUserViewSet)
router.register(r"staff", StaffUserViewSet)
router.register(r"customers", CustomerViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("summary/", UserDomainSummaryAPIView.as_view(), name="user-summary"),
    path("login/", UserLoginAPIView.as_view(), name="user-login"),
]
