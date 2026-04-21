from django.db import migrations, models


def seed_passwords(apps, schema_editor):
    AdminUser = apps.get_model("api", "AdminUser")
    StaffUser = apps.get_model("api", "StaffUser")
    Customer = apps.get_model("api", "Customer")

    AdminUser.objects.all().update(password="123456")
    StaffUser.objects.all().update(password="123456")
    Customer.objects.all().update(password="123456")


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_seed_users"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminuser",
            name="password",
            field=models.CharField(default="123456", max_length=128),
        ),
        migrations.AddField(
            model_name="staffuser",
            name="password",
            field=models.CharField(default="123456", max_length=128),
        ),
        migrations.AddField(
            model_name="customer",
            name="password",
            field=models.CharField(default="123456", max_length=128),
        ),
        migrations.RunPython(seed_passwords, migrations.RunPython.noop),
    ]
