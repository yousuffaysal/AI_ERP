"""Audit app middleware — auto-log every mutating API request."""
import logging

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

LOGGED_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}


class AuditLogMiddleware(MiddlewareMixin):
    """
    Automatically creates an AuditLog entry for every mutating API request.

    Captures: user, action, path, request body, IP address, user-agent,
    response status code, and the resolved company.
    """

    def process_response(self, request, response):
        if request.method not in LOGGED_METHODS:
            return response

        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return response

        if not request.path.startswith('/api/'):
            return response

        action_map = {
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        action = action_map.get(request.method, 'update')

        try:
            from apps.audit.models import AuditLog

            # Safely parse request body
            body = {}
            if hasattr(request, 'data') and isinstance(request.data, dict):
                # Scrub sensitive fields before logging
                body = {
                    k: '***' if k.lower() in ('password', 'token', 'secret', 'key') else v
                    for k, v in request.data.items()
                }

            AuditLog.objects.create(
                user=user,
                action=action,
                object_repr=request.path,
                changes=body,
                ip_address=_get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                extra={
                    'status_code': response.status_code,
                    'method': request.method,
                    'company_id': str(request.company.id) if getattr(request, 'company', None) else None,
                },
            )
        except Exception as exc:
            # Audit failures must never break the actual request
            logger.warning('AuditLogMiddleware: failed to write audit log — %s', exc)

        return response


def _get_client_ip(request):
    """Extract real client IP, respecting X-Forwarded-For from proxies."""
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
