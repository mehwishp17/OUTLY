from drf_spectacular.extensions import OpenApiAuthenticationExtension


class ActiveJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Declares the bearer-JWT scheme so Swagger UI's Authorize button works."""

    target_class = "apps.accounts.authentication.ActiveJWTAuthentication"
    name = "jwtAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
