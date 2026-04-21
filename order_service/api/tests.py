from rest_framework import status
from rest_framework.test import APITestCase


class OrderServiceTests(APITestCase):
    def test_order_list_returns_seeded_orders(self):
        response = self.client.get("/api/orders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
