import sys
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS = ['testserver', '*']

from rest_framework.test import APIClient
from apps.accounts.models import User, Company

c = Company.objects.first()
u = User.objects.filter(role='admin').first()
if not u:
    print("NO ADMIN FOUND")
    sys.exit()

client = APIClient()
client.force_authenticate(user=u)

try:
    response = client.get(f'/api/v1/accounts/companies/{c.id}/health/', HTTP_HOST='testserver')
    print(f"STATUS: {response.status_code}")
    if hasattr(response, 'data'):
        print(f"DATA: {response.data}")
    else:
        print(f"CONTENT: {response.content}")
except Exception as e:
    import traceback
    traceback.print_exc()

