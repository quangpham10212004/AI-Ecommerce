from rest_framework import status
from rest_framework.test import APITestCase


class ChatAPITests(APITestCase):
    def test_returns_product_specific_answer_for_keychron(self):
        response = self.client.post(
            "/api/chat/",
            {"query": "Tu van giup toi ve san pham Ban phim co Keychron Q1 thuoc danh muc Phu kien."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Keychron Q1", response.data["response"])
        self.assertTrue(response.data["retrieved_documents"])
        self.assertTrue(response.data["sources"])

    def test_returns_category_guidance_for_audio_query(self):
        response = self.client.post(
            "/api/chat/",
            {"query": "Toi can tu van nhom thiet bi am thanh cho lam viec."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("knowledge base", response.data["response"].lower())

    def test_returns_400_for_empty_query(self):
        response = self.client.post("/api/chat/", {"query": ""}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_endpoint_reports_index_backend(self):
        response = self.client.get("/api/chat/status/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(response.data["backend"], {"qdrant", "in_memory"})
