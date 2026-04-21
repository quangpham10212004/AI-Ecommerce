from django.db import migrations


CARTS = [
    {
        "customer_name": "Pham Minh Anh",
        "customer_email": "minhanh.customer@ecommerce.local",
        "item_count": 2,
        "total_amount": "11480000",
        "status": "active",
        "notes": "Sony WH-1000XM5 + JBL Flip 6",
    },
    {
        "customer_name": "Do Gia Huy",
        "customer_email": "giahuy.customer@ecommerce.local",
        "item_count": 1,
        "total_amount": "4290000",
        "status": "active",
        "notes": "Keychron Q1",
    },
]


def seed_carts(apps, schema_editor):
    Cart = apps.get_model("api", "Cart")
    for payload in CARTS:
        Cart.objects.get_or_create(
            customer_email=payload["customer_email"],
            status=payload["status"],
            defaults=payload,
        )


def unseed_carts(apps, schema_editor):
    Cart = apps.get_model("api", "Cart")
    Cart.objects.filter(customer_email__in=[item["customer_email"] for item in CARTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_carts, unseed_carts),
    ]
