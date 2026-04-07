from django.db import models
class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.CharField(max_length=50)
    ai_match = models.IntegerField(null=True, blank=True)
    image_icon = models.CharField(max_length=50)
