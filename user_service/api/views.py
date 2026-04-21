from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import AdminUser, Customer, StaffUser
from .serializers import AdminUserSerializer, CustomerSerializer, StaffUserSerializer


class AdminUserViewSet(ModelViewSet):
    queryset = AdminUser.objects.all().order_by("full_name")
    serializer_class = AdminUserSerializer


class StaffUserViewSet(ModelViewSet):
    queryset = StaffUser.objects.all().order_by("full_name")
    serializer_class = StaffUserSerializer


class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all().order_by("full_name")
    serializer_class = CustomerSerializer


class UserDomainSummaryAPIView(APIView):
    def get(self, request):
        return Response(
            {
                "admins": AdminUser.objects.count(),
                "staff": StaffUser.objects.count(),
                "customers": Customer.objects.count(),
            }
        )


class UserLoginAPIView(APIView):
    def post(self, request):
        role = (request.data.get("role") or "").strip().lower()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        model_map = {
            "admin": (AdminUser, "admin"),
            "staff": (StaffUser, "staff"),
            "customer": (Customer, "customer"),
        }

        if role not in model_map:
            return Response({"detail": "Unsupported role."}, status=status.HTTP_400_BAD_REQUEST)

        model_class, normalized_role = model_map[role]

        try:
            user = model_class.objects.get(email=email, password=password, is_active=True)
        except model_class.DoesNotExist:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(
            {
                "role": normalized_role,
                "email": user.email,
                "full_name": user.full_name,
                "default_password": "123456",
            }
        )
