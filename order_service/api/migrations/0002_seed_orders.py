from django.db import migrations


ORDERS = [
    {
        "order_number": "ORD-1001",
        "customer_name": "Pham Minh Anh",
        "customer_email": "minhanh.customer@ecommerce.local",
        "status": "confirmed",
        "payment_status": "paid",
        "shipping_status": "in_transit",
        "total_amount": "11480000",
    },
    {
        "order_number": "ORD-1002",
        "customer_name": "Do Gia Huy",
        "customer_email": "giahuy.customer@ecommerce.local",
        "status": "processing",
        "payment_status": "pending",
        "shipping_status": "pending",
        "total_amount": "4290000",
    },
]


def seed_orders(apps, schema_editor):
    Order = apps.get_model("api", "Order")
    for payload in ORDERS:
        Order.objects.get_or_create(order_number=payload["order_number"], defaults=payload)


def unseed_orders(apps, schema_editor):
    Order = apps.get_model("api", "Order")
    Order.objects.filter(order_number__in=[item["order_number"] for item in ORDERS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_orders, unseed_orders),
    ]
