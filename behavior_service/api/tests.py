from rest_framework import status
from rest_framework.test import APITestCase


class BehaviorPredictTests(APITestCase):
    def test_returns_ranked_recommendations_from_lstm_model(self):
        response = self.client.post(
            "/api/recommend/",
            {
                "preferred_category": "audio",
                "search_terms": "premium headphones for travel",
                "cart_value": 12000000,
                "premium_intent": 0.9,
                "mobility_intent": 0.6,
                "recent_views": ["sony wh-1000xm5", "jbl flip 6"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["model_family"], "lstm")
        self.assertEqual(response.data["model_architecture"], "lstm")
        self.assertEqual(len(response.data["recommendations"]), 3)
        self.assertIn(1, response.data["recommended_product_ids"])
