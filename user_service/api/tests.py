from rest_framework import status
from rest_framework.test import APITestCase


class UserDomainTests(APITestCase):
    def test_summary_endpoint_returns_domain_counts(self):
        response = self.client.get("/api/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["admins"], 1)
        self.assertGreaterEqual(response.data["staff"], 2)
        self.assertGreaterEqual(response.data["customers"], 3)

    def test_login_accepts_default_customer_password(self):
        response = self.client.post(
            "/api/login/",
            {
                "role": "customer",
                "email": "minhanh.customer@ecommerce.local",
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "customer")
