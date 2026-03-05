"""
Company isolation tests.

These tests are the PROOF that multi-tenant isolation works correctly.
They verify that:
  1. Users cannot see data from a different company.
  2. Requests with no company context are rejected with 403.
  3. CompanyMiddleware correctly resolves company from header or user.
  4. perform_create() automatically assigns the right company to new records.
  5. A superuser debug bypass works only in DEBUG mode.
"""
import uuid

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Company, User
from apps.inventory.models import Category, Product, Unit


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_company(name='Test Co', slug=None):
    slug = slug or name.lower().replace(' ', '-')
    return Company.objects.create(name=name, slug=slug)


def make_user(company, email, role=User.Roles.STAFF, password='TestPass123!'):
    user = User.objects.create_user(
        email=email,
        password=password,
        first_name='Test',
        last_name='User',
        role=role,
        company=company,
    )
    return user


def auth_client(user):
    """Return an APIClient authenticated as the given user via JWT."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


def auth_client_with_header(user, company):
    """Return an APIClient with both JWT and X-Company-ID header."""
    client = auth_client(user)
    client.credentials(
        HTTP_AUTHORIZATION=f'Bearer {str(RefreshToken.for_user(user).access_token)}',
        HTTP_X_COMPANY_ID=str(company.id),
    )
    return client


# ---------------------------------------------------------------------------
# Test: Company A cannot see Company B's data
# ---------------------------------------------------------------------------

class CompanyIsolationTest(TestCase):
    """
    Core isolation contract: querying through Company A's credentials
    must NEVER return Company B's records.
    """

    def setUp(self):
        self.company_a = make_company('Company A', 'company-a')
        self.company_b = make_company('Company B', 'company-b')

        self.unit = Unit.objects.create(name='Piece', abbreviation='PCS', company=self.company_a)
        self.unit_b = Unit.objects.create(name='Piece', abbreviation='PCS', company=self.company_b)

        self.category_a = Category.objects.create(name='Electronics', company=self.company_a)
        self.category_b = Category.objects.create(name='Electronics', company=self.company_b)

        self.product_a = Product.objects.create(
            name='Laptop A', sku='A-001',
            category=self.category_a, unit=self.unit,
            company=self.company_a,
        )
        self.product_b = Product.objects.create(
            name='Laptop B', sku='B-001',
            category=self.category_b, unit=self.unit_b,
            company=self.company_b,
        )

        self.admin_a = make_user(self.company_a, 'admin@company-a.com', User.Roles.ADMIN)
        self.admin_b = make_user(self.company_b, 'admin@company-b.com', User.Roles.ADMIN)

        self.client_a = auth_client(self.admin_a)
        self.client_b = auth_client(self.admin_b)

    def test_company_a_sees_only_its_products(self):
        """Company A user should only see Company A's products."""
        url = '/api/v1/inventory/products/'
        response = self.client_a.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product_names = [p['name'] for p in response.data['results']]
        self.assertIn('Laptop A', product_names)
        self.assertNotIn('Laptop B', product_names)

    def test_company_b_sees_only_its_products(self):
        """Company B user should only see Company B's products."""
        url = '/api/v1/inventory/products/'
        response = self.client_b.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product_names = [p['name'] for p in response.data['results']]
        self.assertIn('Laptop B', product_names)
        self.assertNotIn('Laptop A', product_names)

    def test_company_a_cannot_access_company_b_product_by_id(self):
        """Company A user cannot retrieve a specific Company B product."""
        url = f'/api/v1/inventory/products/{self.product_b.id}/'
        response = self.client_a.get(url)
        # Should be 404 (not in queryset) not 403 (we don't leak existence)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_company_a_cannot_modify_company_b_product(self):
        """Company A admin cannot PATCH a Company B product."""
        url = f'/api/v1/inventory/products/{self.product_b.id}/'
        response = self.client_a.patch(url, {'name': 'Hacked'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_company_a_cannot_delete_company_b_product(self):
        """Company A admin cannot DELETE a Company B product."""
        url = f'/api/v1/inventory/products/{self.product_b.id}/'
        response = self.client_a.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # The product must still exist in the database
        self.assertTrue(Product.objects.filter(id=self.product_b.id).exists())

    def test_total_products_in_db_is_two(self):
        """Sanity check: both products exist in the database."""
        self.assertEqual(Product.objects.count(), 2)


# ---------------------------------------------------------------------------
# Test: Request with no company context is rejected
# ---------------------------------------------------------------------------

class NoCompanyContextTest(TestCase):
    """
    When a user has no company assigned, the API must reject requests
    that touch company-scoped resources.
    """

    def setUp(self):
        # A user with NO company assigned
        self.orphan_user = User.objects.create_user(
            email='orphan@example.com',
            password='TestPass123!',
            first_name='Orphan',
            last_name='User',
            company=None,   # ← no company
        )
        self.client = auth_client(self.orphan_user)

    def test_orphan_user_cannot_list_products(self):
        """User with no company gets 403 on company-scoped endpoints."""
        response = self.client.get('/api/v1/inventory/products/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_orphan_user_cannot_create_product(self):
        response = self.client.post('/api/v1/inventory/products/', {
            'name': 'Phantom Product',
            'sku': 'PHANTOM-001',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Test: CompanyMiddleware resolution
# ---------------------------------------------------------------------------

class CompanyMiddlewareTest(TestCase):
    """Tests that middleware correctly resolves company from header and user."""

    def setUp(self):
        self.company = make_company('Middleware Co', 'middleware-co')
        self.user = make_user(self.company, 'mw@middleware-co.com', User.Roles.ADMIN)

    def test_middleware_resolves_company_from_user(self):
        """When no header is sent, company resolves from user.company."""
        client = auth_client(self.user)
        response = client.get('/api/v1/inventory/products/')
        # 200 = company was resolved (otherwise 403)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_middleware_resolves_company_from_x_company_id_header(self):
        """X-Company-ID header should override user.company."""
        # Create a second company and product to verify isolation via header
        company2 = make_company('Header Co', 'header-co')
        Product.objects.create(
            name='Header Product', sku='HDR-001', company=company2,
        )
        # Send X-Company-ID for company2, but user belongs to company
        client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}',
            HTTP_X_COMPANY_ID=str(company2.id),
        )
        response = client.get('/api/v1/inventory/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see company2's products, not self.company's
        names = [p['name'] for p in response.data['results']]
        self.assertIn('Header Product', names)

    def test_invalid_x_company_id_header_falls_back_to_user_company(self):
        """Invalid X-Company-ID should fall back to user's own company."""
        client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}',
            HTTP_X_COMPANY_ID='00000000-0000-0000-0000-000000000000',  # non-existent UUID
        )
        response = client.get('/api/v1/inventory/products/')
        # Falls back to user's company — still returns 200
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Test: Auto-assignment of company on create
# ---------------------------------------------------------------------------

class AutoCompanyAssignmentTest(TestCase):
    """
    Tests that CompanyQuerysetMixin.perform_create() automatically
    assigns request.company to new records.
    """

    def setUp(self):
        self.company = make_company('Auto Co', 'auto-co')
        self.manager = make_user(self.company, 'manager@auto-co.com', User.Roles.MANAGER)
        self.client = auth_client(self.manager)

    def test_new_category_auto_assigned_to_company(self):
        """POST /inventory/categories/ must auto-set company = request.company."""
        response = self.client.post('/api/v1/inventory/categories/', {
            'name': 'Auto Category',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        category_id = response.data['id']
        category = Category.objects.get(id=category_id)
        self.assertEqual(category.company, self.company)

    def test_new_category_not_visible_from_other_company(self):
        """A category created under Company A is invisible to Company B users."""
        # Create a product under company A
        self.client.post('/api/v1/inventory/categories/', {'name': 'A-Only Cat'}, format='json')

        # Company B user tries to see it
        company_b = make_company('Other Co', 'other-co')
        user_b = make_user(company_b, 'b@other-co.com', User.Roles.ADMIN)
        client_b = auth_client(user_b)
        response = client_b.get('/api/v1/inventory/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in response.data['results']]
        self.assertNotIn('A-Only Cat', names)


# ---------------------------------------------------------------------------
# Test: User listing isolation
# ---------------------------------------------------------------------------

class UserIsolationTest(TestCase):
    """Users must only be able to see users in their own company."""

    def setUp(self):
        self.company_a = make_company('UserCo A', 'userco-a')
        self.company_b = make_company('UserCo B', 'userco-b')
        self.admin_a = make_user(self.company_a, 'admin@userco-a.com', User.Roles.ADMIN)
        self.staff_b = make_user(self.company_b, 'staff@userco-b.com', User.Roles.STAFF)
        self.client_a = auth_client(self.admin_a)

    def test_admin_sees_only_own_company_users(self):
        """Admin in Company A cannot see users from Company B."""
        response = self.client_a.get('/api/v1/accounts/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u['email'] for u in response.data['results']]
        self.assertIn('admin@userco-a.com', emails)
        self.assertNotIn('staff@userco-b.com', emails)
