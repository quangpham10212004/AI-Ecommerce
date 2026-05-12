from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"
        read_only_fields = ("order",)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ("total_amount",)

    @staticmethod
    def _recalculate_order(order):
        items = order.items.all()
        total_amount = sum(item.unit_price * item.quantity for item in items)
        order.total_amount = f"{total_amount:.2f}"
        order.save(update_fields=["total_amount"])

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        order = Order.objects.create(total_amount="0.00", **validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        self._recalculate_order(order)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)

        self._recalculate_order(instance)
        return instance
