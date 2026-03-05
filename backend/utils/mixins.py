"""
CompanyQuerysetMixin — the single source of multi-tenant enforcement.

Every ViewSet in this project MUST inherit CompanyQuerysetMixin to guarantee
that no data leaks across company boundaries. The mixin:

1. Filters all querysets to the current request's company.
2. Auto-assigns company/created_by/updated_by on record creation.
3. Auto-assigns updated_by on record updates.
4. Raises 403 immediately if a request carries no company context.

Usage:
    class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):
        queryset = Product.objects.all()
        ...
"""
import logging

from rest_framework.exceptions import PermissionDenied
from rest_framework.viewsets import ModelViewSet

logger = logging.getLogger(__name__)


class CompanyQuerysetMixin:
    """
    Mixin that enforces company-scoped queryset filtering for all ViewSets.

    Safety contract:
    - If request.company is None → PermissionDenied (HTTP 403).
    - Every .get_queryset() call is filtered by request.company.
    - Every .perform_create() sets company, created_by, updated_by.
    - Every .perform_update() sets updated_by.
    """

    def get_company(self):
        """
        Resolve the current company from the request.
        Raises PermissionDenied if the request has no company context —
        this prevents silent data leakage via unfiltered querysets.
        """
        company = getattr(self.request, 'company', None)
        if company is None:
            logger.warning(
                'CompanyQuerysetMixin: No company on request for %s %s by user=%s',
                self.request.method,
                self.request.path,
                getattr(self.request.user, 'email', 'anonymous'),
            )
            raise PermissionDenied(
                detail='No company context found. Include the X-Company-ID header or ensure your user account is linked to a company.'
            )
        return company

    def get_queryset(self):
        """
        Returns the base queryset filtered to the current company.
        Superusers can optionally bypass isolation via ?all_companies=true,
        but only when DEBUG=True (never in production).
        """
        from django.conf import settings

        qs = super().get_queryset()

        # Superuser bypass only in development (for debugging/admin tasks)
        if (
            settings.DEBUG
            and getattr(self.request.user, 'is_superuser', False)
            and self.request.query_params.get('all_companies') == 'true'
        ):
            logger.warning('Superuser bypassing company filter — all_companies=true')
            return qs

        company = self.get_company()
        return qs.filter(company=company)

    def perform_create(self, serializer):
        """Auto-assign company and audit fields on record creation."""
        company = self.get_company()
        extra = {'company': company}

        # Set audit fields if the model has them
        user = self.request.user
        if user and user.is_authenticated:
            extra['created_by'] = user
            extra['updated_by'] = user

        serializer.save(**extra)

    def perform_update(self, serializer):
        """Auto-assign updated_by on record updates."""
        extra = {}
        user = self.request.user
        if user and user.is_authenticated:
            extra['updated_by'] = user
        serializer.save(**extra)
