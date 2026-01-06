# Frontend Development Patterns - Beginner's Guide

> **For New Developers**: This guide shows you how to use the existing code patterns to add new features quickly and consistently.

## 📁 Project Structure Overview

```
src/
├── hooks/           # Reusable React hooks for data & logic
│   ├── useAuth.tsx          # Authentication
│   ├── useExpenses.ts       # Expense operations
│   ├── useCategories.ts     # Category operations
│   ├── useDashboard.ts      # Dashboard data
│   └── useFormValidation.ts # Form validation
│
├── lib/             # Services & utilities
│   ├── api.ts              # Axios client (for API calls)
│   ├── auth-service.ts     # Auth operations
│   ├── admin-service.ts    # Admin operations
│   ├── endpoints.ts        # All API routes
│   └── types.ts            # TypeScript types
│
├── components/      # Reusable UI components
└── app/            # Pages (Next.js routing)
```

---

## 🎯 Common Tasks

### Task 1: Add a New Resource (e.g., "Tags")

Follow this pattern to add a new resource type to your app.

#### Step 1: Add TypeScript Types

**File:** `src/lib/types.ts`

```typescript
// Add your new type
export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

// Add create data type (fields needed to create)
export interface CreateTagData {
  name: string
  color: string
}
```

#### Step 2: Add API Endpoints

**File:** `src/lib/endpoints.ts`

```typescript
export const ENDPOINTS = {
  // ... existing endpoints ...
  
  // Add your new endpoints
  TAGS: {
    LIST: '/tags/',
    DETAIL: (id: string | number) => `/tags/${id}/`,
  },
}
```

#### Step 3: Create a Hook for Data Operations

**File:** `src/hooks/useTags.ts` (NEW FILE)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { Tag, CreateTagData } from '@/lib/types'

// Fetch all tags
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await apiClient.get<Tag[]>('/tags/')
      return data
    },
  })
}

// Create tag
export const useCreateTag = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newTag: CreateTagData) => {
      const { data } = await apiClient.post<Tag>('/tags/', newTag)
      return data
    },
    onSuccess: () => {
      // Refresh the tags list after creating
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// Delete tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/tags/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
```

#### Step 4: Use the Hook in a Component

**File:** `src/app/tags/page.tsx` (NEW FILE)

```tsx
'use client'

import { useState } from 'react'
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/useTags'

export default function TagsPage() {
  const [newTagName, setNewTagName] = useState('')
  
  // Fetch data
  const { data: tags, isLoading, error } = useTags()
  
  // Mutations
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()

  const handleCreate = async () => {
    await createTag.mutateAsync({
      name: newTagName,
      color: '#3b82f6',
    })
    setNewTagName('') // Clear input
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading tags</div>

  return (
    <div>
      <h1>Tags</h1>
      
      {/* Create Form */}
      <div>
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Tag name"
        />
        <button onClick={handleCreate}>
          Create Tag
        </button>
      </div>

      {/* List */}
      <ul>
        {tags?.map((tag) => (
          <li key={tag.id}>
            {tag.name}
            <button onClick={() => deleteTag.mutate(tag.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```


**To add new validation rules:**

Edit `src/hooks/useFormValidation.ts`:

```typescript
// Add new validation function
const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 20
}

// Add to interface
interface ValidationError {
  email?: string
  password?: string
  username?: string  // NEW
}
```

---

### Task 3: Make API Calls

#### Using Hooks (Recommended for CRUD operations)

```tsx
import { useExpenses, useCreateExpense } from '@/hooks/useExpenses'

function MyComponent() {
  // GET request (automatic caching!)
  const { data, isLoading } = useExpenses()
  
  // POST request
  const createExpense = useCreateExpense()
  
  const handleCreate = () => {
    createExpense.mutate({
      amount: 100,
      category: 1,
      description: 'Lunch',
    })
  }
}
```

#### Using apiClient Directly (For one-off requests)

```tsx
import apiClient from '@/lib/api'

async function fetchSomething() {
  try {
    const response = await apiClient.get('/some-endpoint/')
    console.log(response.data)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

---

### Task 4: Protect Routes (Authentication)

Use the existing auth pattern to protect pages.

**File:** `src/app/protected-page/page.tsx`

```tsx
'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Only logged-in users see this!</h1>
      </div>
    </ProtectedRoute>
  )
}
```

**Check auth status in components:**

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }
  
  return <div>Welcome, {user?.email}!</div>
}
```

---

### Task 5: Add Admin-Only Features

**Pattern 1: Conditional Rendering**

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user } = useAuth()
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Only show to admins */}
      {user?.is_staff && user?.is_superuser && (
        <button>Admin Action</button>
      )}
    </div>
  )
}
```

**Pattern 2: Admin Service**

```tsx
import { adminService } from '@/lib/admin-service'

async function promoteUser(userId: number) {
  try {
    await adminService.makeStaff(userId)
    alert('User promoted!')
  } catch (error) {
    alert('Failed to promote user')
  }
}
```

---

## 🔧 Understanding the Files

### `src/lib/api.ts` - The API Client

This is your **HTTP client** for making requests to the backend.

```typescript
import apiClient from '@/lib/api'

// GET request
const response = await apiClient.get('/expenses/')

// POST request
const response = await apiClient.post('/expenses/', {
  amount: 100,
  description: 'Lunch'
})

// PATCH request (update)
const response = await apiClient.patch('/expenses/1/', {
  amount: 150
})

// DELETE request
await apiClient.delete('/expenses/1/')
```

**Key Features:**
- Automatically adds base URL (`http://localhost:8000/api`)
- Handles request/response interceptors
- Configured via `.env` file

---

### `src/lib/endpoints.ts` - API Routes

**Why use this?** Prevents typos and provides autocomplete!

```typescript
import { ENDPOINTS } from '@/lib/endpoints'

// ❌ BAD: Hardcoded strings
await apiClient.get('/auth/login/')  // Easy to mistype!

// ✅ GOOD: Use constants
await apiClient.get(ENDPOINTS.AUTH.LOGIN)  // Autocomplete!

// ✅ GOOD: Dynamic URLs
await apiClient.get(ENDPOINTS.EXPENSES.DETAIL(123))
// Becomes: '/expenses/123/'
```

---

### `src/lib/types.ts` - TypeScript Types

**Why use this?** Type safety and autocomplete!

```typescript
import type { Expense, CreateExpenseData } from '@/lib/types'

// ✅ TypeScript knows the shape of data
const expense: Expense = {
  id: 1,
  amount: 100,
  description: 'Lunch',
  category: 1,
  // TypeScript will error if you forget required fields!
}

// ✅ Form data typing
const formData: CreateExpenseData = {
  amount: 100,
  description: 'Lunch',
  category: 1,
  // Don't need to include 'id' - it's added by the server
}
```

---

### React Query Hooks Pattern

All data hooks follow this pattern:

```typescript
// 1. Queries (GET) - for fetching data
export const useExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],  // Unique identifier for caching
    queryFn: async () => {
      const { data } = await apiClient.get('/expenses/')
      return data
    },
  })
}

// 2. Mutations (POST/PUT/PATCH/DELETE) - for changing data
export const useCreateExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newExpense: CreateExpenseData) => {
      const { data } = await apiClient.post('/expenses/', newExpense)
      return data
    },
    onSuccess: () => {
      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
```

**Benefits:**
- ✅ Automatic caching
- ✅ Automatic refetching
- ✅ Loading/error states
- ✅ Optimistic updates

---

## 🎨 Best Practices

### 1. Always Use Types

```typescript
// ✅ GOOD
const [expenses, setExpenses] = useState<Expense[]>([])

// ❌ BAD
const [expenses, setExpenses] = useState([])
```

### 2. Use Hooks for Data Fetching

```typescript
// ✅ GOOD - Uses caching, automatic refetch
const { data, isLoading } = useExpenses()

// ❌ BAD - Manual fetch, no caching
const [data, setData] = useState([])
useEffect(() => {
  fetch('/api/expenses').then(r => r.json()).then(setData)
}, [])
```

### 3. Use Endpoints Constants

```typescript
// ✅ GOOD
import { ENDPOINTS } from '@/lib/endpoints'
apiClient.get(ENDPOINTS.EXPENSES.LIST)

// ❌ BAD
apiClient.get('/expenses/')
```

### 4. Handle Loading & Error States

```tsx
const { data, isLoading, error } = useExpenses()

if (isLoading) return <div>Loading...</div>
if (error) return <div>Error: {error.message}</div>
return <div>{/* Render data */}</div>
```

---

## 📚 Quick Reference

| Need to... | Use... | File |
|------------|--------|------|
| Fetch data | React Query hook | `src/hooks/use*.ts` |
| Make API call | `apiClient` | `src/lib/api.ts` |
| Get API route | `ENDPOINTS` | `src/lib/endpoints.ts` |
| Type data | Import type | `src/lib/types.ts` |
| Check if logged in | `useAuth()` | `src/hooks/useAuth.tsx` |
| Validate form | `useFormValidation()` | `src/hooks/useFormValidation.ts` |
| Admin operations | `adminService` | `src/lib/admin-service.ts` |

---

## 💡 Examples to Learn From

**Best files to study:**
1. [`src/hooks/useExpenses.ts`](file:///home/gerald-darwin/EMC/expense-tracker-fe/src/hooks/useExpenses.ts) - Complete CRUD pattern
2. [`src/app/expenses/page.tsx`](file:///home/gerald-darwin/EMC/expense-tracker-fe/src/app/expenses/page.tsx) - Using hooks in components
3. [`src/hooks/useAuth.tsx`](file:///home/gerald-darwin/EMC/expense-tracker-fe/src/hooks/useAuth.tsx) - Context pattern

---

## 🆘 Troubleshooting

### "Cannot find module '@/lib/...'"

Make sure imports start with `@/` (not `../`):
```typescript
// ✅ GOOD
import apiClient from '@/lib/api'

// ❌ BAD
import apiClient from '../lib/api'
```

### "Property 'data' is possibly 'undefined'"

Check for loading state first:
```tsx
const { data, isLoading } = useExpenses()

if (isLoading) return <div>Loading...</div>

// Now TypeScript knows data is defined
return <div>{data.length} expenses</div>
```

### Environment Variables Not Working

- Restart dev server after changing `.env`
- Variables must start with `NEXT_PUBLIC_`
- Example: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

---

## 🚀 Next Steps

1. **Read existing code** in `src/hooks/` and `src/app/`
2. **Copy patterns** when adding new features
3. **Ask questions** if something is unclear!
4. **Keep types updated** in `src/lib/types.ts`

Happy coding! 🎉
