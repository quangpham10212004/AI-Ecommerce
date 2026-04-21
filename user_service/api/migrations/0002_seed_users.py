from django.db import migrations


ADMINS = [
    {
        "full_name": "Nguyen Thi Admin",
        "email": "admin@ecommerce.local",
        "phone": "0901000001",
        "permissions_scope": "catalog,orders,users,analytics",
        "is_active": True,
    }
]

STAFF = [
    {
        "full_name": "Tran Van Sales",
        "email": "sales.staff@ecommerce.local",
        "phone": "0901000002",
        "department": "sales",
        "shift": "morning",
        "is_active": True,
    },
    {
        "full_name": "Le Thi Ops",
        "email": "ops.staff@ecommerce.local",
        "phone": "0901000003",
        "department": "operations",
        "shift": "afternoon",
        "is_active": True,
    },
]

CUSTOMERS = [
    {
        "full_name": "Pham Minh Anh",
        "email": "minhanh.customer@ecommerce.local",
        "phone": "0901000010",
        "loyalty_tier": "gold",
        "default_address": "District 1, Ho Chi Minh City",
        "is_active": True,
    },
    {
        "full_name": "Do Gia Huy",
        "email": "giahuy.customer@ecommerce.local",
        "phone": "0901000011",
        "loyalty_tier": "silver",
        "default_address": "Cau Giay, Ha Noi",
        "is_active": True,
    },
    {
        "full_name": "Vo Bao Chau",
        "email": "baochau.customer@ecommerce.local",
        "phone": "0901000012",
        "loyalty_tier": "standard",
        "default_address": "Hai Chau, Da Nang",
        "is_active": True,
    },
]


def seed_users(apps, schema_editor):
    AdminUser = apps.get_model("api", "AdminUser")
    StaffUser = apps.get_model("api", "StaffUser")
    Customer = apps.get_model("api", "Customer")

    for payload in ADMINS:
        AdminUser.objects.get_or_create(email=payload["email"], defaults=payload)
    for payload in STAFF:
        StaffUser.objects.get_or_create(email=payload["email"], defaults=payload)
    for payload in CUSTOMERS:
        Customer.objects.get_or_create(email=payload["email"], defaults=payload)


def unseed_users(apps, schema_editor):
    AdminUser = apps.get_model("api", "AdminUser")
    StaffUser = apps.get_model("api", "StaffUser")
    Customer = apps.get_model("api", "Customer")
    AdminUser.objects.filter(email__in=[item["email"] for item in ADMINS]).delete()
    StaffUser.objects.filter(email__in=[item["email"] for item in STAFF]).delete()
    Customer.objects.filter(email__in=[item["email"] for item in CUSTOMERS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_users, unseed_users),
    ]
