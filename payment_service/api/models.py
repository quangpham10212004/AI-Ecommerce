from django.db import models


class Payment(models.Model):
    order_number = models.CharField(max_length=50)
    customer_name = models.CharField(max_length=255)
    amount = models.CharField(max_length=50)
    method = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default="pending")
    transaction_ref = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.transaction_ref
