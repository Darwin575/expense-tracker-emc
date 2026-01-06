#!/bin/bash
# Setup & Launch Script for JWT Authentication System

set -e  # Exit on error

echo "=========================================="
echo "  Expense Tracker Authentication Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ===========================================
# BACKEND SETUP
# ===========================================

echo -e "${BLUE}[1/5] Setting up Backend...${NC}"
cd expense-tracker-be

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your database credentials${NC}"
fi

# Create virtual environment if not exists
if [ ! -d venv ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate

# Install/update requirements
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q -r requirements.txt

# Run migrations
echo -e "${YELLOW}Running migrations...${NC}"
python manage.py migrate --noinput

# Create superuser prompt
echo -e "${YELLOW}Create superuser (admin) account:${NC}"
python manage.py createsuperuser

echo -e "${GREEN}✓ Backend setup complete${NC}"
cd ..
echo ""

# ===========================================
# FRONTEND SETUP
# ===========================================

echo -e "${BLUE}[2/5] Setting up Frontend...${NC}"
cd expense-tracker-fe

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
EOF
    echo -e "${YELLOW}✓ .env.local created${NC}"
fi

# Install dependencies
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
else
    echo -e "${YELLOW}Dependencies already installed${NC}"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"
cd ..
echo ""

# ===========================================
# SUMMARY
# ===========================================

echo -e "${GREEN}=========================================="
echo "  Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd expense-tracker-be"
echo "  source venv/bin/activate  # or . venv/Scripts/activate on Windows"
echo "  python manage.py runserver"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd expense-tracker-fe"
echo "  npm run dev"
echo ""
echo -e "${BLUE}Then visit:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  Admin:    http://localhost:8000/admin"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Start the backend server (Terminal 1)"
echo "  2. Start the frontend dev server (Terminal 2)"
echo "  3. Register a new account at http://localhost:3000"
echo "  4. To access admin panel, promote user to admin:"
echo "     python manage.py shell"
echo "     from apps.users.models import User"
echo "     user = User.objects.get(email='your-email@example.com')"
echo "     user.role = 'admin'"
echo "     user.save()"
echo ""
echo -e "${GREEN}For detailed docs, see:${NC}"
echo "  - QUICKSTART.md (5-minute guide)"
echo "  - AUTHENTICATION.md (complete reference)"
echo "  - ENV_SETUP.md (environment variables)"
echo ""
