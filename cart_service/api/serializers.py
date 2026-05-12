from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = "__all__"
        read_only_fields = ("cart",)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, required=False)

    class Meta:
        model = Cart
        fields = "__all__"
        read_only_fields = ("item_count", "total_amount")

    @staticmethod
    def _recalculate_cart(cart):
        items = cart.items.all()
        item_count = sum(item.quantity for item in items)
        total_amount = sum(item.unit_price * item.quantity for item in items)
        cart.item_count = item_count
        cart.total_amount = f"{total_amount:.2f}"
        cart.save(update_fields=["item_count", "total_amount"])

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        cart = Cart.objects.create(total_amount="0.00", **validated_data)
        for item_data in items_data:
            CartItem.objects.create(cart=cart, **item_data)
        self._recalculate_cart(cart)
        return cart

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                CartItem.objects.create(cart=instance, **item_data)

        self._recalculate_cart(instance)
        return instance
