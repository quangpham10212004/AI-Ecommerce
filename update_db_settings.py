import os

base_dir = "/home/l/django-project/ecommerce_ai"
services = ["user_service", "product_service", "order_service"]

db_settings = """
import os
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'postgres'),
        'USER': os.getenv('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': '5432',
    }
}
"""

for service in services:
    settings_path = os.path.join(base_dir, service, "core", "settings.py")
    if not os.path.exists(settings_path): continue
    
    with open(settings_path, "r") as f: content = f.read()
    
    # Simple replacement of DATABASES block
    if "'ENGINE': 'django.db.backends.sqlite3'" in content:
        import re
        content = re.sub(r'DATABASES = \{.*?\n\}', db_settings.strip(), content, flags=re.DOTALL)
        
        with open(settings_path, "w") as f: f.write(content)

print("Database settings updated.")
