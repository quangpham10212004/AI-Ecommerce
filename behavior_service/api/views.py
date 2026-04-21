from rest_framework.response import Response
from rest_framework.views import APIView

from .inference import predict_products


class BehaviorPredictView(APIView):
    def post(self, request):
        result = predict_products(request.data)
        return Response({
            "model_family": "lstm",
            "model_architecture": result["model_type"],
            "predicted_next_action": result["predicted_next_action"],
            "confidence": result["confidence"],
            "intent": result["intent"],
            "recommended_product_ids": [r["product_id"] for r in result["recommendations"]],
            "recommendations": result["recommendations"],
            "input_sequence": result["input_sequence"],
        })
