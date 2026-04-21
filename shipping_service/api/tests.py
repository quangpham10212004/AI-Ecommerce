from rest_framework import status
from rest_framework.test import APITestCase


class ShippingServiceTests(APITestCase):
    def test_shipment_list_returns_seeded_shipments(self):
        response = self.client.get("/api/shipments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
