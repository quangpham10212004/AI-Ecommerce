from django.test import TestCase

from .models import Product


class ProductSeedDataTests(TestCase):
    def test_seed_data_contains_at_least_ten_products(self):
        self.assertGreaterEqual(Product.objects.count(), 10)
