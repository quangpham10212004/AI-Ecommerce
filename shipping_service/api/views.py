from rest_framework.viewsets import ModelViewSet

from .models import Shipment
from .serializers import ShipmentSerializer


class ShipmentViewSet(ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
