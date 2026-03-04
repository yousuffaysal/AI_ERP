"""Views for accounts app."""
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, IsAdmin, IsManager

from .models import Company
from .serializers import (
    ChangePasswordSerializer,
    CompanySerializer,
    CustomTokenObtainPairSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Authentication Views
# ---------------------------------------------------------------------------

class CustomTokenObtainPairView(TokenObtainPairView):
    """Login — returns access + refresh tokens with embedded user + company info."""
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Blacklist the refresh token to invalidate the session."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data['refresh'])
            token.blacklist()
            return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except KeyError:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the currently authenticated user's own profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    """Allow an authenticated user to change their own password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Incorrect password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Company ViewSet
# ---------------------------------------------------------------------------

class CompanyViewSet(ModelViewSet):
    """
    CRUD for Companies. Admin only.
    This is the only ViewSet that does NOT use CompanyQuerysetMixin because
    Company itself is the top-level tenant entity — it is not scoped to
    another company.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    search_fields = ['name', 'slug', 'email', 'domain']
    filterset_fields = ['is_active', 'subscription_plan']
    ordering_fields = ['name', 'created_at']


# ---------------------------------------------------------------------------
# User ViewSet
# ---------------------------------------------------------------------------

class UserViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    CRUD for Users, scoped to the current company.

    Inherits CompanyQuerysetMixin so:
    - GET /users/ returns only users in request.company
    - POST /users/ auto-assigns company to the new user
    """
    queryset = User.objects.select_related('company').all()
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    search_fields = ['email', 'first_name', 'last_name']
    filterset_fields = ['role', 'is_active']
    ordering_fields = ['date_joined', 'last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsManager(), HasCompany()]
        return [IsAdmin(), HasCompany()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin, HasCompany])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'message': f'User {user.email} activated.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin, HasCompany])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': f'User {user.email} deactivated.'})

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin, HasCompany])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in User.Roles.values:
            return Response(
                {'role': f'Invalid role. Choose from: {list(User.Roles.values)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.role = new_role
        user.save(update_fields=['role'])
        return Response(UserSerializer(user).data)
