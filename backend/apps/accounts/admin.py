"""Accounts app admin configuration."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Company, Permission, RolePermission, User, UserPermissionOverride


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'slug', 'email', 'subscription_plan',
        'active_user_count', 'max_users', 'is_active', 'created_at',
    ]
    list_filter = ['is_active', 'subscription_plan']
    search_fields = ['name', 'slug', 'email', 'domain']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'active_user_count', 'is_at_user_limit', 'created_at', 'updated_at']
    fieldsets = (
        (None, {'fields': ('id', 'name', 'slug', 'is_active')}),
        (_('Contact'), {'fields': ('email', 'phone', 'address', 'website', 'logo')}),
        (_('Routing'), {'fields': ('domain',)}),
        (_('Plan & Limits'), {'fields': ('subscription_plan', 'max_users', 'active_user_count', 'is_at_user_limit')}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'company', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'company']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['id', 'date_joined', 'last_login', 'full_name']

    fieldsets = (
        (None, {'fields': ('id', 'email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'full_name', 'phone', 'avatar')}),
        (_('Organisation'), {'fields': ('company', 'role')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Dates'), {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'company', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'module']
    list_filter = ['module']
    search_fields = ['code', 'name']
    ordering = ['module', 'code']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission']
    list_filter = ['role', 'permission__module']
    search_fields = ['permission__code']
    ordering = ['role', 'permission__code']


@admin.register(UserPermissionOverride)
class UserPermissionOverrideAdmin(admin.ModelAdmin):
    list_display = ['user', 'permission', 'granted', 'created_at']
    list_filter = ['granted', 'permission__module']
    search_fields = ['user__email', 'permission__code']
    ordering = ['-created_at']
