# Expense Manager

A full-stack expense tracking application built with Django (backend) and Next.js (frontend), optimized for efficiency and ease of use.

## 🚀 Tech Stack

### Backend
- **Django 5.0** - Python web framework
- **Django REST Framework** - RESTful API
- **PostgreSQL/SQLite** - Database
- **Gunicorn** - WSGI HTTP Server

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy (production)

## 📁 Project Structure

```
EMC/
├── expense-tracker-be/      # Django backend
│   ├── apps/
│   │   └── expenses/       # Expense management app
│   ├── config/             # Django settings
│   ├── Dockerfile
│   └── requirements.txt
├── expense-tracker-fe/      # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and hooks
│   ├── Dockerfile
│   └── package.json
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Development setup
├── docker-compose.prod.yml # Production setup
└── setup.sh                # Quick setup script
```

## 🚀 Quick Start (Recommended)

The easiest way to get started is to use the included setup script, which handles environment configuration, dependencies, and database migrations.

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd expense-tracker-emc
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```
   Follow the on-screen prompts to set up both backend and frontend environments.

## 🛠️ Manual Setup

If you prefer to set up manually or encounter issues with the script:

### Backend Development

```bash
cd expense-tracker-be
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure your environment variables
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Development

```bash
cd expense-tracker-fe
cp .env.example .env.local # Configure your environment variables
npm install
npm run dev
```

## 📝 API Endpoints

- `GET /api/expenses/` - List all expenses (paginated)
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/{id}/` - Retrieve expense details
- `PATCH /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense

## 📚 Documentation

Detailed documentation can be found in the `guides/` directory:
- [Quick Start Guide](guides/QUICKSTART.md)
- [Authentication](guides/AUTHENTICATION.md)
- [Environment Setup](guides/ENV_SETUP.md)
- [Developer Guide](guides/DEVELOPER_GUIDE.md)

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📄 License

This project is open-source and available under the MIT License.
