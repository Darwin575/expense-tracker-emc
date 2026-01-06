# Authentication Bug Fixes

## Issue
Infinite refresh/logout loop when signing in or logging out.

## Root Causes
1. **Token auto-refresh interceptor** - The response interceptor was attempting to automatically refresh tokens on 401 errors, creating an infinite loop
2. **Register function mismatch** - Register function in useAuth was trying to access response.user which no longer exists (since accounts are inactive)
3. **Logout flag** - No flag to prevent re-trying logout when already logging out

## Fixes Applied

### 1. Auth Service (`src/lib/auth-service.ts`)
**Removed problematic auto-refresh interceptor:**
- Old: Attempted automatic token refresh on 401 status
- New: Simply clears tokens on 401 and lets the error propagate
- This prevents the infinite refresh loop

**Added logout flag:**
- `private isLoggingOut = false` - prevents multiple logout attempts
- Set to true during logout, false after completion

**Improved login error handling:**
- Now properly extracts error message from API response
- Handles both `message` and `detail` fields from backend

### 2. UseAuth Hook (`src/hooks/useAuth.tsx`)
**Fixed register function:**
- Old: Tried to set `response.user` which doesn't exist
- New: Correctly sets `isAuthenticated=false` and `user=null`
- Registration returns `{email, message}` not `{user, ...}`

## Key Changes Summary

| Component | Change | Reason |
|-----------|--------|--------|
| Response Interceptor | Removed auto-refresh | Prevents infinite loop |
| Login | Better error extraction | Shows correct error messages |
| Logout | Added isLoggingOut flag | Prevents multiple logout attempts |
| Register | Fixed response handling | Matches new API response format |

## How It Works Now

1. **Login**:
   - User enters email/password
   - API returns tokens + user data (if approved)
   - Sets tokens in storage
   - Redirects to dashboard

2. **Logout**:
   - Sets `isLoggingOut = true`
   - Calls logout endpoint
   - Clears tokens
   - Sets `isLoggingOut = false`

3. **Register**:
   - User fills registration form
   - API returns `{email, message}`
   - Does NOT set user (account is inactive)
   - Shows success screen
   - Redirects to login

4. **Error Handling**:
   - 401 error → Clear tokens (no retry)
   - Login errors → Show message to user
   - Logout errors → Still clears tokens (no error thrown)

## Testing
```
1. Try to login (should fail if account not approved)
2. Admin approves account in Django admin
3. Login again (should work)
4. Logout (should clear tokens without refresh loop)
5. Register new account (should show pending approval message)
```

## Files Modified
- `src/lib/auth-service.ts` - Fixed interceptors and logout
- `src/hooks/useAuth.tsx` - Fixed register function

## What's Different for Users

✅ **Login now works properly**
- Shows correct error message if account pending approval
- Redirects to dashboard after successful login
- No more infinite refresh loops

✅ **Logout now works properly**
- Clears tokens without looping
- Redirects cleanly

✅ **Registration now works properly**
- Shows pending approval message
- Auto-redirects to login after 3 seconds
- Ready for admin approval

✅ **No infinite refresh cycles**
- Auto-refresh removed (not needed for short-lived tokens)
- Clean error handling instead
