from rest_framework.response import Response
from rest_framework.views import APIView

from .inference import predict_products


class BehaviorPredictView(APIView):
    def post(self, request):
        result = predict_products(request.data)
        return Response(
            {
                "model_family": "deep-learning",
                "recommended_product_ids": [
                    item["product_id"] for item in result["recommendations"]
                ],
                "recommendations": result["recommendations"],
                "input_features": result["input_features"],
            }
        )
