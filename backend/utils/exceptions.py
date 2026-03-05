"""Custom exception handler for consistent error responses."""
import logging

from django.core.exceptions import PermissionDenied, ValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Returns a consistent JSON error response:
    {
        "success": false,
        "status_code": 400,
        "error": "Brief error type",
        "message": "Human-readable message",
        "details": { ... }   # optional
    }
    """
    # Let DRF handle the initial exception
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'status_code': response.status_code,
            'error': _get_error_code(response.status_code),
            'message': _extract_message(response.data),
            'details': response.data if isinstance(response.data, dict) else None,
        }
        response.data = error_data
        return response

    # Handle Django exceptions not caught by DRF
    if isinstance(exc, Http404):
        return Response(
            {'success': False, 'status_code': 404, 'error': 'NOT_FOUND', 'message': 'Resource not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    if isinstance(exc, PermissionDenied):
        return Response(
            {'success': False, 'status_code': 403, 'error': 'FORBIDDEN', 'message': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    if isinstance(exc, ValidationError):
        return Response(
            {'success': False, 'status_code': 400, 'error': 'VALIDATION_ERROR', 'message': str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Unexpected errors
    logger.exception('Unhandled exception: %s', exc, exc_info=exc)
    return Response(
        {'success': False, 'status_code': 500, 'error': 'INTERNAL_ERROR', 'message': 'An unexpected error occurred.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _get_error_code(status_code: int) -> str:
    codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_ERROR',
    }
    return codes.get(status_code, 'ERROR')


def _extract_message(data) -> str:
    if isinstance(data, str):
        return data
    if isinstance(data, list) and data:
        return str(data[0])
    if isinstance(data, dict):
        for key in ('detail', 'message', 'non_field_errors'):
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
        # Return first field error
        first_val = next(iter(data.values()))
        return str(first_val[0]) if isinstance(first_val, list) else str(first_val)
    return 'An error occurred.'
