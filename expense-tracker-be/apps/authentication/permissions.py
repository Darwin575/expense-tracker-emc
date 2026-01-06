from rest_framework.permissions import BasePermission



class IsAdmin(BasePermission):
    """
    Allows access only to admin users (is_staff and is_superuser).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_staff and
            request.user.is_superuser
        )


class IsAuthenticated(BasePermission):
    """
    Allows access only to authenticated users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
