"""Serializers for accounts app."""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Company

User = get_user_model()


# ---------------------------------------------------------------------------
# Company Serializers
# ---------------------------------------------------------------------------

class CompanySerializer(serializers.ModelSerializer):
    """Full serializer for Company model (admin use)."""
    active_user_count = serializers.IntegerField(read_only=True)
    is_at_user_limit = serializers.BooleanField(read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'email', 'phone', 'address', 'website',
            'logo', 'domain', 'subscription_plan', 'max_users',
            'active_user_count', 'is_at_user_limit', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'active_user_count', 'is_at_user_limit']


class CompanyMiniSerializer(serializers.ModelSerializer):
    """Compact company representation embedded in other serializers."""
    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'subscription_plan']


# ---------------------------------------------------------------------------
# User Serializers
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Read serializer for User — includes computed and nested fields."""
    full_name = serializers.CharField(read_only=True)
    company_detail = CompanyMiniSerializer(source='company', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'avatar',
            'company', 'company_detail',
            'is_active', 'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    """Write serializer for creating a new User."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name',
            'password', 'password_confirm',
            'role', 'phone', 'company',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def validate_company(self, company):
        """Prevent creating a user for an inactive company."""
        if company and not company.is_active:
            raise serializers.ValidationError('Cannot add users to an inactive company.')
        return company

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Partial-update serializer — users can only change personal info, not role or company."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        return attrs


# ---------------------------------------------------------------------------
# JWT Serializer
# ---------------------------------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extended JWT payload — embeds user metadata so the frontend
    never needs an extra /me call just to determine role or company.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Business claims embedded into the token
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['company_id'] = str(user.company.id) if user.company else None
        token['company_name'] = user.company.name if user.company else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Also return the full user profile alongside the tokens
        data['user'] = UserSerializer(self.user).data
        return data
