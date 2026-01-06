# apps/authentication/urls.py
from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    MeView,
    RefreshTokenView,
    LogoutView,
    CredentialResetRequestView,
    CreateSuperuserView,
)
urlpatterns = [
    path('setup-admin/', CreateSuperuserView.as_view(), name='setup_admin'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('request-credential-reset/', CredentialResetRequestView.as_view(), name='request_credential_reset'),
]
