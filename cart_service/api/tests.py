from rest_framework import status
from rest_framework.test import APITestCase


class CartServiceTests(APITestCase):
    def test_cart_list_returns_seeded_carts(self):
        response = self.client.get("/api/carts/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
