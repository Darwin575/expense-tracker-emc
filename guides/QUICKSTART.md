# Quick Start & Troubleshooting Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Backend Setup
```bash
cd expense-tracker-be

# Create .env file (copy from .env.example)
cp .env.example .env

# Install dependencies (if not done)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Step 2: Frontend Setup
```bash
cd ../expense-tracker-fe

# Create .env.local (copy from .env.example)
cp .env.example .env.local

# Ensure NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

### Step 3: Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Admin Dashboard**: http://localhost:3000/admin (login as admin first)

---

## 🔑 Test Credentials

### Create Test User (Method 1: Frontend)
1. Go to http://localhost:3000
2. Click "Create Account"
3. Fill in form:
   - Name: John Doe
   - Email: john@example.com
   - Password: Test@1234567 (min 8 chars)
4. Click "Create Account" → Auto-login → Dashboard

### Create Admin User (Method 2: Django CLI)
```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Invalid email or password" (Always fails)

**Check list:**
1. ✅ User exists in database
   ```bash
   python manage.py shell
   from apps.users.models import User
   User.objects.all()  # List all users
   ```

2. ✅ User is active
   ```bash
   # In Django shell
   user = User.objects.get(email='test@example.com')
   print(user.is_active)  # Should be True
   ```

3. ✅ Backend is running
   ```bash
   curl http://localhost:8000/api/auth/login/  # Should get error, not connection refused
   ```

4. ✅ Correct API URL in frontend
   - Check `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

---

### Issue 2: CORS Error in Browser

**Error:** `Access to XMLHttpRequest... blocked by CORS policy`

**Solutions:**
1. Check Django settings:
   ```python
   # config/settings.py
   CORS_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
   CORS_ALLOW_CREDENTIALS = True
   ```

2. Restart backend after changes:
   ```bash
   python manage.py runserver
   ```

3. Clear browser cache (Ctrl+Shift+Delete)

---

### Issue 3: Admin Panel Access Denied

**Check:**
1. Are you logged in? (Check dashboard loads)
2. Is user an admin?
   ```bash
   python manage.py shell
   user = User.objects.get(email='admin@example.com')
   print(user.role)  # Should be 'admin'
   ```

3. If not admin, promote via Django:
   ```bash
   python manage.py shell
   user = User.objects.get(email='admin@example.com')
   user.role = 'admin'
   user.save()
   print(user.role)  # Verify
   ```

4. Clear browser sessionStorage:
   ```javascript
   // In browser console
   sessionStorage.clear()
   localStorage.clear()
   // Refresh page and login again
   ```

---

### Issue 4: "Failed to load data" on Admin Panel

**Solutions:**
1. Check API token:
   ```javascript
   // In browser console
   console.log(sessionStorage.getItem('access_token'))  // Should have long string
   ```

2. Check backend is running:
   ```bash
   curl http://localhost:8000/api/auth/admin/users/  # Should fail with 401 (not found)
   ```

3. Check token is valid:
   ```bash
   python manage.py shell
   from rest_framework_simplejwt.tokens import AccessToken
   token = "paste-token-here"
   AccessToken(token)  # Will error if invalid
   ```

---

### Issue 5: Registration shows "Email is already registered"

**Check:**
1. Clear browser cookies: Ctrl+Shift+Delete
2. Use unique email: `john+${Date.now()}@example.com`
3. Check database:
   ```bash
   python manage.py shell
   from apps.users.models import User
   User.objects.filter(email='your-email@example.com')
   ```

---

### Issue 6: Logout doesn't redirect to login

**Solutions:**
1. Check browser console for errors
2. Clear tokens manually:
   ```javascript
   // In browser console
   sessionStorage.clear()
   localStorage.clear()
   ```
3. Refresh page

---

## 🔍 Debugging Commands

### Check Users in Database
```bash
python manage.py shell
from apps.users.models import User

# List all users
for user in User.objects.all():
    print(f"{user.email} - Role: {user.role} - Active: {user.is_active}")

# Get specific user
user = User.objects.get(email='test@example.com')
print(f"Email: {user.email}, Role: {user.role}, Active: {user.is_active}")

# Update user role
user.role = 'admin'
user.save()

# Deactivate user
user.is_active = False
user.save()
```

### Check Token Validity
```bash
# In browser console
const token = sessionStorage.getItem('access_token')
console.log('Token:', token)

// Decode token (not secure, for debugging only)
const base64Url = token.split('.')[1]
const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
const payload = JSON.parse(atob(base64))
console.log('Payload:', payload)
```

### Check API Response
```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com", "password":"password123"}'

# Note: Field might be "username" or "email", check error response
```

---

## 🧹 Reset Everything

### Reset Database (CAUTION: Deletes all data)
```bash
cd expense-tracker-be

# Option 1: Delete database and migrations
rm db.sqlite3
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Option 2: Fresh migrations
python manage.py makemigrations
python manage.py migrate

# Create new superuser
python manage.py createsuperuser
```

### Reset Frontend Auth
```javascript
// In browser console
sessionStorage.clear()
localStorage.clear()
// Then refresh page
window.location.reload()
```

---

## 📝 Useful API Calls

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### List All Users (Admin)
```bash
curl -X GET "http://localhost:8000/api/auth/admin/users/?page=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get User Stats (Admin)
```bash
curl -X GET http://localhost:8000/api/auth/admin/users/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Promote User to Admin
```bash
curl -X POST http://localhost:8000/api/auth/admin/users/2/promote_to_admin/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 💡 Tips

1. **Check Logs**: Django logs appear in terminal running `runserver`
2. **Clear Cache**: Ctrl+Shift+Delete in browser to clear all storage
3. **Test Login**: Use curl commands above to test backend separately
4. **Check Console**: Open browser DevTools (F12) → Console for frontend errors
5. **Use Django Admin**: http://localhost:8000/admin for manual user management
6. **Network Tab**: F12 → Network tab to see API calls and responses

---

## 📚 Files to Check

- **Settings**: `expense-tracker-be/config/settings.py` (JWT config)
- **Auth Views**: `expense-tracker-be/apps/authentication/views.py` (endpoints)
- **Auth Service**: `expense-tracker-fe/src/lib/auth-service.ts` (frontend API)
- **Auth Hook**: `expense-tracker-fe/src/hooks/useAuth.tsx` (state management)
- **Routes**: `expense-tracker-be/config/urls.py` (backend routes)
- **Env**: `.env` (backend) and `.env.local` (frontend)

---

## ❓ Still Having Issues?

1. Check `AUTHENTICATION.md` for detailed documentation
2. Look at specific error messages in:
   - Browser console (F12)
   - Django terminal output
   - Network tab responses
3. Try the "Reset Everything" section above
4. Verify all files were created correctly in file explorer

---

**Last Updated**: December 2024
