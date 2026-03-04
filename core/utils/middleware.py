"""
CompanyMiddleware — resolves the current Company for every request.

Resolution order:
  1. X-Company-ID request header (explicit — useful for API clients / multi-company admins)
  2. Authenticated user's company (implicit — covers the common case)
  3. None → some endpoints will reject with 403 via CompanyQuerysetMixin

Sets:
  request.company  — the resolved Company model instance (or None)
"""
import logging

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class CompanyMiddleware(MiddlewareMixin):
    """
    Reads 'X-Company-ID' header and attaches the Company object to request.
    Falls back to the authenticated user's company if no header is present.
    """

    def process_request(self, request):
        request.company = None

        # Lazy import — avoids circular dependency at startup
        try:
            from apps.accounts.models import Company
        except ImportError:
            return

        # Priority 1: explicit header (e.g. from admin tool or multi-company client)
        company_id = request.headers.get('X-Company-ID')
        if company_id:
            try:
                request.company = Company.objects.select_related().get(
                    id=company_id, is_active=True
                )
                logger.debug('Company resolved from X-Company-ID header: %s', request.company)
                return
            except (Company.DoesNotExist, ValueError):
                logger.warning(
                    'Invalid or inactive X-Company-ID header value: %s', company_id
                )
                # Fall through to user-based resolution

        # Priority 2: authenticated user's linked company
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            request.company = getattr(user, 'company', None)
            if request.company:
                logger.debug('Company resolved from user account: %s', request.company)
