from django.db import models


class Order(models.Model):
    order_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    status = models.CharField(max_length=50, default="created")
    payment_status = models.CharField(max_length=50, default="pending")
    shipping_status = models.CharField(max_length=50, default="pending")
    total_amount = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number
