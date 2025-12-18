# 🛠️ BookDress - Local Development Guide

This guide covers setting up and running the BookDress dress rental system locally with development-friendly security features and hot reload capabilities.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Development Setup Options](#development-setup-options)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [Security Features in Development](#security-features-in-development)
7. [Database Management](#database-management)
8. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
9. [Testing](#testing)
10. [Code Changes and Hot Reload](#code-changes-and-hot-reload)

## ⚡ Quick Start

### 🚀 One-Command Development Setup

**Windows:**
```bash
# Clone and start development environment
git clone https://github.com/yourusername/bookdress.git
cd bookdress
./setup-bookdress.bat

# Choose option 1: Development (Docker with hot reload)
# OR option 3: Development (Local - requires Node.js)
```

**Linux/macOS:**
```bash
# Clone and start development environment
git clone https://github.com/yourusername/bookdress.git
cd bookdress
./setup-bookdress.sh

# Choose your preferred development option
```

### 📱 Development URLs

After setup, access your development environment:

| Service | URL | Purpose |
|---------|-----|---------|
| **Customer App** | http://localhost:3000 | Frontend development |
| **Admin Dashboard** | http://localhost:3001 | Backend development |
| **API Server** | http://localhost:4002 | API development |
| **Database Admin** | http://localhost:8084 | MongoDB management |
| **Security Dashboard** | http://localhost:4002/api/security/dashboard | Security monitoring |

### 🛡️ Development Security Features

Development mode includes relaxed security settings for easier debugging:
- ✅ **CSP in report-only mode** (won't break debugging tools)
- ✅ **Higher rate limits** (1000 vs 100 requests)
- ✅ **No IP blocking** (won't block developers)
- ✅ **Unsafe-inline allowed** for development tools
- ✅ **Security monitoring active** but non-blocking

## 📋 Prerequisites

### System Requirements
- **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux)
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **Git** for cloning the repository
- **Node.js** 18+ (optional, for running tests outside Docker)

### Minimum Hardware
- **RAM**: 4GB (8GB recommended)
- **CPU**: 2 cores (4 cores recommended)
- **Storage**: 10GB free space
- **Network**: Internet connection for downloading images

### Port Requirements
Ensure these ports are available on your local machine:
- `3000` - Frontend (Customer App)
- `3001` - Backend (Admin Dashboard)
- `4002` - API Server
- `8084` - MongoDB Express (Database UI)
- `27018` - MongoDB (external access)

## 🚀 Quick Start

### Automated Setup (Recommended)

**Windows:**
```bash
# Run the setup script
./setup-bookdress.bat
```

**Linux/macOS:**
```bash
# Make script executable and run
chmod +x setup-bookdress.sh
./setup-bookdress.sh
```

### Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/bookdress.git
cd bookdress

# 2. Create necessary directories
mkdir -p api/cdn/bookdress/{users,dresses,locations,contracts,licenses}
mkdir -p api/cdn/bookdress/temp/{users,dresses,locations,contracts,licenses}
chmod -R 755 api/cdn/

# 3. Start all services
docker compose up --build -d

# 4. Wait for services to start (30-60 seconds)
docker compose ps

# 5. Access applications
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "API: http://localhost:4002"
echo "MongoDB Express: http://localhost:8084"
```

### Default Access Credentials

**Admin Dashboard (Backend):**
- URL: http://localhost:3001
- Email: admin@bookdress.local
- Password: admin123

**MongoDB Express:**
- URL: http://localhost:8084
- Username: admin
- Password: admin

## 🔧 Development Setup

### Development Services

The development environment includes:

| Service | Port | Purpose | Auto-Reload |
|---------|------|---------|-------------|
| `bc-frontend` | 3000 | Customer interface | ✅ Yes |
| `bc-backend` | 3001 | Admin dashboard | ✅ Yes |
| `bc-api` | 4002 | Business logic & API | ❌ Manual restart |
| `mongo` | 27018 | Database | N/A |
| `mongo-express` | 8084 | DB management UI | N/A |

### Environment Files

The development setup uses these environment files:
- `api/.env.docker` - API server configuration
- `backend/.env.docker` - Admin dashboard configuration
- `frontend/.env.docker` - Customer app configuration

These files are automatically created from `.example` files if they don't exist.

## ⚙️ Environment Configuration

### Default Development Settings

The development environment is pre-configured with:

```env
# Regional Settings (Arabic/Palestine focus)
BC_DEFAULT_LANGUAGE=ar
BC_BASE_CURRENCY=ILS
BC_TIMEZONE=Asia/Jerusalem
BC_IPINFO_DEFAULT_COUNTRY=PS
BC_WEBSITE_NAME=BookDress

# Database (Local MongoDB)
BC_DB_URI=mongodb://admin:admin@mongo:27017/bookdress?authSource=admin

# Development URLs
BC_FRONTEND_HOST=http://localhost:3000/
BC_BACKEND_HOST=http://localhost:3001/
```

### Customizing Development Environment

To customize settings, edit the environment files:

```bash
# Edit API configuration
nano api/.env.docker

# Edit backend configuration
nano backend/.env.docker

# Edit frontend configuration
nano frontend/.env.docker

# Restart services to apply changes
docker compose restart
```

### Development vs Production Differences

| Setting | Development | Production |
|---------|-------------|------------|
| Database | Local MongoDB | MongoDB Atlas |
| HTTPS | Disabled | Enabled |
| Email | Mock/Console | Real SMTP |
| SMS | Mock/Console | Real Twilio |
| Payments | Sandbox | Live |
| Debug Logs | Enabled | Disabled |

## 🔄 Development Workflow

### Starting Development Environment

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Start specific services only
docker compose up mongo mongo-express bc-api

# Start with rebuild
docker compose up --build
```

### Viewing Logs

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs bc-api
docker compose logs bc-frontend
docker compose logs bc-backend

# Follow logs in real-time
docker compose logs -f bc-api

# View last 50 lines
docker compose logs --tail=50 bc-api
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Stop specific service
docker compose stop bc-api
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart bc-api

# Restart with rebuild
docker compose up --build bc-api
```

## 🗄️ Database Management

### Database Access

```bash
# MongoDB shell access
docker compose exec mongo mongo -u admin -p admin bookdress

# MongoDB Express web interface
# Go to http://localhost:8084
```

### Database Operations

```bash
# Initialize/reset database with sample data
docker compose exec bc-api npm run script:create-dress-db

# Check database collections
docker compose exec mongo mongo bookdress --eval "show collections"

# View sample data
docker compose exec mongo mongo bookdress --eval "db.dresses.find().limit(3).pretty()"

# Check user accounts
docker compose exec mongo mongo bookdress --eval "db.users.find({}, {email: 1, role: 1}).pretty()"
```

### Database Backup/Restore

```bash
# Create backup
docker compose exec mongo mongodump --host mongo:27017 --username admin --password admin --db bookdress --out /backup

# Copy backup from container
docker cp $(docker compose ps -q mongo):/backup ./backup

# Restore from backup
docker cp ./backup $(docker compose ps -q mongo):/restore
docker compose exec mongo mongorestore --host mongo:27017 --username admin --password admin --db bookdress /restore/bookdress
```

## 🐛 Debugging and Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :3000  # Linux
lsof -i :3000               # macOS

# Stop conflicting service
sudo systemctl stop apache2  # Linux
brew services stop nginx     # macOS

# Or change ports in docker-compose.yml
```

#### 2. Services Not Starting
```bash
# Check service status
docker compose ps

# Check logs for errors
docker compose logs service-name

# Restart problematic service
docker compose restart service-name

# Rebuild if needed
docker compose up --build service-name
```

#### 3. Database Connection Issues
```bash
# Wait for MongoDB to fully start (can take 30-60 seconds)
docker compose logs mongo

# Test database connection
docker compose exec bc-api node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin@mongo:27017/bookdress?authSource=admin')
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Error:', err));
"
```

#### 4. File Upload Issues
```bash
# Check CDN directories exist
docker compose exec bc-api ls -la /var/www/cdn/bookdress/

# Recreate directories if missing
docker compose exec bc-api mkdir -p /var/www/cdn/bookdress/{users,dresses,locations}

# Fix permissions
docker compose exec bc-api chmod -R 755 /var/www/cdn/
```

### Health Checks

```bash
# Check all services health
docker compose ps

# Test API health
curl http://localhost:4002/api/status

# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:3001

# Check resource usage
docker stats
```

## 🧪 Testing

### Running Tests

```bash
# Run API tests
docker compose exec bc-api npm test

# Run frontend tests
docker compose exec bc-frontend npm test

# Run backend tests
docker compose exec bc-backend npm test

# Run tests with coverage
docker compose exec bc-api npm run test:coverage
```

### Test Database

```bash
# Use separate test database
docker compose exec bc-api NODE_ENV=test npm test

# Reset test data
docker compose exec bc-api npm run script:create-test-data
```

### Manual Testing

1. **Frontend Testing**
   - Go to http://localhost:3000
   - Test dress search and booking flow
   - Test user registration and login
   - Test fitting appointment booking

2. **Backend Testing**
   - Go to http://localhost:3001
   - Login with admin@bookdress.local / admin123
   - Test dress management
   - Test booking management
   - Test analytics dashboard

3. **API Testing**
   - Use Postman or curl to test endpoints
   - Test authentication endpoints
   - Test CRUD operations
   - Test payment processing (sandbox mode)

## 🔄 Code Changes and Hot Reload

### Frontend/Backend Changes (Auto-Reload)

The frontend and backend services support hot reload:

```bash
# Make changes to frontend code
# Changes are automatically reflected in browser

# Make changes to backend code
# Admin dashboard automatically reloads
```

### API Changes (Manual Restart)

For API changes, restart the service:

```bash
# After making changes to API code
docker compose restart bc-api

# Or rebuild if dependencies changed
docker compose up --build bc-api
```

### Database Schema Changes

```bash
# After modifying database models
docker compose exec bc-api npm run script:create-dress-db

# Or run specific migration scripts
docker compose exec bc-api npm run script:migrate-collections
```

### Environment Variable Changes

```bash
# After changing .env.docker files
docker compose restart

# Or restart specific service
docker compose restart bc-api
```

## 🔧 Development Commands

### Useful Docker Commands

```bash
# View container details
docker compose config

# Execute commands in containers
docker compose exec bc-api sh
docker compose exec mongo mongo

# Copy files to/from containers
docker cp local-file.txt $(docker compose ps -q bc-api):/app/
docker cp $(docker compose ps -q bc-api):/app/logs ./logs

# Clean up Docker resources
docker system prune
docker volume prune
```

### Development Scripts

```bash
# API development scripts
docker compose exec bc-api npm run dev          # Start in development mode
docker compose exec bc-api npm run build        # Build for production
docker compose exec bc-api npm run lint         # Run linter
docker compose exec bc-api npm run format       # Format code

# Frontend development scripts
docker compose exec bc-frontend npm run dev     # Start dev server
docker compose exec bc-frontend npm run build   # Build for production
docker compose exec bc-frontend npm run preview # Preview build

# Backend development scripts
docker compose exec bc-backend npm run dev      # Start dev server
docker compose exec bc-backend npm run build    # Build for production
```

## 📝 Development Tips

### Performance Optimization

1. **Use Docker BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   docker compose build
   ```

2. **Optimize Docker Images**
   - Use multi-stage builds
   - Minimize layer count
   - Use .dockerignore files

3. **Resource Limits**
   ```yaml
   # In docker-compose.yml
   services:
     bc-api:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

### Code Quality

1. **Linting and Formatting**
   ```bash
   # Run linters
   docker compose exec bc-api npm run lint
   docker compose exec bc-frontend npm run lint

   # Auto-fix issues
   docker compose exec bc-api npm run lint:fix
   ```

2. **Type Checking**
   ```bash
   # TypeScript type checking
   docker compose exec bc-api npm run type-check
   docker compose exec bc-frontend npm run type-check
   ```

### Debugging

1. **Enable Debug Logs**
   ```env
   # In api/.env.docker
   BC_DB_DEBUG=true
   NODE_ENV=development
   ```

2. **Use Debugger**
   ```bash
   # Attach debugger to API
   docker compose exec bc-api node --inspect=0.0.0.0:9229 dist/index.js
   ```

## 🔄 Development Lifecycle

### Daily Development Workflow

1. **Start Development Environment**
   ```bash
   docker compose up -d
   ```

2. **Check Service Health**
   ```bash
   docker compose ps
   ```

3. **Make Code Changes**
   - Frontend/Backend: Auto-reload
   - API: Manual restart

4. **Test Changes**
   ```bash
   npm test
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

### Weekly Maintenance

1. **Update Dependencies**
   ```bash
   docker compose exec bc-api npm update
   docker compose exec bc-frontend npm update
   docker compose exec bc-backend npm update
   ```

2. **Clean Docker Resources**
   ```bash
   docker system prune
   docker volume prune
   ```

3. **Backup Development Data**
   ```bash
   docker compose exec mongo mongodump --out /backup
   ```

## 📞 Development Support

### Getting Help

1. **Check Logs**: `docker compose logs service-name`
2. **Verify Configuration**: `docker compose config`
3. **Test Connectivity**: `docker compose exec service-name command`
4. **Monitor Resources**: `docker stats`

### Common Development Tasks

```bash
# Reset everything (clean slate)
docker compose down -v
docker system prune -f
docker compose up --build

# Quick restart
docker compose restart

# View all logs
docker compose logs -f

# Access database
docker compose exec mongo mongo -u admin -p admin bookdress
```

---

Happy coding! 🎉👗

For production deployment, see the [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md).
For environment variables reference, see the [Environment Variables Guide](ENVIRONMENT_VARIABLES.md).
