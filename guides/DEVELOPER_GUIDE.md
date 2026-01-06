# 🚀 Developer Guide - EMC (Expense Manager)

Welcome to the EMC development team! This guide will help you understand how to work with both the **frontend (EMC-FE)** and **backend (EMC-BE)** of our application.

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Frontend Guide](#-frontend-guide-emc-fe)
   - [Adding New Pages](#adding-new-pages)
   - [Using Axios for API Calls](#using-axios-for-api-calls)
   - [Working with React Query Hooks](#working-with-react-query-hooks)
3. [Backend Guide](#-backend-guide-emc-be)
   - [Adding New Models](#adding-new-models)
   - [Creating API Endpoints](#creating-api-endpoints)
   - [Registering URLs](#registering-urls)
4. [Common Workflows](#-common-workflows)
5. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Project Overview

### Tech Stack

**Frontend (EMC-FE):**
- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** Axios + React Query
- **Charts:** Recharts

**Backend (EMC-BE):**
- **Framework:** Django 5.0
- **API:** Django REST Framework
- **Database:** PostgreSQL (with psycopg2)
- **Server:** Gunicorn

### Project Structure

```
EMC/
├── EMC-FE/                 # Frontend application
│   ├── src/
│   │   ├── app/           # Next.js pages (App Router)
│   │   ├── components/    # Reusable React components
│   │   └── lib/           # Utilities, hooks, API config
│   └── package.json
│
└── EMC-BE/                 # Backend application
    ├── apps/              # Django apps
    │   └── expenses/      # Main expense app
    ├── config/            # Project settings & URLs
    └── requirements.txt
```

---

## 🎨 Frontend Guide (EMC-FE)

### Adding New Pages

Next.js 14 uses the **App Router** where folders in `src/app/` become routes automatically.

#### Step-by-Step: Create a New Page

**Example:** Let's create a "Settings" page at `/settings`

1. **Create a new folder** in `src/app/`:
   ```bash
   mkdir src/app/settings
   ```

2. **Create a `page.tsx` file** inside:
   ```bash
   touch src/app/settings/page.tsx
   ```

3. **Add your page content:**

   ```typescript
   'use client'  // Required for client-side features like hooks
   
   export default function SettingsPage() {
       return (
           <div className="p-8">
               <h1 className="text-4xl font-bold mb-4">Settings</h1>
               <p className="text-slate-600 dark:text-slate-400">
                   Configure your application settings here.
               </p>
           </div>
       )
   }
   ```

4. **Access your page** by navigating to `http://localhost:3000/settings`

#### Page Route Examples

| Folder Path | URL | File |
|------------|-----|------|
| `src/app/settings/page.tsx` | `/settings` | Settings page |
| `src/app/profile/page.tsx` | `/profile` | Profile page |
| `src/app/reports/monthly/page.tsx` | `/reports/monthly` | Monthly reports |

> **💡 Tip:** Use `'use client'` at the top of your file if you need:
> - React hooks (`useState`, `useEffect`, etc.)
> - Event handlers (`onClick`, `onChange`, etc.)
> - Browser APIs

---

### Using Axios for API Calls

We have a pre-configured Axios instance in `src/lib/api.ts`.

#### Basic Usage

**1. Import the API client:**
```typescript
import apiClient from '@/lib/api'
```

**2. Make API calls:**

```typescript
// GET request
const response = await apiClient.get('/expenses/')
const expenses = response.data

// POST request
const newExpense = {
    title: 'Coffee',
    amount: 5.50,
    category: 1,
    date: '2025-12-09'
}
const response = await apiClient.post('/expenses/', newExpense)

// PUT request (update)
const updated = { ...newExpense, amount: 6.00 }
await apiClient.put('/expenses/1/', updated)

// DELETE request
await apiClient.delete('/expenses/1/')
```

#### Example Component with Axios

```typescript
'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api'

export default function ExpenseList() {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch expenses when component mounts
        const fetchExpenses = async () => {
            try {
                const response = await apiClient.get('/expenses/')
                setExpenses(response.data)
            } catch (error) {
                console.error('Error fetching expenses:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchExpenses()
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div>
            {expenses.map((expense: any) => (
                <div key={expense.id}>{expense.title} - ${expense.amount}</div>
            ))}
        </div>
    )
}
```

---

### Working with React Query Hooks

React Query makes data fetching easier with automatic caching and refetching. We store hooks in `src/lib/hooks/`.

#### Creating a Custom Hook

**Example:** Create a hook for fetching categories

1. **Create file** `src/lib/hooks/useCategories.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api'

// Fetch all categories
export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await apiClient.get('/categories/')
            return response.data
        }
    })
}

// Create a new category
export function useCreateCategory() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (newCategory: { name: string; description?: string }) => {
            const response = await apiClient.post('/categories/', newCategory)
            return response.data
        },
        onSuccess: () => {
            // Refetch categories after creating one
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}

// Delete a category
export function useDeleteCategory() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/categories/${id}/`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}
```

2. **Use the hook in your component:**

```typescript
'use client'

import { useCategories, useCreateCategory } from '@/lib/hooks/useCategories'

export default function CategoriesPage() {
    const { data: categories, isLoading, error } = useCategories()
    const createCategory = useCreateCategory()

    const handleCreate = async () => {
        await createCategory.mutateAsync({
            name: 'New Category',
            description: 'Description here'
        })
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error loading categories</div>

    return (
        <div>
            <button onClick={handleCreate}>Add Category</button>
            {categories?.map((cat: any) => (
                <div key={cat.id}>{cat.name}</div>
            ))}
        </div>
    )
}
```

#### React Query Benefits

✅ **Automatic caching** - Data is cached and reused  
✅ **Background refetching** - Keeps data fresh  
✅ **Loading/error states** - Built-in status management  
✅ **Mutation handling** - Easy create/update/delete operations

---

## 🔧 Backend Guide (EMC-BE)

### Adding New Models

Models define your database structure. They live in `apps/<app_name>/models.py`.

#### Step-by-Step: Create a New Model

**Example:** Let's create a "Budget" model

1. **Open** `apps/expenses/models.py`

2. **Add your model:**

```python
from django.db import models
from django.contrib.auth.models import User

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-month']
        unique_together = ['user', 'category', 'month']

    def __str__(self):
        return f"{self.category.name} - ${self.amount} ({self.month.strftime('%Y-%m')})"
```

3. **Create and run migrations:**

```bash
cd EMC-BE
python manage.py makemigrations
python manage.py migrate
```

> **💡 Common Field Types:**
> - `CharField(max_length=100)` - Short text
> - `TextField()` - Long text
> - `DecimalField(max_digits=10, decimal_places=2)` - Money
> - `DateField()` - Date only
> - `DateTimeField()` - Date and time
> - `BooleanField(default=False)` - True/False
> - `ForeignKey(OtherModel, on_delete=models.CASCADE)` - Relationship

---

### Creating API Endpoints

Django REST Framework uses **ViewSets** to create API endpoints automatically.

#### Step-by-Step: Create an API Endpoint

**Example:** Create API for the Budget model

1. **Create a Serializer** in `apps/expenses/serializers.py`:

```python
from rest_framework import serializers
from .models import Budget

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Budget
        fields = ['id', 'user', 'category', 'category_name', 'amount', 'month', 'created_at']
        read_only_fields = ['created_at']
```

> **What is a Serializer?**  
> A serializer converts Django models to/from JSON format for the API.

2. **Create a ViewSet** in `apps/expenses/views.py`:

```python
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Budget
from .serializers import BudgetSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet for Budget model"""
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category__name']
    ordering_fields = ['month', 'amount', 'created_at']

    def get_queryset(self):
        """Filter budgets by user"""
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Save the budget with the current user"""
        serializer.save(user=self.request.user)
```

> **What is a ViewSet?**  
> A ViewSet automatically creates these endpoints:
> - `GET /api/budgets/` - List all budgets
> - `POST /api/budgets/` - Create a budget
> - `GET /api/budgets/{id}/` - Get single budget
> - `PUT /api/budgets/{id}/` - Update a budget
> - `DELETE /api/budgets/{id}/` - Delete a budget

3. **Register the URL** in `config/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers

# Create a router for API endpoints
router = routers.DefaultRouter()

# Import viewsets
from apps.expenses.views import ExpenseViewSet, CategoryViewSet, BudgetViewSet

# Register viewsets
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'budgets', BudgetViewSet, basename='budget')  # ← Add this line

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]
```

4. **Test your API:**

```bash
# Start the server
python manage.py runserver

# Visit in browser:
http://localhost:8000/api/budgets/
```

---

### Registering URLs

All API URLs are registered in `config/urls.py` using Django REST Framework's router.

#### URL Pattern

```python
router.register(r'endpoint-name', ViewSetName, basename='base-name')
```

**Examples:**

```python
# Creates: /api/expenses/, /api/expenses/{id}/
router.register(r'expenses', ExpenseViewSet, basename='expense')

# Creates: /api/categories/, /api/categories/{id}/
router.register(r'categories', CategoryViewSet, basename='category')

# Creates: /api/users/, /api/users/{id}/
router.register(r'users', UserViewSet, basename='user')
```

---

## 🔄 Common Workflows

### Workflow 1: Adding a Complete Feature (Frontend + Backend)

**Example:** Add a "Notes" feature to expenses

#### Backend Steps

1. **Add model field** in `apps/expenses/models.py`:
   ```python
   class Expense(models.Model):
       # ... existing fields ...
       notes = models.TextField(blank=True, null=True)  # Add this
   ```

2. **Update serializer** in `apps/expenses/serializers.py`:
   ```python
   class ExpenseSerializer(serializers.ModelSerializer):
       class Meta:
           model = Expense
           fields = [..., 'notes']  # Add 'notes' to fields list
   ```

3. **Create and run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

#### Frontend Steps

4. **Update TypeScript type** (create `src/lib/types.ts` if needed):
   ```typescript
   export interface Expense {
       id: number
       title: string
       amount: number
       notes?: string  // Add this
       // ... other fields
   }
   ```

5. **Update form component** to include notes field:
   ```typescript
   <textarea
       name="notes"
       placeholder="Add notes..."
       className="w-full p-2 border rounded"
   />
   ```

6. **Use the updated API** - No changes needed! Axios will automatically send/receive the new field.

---

### Workflow 2: Debugging API Calls

When things don't work, follow these steps:

#### Frontend Debugging

1. **Check browser console** (F12 → Console tab)
   ```typescript
   console.log('Response:', response.data)
   console.error('Error:', error)
   ```

2. **Check Network tab** (F12 → Network tab)
   - Look for failed requests (red text)
   - Click on request to see details
   - Check "Response" tab for error messages

#### Backend Debugging

1. **Check Django terminal** for errors

2. **Test API in browser:**
   ```
   http://localhost:8000/api/expenses/
   ```

3. **Use Django REST Framework's browsable API** - You can test POST/PUT/DELETE directly in the browser!

---

### Workflow 3: Adding Navigation Links

To add links to your new pages:

1. **Find the navigation component** (usually in `src/components/` or `src/app/layout.tsx`)

2. **Add a link:**
   ```typescript
   import Link from 'next/link'

   <Link 
       href="/settings" 
       className="text-slate-600 hover:text-slate-900"
   >
       Settings
   </Link>
   ```

---

## 🐛 Troubleshooting

### Common Frontend Issues

#### Issue: "Cannot find module '@/lib/api'"
**Solution:** Make sure you're using `@/` for imports (it's configured in `tsconfig.json`)

#### Issue: "Hydration failed"
**Solution:** Make sure you're using `'use client'` when using hooks or client-side features

#### Issue: Changes not showing up
**Solution:** 
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Restart dev server: `Ctrl+C` then `npm run dev`

### Common Backend Issues

#### Issue: "No such table" error
**Solution:** Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Issue: "CORS" error in browser console
**Solution:** Make sure `django-cors-headers` is installed and configured in settings

#### Issue: API returns 404
**Solution:** 
- Check that ViewSet is registered in `config/urls.py`
- Check the exact URL in browser: `http://localhost:8000/api/`

---

## 🚀 Quick Reference

### Running the Project

**Frontend:**
```bash
cd EMC-FE
npm install          # First time only
npm run dev          # Start development server (port 3000)
```

**Backend:**
```bash
cd EMC-BE
pip install -r requirements.txt  # First time only
python manage.py migrate         # First time only
python manage.py runserver       # Start server (port 8000)
```

### Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Backend** (`.env`):
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://...
```

---

## 📚 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **React Query Docs:** https://tanstack.com/query/latest/docs/react/overview
- **Django REST Framework:** https://www.django-rest-framework.org/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## � Deployment

For information on how to deploy the application, structure your repositories, and configure Nginx, please refer to the **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**.

---

## �💬 Need Help?

1. **Check this guide first** - Most common tasks are covered here
2. **Search the error message** - Google/Stack Overflow is your friend
3. **Ask the team** - We're all learning together!

---

**Happy Coding! 🎉**

*Last updated: December 9, 2025*
