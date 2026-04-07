from rest_framework.views import APIView
from rest_framework.response import Response
class BehaviorPredictView(APIView):
    def post(self, request):
        # Mocking deep learning inference
        return Response({"recommended_product_ids": [1, 2, 6]})
