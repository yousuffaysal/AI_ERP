"""Shared permission classes and factory for role-based and RBAC access control."""
from rest_framework.permissions import BasePermission

from apps.accounts.models import User


# ---------------------------------------------------------------------------
# Legacy role-level classes (kept for backward compat)
# ---------------------------------------------------------------------------

class IsAdmin(BasePermission):
    """Allow access only to Admin role users."""
    message = 'Only admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Roles.ADMIN
        )


class IsManager(BasePermission):
    """Allow access to Admin or Manager role users."""
    message = 'Only managers or admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in (User.Roles.ADMIN, User.Roles.MANAGER)
        )


class IsStaff(BasePermission):
    """Allow access to any authenticated staff member."""
    message = 'Only authenticated staff members can perform this action.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class HasCompany(BasePermission):
    """Reject any request that has no resolved company context."""
    message = (
        'No company context found. Ensure your account is linked to a company '
        'or provide the X-Company-ID header.'
    )

    def has_permission(self, request, view):
        company = getattr(request, 'company', None)
        if not company and getattr(request, 'user', None) and request.user.is_authenticated:
            company = getattr(request.user, 'company', None)
            request.company = company
        return company is not None


class IsSameCompany(BasePermission):
    """Object-level: the record's company must match the request's company."""
    message = 'You do not have permission to access data from a different company.'

    def has_object_permission(self, request, view, obj):
        request_company = getattr(request, 'company', None)
        if not request_company and getattr(request, 'user', None) and request.user.is_authenticated:
            request_company = getattr(request.user, 'company', None)
            request.company = request_company
        obj_company = getattr(obj, 'company', None)
        if request_company is None or obj_company is None:
            return False
        return request_company.id == obj_company.id


# ---------------------------------------------------------------------------
# RBAC — granular permission factory (Option B)
# ---------------------------------------------------------------------------

def require_permission(code: str):
    """
    Factory that returns a DRF-compatible permission class requiring a
    specific ERP permission code.

    Usage in views:
        permission_classes = [require_permission('can_approve_expenses'), HasCompany]

    The returned class is a proper DRF BasePermission subclass that Django REST
    Framework can instantiate normally (no args needed at instantiation time,
    because the code is baked in at class-creation time).
    """
    class _HasPermission(BasePermission):
        _code = code
        message = f'Permission required: "{code}". Your role does not have this access.'

        def has_permission(self, request, view):
            return bool(
                request.user
                and request.user.is_authenticated
                and request.user.has_erp_permission(self._code)
            )

    _HasPermission.__name__ = f'HasPermission[{code}]'
    _HasPermission.__qualname__ = f'HasPermission[{code}]'
    return _HasPermission
