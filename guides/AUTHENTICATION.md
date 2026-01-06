# Authentication System Documentation

## Overview

This application implements a secure JWT-based authentication system with role-based access control (RBAC). Users can register, login, and admins can manage users through a dedicated admin panel.

## Security Features

### Backend Security

1. **JWT Tokens (djangorestframework-simplejwt)**
   - Access tokens stored in memory (short-lived: 15 minutes)
   - Refresh tokens issued for obtaining new access tokens (7 days)
   - Token rotation and blacklisting enabled
   - CSRF protection enabled

2. **Password Security**
   - Django's built-in password validators:
     - Minimum length (8 characters)
     - Common password check
     - Numeric-only password prevention
     - User attribute similarity check
   - Argon2 hashing (via django-allauth)

3. **Rate Limiting**
   - django-axes enabled for brute-force protection
   - Multiple failed login attempts trigger account lockout

4. **Error Handling**
   - Generic error messages ("Invalid email or password") prevent email enumeration
   - No information leakage in error responses
   - Server-side validation on all endpoints

5. **CORS Configuration**
   - Restricted to allowed origins only
   - Credentials allowed only from trusted sources

### Frontend Security

1. **Token Storage**
   - Access token: `sessionStorage` (cleared on browser close)
   - Refresh token: `localStorage` (for persistent sessions)
   - Tokens NOT stored in cookies by default (vulnerable to XSS)

2. **Form Validation**
   - Email format validation (RFC 5322 compliant)
   - Password strength requirements
   - Client-side validation with server-side verification

3. **Protected Routes**
   - `ProtectedRoute` component enforces authentication
   - Automatic redirect to login for unauthenticated users
   - Admin routes protected with role-based checks

4. **API Interceptors**
   - Automatic token refresh on 401 Unauthenticated
   - Bearer token injection in request headers
   - Error handling for expired tokens

## Project Structure

### Backend

```
apps/
├── authentication/
│   ├── __init__.py
│   ├── apps.py
│   ├── serializers.py      # JWT & registration serializers
│   ├── permissions.py      # IsAdmin, IsAuthenticated
│   ├── views.py            # Login, Register, Admin endpoints
│   └── urls.py             # Auth routes
├── users/
│   ├── models.py           # Custom User model with role field
│   └── migrations/
└── ...
config/
├── settings.py             # JWT & CORS configuration
└── urls.py                 # Include auth URLs
```

### Frontend

```
src/
├── lib/
│   ├── auth-service.ts     # API calls for authentication
│   └── admin-service.ts    # Admin panel API calls
├── hooks/
│   ├── useAuth.tsx         # Authentication context
│   └── useFormValidation.ts # Form validation
├── components/
│   ├── ProtectedRoute.tsx  # Route protection HOC
│   └── Navigation.tsx      # Updated with logout & admin link
└── app/
    ├── auth/
    │   ├── login/
    │   │   └── page.tsx    # Login form
    │   └── register/
    │       └── page.tsx    # Registration form
    ├── admin/
    │   └── page.tsx        # Admin dashboard
    └── dashboard/
        └── page.tsx        # Protected dashboard
```

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login/` | Login with email & password | No |
| POST | `/api/auth/register/` | Create new account | No |
| GET | `/api/auth/me/` | Get current user info | Yes |
| POST | `/api/auth/refresh/` | Refresh access token | No |
| POST | `/api/auth/logout/` | Logout (blacklist token) | Yes |

### Admin Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/auth/admin/users/` | List all users (paginated) | Admin |
| GET | `/api/auth/admin/users/{id}/` | Get user details | Admin |
| PATCH | `/api/auth/admin/users/{id}/` | Update user | Admin |
| DELETE | `/api/auth/admin/users/{id}/` | Delete user | Admin |
| POST | `/api/auth/admin/users/{id}/promote_to_admin/` | Promote user to admin | Admin |
| POST | `/api/auth/admin/users/{id}/demote_to_user/` | Demote admin to user | Admin |
| POST | `/api/auth/admin/users/{id}/toggle_active/` | Toggle user active status | Admin |
| GET | `/api/auth/admin/users/stats/` | Get admin dashboard stats | Admin |

### Response Examples

**Login Success (200)**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Login Failure (401)**
```json
{
  "detail": "Invalid email or password."
}
```

**Registration Failure (400)**
```json
{
  "email": ["This email is already registered."],
  "password": ["Password must be at least 8 characters."]
}
```

## User Roles

### User Role
- Access to dashboard
- Can manage own expenses
- Cannot access admin panel

### Admin Role
- All user permissions
- Access to admin panel
- Can manage all users
- Can promote/demote users
- Can activate/deactivate users
- Cannot be demoted if they are the last admin

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create superuser (admin):**
   ```bash
   python manage.py createsuperuser
   ```

5. **Run development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env.local file:**
   ```bash
   cp .env.example .env.local
   # Update API_URL to match your backend
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin: http://localhost:8000/admin

## Testing

### Backend Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.authentication
```

### Frontend Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Development Workflow

### Creating New Protected Routes

1. Wrap component with `ProtectedRoute`:
   ```tsx
   import { ProtectedRoute } from '@/components/ProtectedRoute'
   
   export default function MyPage() {
     return (
       <ProtectedRoute>
         <div>Protected content here</div>
       </ProtectedRoute>
     )
   }
   ```

2. Access user info with hook:
   ```tsx
   import { useAuth } from '@/hooks/useAuth'
   
   function MyComponent() {
     const { user } = useAuth()
     return <p>Welcome {user?.name}</p>
   }
   ```

### Adding Admin-Only Routes

1. Check user role before rendering:
   ```tsx
   if (user?.role !== 'admin') {
     return <NotFound />
   }
   ```

### Updating Backend Authentication

1. Modify JWT settings in `config/settings.py`
2. Update serializers in `apps/authentication/serializers.py`
3. Add new views in `apps/authentication/views.py`
4. Register routes in `apps/authentication/urls.py`

## Common Issues & Solutions

### Issue: Token expired
**Solution:** Frontend automatically refreshes token. If refresh fails, user is logged out.

### Issue: User can't login
1. Check email/password combination
2. Verify user account is active (`is_active=True`)
3. Check Django logs for specific error

### Issue: Admin can't see users
1. Verify user role is 'admin'
2. Check backend JWT configuration
3. Verify token is being sent correctly

## Security Best Practices

✅ DO:
- Always use HTTPS in production
- Keep SECRET_KEY secret and rotate regularly
- Validate all inputs (frontend AND backend)
- Use strong passwords (8+ characters)
- Implement rate limiting
- Monitor failed login attempts
- Keep dependencies updated
- Use environment variables for secrets

❌ DON'T:
- Store tokens in cookies with JavaScript access
- Use localStorage for sensitive tokens
- Trust client-side validation alone
- Expose user information in error messages
- Use debug=True in production
- Hardcode secrets in code
- Send tokens in URL parameters

## Production Deployment

1. **Set environment variables:**
   ```bash
   SECRET_KEY=<generate-secure-key>
   DEBUG=False
   ALLOWED_HOSTS=yourdomain.com
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Update database:**
   ```bash
   python manage.py migrate
   ```

3. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Use production server:**
   ```bash
   gunicorn config.wsgi:application
   ```

## License

MIT
