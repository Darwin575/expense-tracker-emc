# Expense Tracker Backend

A Django REST Framework backend for tracking personal expenses, categories, and budgets.

## Tech Stack

- **Framework:** Django 6.0
- **API:** Django REST Framework 3.14
- **Database:** PostgreSQL (production) / SQLite (development)
- **Deployment:** Docker, Docker Compose, Gunicorn, Nginx

---

## Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL (for production)
- Docker & Docker Compose (optional)

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd expense-tracker-be

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Docker Setup

```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=expense_manager
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## REST API Endpoints

**Base URL:** `http://localhost:8000`

### Authentication

All write operations (POST, PUT, PATCH, DELETE) require authentication.
GET requests are public (read-only access).

---

### Categories

Manage expense categories.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List all categories |
| GET | `/api/categories/{id}/` | Get single category |
| POST | `/api/categories/` | Create category |
| PUT | `/api/categories/{id}/` | Full update category |
| PATCH | `/api/categories/{id}/` | Partial update category |
| DELETE | `/api/categories/{id}/` | Delete category |

**Query Parameters:**
- `?search=<term>` - Search by name or description
- `?ordering=name` or `?ordering=-created_at` - Order results

**Request Body (POST/PUT):**
```json
{
    "name": "Food",
    "description": "Food and dining expenses",
    "color_code": "#FF5733"
}
```

**Response:**
```json
{
    "id": 1,
    "user": 1,
    "user_username": "demo",
    "name": "Food",
    "description": "Food and dining expenses",
    "color_code": "#FF5733",
    "created_at": "2025-12-11T10:00:00Z",
    "updated_at": "2025-12-11T10:00:00Z"
}
```

---

### Expenses

Track individual expenses.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/` | List all expenses |
| GET | `/api/expenses/{id}/` | Get single expense |
| POST | `/api/expenses/` | Create expense |
| PUT | `/api/expenses/{id}/` | Full update expense |
| PATCH | `/api/expenses/{id}/` | Partial update expense |
| DELETE | `/api/expenses/{id}/` | Delete expense |

**Query Parameters:**
- `?category=<id>` - Filter by category ID
- `?payment_method=CASH` or `?payment_method=CARD` - Filter by payment method
- `?date=2025-12-11` - Filter by date
- `?search=<term>` - Search by title or description
- `?ordering=amount` or `?ordering=-date` - Order results
- `?page=<number>` - Pagination (10 items per page)

**Request Body (POST/PUT):**
```json
{
    "title": "Grocery Shopping",
    "amount": "150.50",
    "date": "2025-12-11",
    "category": 1,
    "description": "Weekly groceries",
    "payment_method": "CARD",
    "is_recurring": false,
    "recurring_frequency": null
}
```

**Field Reference:**

| Field | Type | Required | Valid Values |
|-------|------|----------|--------------|
| `title` | string | ✅ | max 255 chars |
| `amount` | decimal | ✅ | up to 10 digits, 2 decimals |
| `date` | date | ✅ | `YYYY-MM-DD` format |
| `category` | integer | ❌ | category ID (nullable) |
| `description` | string | ❌ | any text |
| `payment_method` | string | ❌ | `"CASH"` or `"CARD"` (default: CASH) |
| `is_recurring` | boolean | ❌ | `true` or `false` (default: false) |
| `recurring_frequency` | string | ❌ | `"daily"`, `"weekly"`, `"monthly"`, `"yearly"` |

**Response:**
```json
{
    "id": 1,
    "user": 1,
    "user_username": "demo",
    "category": 1,
    "category_name": "Food",
    "title": "Grocery Shopping",
    "description": "Weekly groceries",
    "amount": "150.50",
    "payment_method": "CARD",
    "date": "2025-12-11",
    "is_recurring": false,
    "recurring_frequency": null,
    "created_at": "2025-12-11T10:00:00Z",
    "updated_at": "2025-12-11T10:00:00Z"
}
```

---

### Budgets

Set monthly budgets.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets/` | List all budgets |
| GET | `/api/budgets/{id}/` | Get single budget |
| POST | `/api/budgets/` | Create budget |
| PUT | `/api/budgets/{id}/` | Full update budget |
| PATCH | `/api/budgets/{id}/` | Partial update budget |
| DELETE | `/api/budgets/{id}/` | Delete budget |

**Query Parameters:**
- `?month=2025-12-01` - Filter by month
- `?ordering=month` or `?ordering=-budget_amount` - Order results

**Request Body (POST/PUT):**
```json
{
    "month": "2025-12-01",
    "budget_amount": "5000.00"
}
```

**Response:**
```json
{
    "id": 1,
    "user": 1,
    "user_username": "demo",
    "month": "2025-12-01",
    "budget_amount": "5000.00"
}
```

---

### Dashboard Summary

Get aggregated dashboard data for analytics and summary cards.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary/` | Get dashboard analytics |

**Response Structure:**
```json
{
    "period": {
        "current_month": "2025-12",
        "month_name": "December 2025",
        "start_date": "2025-12-01",
        "end_date": "2025-12-11",
        "days_in_month": 31,
        "days_passed": 11
    },
    "spending": {
        "total_this_month": 850.00,
        "total_this_week": 220.00,
        "total_today": 45.00,
        "transaction_count": 15,
        "daily_average": 77.27
    },
    "budget": {
        "amount": 3000.00,
        "spent": 850.00,
        "remaining": 2150.00,
        "utilization_percent": 28.33,
        "daily_recommended": 107.50,
        "status": "on_track"
    },
    "top_category": {
        "id": 1,
        "name": "Food",
        "color_code": "#FF5733",
        "amount": 350.00,
        "transaction_count": 8,
        "percentage": 41.18
    },
    "categories": [
        {"id": 1, "name": "Food", "amount": 350.00, "count": 8, "percentage": 41.18},
        {"id": 2, "name": "Transport", "amount": 200.00, "count": 5, "percentage": 23.53}
    ],
    "top_expenses": [
        {"id": 5, "title": "Grocery Shopping", "amount": 150.00, "category": "Food", "date": "2025-12-10"}
    ],
    "recent_expenses": [
        {"id": 15, "title": "Coffee", "amount": 5.50, "category": "Food", "date": "2025-12-11"}
    ],
    "payment_methods": [
        {"method": "CARD", "amount": 600.00, "count": 10, "percentage": 70.59},
        {"method": "CASH", "amount": 250.00, "count": 5, "percentage": 29.41}
    ],
    "comparison": {
        "last_month_total": 1200.00,
        "change_amount": -350.00,
        "change_percent": -29.17,
        "trend": "down"
    }
}
```

**Response Fields:**

| Section | Description |
|---------|-------------|
| `period` | Current month info and date range |
| `spending` | Total spending metrics (month, week, today, daily avg) |
| `budget` | Budget vs actual spending with status |
| `top_category` | Highest spending category this month |
| `categories` | Top 5 categories breakdown |
| `top_expenses` | 5 highest amount transactions |
| `recent_expenses` | 5 most recent transactions |
| `payment_methods` | Spending by payment method (CASH/CARD) |
| `comparison` | Month-over-month comparison |

**Budget Status Values:**
- `on_track` - Utilization ≤ 80%
- `warning` - Utilization > 80%
- `over_budget` - Spent more than budget
- `no_budget_set` - No budget defined for current month

---

### Analytics (Charts & Graphs)

Endpoints for frontend charts with caching and query limits.

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/analytics/category-breakdown/` | Pie chart - spending by category | `?month=2025-12` |
| GET | `/api/analytics/weekly-spending/` | Bar chart - daily spending for week | `?week_offset=0` |
| GET | `/api/analytics/monthly-trend/` | Line chart - monthly trends | `?months=6` |
| GET | `/api/analytics/payment-breakdown/` | Donut chart - CASH vs CARD | `?month=2025-12` |

#### Category Breakdown (Pie Chart)

`GET /api/analytics/category-breakdown/?month=2025-12`

```json
{
    "success": true,
    "meta": {
        "period": "2025-12",
        "start_date": "2025-12-01",
        "end_date": "2025-12-31",
        "total_categories": 3,
        "cached": false
    },
    "summary": {
        "total": 391.99,
        "transaction_count": 7
    },
    "data": [
        {"id": 1, "name": "Food", "value": 244.00, "color": "#FF5733", "count": 4, "percentage": 62.2},
        {"id": 2, "name": "Transport", "value": 100.00, "color": "#3498DB", "count": 2, "percentage": 25.5}
    ]
}
```

#### Weekly Spending (Bar Chart)

`GET /api/analytics/weekly-spending/?week_offset=0`

```json
{
    "success": true,
    "meta": {
        "week_offset": 0,
        "start_date": "2025-12-09",
        "end_date": "2025-12-15",
        "week_label": "Dec 09 - Dec 15, 2025",
        "cached": false
    },
    "summary": {
        "total": 391.99,
        "daily_average": 56.00,
        "transaction_count": 7,
        "days_with_spending": 4
    },
    "data": [
        {"date": "2025-12-09", "day": "Mon", "total": 55.00, "count": 1},
        {"date": "2025-12-10", "day": "Tue", "total": 45.00, "count": 1},
        {"date": "2025-12-11", "day": "Wed", "total": 159.00, "count": 2}
    ]
}
```

#### Monthly Trend (Line Chart)

`GET /api/analytics/monthly-trend/?months=6`

```json
{
    "success": true,
    "meta": {
        "months_requested": 6,
        "months_returned": 6,
        "cached": false
    },
    "summary": {
        "grand_total": 5420.50,
        "monthly_average": 903.42,
        "trend": "down",
        "change_percent": -15.3
    },
    "data": [
        {"month": "2025-07", "month_short": "Jul", "month_name": "July 2025", "total": 1200.00, "count": 25},
        {"month": "2025-08", "month_short": "Aug", "month_name": "August 2025", "total": 980.50, "count": 22}
    ]
}
```

#### Payment Breakdown (Donut Chart)

`GET /api/analytics/payment-breakdown/?month=2025-12`

```json
{
    "success": true,
    "meta": {
        "period": "2025-12",
        "cached": false
    },
    "summary": {
        "total": 391.99,
        "transaction_count": 7
    },
    "data": [
        {"method": "CARD", "label": "Card", "total": 351.49, "count": 5, "color": "#3B82F6", "percentage": 89.7},
        {"method": "CASH", "label": "Cash", "total": 40.50, "count": 2, "color": "#10B981", "percentage": 10.3}
    ]
}
```

---

### Stub Endpoint (Testing)

Returns static mock data without database interaction.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stub/expenses/` | Get mock expense data |

---

## API Root

Visit `http://localhost:8000/api/` to see all available endpoints via the DRF Browsable API.

---

## Admin Panel

Access the Django admin at `http://localhost:8000/admin/`

---

## Project Structure

```
expense-tracker-be/
├── apps/
│   ├── common/
│   │   └── utils.py
│   ├── expenses/
│   │   ├── admin.py
│   │   ├── dashboard_views.py    # Dashboard & Analytics API
│   │   ├── helpers.py            # Helper functions & validation
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py              # CRUD operations
│   │   └── migrations/
│   └── users/
│       ├── admin.py
│       ├── models.py
│       └── migrations/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── manage.py
├── requirements.txt
└── README.md
```

---

## License

This project is proprietary software.
