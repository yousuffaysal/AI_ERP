"""
accounts/models.py

Defines:
  - Company: the top-level multi-tenant entity (replaces Tenant)
  - User: custom user model linked to a Company, with role-based access
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class Company(models.Model):
    """
    Represents an organisational unit / business entity.

    Every piece of business data (products, orders, employees, etc.) is
    linked to exactly one Company — this is the foundation of multi-tenancy.
    """

    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', _('Free')
        STARTER = 'starter', _('Starter')
        PROFESSIONAL = 'professional', _('Professional')
        ENTERPRISE = 'enterprise', _('Enterprise')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('company name'), max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)

    # Contact / identity
    email = models.EmailField(_('company email'), blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)

    # Routing / isolation
    domain = models.CharField(
        max_length=255, blank=True, null=True, unique=True,
        help_text='Custom domain for this company (e.g. acme.app.io)'
    )

    # Plan & limits
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.FREE,
    )
    max_users = models.PositiveIntegerField(
        default=5,
        help_text='Maximum number of active users allowed for this company'
    )

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


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model.
    - Email-based authentication (not username)
    - Role-based access control: Admin / Manager / Staff
    - Scoped to exactly one Company
    """

    class Roles(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        MANAGER = 'manager', _('Manager')
        STAFF = 'staff', _('Staff')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Multi-tenant link — the most important FK in the project
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        verbose_name=_('Company'),
        db_index=True,
    )

    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=Roles.choices,
        default=Roles.STAFF,
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

    @property
    def is_admin(self):
        return self.role == self.Roles.ADMIN

    @property
    def is_manager(self):
        return self.role == self.Roles.MANAGER

    @property
    def is_staff_member(self):
        return self.role == self.Roles.STAFF
