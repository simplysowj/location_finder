# myapp/admin.py

from django.contrib import admin
from .models import User, Image, Location
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_super_admin', 'is_admin', 'is_user')
    list_filter = ('is_super_admin', 'is_admin', 'is_user')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_super_admin', 'is_admin', 'is_user', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    # Restrict access based on roles
    def has_delete_permission(self, request, obj=None):
        # Only Super Admin can delete
        return request.user.is_super_admin

    def has_change_permission(self, request, obj=None):
        # Super Admin and Admin can edit
        return request.user.is_super_admin or request.user.is_admin

    def has_view_permission(self, request, obj=None):
        # All users can view
        return True

#admin.site.register(User)
admin.site.register(Image)
admin.site.register(Location)
admin.site.register(User, UserAdmin)