from rest_framework import status
from rest_framework.test import APITestCase


class PaymentServiceTests(APITestCase):
    def test_payment_list_returns_seeded_payments(self):
        response = self.client.get("/api/payments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
