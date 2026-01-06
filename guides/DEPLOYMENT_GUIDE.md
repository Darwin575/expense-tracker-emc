# 🚀 Deployment & Repository Guide - EMC

This guide explains how to organize your repositories and deployment configuration for the EMC project.

## 📦 Repository Structure (2-Repo Setup)

Since you are limited to **2 repositories**, the best practice is to place your infrastructure configuration (Nginx, Docker Compose) inside the **Backend Repository**.

### Repositories

1.  **`emc-frontend`**
    -   Contains: `src/`, `package.json`, `Dockerfile`
2.  **`emc-backend`**
    -   Contains: `apps/`, `manage.py`, `requirements.txt`, `Dockerfile`
    -   **PLUS:** `nginx/`, `docker-compose.yml`

---

## 🏗️ The Backend Repository (`emc-backend`)

This repo will now handle both the API code and the deployment configuration.

### Directory Structure

```
emc-backend/
├── apps/              # Django apps
├── config/            # Django settings
├── nginx/             # MOVED HERE
│   └── nginx.conf
├── docker-compose.yml # MOVED HERE
├── Dockerfile         # Django Dockerfile
├── manage.py
└── requirements.txt
```

### Why the Backend Repo?

-   The Backend is the "heart" of the application logic.
-   Nginx often needs to serve static files collected by Django.
-   It's the most common place for "orchestration" files when a dedicated Infra repo isn't possible.

---

## 🛠️ Step-by-Step Migration Guide

Here is how to organize and push your code to your 2 repositories.

### 1. Push Frontend (`emc-frontend`)

Run these commands in your terminal:

```bash
# Go to your frontend folder
cd /home/gerald-darwin/EMC/EMC-FE

# Initialize Git
git init
git add .
git commit -m "Initial commit of Frontend"

# Link to your GitLab Frontend Repo
git remote add origin <YOUR_FRONTEND_REPO_URL>
git branch -M main
git push -u origin main
```

### 2. Prepare and Push Backend (`emc-backend`)

We will move the `nginx` folder and `docker-compose.yml` into the backend folder before pushing.

```bash
# 1. Go to your backend folder
cd /home/gerald-darwin/EMC/EMC-BE

# 2. Copy Nginx and Docker Compose from the root folder INTO here
cp -r ../nginx .
cp ../docker-compose.yml .
cp ../DEPLOYMENT_GUIDE.md .

# 3. Initialize Git
git init
git add .
git commit -m "Initial commit of Backend with Infra"

# 4. Link to your GitLab Backend Repo
git remote add origin git@gitlab.cytechint.com:gitlab-instance-3e959372/cytech-internal/expense-tracker-b/expense-tracker-be.git
git branch -M main
git push -u origin main
```

> **✅ Verification:**
> - **Frontend Repo**: Only Next.js code.
> - **Backend Repo**: Django code + `nginx/` folder + `docker-compose.yml`.

---

## ⚙️ Updated Configuration

Since you moved `docker-compose.yml` **inside** `EMC-BE`, you need to update the paths in it.

**Open `EMC-BE/docker-compose.yml` and update:**

```yaml
services:
  backend:
    build:
      context: .          # Changed from ./backend to .
      dockerfile: Dockerfile
    volumes:
      - .:/app            # Changed from ./backend to .
    # ...

  frontend:
    # If running locally with both folders side-by-side:
    build:
      context: ../EMC-FE  # Points to sibling folder
      dockerfile: Dockerfile
    volumes:
      - ../EMC-FE:/app
    # ...

  nginx:
    # ...
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./staticfiles:/app/staticfiles
```


