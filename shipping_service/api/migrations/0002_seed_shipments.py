from django.db import migrations


SHIPMENTS = [
    {
        "order_number": "ORD-1001",
        "carrier": "GHN",
        "tracking_number": "SHIP-1001",
        "shipping_status": "in_transit",
        "destination": "District 1, Ho Chi Minh City",
        "eta_days": 2,
    },
    {
        "order_number": "ORD-1002",
        "carrier": "Viettel Post",
        "tracking_number": "SHIP-1002",
        "shipping_status": "ready_to_ship",
        "destination": "Cau Giay, Ha Noi",
        "eta_days": 3,
    },
]


def seed_shipments(apps, schema_editor):
    Shipment = apps.get_model("api", "Shipment")
    for payload in SHIPMENTS:
        Shipment.objects.get_or_create(tracking_number=payload["tracking_number"], defaults=payload)


def unseed_shipments(apps, schema_editor):
    Shipment = apps.get_model("api", "Shipment")
    Shipment.objects.filter(tracking_number__in=[item["tracking_number"] for item in SHIPMENTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_shipments, unseed_shipments),
    ]
