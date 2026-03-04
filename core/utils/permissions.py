"""Shared permission classes for role-based and company-scoped access control."""
from rest_framework.permissions import BasePermission

from apps.accounts.models import User


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
    """
    Reject any request that has no resolved company context.
    Use this on ViewSets that handle public-facing or cross-company operations
    where you want an explicit 403 before reaching the queryset layer.

    Note: CompanyQuerysetMixin already raises PermissionDenied if company is None,
    so this is optional but useful as early-exit for clarity.
    """
    message = 'No company context found. Ensure your account is linked to a company or provide the X-Company-ID header.'

    def has_permission(self, request, view):
        return getattr(request, 'company', None) is not None


class IsSameCompany(BasePermission):
    """
    Object-level permission: the record's company must match the request's company.

    Use this alongside CompanyQuerysetMixin for extra defence-in-depth on
    retrieve/update/delete operations.
    """
    message = 'You do not have permission to access data from a different company.'

    def has_object_permission(self, request, view, obj):
        request_company = getattr(request, 'company', None)
        obj_company = getattr(obj, 'company', None)

        if request_company is None or obj_company is None:
            return False

        return request_company.id == obj_company.id
