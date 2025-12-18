# 🚀 BookDress - Deployment Documentation

Welcome to the BookDress dress rental system deployment documentation. This comprehensive guide covers everything you need to deploy BookDress with enterprise-grade security features in both development and production environments.

## 📚 Documentation Overview

This deployment documentation is organized into focused, comprehensive guides with no duplicate information:

### 🎯 Core Deployment Guides

| Guide | Purpose | When to Use |
|-------|---------|-------------|
| **[Quick Start Guide](#quick-start)** | Get started in 5 minutes | First time setup |
| **[Deployment Summary](DEPLOYMENT_SUMMARY.md)** | Complete deployment overview | Understanding the system |
| **[Production Deployment](PRODUCTION_DEPLOYMENT.md)** | Complete production deployment with security | Deploying to production servers |
| **[Development Guide](DEVELOPMENT_GUIDE.md)** | Local development setup | Setting up local development environment |
| **[Environment Variables](ENVIRONMENT_VARIABLES.md)** | Complete environment variables reference | Configuring any environment |
| **[Prerequisites](PREREQUISITES.md)** | System requirements and dependencies | Before starting any deployment |
| **[MongoDB Atlas Integration](MONGODB_ATLAS_INTEGRATION.md)** | Cloud database setup and configuration | Migrating from local MongoDB to Atlas |

### 🛡️ Security Features

| Feature | Description | Documentation |
|---------|-------------|---------------|
| **Content Security Policy** | Environment-aware CSP with nonce support | [Security Guide](../docs/SECURITY.md) |
| **Threat Detection** | Real-time threat monitoring (50+ patterns) | [Security Guide](../docs/SECURITY.md) |
| **Rate Limiting** | Intelligent rate limiting with IP blocking | [Security Guide](../docs/SECURITY.md) |
| **Security Headers** | Comprehensive security headers enforcement | [Security Guide](../docs/SECURITY.md) |
| **CORS Protection** | Advanced CORS with abuse detection | [Security Guide](../docs/SECURITY.md) |

### 🛠️ Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `../setup-bookdress.bat` | **Main deployment script** | `./setup-bookdress.bat` |
| `scripts/setup-server.sh` | Server preparation for production | `sudo ./scripts/setup-server.sh` |
| `scripts/ssl-setup.sh` | SSL certificate setup with Let's Encrypt | `sudo ./scripts/ssl-setup.sh` |

### 🐳 Docker Configuration

| File | Purpose |
|------|---------|
| `../docker-compose.yml` | Production Docker Compose with security |
| `../docker-compose.dev.yml` | Development Docker Compose with relaxed security |
| `../api/nginx/nginx.conf` | Nginx configuration for production (auto-generated) |

## 🚀 Quick Start

### ⚡ One-Command Setup

**Windows:**
```bash
# 1. Clone repository
git clone https://github.com/yourusername/bookdress.git
cd bookdress

# 2. Run the unified setup script
./setup-bookdress.bat

# Choose from options:
# 1. Development (Docker with hot reload)
# 2. Production (Docker with full security)
# 3. Development (Local - requires Node.js)
# 4. Test security features
# 5. Clean and rebuild
```

**Linux/macOS:**
```bash
# 1. Clone repository
git clone https://github.com/yourusername/bookdress.git
cd bookdress

# 2. Run the unified setup script
./setup-bookdress.sh

# Choose from the same options as Windows
```

### 📱 Access Your Applications

After setup completes, access your applications:

| Service | URL | Purpose |
|---------|-----|---------|
| **Customer App** | http://localhost:3000 | Dress rental interface |
| **Admin Dashboard** | http://localhost:3001 | Business management |
| **API Server** | http://localhost:4002 | Backend API |
| **Security Dashboard** | http://localhost:4002/api/security/dashboard | Security monitoring |
| **Database Admin** | MongoDB Atlas Dashboard | Cloud database management |

### 🔐 Default Credentials

**Admin Access:**
- Email: `admin@bookdress.local`
- Password: `admin123`
- **⚠️ Change immediately after first login!**

### For Production
```bash
# 1. Prepare server
sudo ./deployment/scripts/setup-server.sh

# 2. Deploy application

# 3. Setup SSL
sudo ./deployment/scripts/ssl-setup.sh
```

## 📋 System Architecture

### Development Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │      API        │
│  (Customer)     │    │   (Admin)       │    │   (Business)    │
│   Port 3000     │    │   Port 3001     │    │   Port 4002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  MongoDB Atlas  │
                    │   (Cloud DB)    │
                    └─────────────────┘
```

### Production Environment
```
                    ┌─────────────────┐
                    │      Nginx      │
                    │   (Port 80/443) │
                    └─────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Frontend      │ │    Backend      │ │      API        │
│  (Customer)     │ │   (Admin)       │ │   (Business)    │
│   Port 3000     │ │   Port 3001     │ │   Port 4002     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                             │
                    ┌─────────────────┐
                    │  MongoDB Atlas  │
                    │   (Cloud DB)    │
                    └─────────────────┘
```

## 🔧 Configuration Overview

### Environment Files Structure
```
api/
├── .env.docker          # Development API config
├── .env.production      # Production API config
└── .env.example         # Template

backend/
├── .env.docker          # Development backend config
├── .env.production      # Production backend config
└── .env.docker.example  # Template

frontend/
├── .env.docker          # Development frontend config
├── .env.production      # Production frontend config
└── .env.docker.example  # Template
```

### Key Configuration Differences

| Setting | Development | Production |
|---------|-------------|------------|
| **Database** | Local MongoDB | MongoDB Atlas |
| **HTTPS** | Disabled | Required |
| **Email** | Mock/Console | Real SMTP |
| **SMS** | Mock/Console | Real Twilio |
| **Payments** | Sandbox | Live |
| **Secrets** | Simple | Strong (32+ chars) |

## 🌍 Regional Configuration

BookDress is configured for Arabic/Palestinian market by default:

```env
BC_DEFAULT_LANGUAGE=ar          # Arabic
BC_BASE_CURRENCY=ILS           # Israeli Shekel
BC_TIMEZONE=Asia/Jerusalem     # Palestine timezone
BC_IPINFO_DEFAULT_COUNTRY=PS   # Palestine
```

## 📊 Service Ports

### Development Ports
- `3000` - Frontend (Customer App)
- `3001` - Backend (Admin Dashboard)
- `4002` - API Server

### Production Ports
- `80` - HTTP (redirects to HTTPS)
- `443` - HTTPS (main application)
- `22` - SSH (server management)

## 🔒 Security Features

### Development
- Basic authentication
- HTTP allowed
- Simple secrets
- Local database

### Production
- Strong JWT/Cookie secrets
- HTTPS enforced
- SSL certificates
- Firewall configured
- Rate limiting
- Security headers
- Fail2ban protection

## 📚 External Services Required

### Required for Production
1. **MongoDB Atlas** - Database hosting
2. **SendGrid/Mailgun** - Email notifications
3. **Twilio** - SMS notifications
4. **Domain Name** - Website hosting

### Optional Services
1. **Stripe/PayPal** - Payment processing
2. **CloudFlare** - CDN and DDoS protection
3. **Sentry** - Error monitoring
4. **Google Analytics** - Website analytics

## 🆘 Getting Help

### Documentation Order
1. **Start here**: [Prerequisites](PREREQUISITES.md)
2. **Development**: [Development Guide](DEVELOPMENT_GUIDE.md)
3. **Production**: [Production Deployment](PRODUCTION_DEPLOYMENT.md)
4. **Configuration**: [Environment Variables](ENVIRONMENT_VARIABLES.md)

### Common Issues
- **Port conflicts**: Check if ports 3000, 3001, 4002 are available
- **Docker issues**: Ensure Docker Desktop is running
- **Database connection**: Wait 30-60 seconds for MongoDB to start
- **Permission errors**: Check file permissions and Docker group membership

### Support Resources
- Check service logs: `docker compose logs service-name`
- Verify configuration: `docker compose config`
- Monitor resources: `docker stats`
- Test connectivity: `curl http://localhost:4002/api/status`

## 🎉 Success Indicators

### Development Ready
- ✅ All services show "healthy" status
- ✅ Frontend loads at http://localhost:3000
- ✅ Backend loads at http://localhost:3001
- ✅ API responds at http://localhost:4002/api/status
- ✅ Can login with admin@bookdress.local / admin123

### Production Ready
- ✅ HTTPS certificate valid
- ✅ Domain resolves correctly
- ✅ All services healthy
- ✅ Email notifications working
- ✅ SMS notifications working
- ✅ Payment processing functional
- ✅ Database backups configured

---

**Ready to deploy BookDress? Start with [Prerequisites](PREREQUISITES.md)!** 🎉👗
