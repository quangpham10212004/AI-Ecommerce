from django.db import models


class Cart(models.Model):
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    item_count = models.IntegerField(default=0)
    total_amount = models.CharField(max_length=50, default="0.00")
    status = models.CharField(max_length=50, default="active")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer_name} cart"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product_id = models.IntegerField(null=True, blank=True)
    product_name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"
