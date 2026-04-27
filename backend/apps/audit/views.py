"""Audit views — read-only, company-scoped."""
from rest_framework.viewsets import ReadOnlyModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, require_permission

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(CompanyQuerysetMixin, ReadOnlyModelViewSet):
    """
    Immutable audit trail — read-only, company-scoped.
    Requires 'can_view_audit_logs' permission (Manager, Auditor, Admin).
    Records can be viewed and filtered but never created, modified, or deleted via API.
    """
    queryset = AuditLog.objects.select_related('user', 'content_type').all()
    serializer_class = AuditLogSerializer
    permission_classes = [require_permission('can_view_audit_logs'), HasCompany]
    filterset_fields = ['user', 'action', 'content_type']
    search_fields = ['object_repr', 'user__email']
    ordering_fields = ['created_at']
