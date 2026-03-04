"""Development Settings."""
from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ['*']

# Allow all CORS origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Show emails in console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Django Debug Toolbar (optional, install separately)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']

# Disable caching in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Verbose DRF errors in development
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (  # noqa
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)
