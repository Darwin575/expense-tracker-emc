from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model extending Django's AbstractUser"""
    requested_credential_reset = models.BooleanField(
        default=False,
        help_text="User has requested credential reset"
    )

    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['requested_credential_reset']),
        ]

    def __str__(self):
        return self.email