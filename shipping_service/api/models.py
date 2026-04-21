from django.db import models


class Shipment(models.Model):
    order_number = models.CharField(max_length=50)
    carrier = models.CharField(max_length=100)
    tracking_number = models.CharField(max_length=100, unique=True)
    shipping_status = models.CharField(max_length=50, default="pending")
    destination = models.CharField(max_length=255)
    eta_days = models.IntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.tracking_number
