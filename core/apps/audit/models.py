"""Audit models: AuditLog for tracking all mutations."""
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.models import TimeStampedModel, UUIDModel


class AuditLog(UUIDModel, TimeStampedModel):
    """
    Immutable log entry recording who did what to which record.
    Linked to any model via GenericForeignKey.
    """

    class Action(models.TextChoices):
        CREATE = 'create', _('Create')
        UPDATE = 'update', _('Update')
        DELETE = 'delete', _('Delete')
        VIEW = 'view', _('View')
        LOGIN = 'login', _('Login')
        LOGOUT = 'logout', _('Logout')
        EXPORT = 'export', _('Export')

    user = models.ForeignKey(
        'accounts.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    extra = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'audit_logs'
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        user_email = self.user.email if self.user else 'anonymous'
        return f'[{self.created_at:%Y-%m-%d %H:%M}] {user_email} {self.action} {self.object_repr}'
