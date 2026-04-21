from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AdminUser(TimestampedModel):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default="123456")
    phone = models.CharField(max_length=30)
    permissions_scope = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name


class StaffUser(TimestampedModel):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default="123456")
    phone = models.CharField(max_length=30)
    department = models.CharField(max_length=100)
    shift = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name


class Customer(TimestampedModel):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default="123456")
    phone = models.CharField(max_length=30)
    loyalty_tier = models.CharField(max_length=50, default="standard")
    default_address = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name
