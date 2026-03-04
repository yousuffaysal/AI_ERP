"""Base abstract models for all apps."""
import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Abstract model providing created_at and updated_at fields."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class UUIDModel(models.Model):
    """Abstract model using UUID as primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class AuditableModel(TimeStampedModel):
    """Abstract model tracking who created and last updated the record."""

    created_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_created',
        editable=False,
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_updated',
        editable=False,
    )

    class Meta:
        abstract = True


class CompanyModel(AuditableModel):
    """
    Abstract model that isolates records to a specific Company.
    Every business model must inherit from this to participate in
    multi-tenant data isolation.
    """

    company = models.ForeignKey(
        'accounts.Company',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        null=True,
        blank=True,
        db_index=True,
    )

    class Meta:
        abstract = True


class BaseModel(UUIDModel, CompanyModel):
    """
    Full-featured base model combining:
    - UUID primary key
    - Company isolation (multi-tenant)
    - Audit fields (created_by, updated_by, timestamps)
    """

    class Meta:
        abstract = True
