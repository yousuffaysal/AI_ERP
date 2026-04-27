"""
Management command: seed_rbac

Creates all 20 ERP permissions, assigns them to roles by default,
and creates one test user per role linked to the first active Company.

Usage:
    python manage.py seed_rbac
    python manage.py seed_rbac --reset   # wipe & recreate everything
"""
from django.core.management.base import BaseCommand
from django.db import transaction


# ---------------------------------------------------------------------------
# Master permission list: (code, name, module, description)
# ---------------------------------------------------------------------------
PERMISSIONS = [
    # Accounts
    ('can_manage_users',    'Manage Users',    'accounts', 'Create, edit, activate/deactivate, and change roles of users'),
    ('can_manage_company',  'Manage Company',  'accounts', 'Edit company settings, plan, and domain'),
    # Finance
    ('can_approve_expenses',  'Approve Expenses',   'finance', 'Approve or reject employee expense claims'),
    ('can_mark_expense_paid', 'Mark Expense Paid',  'finance', 'Mark approved expenses as paid'),
    ('can_manage_accounts',   'Manage Accounts',    'finance', 'Create and edit chart of accounts'),
    ('can_manage_budgets',    'Manage Budgets',     'finance', 'Create and edit budgets per account/period'),
    # Sales
    ('can_confirm_orders',    'Confirm Orders',     'sales', 'Confirm draft sales orders'),
    ('can_ship_orders',       'Ship Orders',        'sales', 'Process, ship, and deliver confirmed orders'),
    ('can_confirm_invoices',  'Confirm Invoices',   'sales', 'Confirm draft invoices (auto-deducts stock)'),
    ('can_record_payments',   'Record Payments',    'sales', 'Record payments against invoices'),
    ('can_void_invoices',     'Void Invoices',      'sales', 'Void confirmed or partial invoices'),
    # Inventory
    ('can_manage_products',   'Manage Products',    'inventory', 'Create and edit products and categories'),
    ('can_manage_stock',      'Manage Stock',       'inventory', 'Record stock movements (IN, OUT, TRANSFER, etc.)'),
    ('can_manage_suppliers',  'Manage Suppliers',   'inventory', 'Create and edit suppliers and pricing'),
    ('can_manage_warehouses', 'Manage Warehouses',  'inventory', 'Create and edit warehouse locations'),
    # HR
    ('can_manage_employees',  'Manage Employees',   'hr', 'Create and edit employee records and departments'),
    ('can_approve_leave',     'Approve Leave',      'hr', 'Approve or reject employee leave requests'),
    # Audit
    ('can_view_audit_logs',   'View Audit Logs',    'audit', 'Read the immutable system audit trail'),
    # Reports
    ('can_generate_reports',  'Generate Reports',   'reports', 'Generate and schedule Excel/PDF reports'),
    # AI
    ('can_use_ai_features',   'Use AI Features',    'ai', 'Access AI demand forecast and price optimization'),
]

# ---------------------------------------------------------------------------
# Default role → permission mapping
# ---------------------------------------------------------------------------
_ALL = [p[0] for p in PERMISSIONS]

ROLE_PERMISSIONS = {
    'admin': _ALL,
    'manager': [
        'can_approve_expenses', 'can_manage_accounts', 'can_manage_budgets',
        'can_confirm_orders', 'can_ship_orders', 'can_confirm_invoices',
        'can_record_payments', 'can_void_invoices',
        'can_manage_products', 'can_manage_stock', 'can_manage_suppliers', 'can_manage_warehouses',
        'can_manage_employees', 'can_approve_leave',
        'can_view_audit_logs', 'can_generate_reports', 'can_use_ai_features',
    ],
    'finance': [
        'can_approve_expenses', 'can_mark_expense_paid',
        'can_manage_accounts', 'can_manage_budgets',
        'can_confirm_invoices', 'can_record_payments', 'can_void_invoices',
        'can_generate_reports', 'can_use_ai_features',
    ],
    'sales': [
        'can_confirm_orders', 'can_ship_orders',
        'can_confirm_invoices',
        'can_generate_reports', 'can_use_ai_features',
    ],
    'hr_manager': [
        'can_manage_employees', 'can_approve_leave',
        'can_generate_reports',
    ],
    'auditor': [
        'can_view_audit_logs', 'can_generate_reports',
    ],
    'staff': [],  # view-only via IsAuthenticated endpoints
}

# ---------------------------------------------------------------------------
# Test users: one per role
# ---------------------------------------------------------------------------
TEST_USERS = [
    {
        'email': 'admin@erp.io',
        'password': 'Admin@12345!',
        'role': 'admin',
        'first_name': 'Super',
        'last_name': 'Admin',
        'is_superuser': True,
        'is_staff': True,
    },
    {
        'email': 'manager@erp.io',
        'password': 'Manager@12345!',
        'role': 'manager',
        'first_name': 'General',
        'last_name': 'Manager',
    },
    {
        'email': 'finance@erp.io',
        'password': 'Finance@12345!',
        'role': 'finance',
        'first_name': 'Finance',
        'last_name': 'Officer',
    },
    {
        'email': 'sales@erp.io',
        'password': 'Sales@12345!',
        'role': 'sales',
        'first_name': 'Sales',
        'last_name': 'Executive',
    },
    {
        'email': 'hr@erp.io',
        'password': 'HrManager@12345!',
        'role': 'hr_manager',
        'first_name': 'HR',
        'last_name': 'Manager',
    },
    {
        'email': 'auditor@erp.io',
        'password': 'Auditor@12345!',
        'role': 'auditor',
        'first_name': 'System',
        'last_name': 'Auditor',
    },
    {
        'email': 'staff@erp.io',
        'password': 'Staff@12345!',
        'role': 'staff',
        'first_name': 'General',
        'last_name': 'Staff',
    },
]


class Command(BaseCommand):
    help = 'Seed ERP permissions, role-permission mappings, and one test user per role.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing permissions and role-permission records before seeding.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.accounts.models import Company, Permission, RolePermission, User

        if options['reset']:
            self.stdout.write(self.style.WARNING('--reset: clearing permissions and role-permissions…'))
            RolePermission.objects.all().delete()
            Permission.objects.all().delete()

        # 1. Create / update Permission records
        self.stdout.write('Creating permissions…')
        perm_map = {}
        for code, name, module, desc in PERMISSIONS:
            obj, created = Permission.objects.update_or_create(
                code=code,
                defaults={'name': name, 'module': module, 'description': desc},
            )
            perm_map[code] = obj
            status = '  [NEW]' if created else '  [OK] '
            self.stdout.write(f'{status} {code}')

        # 2. Create / update RolePermission records
        self.stdout.write('\nAssigning permissions to roles…')
        for role, codes in ROLE_PERMISSIONS.items():
            for code in codes:
                RolePermission.objects.get_or_create(
                    role=role,
                    permission=perm_map[code],
                )
            self.stdout.write(f'  {role}: {len(codes)} permissions')

        # 3. Get the first active company to link test users to
        company = Company.objects.filter(is_active=True).first()
        if not company:
            self.stdout.write(self.style.WARNING(
                '\nNo active company found — test users will be created without a company link.'
            ))

        # 4. Create test users
        self.stdout.write('\nCreating test users…')
        for data in TEST_USERS:
            email = data['email']
            existing = User.objects.filter(email=email).first()
            if existing:
                self.stdout.write(f'  [SKIP] {email} already exists (role: {existing.role})')
                continue

            user = User.objects.create_user(
                email=email,
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role=data['role'],
                company=company,
                is_superuser=data.get('is_superuser', False),
                is_staff=data.get('is_staff', False),
            )
            self.stdout.write(
                self.style.SUCCESS(f'  [NEW] {email} | role: {user.role} | company: {company}')
            )

        self.stdout.write(self.style.SUCCESS('\n✅ RBAC seed complete.'))
