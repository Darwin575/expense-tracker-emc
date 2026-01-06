from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    list_display = ['email', 'get_full_name', 'is_active', 'is_staff', 'requested_credential_reset', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'requested_credential_reset', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Account Status'), {
            'fields': ('requested_credential_reset',),
            'description': _('Check this box if user requested credential reset. Uncheck after resetting credentials.'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    def get_full_name(self, obj):
        """Display full name"""
        full_name = obj.get_full_name()
        return full_name if full_name else obj.email
    get_full_name.short_description = 'Name'