"""
accounts/models.py

Defines:
  - Company: top-level multi-tenant entity
  - User: custom user model with 7-role RBAC
  - Permission: an ERP-level permission code (e.g. 'can_approve_expenses')
  - RolePermission: default role → permission grants
  - UserPermissionOverride: per-user grant/revoke that overrides role defaults
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


# ---------------------------------------------------------------------------
# Company (Tenant)
# ---------------------------------------------------------------------------

class Company(models.Model):
    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', _('Free')
        STARTER = 'starter', _('Starter')
        PROFESSIONAL = 'professional', _('Professional')
        ENTERPRISE = 'enterprise', _('Enterprise')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('company name'), max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)

    email = models.EmailField(_('company email'), blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)

    domain = models.CharField(
        max_length=255, blank=True, null=True, unique=True,
        help_text='Custom domain for this company (e.g. acme.app.io)'
    )
    subscription_plan = models.CharField(
        max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.FREE,
    )
    max_users = models.PositiveIntegerField(default=5)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name = _('Company')
        verbose_name_plural = _('Companies')
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def active_user_count(self):
        return self.users.filter(is_active=True).count()

    @property
    def is_at_user_limit(self):
        return self.active_user_count >= self.max_users


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model with 7 roles and granular RBAC via has_erp_permission().
    """

    class Roles(models.TextChoices):
        ADMIN      = 'admin',      _('Admin')
        MANAGER    = 'manager',    _('Manager')
        FINANCE    = 'finance',    _('Finance')
        SALES      = 'sales',      _('Sales')
        HR_MANAGER = 'hr_manager', _('HR Manager')
        AUDITOR    = 'auditor',    _('Auditor')
        STAFF      = 'staff',      _('Staff')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name='users',
        null=True, blank=True, verbose_name=_('Company'), db_index=True,
    )

    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    role = models.CharField(
        _('role'), max_length=20, choices=Roles.choices, default=Roles.STAFF,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    last_login = models.DateTimeField(_('last login'), blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    # ------------------------------------------------------------------
    # Legacy role helpers (kept for backward compat)
    # ------------------------------------------------------------------
    @property
    def is_admin(self):
        return self.role == self.Roles.ADMIN

    @property
    def is_manager(self):
        return self.role in (self.Roles.ADMIN, self.Roles.MANAGER)

    @property
    def is_staff_member(self):
        return self.role == self.Roles.STAFF

    # ------------------------------------------------------------------
    # RBAC — granular permission check
    # ------------------------------------------------------------------
    def has_erp_permission(self, code: str) -> bool:
        """
        Returns True if the user has the given ERP permission code.

        Resolution order:
          1. Inactive users → always False
          2. Superusers → always True
          3. UserPermissionOverride for this user (grant or revoke)
          4. RolePermission default for this user's role
        """
        if not self.is_active:
            return False
        if self.is_superuser:
            return True

        # Per-user override (grant or revoke)
        try:
            override = self.permission_overrides.filter(permission__code=code).first()
            if override is not None:
                return override.granted
        except Exception:
            pass

        # Default role permission
        return RolePermission.objects.filter(
            role=self.role,
            permission__code=code,
        ).exists()


# ---------------------------------------------------------------------------
# Permission  (ERP-level permission code)
# ---------------------------------------------------------------------------

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    module = models.CharField(
        max_length=50, blank=True,
        help_text='ERP module this permission belongs to (accounts, finance, sales, …)',
    )

    class Meta:
        db_table = 'erp_permissions'
        ordering = ['module', 'code']
        verbose_name = _('Permission')
        verbose_name_plural = _('Permissions')

    def __str__(self):
        return self.code


# ---------------------------------------------------------------------------
# RolePermission  (default role → permission mapping)
# ---------------------------------------------------------------------------

class RolePermission(models.Model):
    role = models.CharField(
        max_length=20, choices=User.Roles.choices, db_index=True,
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name='role_permissions',
    )

    class Meta:
        db_table = 'role_permissions'
        unique_together = ['role', 'permission']
        verbose_name = _('Role Permission')
        verbose_name_plural = _('Role Permissions')

    def __str__(self):
        return f'{self.role} → {self.permission.code}'


# ---------------------------------------------------------------------------
# UserPermissionOverride  (per-user grant or revoke)
# ---------------------------------------------------------------------------

class UserPermissionOverride(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='permission_overrides',
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name='user_overrides',
    )
    granted = models.BooleanField(
        default=True,
        help_text='True = grant this permission to the user; False = revoke it even if their role has it',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_permission_overrides'
        unique_together = ['user', 'permission']
        verbose_name = _('User Permission Override')
        verbose_name_plural = _('User Permission Overrides')

    def __str__(self):
        action = 'GRANT' if self.granted else 'REVOKE'
        return f'{action}: {self.user.email} → {self.permission.code}'
