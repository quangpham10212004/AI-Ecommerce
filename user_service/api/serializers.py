from rest_framework import serializers

from .models import AdminUser, Customer, StaffUser


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}


class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffUser
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}
