"""OUTLY backend settings. Everything environment-specific comes from env vars."""
import os
from datetime import timedelta
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv():
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()


def env(name, default=None):
    return os.environ.get(name, default)


def env_bool(name, default=False):
    return str(env(name, str(default))).lower() in ("1", "true", "yes", "on")


def env_int(name, default):
    """Integer from the environment; a missing, empty or malformed value falls back to `default`."""
    try:
        return int(env(name, str(default)))
    except (TypeError, ValueError):
        return default


def env_list(name, default=""):
    return [item.strip() for item in env(name, default).split(",") if item.strip()]


DEBUG = env_bool("DJANGO_DEBUG", False)
SECRET_KEY = env("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "dev-only-insecure-key-do-not-use-in-production-0123456789"
    else:
        raise RuntimeError("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false.")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "channels",
    "apps.common",
    "apps.accounts",
    "apps.profiles",
    "apps.follows",
    "apps.posts",
    "apps.places",
    "apps.activities",
    "apps.events",
    "apps.groups",
    "apps.partner",
    "apps.messaging",
    "apps.notifications",
    "apps.reviews",
    "apps.achievements",
    "apps.organizers",
    "apps.moderation",
    "apps.analytics",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# Database. Under ASGI (Daphne/Uvicorn - needed for WebSockets) Django serves each
# request on its own thread, so per-thread persistent connections (CONN_MAX_AGE)
# would pile up until Postgres refuses new clients. A psycopg connection pool
# shares a bounded set of connections instead (DB_POOL=false restores
# CONN_MAX_AGE for a classic sync-WSGI deployment).
DB_POOL = env_bool("DB_POOL", True)
DATABASES = {
    "default": dj_database_url.parse(
        env("DATABASE_URL", "postgres://outly:outly_dev_password@127.0.0.1:5433/outly"),
        conn_max_age=0 if DB_POOL else int(env("DB_CONN_MAX_AGE", "60")),
        conn_health_checks=not DB_POOL,
    )
}
if DB_POOL:
    DATABASES["default"].setdefault("OPTIONS", {})["pool"] = {
        "min_size": int(env("DB_POOL_MIN", "2")),
        "max_size": int(env("DB_POOL_MAX", "10")),
        "timeout": 10,
    }

AUTH_USER_MODEL = "accounts.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Argon2id first (OWASP's preferred algorithm, see config/hashers.py). PBKDF2 stays
# listed so existing hashes still verify; Django re-hashes them to Argon2id on login.
PASSWORD_HASHERS = [
    "config.hashers.OutlyArgon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = env("MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / env("MEDIA_ROOT", "media")
MEDIA_MAX_UPLOAD_BYTES = int(float(env("MEDIA_MAX_UPLOAD_MB", "5")) * 1024 * 1024)
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# Persistent media: Cloudinary is used only when all three variables are set; otherwise uploads
# stay on the local filesystem exactly as above.
CLOUDINARY_CLOUD_NAME = env("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = env("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = env("CLOUDINARY_API_SECRET", "")
USE_CLOUDINARY = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)
if USE_CLOUDINARY:
    STORAGES["default"] = {"BACKEND": "apps.common.storage.CloudinaryMediaStorage"}
# Public base URL of this API (e.g. https://api.example.com), used only to turn local media paths
# into full URLs where no request is available (WebSocket payloads). Empty = leave paths relative.
PUBLIC_API_URL = env("PUBLIC_API_URL", "").rstrip("/")

# ---- Cache / channel layer -------------------------------------------------
REDIS_URL = env("REDIS_URL", "")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "KEY_PREFIX": "outly",
        }
    }
    CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels_redis.core.RedisChannelLayer", "CONFIG": {"hosts": [REDIS_URL]}}
    }
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# ---- Django REST framework ---------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.ActiveJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["apps.common.renderers.EnvelopeRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.CursorPage",
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.common.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/min",
        "user": "600/min",
        "login": env("LOGIN_THROTTLE_RATE", "10/min"),
        "register": "10/hour",
        "password_reset": "5/hour",
        "verify_email": "20/hour",
        "post_write": "60/hour",
        "comment_write": "120/hour",
        "message_write": "120/min",
        "upload": "60/hour",
        "report_write": "30/hour",
    },
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
    # Number of reverse proxies in front of the app (Render = 1) so throttling sees the real client IP.
    "NUM_PROXIES": int(env("NUM_PROXIES", "1")),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "OUTLY API",
    "DESCRIPTION": "Outdoor Social Network & Adventure Platform API. "
    "Every response uses the envelope {success, message, data, errors, meta}.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
        "apps.common.schema.envelope_hook",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(env("JWT_ACCESS_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(env("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": SECRET_KEY,
}

# ---- CORS / security ---------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:3000")

if not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Email. Nothing configured -> the console backend (mail is printed to the terminal), exactly as before.
# Setting EMAIL_HOST (e.g. Brevo: smtp-relay.brevo.com, port 587, EMAIL_USE_TLS=true) switches to Django's
# SMTP backend, unless EMAIL_BACKEND names a backend explicitly. Credentials and the sender address come
# only from the environment; empty values count as "not set".
EMAIL_HOST = env("EMAIL_HOST") or "localhost"
EMAIL_BACKEND = env("EMAIL_BACKEND") or (
    "django.core.mail.backends.smtp.EmailBackend" if env("EMAIL_HOST") else "django.core.mail.backends.console.EmailBackend"
)
EMAIL_PORT = env_int("EMAIL_PORT", 25)
EMAIL_HOST_USER = env("EMAIL_HOST_USER") or ""
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD") or ""
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", False)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", False)
EMAIL_TIMEOUT = env_int("EMAIL_TIMEOUT", 10)  # seconds; a stuck SMTP server must not hang the request
if EMAIL_USE_TLS and EMAIL_USE_SSL:
    raise RuntimeError("EMAIL_USE_TLS and EMAIL_USE_SSL cannot both be enabled (use TLS on port 587, SSL on port 465).")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL") or "OUTLY <no-reply@outly.local>"

# ---- Product rules -------------------------------------------------------------
EVENTS_REQUIRE_MODERATION = env_bool("EVENTS_REQUIRE_MODERATION", False)

# ---- Logging (never log passwords or tokens) ---------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"std": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "std"}},
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
    "loggers": {
        "django.request": {"level": "WARNING"},
        "outly.audit": {"level": "INFO"},
        "outly.security": {"level": "INFO"},
    },
}
