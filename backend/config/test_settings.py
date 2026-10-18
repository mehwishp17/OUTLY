from .settings import *  # noqa: F401,F403

DEBUG = False
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
ALLOWED_HOSTS = ["testserver", "localhost"]
# Tests use plain connections (the pool is for the running server).
DATABASES["default"].pop("OPTIONS", None)  # noqa: F405
DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # test speed only; production uses Argon2id
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {k: "100000/min" for k in REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]},  # noqa: F405
}
MEDIA_ROOT = BASE_DIR / "media_test"  # noqa: F405
# Never talk to Cloudinary from tests, even if real credentials are present in backend/.env.
USE_CLOUDINARY = False
STORAGES = {**STORAGES, "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}}  # noqa: F405
CLOUDINARY_CLOUD_NAME = CLOUDINARY_API_KEY = CLOUDINARY_API_SECRET = ""
PUBLIC_API_URL = ""
