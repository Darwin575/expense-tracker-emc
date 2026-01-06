# Environment Configuration Guide

## Backend Environment Variables (.env)

Create `.expense-tracker-be/.env` with the following:

```bash
# Security
SECRET_KEY=your-very-secure-random-key-here-min-50-chars
DEBUG=False  # Set to False for production

# Allowed hosts (comma-separated)
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=expense_manager
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional: For development with SQLite instead of PostgreSQL
# DATABASE_URL=sqlite:///./db.sqlite3
```

### Generate SECRET_KEY

```bash
# Option 1: Python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Option 2: OpenSSL
openssl rand -base64 50
```

### JWT Configuration (Already in settings.py)

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # 15 minutes
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # 7 days
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}
```

---

## Frontend Environment Variables (.env.local)

Create `expense-tracker-fe/.env.local` with the following:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Important Notes:
- Prefix `NEXT_PUBLIC_` makes variables available in browser
- Change `NEXT_PUBLIC_API_URL` when deploying
- Don't commit `.env.local` to git (add to `.gitignore`)

---

## Environment Setup by Stage

### Development Environment

**Backend (.env)**
```bash
SECRET_KEY=dev-secret-key-not-safe-for-production
DEBUG=True
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Staging Environment

**Backend (.env)**
```bash
SECRET_KEY=<use-strong-generated-key>
DEBUG=False
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_NAME=expense_staging
ALLOWED_HOSTS=staging.example.com,www.staging.example.com
CORS_ALLOWED_ORIGINS=https://staging.example.com
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=https://api-staging.example.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Production Environment

**Backend (.env) - CRITICAL**
```bash
SECRET_KEY=<use-very-strong-generated-key>
DEBUG=False
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=expense_prod
ALLOWED_HOSTS=example.com,www.example.com
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

## Database Configuration

### Using PostgreSQL (Recommended for Production)

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Create Database**
   ```bash
   createdb expense_manager
   createuser expenseuser -P  # Enter password when prompted
   psql expense_manager
   GRANT ALL PRIVILEGES ON DATABASE expense_manager TO expenseuser;
   \q
   ```

3. **Update .env**
   ```bash
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=expense_manager
   DB_USER=expenseuser
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

### Using SQLite (Development Only)

In Django settings, uncomment:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

No need for `.env` database variables.

---

## Docker Configuration

### For Running in Docker

**Backend docker-compose.yml** (Already included)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: expense_manager
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  backend:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=postgres
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      - postgres
```

**Start Docker**
```bash
docker-compose up -d
```

---

## Security Checklist

Before Production Deployment:

- [ ] `DEBUG=False` in backend
- [ ] Strong `SECRET_KEY` generated
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] `CORS_ALLOWED_ORIGINS` restricted to your domain
- [ ] Database password is secure
- [ ] HTTPS enabled
- [ ] Static files collected
- [ ] Email configuration (if needed)
- [ ] Logging configured
- [ ] Database backup strategy
- [ ] SSL/TLS certificates valid

---

## Verifying Environment Setup

### Backend

```bash
# Test Django can read env vars
python manage.py shell
from django.conf import settings
print(settings.DEBUG)  # Should be False or True based on .env
print(settings.ALLOWED_HOSTS)
exit()
```

### Frontend

```bash
# Test Next.js can read env vars
npm run build

# Check .next/server/edge-runtime-webpack.js contains your API URL
```

---

## Common Configuration Errors

### Error: "django.db.utils.OperationalError: could not connect to server"

**Solution**: Check database credentials
```bash
# Test connection
psql -h localhost -U postgres -d expense_manager
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: Update CORS settings
```python
# config/settings.py
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

### Error: "Invalid characters in cookie name"

**Solution**: Check for spaces in SECRET_KEY
```bash
# Test SECRET_KEY
python -c "from decouple import config; print(len(config('SECRET_KEY')))"
```

### Error: "API_URL is undefined"

**Solution**: Ensure frontend env vars have `NEXT_PUBLIC_` prefix
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api  # ✅ Correct
API_URL=http://localhost:8000/api               # ❌ Wrong (not accessible)
```

---

## Environment Variables Reference

### Backend (Django)

| Variable | Type | Default | Required | Notes |
|----------|------|---------|----------|-------|
| SECRET_KEY | string | N/A | ✅ Yes | Min 50 chars, keep secret |
| DEBUG | bool | True | ❌ No | Must be False in production |
| ALLOWED_HOSTS | string | localhost,127.0.0.1 | ✅ Yes | Comma-separated |
| DB_ENGINE | string | postgresql | ✅ Yes | Or sqlite3 |
| DB_NAME | string | expense_manager | ✅ Yes | Database name |
| DB_USER | string | postgres | ✅ Yes | Database user |
| DB_PASSWORD | string | N/A | ✅ Yes | Database password |
| DB_HOST | string | localhost | ✅ Yes | Database host |
| DB_PORT | string | 5432 | ✅ Yes | Database port |
| CORS_ALLOWED_ORIGINS | string | localhost | ✅ Yes | Comma-separated URLs |

### Frontend (Next.js)

| Variable | Type | Default | Required | Notes |
|----------|------|---------|----------|-------|
| NEXT_PUBLIC_API_URL | string | http://localhost:8000/api | ✅ Yes | Must have NEXT_PUBLIC_ prefix |
| NEXT_PUBLIC_USE_MOCK_DATA | bool | false | ❌ No | For development/testing |

---

## Troubleshooting Configuration

### Check Backend Configuration
```bash
python manage.py shell
from django.conf import settings

# Check database
print("Database:", settings.DATABASES['default'])

# Check JWT
from rest_framework_simplejwt.settings import DEFAULTS
print("JWT Lifetime:", DEFAULTS['ACCESS_TOKEN_LIFETIME'])

# Check CORS
print("CORS Origins:", settings.CORS_ALLOWED_ORIGINS)
```

### Check Frontend Configuration
```bash
# Print all NEXT_PUBLIC variables
node -e "console.log(process.env)" | grep NEXT_PUBLIC
```

---

## Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use `.env.example` as template
3. ✅ Different keys for different environments
4. ✅ Rotate keys periodically
5. ✅ Use environment-specific values
6. ✅ Document required variables
7. ✅ Validate all variables on startup
8. ✅ Use secrets manager for production

---

## Deployment Platforms

### Heroku
```bash
heroku config:set SECRET_KEY="your-key"
heroku config:set ALLOWED_HOSTS="yourapp.herokuapp.com"
```

### AWS
Use AWS Secrets Manager or Parameter Store

### DigitalOcean
Use environment variables in app platform settings

### Vercel (Frontend)
Add `NEXT_PUBLIC_API_URL` in project settings

---

**Last Updated**: December 2024
