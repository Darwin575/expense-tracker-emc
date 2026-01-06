"""
Django settings for expense manager project.
"""

from pathlib import Path
from decouple import config
import os
import socket

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = [
    '*'
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Local apps
    'apps.authentication',
    'apps.expenses',
    'apps.users.apps.UsersConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# PostgreSQL config (for production):
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default=config('POSTGRES_DB', default='expense_manager')),
        'USER': config('DB_USER', default=config('POSTGRES_USER', default='postgres')),
        'PASSWORD': config('DB_PASSWORD', default=config('POSTGRES_PASSWORD', default='postgres')),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5433'),
    }
}

# Smart Docker Host Resolution
# If running in Docker (often indicated by /.dockerenv or env vars)
# and DB_HOST is "localhost" (default) or "db" (maybe not resolving)
# if os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER'):
#     current_host = DATABASES['default']['HOST']
    
#     # List of candidates to try if current one fails or just to be robust
#     # We prioritize what is in env, then standard names
#     candidates = []
#     if current_host not in ['localhost', '127.0.0.1']:
#         candidates.append(current_host)
    
#     candidates.extend([
        
#         '192.168.20.162'  # Fallback Staging DB
#     ])
    
#     # Try to resolve each until one works
#     final_host = current_host
#     for candidate in candidates:
#         try:
#             # Just try to resolve DNS, not full connection yet (faster)
#             socket.gethostbyname(candidate)
#             final_host = candidate
#             print(f"✅ [Settings] Resolved DB host: {final_host}")
#             break
#         except socket.error:
#              print(f"⚠️ [Settings] Could not resolve host: {candidate}")
#              continue
    
#     DATABASES['default']['HOST'] = final_host
#     DATABASES['default']['PORT'] = '5432' # Default internal Docker port

#     # STAGING CREDENTIAL FIX (DevOps Bypass)
#     # The staging Jenkins pipeline is not injecting env vars (no --env-file).
#     # If we detected the staging IP (by resolving whatever hostname worked),
#     # and the user is still default 'postgres', we MUST manually set the correct credentials.
#     try:
#         # Resolve the final host to an IP to be sure
#         resolved_ip = socket.gethostbyname(final_host)
#         print(f"✅ [Settings] Resolved IP for '{final_host}': {resolved_ip}")
        
#         # Check against Staging IP
#         if resolved_ip == '192.168.20.162':
#             current_user = DATABASES['default']['USER']
#             print(f"ℹ️ [Settings] Staging IP match. Current User: '{current_user}'")
            
#             # If user is missing, None, empty, or default 'postgres', FORCE override
#             if not current_user or current_user == 'postgres':
#                 print(f"⚠️ [Settings] Auto-fixing user to 'postgres_b' for Staging.")
#                 DATABASES['default']['USER'] = 'postgres_b'
#                 DATABASES['default']['PASSWORD'] = 'password'
#     except Exception as e:
#         print(f"⚠️ [Settings] Failed to resolve/check staging IP: {e}")


# SQLite config (for local testing without Docker):
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    # Throttling (Rate Limiting)
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS settings
# CORS_ALLOWED_ORIGINS = config(
#     'CORS_ALLOWED_ORIGINS',
#     default='http://localhost:3000,http://127.0.0.1:3000'
# ).split(',')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.20.159:3000",
    "http://192.168.20.40:3000",
]

# NUCLEAR OPTION: Allow all origins and trusted origins
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    'http://192.168.20.159:8000', 
    'http://192.168.20.159:3000', 
    'http://192.168.20.158:3000',  # Frontend Server
    'http://localhost:3000', 
    'http://localhost:8000',
    'http://192.168.20.40:3000',
    'http://192.168.20.40:8000',
]
