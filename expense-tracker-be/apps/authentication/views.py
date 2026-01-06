from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import logging
from django.db.utils import OperationalError, ProgrammingError
from django.core.management import call_command
from apps.common.utils import success_response, error_response


from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    AdminUserSerializer,
    CredentialResetRequestSerializer,
)
from rest_framework.permissions import AllowAny
from .permissions import IsAdmin, IsAuthenticated

User = get_user_model()
logger = logging.getLogger(__name__)

class CreateSuperuserView(APIView):
    """
    Temporary endpoint to create a superuser for emergency access.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Allow GET request to trigger the same logic as POST for easier browser access.
        """
        return self.post(request)

    def post(self, request):
        username = "admin"
        email = "admin@example.com"
        password = "admin"

        try:
            if User.objects.filter(username=username).exists():
                return error_response(
                    message=f"User '{username}' already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.create_superuser(username, email, password)
            # Explicitly set permissions just to be safe/compliant with user request
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            return success_response(
                data={
                    "username": username,
                    "email": email,
                },
                message=f"Superuser '{username}' created successfully with staff privileges.",
                status_code=status.HTTP_201_CREATED
            )
        except (OperationalError, ProgrammingError):
            try:
                # If table doesn't exist, try to run migrations
                call_command('migrate')
                # Retry user creation
                if not User.objects.filter(username=username).exists():
                    user = User.objects.create_superuser(username, email, password)
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                
                return success_response(
                    data={"username": username, "email": email},
                    message=f"Migrations ran and superuser '{username}' created successfully.",
                    status_code=status.HTTP_201_CREATED
                )
            except Exception as e:
                logger.error(f"Migration/Retry failed: {e}")
                
                # DEBUG INFO FOR DEVOPS
                import json
                db_debug = settings.DATABASES['default'].copy()
                # Redact password partially
                if 'PASSWORD' in db_debug:
                    db_debug['PASSWORD'] = '***'
                    
                return error_response(
                    message=f"Database error: {str(e)} | Debug Info: {json.dumps(db_debug)}",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            logger.error(f"Failed to create superuser: {e}")
            return error_response(
                message=f"Failed to create superuser: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view.
    Post email and password to get access and refresh tokens.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            # Optional: wrap successful login response
            return success_response(data=response.data, message="Login successful")
        except ValidationError as e:
            # Handle serializer validation errors with descriptive messages
            message = "Login failed"
            if hasattr(e, 'detail'):
                detail = e.detail
                # If detail is a dict, usually {'detail': ...} or {'field': ...}
                if isinstance(detail, dict):
                    # Prefer 'detail' key common in DRF
                    if 'detail' in detail:
                        err = detail['detail']
                    else:
                        # Grab first error from any field
                        key = next(iter(detail))
                        err = detail[key]
                else:
                    err = detail

                # Unwrap list if necessary (e.g. ['Error message'])
                if isinstance(err, list) and len(err) > 0:
                    message = str(err[0])
                else:
                    message = str(err)
            else:
                message = str(e)
            
            logger.warning(f'Login validation failed: {message}')
            return error_response(message=message, status_code=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.warning(f'Login attempt failed: {str(e)}')
            return error_response(message='Invalid email or password', status_code=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    """
    User registration endpoint.
    New users have is_active=False until admin approval.
    """
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            return success_response(data={
                'email': user.email,
                'message': 'Registration successful. Your account is pending admin approval.',
            }, message="Registration successful", status_code=status.HTTP_201_CREATED)
        
        # Sanitize errors
        errors = serializer.errors
        if 'email' in errors:
            errors['email'] = ['This email is already registered.']
        
        return error_response(message="Registration failed", errors=errors)


class MeView(APIView):
    """
    Get current authenticated user info.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return success_response(data=serializer.data, message="User info retrieved")


class RefreshTokenView(APIView):
    """
    Refresh JWT token.
    """
    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh_token = RefreshToken(refresh)
            return Response({
                'access': str(refresh_token.access_token),
            })
        except Exception as e:
            logger.warning(f'Token refresh failed: {str(e)}')
            return Response(
                {'detail': 'Invalid refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """
    Logout endpoint (invalidate refresh token).
    """
    permission_classes = []  # Allow logout without authentication

    def post(self, request):
        try:
            refresh = request.data.get('refresh')
            if refresh:
                try:
                    token = RefreshToken(refresh)
                    # Try to blacklist if available (requires rest_framework_simplejwt.token_blacklist)
                    if hasattr(token, 'blacklist'):
                        token.blacklist()
                except Exception as e:
                    # Token might be invalid or blacklist not configured
                    logger.debug(f'Token blacklist not available or failed: {str(e)}')
        except Exception as e:
            logger.warning(f'Logout error: {str(e)}')
        
        return success_response(
            data={},
            message='Successfully logged out.',
            status_code=status.HTTP_200_OK
        )


class CredentialResetRequestView(APIView):
    """
    Request credential reset.
    Generic response for security (doesn't reveal if user exists).
    """
    def post(self, request):
        serializer = CredentialResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
                user.requested_credential_reset = True
                user.save()
                logger.info(f'Credential reset requested for {email}')
            except User.DoesNotExist:
                # Don't reveal if user exists
                pass
            
            # Generic response for security
            return success_response(
                data={},
                message='If an account exists with this email, an admin will be notified of your credential reset request. Please contact support if you need immediate assistance.',
                status_code=status.HTTP_200_OK
            )
        
        return error_response(
            message='Please provide a valid email address.',
            status_code=status.HTTP_400_BAD_REQUEST
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin panel for managing users.
    Only admins can access this endpoint.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['is_staff', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'email']
    ordering = ['-date_joined']

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting the last admin user.
        """
        user = self.get_object()
        
        if user.is_staff and user.is_superuser and User.objects.filter(is_staff=True, is_superuser=True).count() == 1:
            return Response(
                {'detail': 'Cannot delete the last admin user.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def make_staff(self, request, pk=None):
        user = self.get_object()
        user.is_staff = True
        user.is_superuser = True
        user.save()
        serializer = self.get_serializer(user)
        return success_response(data=serializer.data, message="User promoted to staff")


    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def remove_staff(self, request, pk=None):
        """
        Remove staff status (admin access).
        Prevent last admin from being demoted.
        """
        user = self.get_object()
        
        if user.is_staff and user.is_superuser and User.objects.filter(is_staff=True, is_superuser=True).count() == 1:
            return Response(
                {'detail': 'Cannot demote the last admin user.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_staff = False
        user.is_superuser = False
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def toggle_active(self, request, pk=None):
        """
        Toggle user active status.
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """
        Get admin dashboard stats.
        """
        total_users = User.objects.count()
        admin_users = User.objects.filter(is_staff=True, is_superuser=True).count()
        regular_users = User.objects.filter(is_staff=False, is_superuser=False).count()
        active_users = User.objects.filter(is_active=True).count()
        
        return Response({
            'total_users': total_users,
            'admin_users': admin_users,
            'regular_users': regular_users,
            'active_users': active_users,
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reset_credentials(self, request, pk=None):
        """
        Reset user credentials (email and password).
        Used when a user requests credential reset.
        """
        user = self.get_object()
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return error_response(
                message='Email and password are required',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Update user email if different
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return error_response(
                    message='Email already in use',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            user.email = email
            user.username = email  # Keep username synced with email for backup

        # Update password
        user.set_password(password)
        
        # Clear the credential reset flag
        user.requested_credential_reset = False
        user.save()

        serializer = self.get_serializer(user)
        return success_response(
            data=serializer.data,
            message='User credentials reset successfully'
        )
