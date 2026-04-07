import yaml

with open('docker-compose.yml', 'r') as f:
    compose = yaml.safe_load(f)

# Update user_service to wait for mysql
if 'postgres_db' in compose['services']['user_service']['depends_on']:
    compose['services']['user_service']['depends_on'].remove('postgres_db')
if 'mysql_db' not in compose['services']['user_service'].get('depends_on', []):
    if 'depends_on' not in compose['services']['user_service']:
        compose['services']['user_service']['depends_on'] = []
    compose['services']['user_service']['depends_on'].append('mysql_db')

# Change user_service environment vars to DB_ instead of POSTGRES_
compose['services']['user_service']['environment'] = {
    'DB_NAME': 'user_db',
    'DB_USER': 'root',
    'DB_PASSWORD': 'rootpassword',
    'DB_HOST': 'mysql_db',
    'DB_PORT': '3306'
}

# Add mysql_db service
compose['services']['mysql_db'] = {
    'image': 'mysql:8',
    'environment': {
        'MYSQL_ROOT_PASSWORD': 'rootpassword',
        'MYSQL_DATABASE': 'user_db'
    },
    'ports': ['3306:3306'],
    'volumes': ['mysqldata:/var/lib/mysql'],
    'networks': ['eccom_network']
}

# Add pgadmin service
compose['services']['pgadmin'] = {
    'image': 'dpage/pgadmin4',
    'environment': {
        'PGADMIN_DEFAULT_EMAIL': 'admin@admin.com',
        'PGADMIN_DEFAULT_PASSWORD': 'admin'
    },
    'ports': ['5050:80'],
    'depends_on': ['postgres_db'],
    'networks': ['eccom_network']
}

if 'mysqldata' not in compose['volumes']:
    compose['volumes']['mysqldata'] = None

with open('docker-compose.yml', 'w') as f:
    yaml.dump(compose, f, default_flow_style=False, sort_keys=False)
