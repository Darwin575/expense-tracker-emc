# users/management/commands/create_dev_user.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings

class Command(BaseCommand):
    help = 'Create default development user'

    def handle(self, *args, **kwargs):
        if not settings.DEBUG:
            self.stdout.write("Not in DEBUG mode. Skipping dev user creation.")
            return

        User = get_user_model()
        try:
            user = User.objects.get(email="dev@example.com")
            # Update existing user to ensure is_active=True
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS("Dev user already exists. Updated to ensure is_active=True"))
        except User.DoesNotExist:
            User.objects.create_user(
                email="dev@example.com",
                username="dev",
                password="devpassword123",
                first_name="Dev",
                last_name="User",
                is_active=True,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS("Created default development user: dev@example.com / devpassword123"))
