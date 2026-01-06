# Generated migration for requested_credential_reset field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_remove_name_role_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='requested_credential_reset',
            field=models.BooleanField(default=False, help_text='User has requested credential reset'),
        ),
    ]

