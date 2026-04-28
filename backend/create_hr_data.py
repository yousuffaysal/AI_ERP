import sys
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.utils import timezone
from apps.accounts.models import Company, User
from apps.hr.models import Department, Employee

def run():
    company = Company.objects.first()
    if not company:
        print("No company found.")
        sys.exit(1)

    departments_data = [
        ("Executive", "EXEC"),
        ("Sales", "SALES"),
        ("Human Resources", "HR"),
        ("Finance", "FIN"),
        ("Operations", "OPS"),
        ("Audit & Compliance", "AUDIT"),
    ]

    print("--- GENERATING DEPARTMENTS ---")
    departments = {}
    for name, code in departments_data:
        dept, created = Department.objects.get_or_create(
            name=name,
            code=code,
            company=company
        )
        departments[code] = dept
        if created:
            print(f"Created department: {name}")

    print("\n--- GENERATING EMPLOYEES ---")
    users = User.objects.filter(company=company)
    
    for u in users:
        # Determine department and designation based on role
        if u.role == 'admin':
            dept = departments['EXEC']
            designation = 'Chief Executive Officer'
        elif u.role == 'manager':
            dept = departments['EXEC']
            designation = 'General Manager'
        elif u.role == 'finance':
            dept = departments['FIN']
            designation = 'Finance Officer'
        elif u.role == 'sales':
            dept = departments['SALES']
            designation = 'Sales Executive'
        elif u.role == 'hr_manager':
            dept = departments['HR']
            designation = 'HR Manager'
        elif u.role == 'auditor':
            dept = departments['AUDIT']
            designation = 'Internal Auditor'
        else:
            dept = departments['OPS']
            designation = 'Operations Staff'

        # Generate a simple employee ID like EMP-1234
        emp_id = f"EMP-{u.id.hex[:4].upper()}"

        emp, created = Employee.objects.get_or_create(
            user=u,
            company=company,
            defaults={
                'employee_id': emp_id,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'email': u.email,
                'phone': '+15550009999',
                'department': dept,
                'designation': designation,
                'hire_date': timezone.now().date(),
                'salary': 50000.00
            }
        )
        if created:
            print(f"Created Employee: {emp.first_name} {emp.last_name} ({designation}) in {dept.name}")

if __name__ == '__main__':
    run()
