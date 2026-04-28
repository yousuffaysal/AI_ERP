import sys
import uuid
from django.contrib.auth import get_user_model
from apps.accounts.models import Company
from apps.sales.models import Customer

User = get_user_model()

def run():
    company = Company.objects.first()
    if not company:
        print("No company found. Please ensure the DB is seeded.")
        sys.exit(1)

    roles_to_create = {
        'staff': 10,
        'manager': 1,
        'finance': 2,
        'sales': 2,
        'hr_manager': 2,
        'auditor': 2,
    }

    print("--- GENERATED CREDENTIALS ---")

    for role, count in roles_to_create.items():
        for i in range(1, count + 1):
            email = f"test_{role}{i}@erp.io"
            password = "Password123!"
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': "Test",
                    'last_name': f"{role.capitalize()} {i}",
                    'role': role,
                    'company': company,
                    'is_active': True
                }
            )
            if created:
                user.set_password(password)
                user.save()
            
            print(f"- **{role.capitalize()} {i}**: `{email}` / `{password}`")

    # Create 20 clients (Customers)
    print("\n--- GENERATING CUSTOMERS ---")
    for i in range(1, 21):
        name = f"Client Business {i}"
        customer, created = Customer.objects.get_or_create(
            name=name,
            company=company,
            defaults={
                'email': f"contact@client{i}.com",
                'phone': f"+1555000{i:04d}",
                'address': f"{i} Commerce Ave"
            }
        )
        if created:
            print(f"Created customer: {name}")

run()
