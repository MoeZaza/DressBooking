# 👗 BookDress - Dress Rental System

[![Build Status](https://github.com/yourusername/bookdress/workflows/build/badge.svg)](https://github.com/yourusername/bookdress/actions)
[![Test Status](https://github.com/yourusername/bookdress/workflows/test/badge.svg)](https://github.com/yourusername/bookdress/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive dress rental management system built with modern web technologies, featuring Arabic/English localization and designed for the Palestinian market.

## ✨ Features

### 🎯 Core Functionality
- **Dress Management**: Complete inventory management with images, sizes, and availability
- **Booking System**: Seamless dress rental with date-based availability
- **Fitting Appointments**: Schedule and manage dress fitting sessions
- **Payment Integration**: Secure payments via Stripe, PayPal, and Visa
- **User Management**: Customer accounts with booking history and preferences

### 🌍 Localization & Regional Focus
- **Arabic/English Support**: Complete RTL/LTR interface with comprehensive translations
- **Palestinian Market**: Default configuration for Palestine (Arabic, ILS currency, Jerusalem timezone)
- **Cultural Adaptation**: Dress-focused terminology and regional preferences

### 👑 Admin & Supplier Features
- **Analytics Dashboard**: Revenue tracking, booking analytics, and performance metrics
- **Inventory Management**: Add, edit, and manage dress collections
- **Booking Management**: View, modify, and track all reservations
- **Accounting System**: Expense tracking and financial reporting
- **Notifications**: Email and SMS alerts for bookings and appointments

### 🔒 Enterprise-Grade Security Features
- **Unified Security Management**: Centralized security monitoring service with real-time dashboard
- **Multi-Layer Protection**: Frontend, backend, and database security with comprehensive threat detection
- **Content Security Policy**: Environment-aware CSP with nonce support and violation reporting
- **Advanced Threat Detection**: Real-time monitoring with 50+ attack pattern detection and automated response
- **Input Sanitization**: Multi-level validation and sanitization against XSS, SQL injection, NoSQL injection
- **Rate Limiting**: Intelligent rate limiting with IP-based tracking and progressive delays
- **Security Monitoring Service**: Dedicated service (port 4002) for continuous security monitoring
- **IP Blacklist Management**: Automated IP blocking with manual override capabilities
- **Security Analytics**: Comprehensive security metrics, trends analysis, and incident reporting
- **Emergency Response**: Security lockdown capabilities and automated threat response

### 🚀 Performance & Reliability
- **Authentication**: JWT-based secure authentication with role-based access
- **Responsive Design**: Mobile-first design compatible with all devices
- **Performance**: Optimized loading with CDN support and caching
- **Health Monitoring**: Comprehensive health checks and system monitoring

## 🚀 Quick Start

### Development Setup

**Windows:**
```bash
# Clone and start development environment
git clone https://github.com/yourusername/bookdress.git
cd bookdress
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
# Clone and start development environment
git clone https://github.com/yourusername/bookdress.git
cd bookdress
chmod +x setup-bookdress.sh
./setup-bookdress.sh
```

### Access Applications
- **Frontend (Customer App)**: http://localhost:3000
- **Backend (Admin Dashboard)**: http://localhost:3001
- **API Server**: http://localhost:4002
- **Database UI**: http://localhost:8084

### Default Login
- **Admin**: admin@bookdress.local / admin123
- **Supplier**: supplier@bookdress.local / supplier123

## 🎛️ Application Management

### Unified Management (New!)
Manage all applications (API, Backend, Frontend) with single commands:

```bash
# Start all applications
npm run start:all

# Check application status
npm run status:all

# Stop all applications
npm run stop:all

# Restart all applications
npm run restart:all
```

**Windows Users can also use batch files:**
```batch
# Start all applications
start-apps.bat start

# Check status
start-apps.bat status

# Stop all applications
stop-apps.bat

# Restart all applications
restart-apps.bat
```

**PowerShell Users:**
```powershell
# Manage applications with PowerShell
.\start-all.ps1 start
.\start-all.ps1 stop
.\start-all.ps1 restart
.\start-all.ps1 status
```

### Features
- ✅ **Background Processes**: Applications run in background, no multiple terminal windows
- ✅ **Smart Process Management**: Automatic PID tracking and cleanup
- ✅ **Port Management**: Automatic port conflict resolution
- ✅ **Status Monitoring**: Real-time application health checking
- ✅ **Cross-Platform**: Works on Windows, Linux, and macOS
- ✅ **Environment Validation**: Checks for required configuration files

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19, TypeScript, Material-UI, Vite
- **Backend**: React 19, TypeScript, Material-UI, Vite (Admin Dashboard)
- **API**: Node.js, Express, TypeScript, MongoDB
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Docker, Docker Compose, Nginx

### Project Structure
```
bookdress/
├── api/                    # Backend API server
├── backend/               # Admin dashboard
├── frontend/              # Customer application
├── packages/              # Shared packages
├── deployment/            # Deployment configurations
└── mobile/               # Mobile app (React Native)
```

## 📚 Documentation

### 🎯 Getting Started
| Guide | Purpose | Link |
|-------|---------|------|
| **Prerequisites** | System requirements and dependencies | [📋 Prerequisites](deployment/PREREQUISITES.md) |
| **Development** | Local development setup | [🛠️ Development Guide](deployment/DEVELOPMENT_GUIDE.md) |
| **Production** | Production deployment | [🚀 Production Deployment](deployment/PRODUCTION_DEPLOYMENT.md) |
| **Environment** | Configuration variables | [🔧 Environment Variables](deployment/ENVIRONMENT_VARIABLES.md) |

### 📖 Additional Resources
- [API Documentation](api/README.md)
- [Frontend Documentation](frontend/README.md)
- [Backend Documentation](backend/README.md)
- [Mobile App Documentation](mobile/README.md)
- [Security Documentation](docs/SECURITY.md)

### 🛡️ Security Management
| Tool | Purpose | Access |
|------|---------|--------|
| **Security Manager** | Unified security management tool | `./security-manager.bat` |
| **Security Monitor** | Real-time security monitoring service | `http://localhost:4002/api/security` |
| **Security Dashboard** | Web-based security dashboard | `http://localhost:4002/api/security/dashboard` |
| **Security Metrics** | Security analytics and metrics | `http://localhost:3001/api/security/metrics` |

## 🔧 Development

### Prerequisites
- Docker Desktop or Docker Engine
- Node.js 18+ (optional, for local development)
- Git

### Development Commands
```bash
# Start all services (including security monitor)
docker compose -f docker-compose.dev.yml up

# Start specific service
docker compose up bc-api
docker compose up bc-frontend
docker compose up bc-backend
docker compose up bc-security-monitor

# View logs
docker compose logs -f bc-api
docker compose logs -f bc-security-monitor

# Run tests
docker compose exec bc-api npm test
docker compose exec bc-frontend npm test
docker compose exec bc-backend npm test

# Security management
./security-manager.bat                    # Unified security management
curl http://localhost:4002/api/security   # Security monitor status
```

### Security Commands
```bash
# Security monitoring and management
./security-manager.bat                    # Main security management tool

# Quick security checks
curl http://localhost:4002/api/security/health        # Security service health
curl http://localhost:4002/api/security/metrics       # Security metrics
curl http://localhost:4002/api/security/incidents     # Recent security incidents

# Security dashboard access
http://localhost:4002/api/security/dashboard          # Main security dashboard
http://localhost:3001/api/security/metrics            # API security metrics
http://localhost:3000/security/dashboard              # Frontend security dashboard
```

### Environment Configuration
The system uses environment-specific configuration:
- **Development**: Local MongoDB, mock services, debug logging
- **Production**: MongoDB Atlas, real services, optimized performance

## 🌍 Localization

### Supported Languages
- **Arabic (ar)**: Primary language with RTL support
- **English (en)**: Secondary language with LTR support

### Regional Configuration
```env
BC_DEFAULT_LANGUAGE=ar          # Arabic by default
BC_BASE_CURRENCY=ILS           # Israeli Shekel
BC_TIMEZONE=Asia/Jerusalem     # Palestine timezone
BC_IPINFO_DEFAULT_COUNTRY=PS   # Palestine country code
```

## 🔒 Security

### Security Features
- JWT-based authentication with secure cookies
- Role-based access control (Admin, Supplier, Customer)
- Input validation and sanitization
- SQL injection prevention
- XSS protection with security headers
- HTTPS enforcement in production
- Rate limiting and DDoS protection
- **Database Security**: Query sanitization, field encryption, audit logging
- **NoSQL Injection Protection**: Advanced query threat detection
- **Field-Level Encryption**: AES-256-GCM encryption for sensitive data

### Security Best Practices
- Strong password requirements
- Secure session management
- Regular security updates
- Environment variable protection
- Database access controls

## 📊 Analytics & Monitoring

### Built-in Analytics
- Revenue tracking and financial reports
- Booking analytics and trends
- Customer behavior insights
- Inventory performance metrics
- Supplier performance tracking

### Monitoring
- Health checks for all services
- Error logging and tracking
- Performance monitoring
- Database monitoring
- Real-time notifications

## 🛡️ Security Features

### Comprehensive Security Implementation

BookDress includes enterprise-grade security features designed to protect against modern web threats:

#### 🔒 Core Security Features
- **Content Security Policy (CSP)**: Environment-aware CSP with nonce support
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **CORS Protection**: Advanced CORS configuration with abuse detection
- **Rate Limiting**: Intelligent rate limiting with automatic IP blocking
- **Input Sanitization**: Protection against XSS, SQL injection, and other attacks

#### 🎯 Threat Detection & Monitoring
- **Real-time Threat Detection**: 50+ attack pattern detection algorithms
- **Security Dashboard**: Comprehensive security monitoring and analytics
- **Incident Tracking**: Automatic security incident logging and alerting
- **IP Reputation**: Automatic blocking of malicious IPs with whitelist support
- **Coordinated Attack Detection**: Identification of distributed attacks

#### 📊 Security Monitoring
```bash
# Access security dashboard
http://localhost:4002/api/security/dashboard

# View real-time security metrics
http://localhost:4002/api/security/realtime

# Check security health
http://localhost:4002/api/security/health

# Test security features (integrated in setup script)
./setup-bookdress.bat (option 4)
```

#### 🔧 Security Configuration

**Development Mode** (Relaxed for debugging):
- CSP in report-only mode
- Higher rate limits
- No IP blocking
- Detailed security logging

**Production Mode** (Strict security):
- Enforced CSP policies
- Strict rate limiting
- Automatic IP blocking
- Real-time threat blocking

#### 🚨 Security Alerts & Notifications
- **Real-time Alerts**: Immediate notification of critical security events
- **Email Notifications**: Security incident reports via email
- **Dashboard Alerts**: Visual alerts in the security dashboard
- **Threshold-based Alerting**: Configurable alert thresholds

#### 📋 Security Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/security/dashboard` | Main security overview |
| `/api/security/realtime` | Real-time security metrics |
| `/api/security/timeline` | Security event timeline |
| `/api/security/threat-intelligence` | Threat analysis |
| `/api/security/incidents` | Security incident tracking |
| `/api/security/health` | Security system health |
| `/api/security/database-health` | Database security status |
| `/api/security/database-test` | Database security testing |

#### 🔐 Production Security Checklist
- [ ] Configure strong passwords and secrets
- [ ] Set up valid SSL certificates
- [ ] Configure admin IP whitelist
- [ ] Set up email/SMS alerts
- [ ] Review security thresholds
- [ ] Enable security monitoring
- [ ] Configure backup procedures
- [ ] Regular security audits

For detailed security documentation, see [SECURITY-COMPLETE.md](docs/SECURITY-COMPLETE.md).

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing
- Conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Start with [Prerequisites](deployment/PREREQUISITES.md)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/bookdress/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/yourusername/bookdress/discussions)

### Community
- **Discord**: Join our community server
- **Twitter**: Follow [@BookDress](https://twitter.com/bookdress)
- **Email**: support@bookdress.com

---

**Ready to start your dress rental business?** 🎉👗

[Get Started](deployment/PREREQUISITES.md) | [View Demo](https://demo.bookdress.com) | [Documentation](deployment/README.md)
