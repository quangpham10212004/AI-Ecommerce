from django.db import migrations


PAYMENTS = [
    {
        "order_number": "ORD-1001",
        "customer_name": "Pham Minh Anh",
        "amount": "11480000",
        "method": "credit_card",
        "status": "paid",
        "transaction_ref": "PAY-TRX-1001",
    },
    {
        "order_number": "ORD-1002",
        "customer_name": "Do Gia Huy",
        "amount": "4290000",
        "method": "bank_transfer",
        "status": "pending",
        "transaction_ref": "PAY-TRX-1002",
    },
]


def seed_payments(apps, schema_editor):
    Payment = apps.get_model("api", "Payment")
    for payload in PAYMENTS:
        Payment.objects.get_or_create(transaction_ref=payload["transaction_ref"], defaults=payload)


def unseed_payments(apps, schema_editor):
    Payment = apps.get_model("api", "Payment")
    Payment.objects.filter(transaction_ref__in=[item["transaction_ref"] for item in PAYMENTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_payments, unseed_payments),
    ]
