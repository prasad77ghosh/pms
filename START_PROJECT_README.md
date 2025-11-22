# Product Management System - Setup Guide

A full-stack product management application with Angular frontend, Node.js/Express backend, PostgreSQL database, and RabbitMQ message queue.

---

## ⚡ Quick Start Guide (Docker)

**Get up and running in 5 minutes!**

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd augmont

# 2. Start all services with Docker Compose
docker-compose up --build -d

# 3. Run database migrations and seed data
docker exec -it backend sh -c "npm run migrate && npm run seed:prod"

# 4. Access the application
Frontend: http://localhost:4200
Backend API: http://localhost:5500
Login credentials: email: admin@example.com / password: admin123


# 5 for bulk upload
I am adding a csv file which conatin 5 lakhs of products
```

**That's it! 🎉** The application is now running with sample data.

---

## 📋 Table of Contents
- [⚡ Quick Start Guide (Docker)](#-quick-start-guide-docker)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development Setup](#local-development-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### For Docker Setup (Recommended)
- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### For Local Development
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/download/) (v16+)
- [RabbitMQ](https://www.rabbitmq.com/download.html) (v3.13+)
- [Angular CLI](https://angular.io/cli) (v19+)

---

## 🚀 Quick Start with Docker

### 1. Clone the Repository
```bash
git clone <repository-url>
cd augmont
```

### 2. Configure Environment Variables

Create `backend/.env.docker` (already exists):
```env
DATABASE_URL=postgresql://app_user:app_password@postgres:5432/augmont_db?schema=public
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
PORT=5500
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_change_this
FRONTEND_URL=http://localhost
```

### 3. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Run Database Migrations
```bash
# Enter backend container
docker exec -it backend sh

# Run migrations
npm run migrate

# Seed initial data (admin user + sample data)
npm run seed:prod

# Exit container
exit
```

### 5. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5500
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **PostgreSQL**: localhost:5432 (app_user/app_password)

### 6. Login Credentials
After seeding:
- **Email**: admin@example.com
- **Password**: admin123

---

## 💻 Local Development Setup

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Configure Environment
Create `backend/.env`:
```env
DATABASE_URL=postgresql://app_user:app_password@localhost:5432/augmont_db?schema=public
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
PORT=5500
NODE_ENV=dev
PERSISTENCE=db
JWT_SECRET=your_jwt_secret_key_change_this
FRONTEND_URL=http://localhost:4200
```

#### 3. Setup Database
```bash
# Make sure PostgreSQL is running
# Create database
createdb augmont_db

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

#### 4. Start Backend
```bash
npm run dev
```

Backend will run on http://localhost:5500

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Configure Environment
Update `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5500'
};
```

#### 3. Start Frontend
```bash
npm start
# or
ng serve
```

Frontend will run on http://localhost:4200

---

## 🗄️ Database Setup

### Migrations
```bash
cd backend

# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:down
```

### Seeding
```bash
cd backend

# Seed database with initial data
npm run seed
```

**Seed Data Includes:**
- 1 Admin user (admin@example.com / admin123)
- 3 Categories (Electronics, Clothing, Home & Garden)
- 5 Sample products

---

## ▶️ Running the Application

### Docker (Production-like)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v
```

### Local Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start

# Terminal 3 - PostgreSQL (if not running as service)
# Terminal 4 - RabbitMQ (if not running as service)
```

---

## 📁 Project Structure

```
augmont/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── db/              # Database connection
│   │   ├── middlewares/     # Express middlewares
│   │   ├── migrations/      # Database migrations
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── workers/         # Worker threads for async tasks
│   │   ├── seed.ts          # Database seeding script
│   │   └── server.ts        # Entry point
│   ├── .env                 # Local environment variables
│   ├── .env.docker          # Docker environment variables
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Angular application
│   │   ├── environments/    # Environment configs
│   │   └── ...
│   ├── Dockerfile
│   ├── nginx.conf           # Nginx configuration
│   └── package.json
└── docker-compose.yml       # Docker orchestration
```

---

## 📜 Available Scripts

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run migrate      # Run database migrations
npm run migrate:down # Rollback last migration
npm run seed         # Seed database with initial data
```

### Frontend
```bash
npm start            # Start development server (ng serve)
npm run build        # Build for production
npm test             # Run unit tests
npm run lint         # Lint code
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List products (with pagination, search, filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Bulk Upload
- `POST /api/bulk-upload/upload` - Upload CSV file for bulk product import
- `GET /api/bulk-upload/status/:jobId` - Get upload job status

### Reports
- `POST /api/reports/request` - Request product report generation
- `GET /api/reports/status/:jobId` - Get report status
- `GET /api/reports/download/:jobId` - Download generated report

### Users (Admin only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

---

## 🐛 Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Check what's using the port
netstat -ano | findstr :5432
netstat -ano | findstr :5500
netstat -ano | findstr :4200

# Stop conflicting services or change ports in docker-compose.yml
```

**Database connection failed:**
```bash
# Check if PostgreSQL container is healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Backend build fails:**
```bash
# Clear Docker cache and rebuild
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Local Development Issues

**Module not found:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database migration fails:**
```bash
# Check PostgreSQL is running
# Check DATABASE_URL in .env
# Try rolling back and re-running
npm run migrate:down
npm run migrate
```

**RabbitMQ connection error:**
```bash
# Check RabbitMQ is running
# Verify RABBITMQ_URL in .env
# Check RabbitMQ management UI: http://localhost:15672
```

---

## 🔐 Security Notes

- Change `JWT_SECRET` in production
- Update default PostgreSQL credentials
- Update default RabbitMQ credentials
- Use HTTPS in production
- Enable CORS only for trusted origins

---

## 📝 Additional Resources

- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Database Seed Guide](./backend/SEED.md)

---

## 👥 Support

For issues and questions, please create an issue in the repository.
