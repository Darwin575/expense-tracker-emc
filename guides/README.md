# Expense Manager

A full-stack expense tracking application built with Django (backend) and Next.js (frontend), containerized with Docker for easy deployment.

## 🚀 Tech Stack

### Backend
- **Django 5.0** - Python web framework
- **Django REST Framework** - RESTful API
- **PostgreSQL** - Database
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
├── backend/                 # Django backend
│   ├── apps/
│   │   └── expenses/       # Expense management app
│   ├── config/             # Django settings
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and hooks
│   ├── Dockerfile
│   └── package.json
├── nginx/                  # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml      # Development setup
└── docker-compose.prod.yml # Production setup
```

## 🛠️ Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)

For local development without Docker:
- Python 3.11+
- Node.js 20+
- PostgreSQL 16+

## 🚀 Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   cd /home/gerald-darwin/EMC
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin

5. **Create a superuser (for Django admin)**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### Production Deployment

1. **Set up production environment variables**
   ```bash
   # Backend
   cp backend/.env.prod.example backend/.env.prod
   # Edit .env.prod with your production values
   
   # Frontend
   cp frontend/.env.prod.example frontend/.env.prod
   # Edit .env.prod with your production values
   ```

2. **Update production settings**
   - Set a strong `SECRET_KEY` in `backend/.env.prod`
   - Set `DEBUG=False`
   - Configure `ALLOWED_HOSTS` with your domain
   - Update `CORS_ALLOWED_ORIGINS`
   - Set a secure database password

3. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run migrations and create superuser**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

## 📝 API Endpoints

### Expenses
- `GET /api/expenses/` - List all expenses (paginated)
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/{id}/` - Retrieve expense details
- `PATCH /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense

### Query Parameters
- `?search=query` - Search by title or description
- `?category=id` - Filter by category
- `?payment_method=METHOD` - Filter by payment method
- `?ordering=-date` - Sort by field (prefix with `-` for descending)

## 🔧 Development

### Backend Development

```bash
# Run backend locally (without Docker)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Development

```bash
# Run frontend locally (without Docker)
cd frontend
npm install
npm run dev
```

## 🧪 Useful Commands

### Django

```bash
# Create migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Django shell
docker-compose exec backend python manage.py shell

# Run tests
docker-compose exec backend python manage.py test
```

### Docker

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes database data)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend
```

## 🎨 Features

- ✅ Expense tracking with categories
- ✅ Multiple payment methods (Cash, Card, Bank Transfer)
- ✅ RESTful API with Django REST Framework
- ✅ Modern React UI with Tailwind CSS
- ✅ Real-time data updates with TanStack Query
- ✅ Responsive design (mobile-friendly)
- ✅ Production-ready Docker setup
- ✅ Nginx reverse proxy for production
- ✅ PostgreSQL database

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong passwords for production databases
- Change the Django `SECRET_KEY` for production
- Configure HTTPS for production deployments
- Set `DEBUG=False` in production
- Implement authentication for production use

## 📚 Next Steps

1. **Add Authentication**
   - Implement JWT authentication
   - Add user registration/login
   - Protect API endpoints

2. **Extend Features**
   - Add expense categories CRUD
   - Implement expense analytics/reports
   - Add budget tracking
   - Export data to CSV/PDF

3. **Optimization**
   - Add caching (Redis)
   - Implement pagination on frontend
   - Add search and filtering UI

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📄 License

This project is open-source and available under the MIT License.

---

**Developed with Django, Next.js, and Docker** 🐍 ⚛️ 🐳
