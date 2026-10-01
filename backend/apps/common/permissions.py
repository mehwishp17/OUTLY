from rest_framework.permissions import SAFE_METHODS, BasePermission

# Roles (users.role). Authorization is always evaluated server-side.
USER = "USER"
GROUP_MODERATOR = "GROUP_MODERATOR"
ORGANIZER = "ORGANIZER"
CONTENT_MODERATOR = "CONTENT_MODERATOR"
ADMINISTRATOR = "ADMINISTRATOR"

STAFF_ROLES = (CONTENT_MODERATOR, ADMINISTRATOR)


def has_role(user, *roles):
    return bool(user and user.is_authenticated and user.role in roles)


def is_staff_user(user):
    return has_role(user, *STAFF_ROLES)


class IsAdministrator(BasePermission):
    message = "Administrator access required."

    def has_permission(self, request, view):
        return has_role(request.user, ADMINISTRATOR)


class IsModeratorOrAdmin(BasePermission):
    message = "Moderator access required."

    def has_permission(self, request, view):
        return has_role(request.user, *STAFF_ROLES)


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: writes only by `owner_field` (default `author`)."""

    owner_field = "author"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return getattr(obj, f"{self.owner_field}_id", None) == request.user.id
