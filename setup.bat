@echo off
REM Setup & Launch Script for JWT Authentication System (Windows)

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   Expense Tracker Authentication Setup
echo ==========================================
echo.

REM ===========================================
REM BACKEND SETUP
REM ===========================================

echo [1/5] Setting up Backend...
cd expense-tracker-be

REM Check if .env exists
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo.
    echo WARNING: Please update .env with your database credentials
)

REM Create virtual environment if not exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update requirements
echo Installing dependencies...
pip install -q -r requirements.txt

REM Run migrations
echo Running migrations...
python manage.py migrate --noinput

REM Create superuser
echo.
echo Create superuser (admin) account:
python manage.py createsuperuser

echo Backend setup complete
cd ..
echo.

REM ===========================================
REM FRONTEND SETUP
REM ===========================================

echo [2/5] Setting up Frontend...
cd expense-tracker-fe

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local file...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
        echo NEXT_PUBLIC_USE_MOCK_DATA=false
    ) > .env.local
    echo .env.local created
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
) else (
    echo Dependencies already installed
)

echo Frontend setup complete
cd ..
echo.

REM ===========================================
REM SUMMARY
REM ===========================================

echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd expense-tracker-be
echo   venv\Scripts\activate.bat
echo   python manage.py runserver
echo.
echo Terminal 2 (Frontend):
echo   cd expense-tracker-fe
echo   npm run dev
echo.
echo Then visit:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   Admin:    http://localhost:8000/admin
echo.
echo Next Steps:
echo   1. Start the backend server (Terminal 1)
echo   2. Start the frontend dev server (Terminal 2)
echo   3. Register a new account at http://localhost:3000
echo   4. To access admin panel, promote user to admin:
echo      python manage.py shell
echo      from apps.users.models import User
echo      user = User.objects.get(email='your-email@example.com')
echo      user.role = 'admin'
echo      user.save()
echo.
echo For detailed docs, see:
echo   - QUICKSTART.md (5-minute guide)
echo   - AUTHENTICATION.md (complete reference)
echo   - ENV_SETUP.md (environment variables)
echo.

pause
