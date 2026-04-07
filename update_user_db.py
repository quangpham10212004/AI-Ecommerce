import os
settings_path = '/home/l/django-project/ecommerce_ai/user_service/core/settings.py'
with open(settings_path, 'r') as f:
    content = f.read()

import re
mysql_db_settings = """
import os
import pymysql
pymysql.install_as_MySQLdb()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'user_db'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'rootpassword'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
    }
}
"""
content = re.sub(r'DATABASES = \{.*?\n\}', mysql_db_settings.strip(), content, flags=re.DOTALL)

with open(settings_path, 'w') as f:
    f.write(content)
