# 📋 BookDress - Prerequisites and System Requirements

This guide outlines all prerequisites, system requirements, and dependencies needed to deploy and run the BookDress dress rental system with enterprise-grade security features in both development and production environments.

## 📋 Table of Contents

1. [Quick Setup Requirements](#quick-setup-requirements)
2. [System Requirements](#system-requirements)
3. [Software Dependencies](#software-dependencies)
4. [Security Requirements](#security-requirements)
5. [External Services](#external-services)
6. [Development Prerequisites](#development-prerequisites)
7. [Production Prerequisites](#production-prerequisites)
8. [Network Requirements](#network-requirements)
9. [Installation Guides](#installation-guides)

## ⚡ Quick Setup Requirements

### 🚀 For Immediate Setup

**Minimum Requirements:**
- **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux)
- **Git** for cloning the repository
- **4GB RAM** and **10GB free disk space**

**That's it!** The `setup-bookdress.bat` script handles everything else automatically.

### 🛡️ Security Features Included

The setup automatically configures:
- ✅ **Content Security Policy** with environment awareness
- ✅ **Advanced threat detection** (50+ attack patterns)
- ✅ **Real-time security monitoring**
- ✅ **Intelligent rate limiting** with IP blocking
- ✅ **Security headers** enforcement
- ✅ **CORS protection** with abuse detection

## 🖥️ System Requirements

### Minimum Requirements

**Development Environment:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

**Production Environment:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+, CentOS 8+, Debian 11+

### Recommended Requirements

**Development Environment:**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB SSD
- **OS**: Latest stable versions

**Production Environment:**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps connection
- **Backup**: Automated backup solution

### Supported Operating Systems

| OS | Development | Production | Notes |
|---|---|---|---|
| **Ubuntu** 20.04+ | ✅ | ✅ | Recommended for production |
| **CentOS** 8+ | ✅ | ✅ | Enterprise-grade option |
| **Debian** 11+ | ✅ | ✅ | Stable and secure |
| **Windows** 10+ | ✅ | ❌ | Development only |
| **macOS** 10.15+ | ✅ | ❌ | Development only |

## 🛠️ Software Dependencies

### Core Dependencies

| Software | Version | Required | Purpose |
|----------|---------|----------|---------|
| **Docker** | 20.10+ | ✅ | Container runtime |
| **Docker Compose** | 2.0+ | ✅ | Multi-container orchestration |
| **Git** | 2.0+ | ✅ | Version control |
| **Node.js** | 18+ | 🔶 | Optional for local development |
| **npm** | 8+ | 🔶 | Package management |

### Database

| Option | Version | Environment | Notes |
|--------|---------|-------------|-------|
| **MongoDB Atlas** | 5.0+ | Production | Recommended for production |
| **MongoDB** | 5.0+ | Development/Production | Self-hosted option |
| **MongoDB Express** | Latest | Development | Database management UI |

### Web Server (Production)

| Software | Version | Purpose | Required |
|----------|---------|---------|----------|
| **Nginx** | 1.18+ | Load balancer, SSL termination | ✅ |
| **Certbot** | Latest | SSL certificate management | 🔶 |

## 🌐 External Services

### Required Services

#### Email Service (Required)
Choose one of the following:

| Provider | Purpose | Setup Difficulty | Cost |
|----------|---------|------------------|------|
| **SendGrid** | Email notifications | Easy | Free tier available |
| **Mailgun** | Email notifications | Easy | Free tier available |
| **AWS SES** | Email notifications | Medium | Pay-per-use |
| **Gmail SMTP** | Email notifications | Easy | Free with limits |

#### SMS Service (Required)
| Provider | Purpose | Setup Difficulty | Cost |
|----------|---------|------------------|------|
| **Twilio** | SMS notifications | Easy | Pay-per-message |
| **AWS SNS** | SMS notifications | Medium | Pay-per-message |

### Optional Services

#### Payment Processing
| Provider | Purpose | Setup Difficulty | Cost |
|----------|---------|------------------|------|
| **Stripe** | Online payments | Easy | Transaction fees |
| **PayPal** | Alternative payments | Easy | Transaction fees |

#### Additional Services
| Service | Purpose | Required |
|---------|---------|----------|
| **Domain Name** | Website hosting | ✅ Production |
| **SSL Certificate** | HTTPS security | ✅ Production |
| **CDN** | Content delivery | ⚪ Optional |
| **Monitoring** | System monitoring | ⚪ Optional |
| **Backup Service** | Data backup | 🔶 Recommended |

## 🛠️ Development Prerequisites

### Local Development Setup

1. **Docker Desktop**
   - Windows: Docker Desktop for Windows
   - macOS: Docker Desktop for Mac
   - Linux: Docker Engine + Docker Compose

2. **Code Editor** (Recommended)
   - Visual Studio Code
   - WebStorm
   - Sublime Text

3. **Git Client**
   - Command line Git
   - GitHub Desktop
   - SourceTree

### Development Tools (Optional)

| Tool | Purpose | Required |
|------|---------|----------|
| **Postman** | API testing | ⚪ |
| **MongoDB Compass** | Database GUI | ⚪ |
| **Node.js** | Local development | ⚪ |
| **npm/yarn** | Package management | ⚪ |

### Development Environment Variables

Minimal required environment setup:
```env
# Database (Local MongoDB)
BC_DB_URI=mongodb://admin:admin@mongo:27017/bookdress?authSource=admin

# Basic Configuration
BC_DEFAULT_LANGUAGE=ar
BC_BASE_CURRENCY=ILS
BC_WEBSITE_NAME=BookDress

# Development URLs
BC_FRONTEND_HOST=http://localhost:3000/
BC_BACKEND_HOST=http://localhost:3001/
```

## 🚀 Production Prerequisites

### Server Requirements

1. **VPS/Cloud Server**
   - DigitalOcean Droplet
   - AWS EC2 Instance
   - Google Cloud Compute Engine
   - Linode VPS
   - Vultr Instance

2. **Domain Name**
   - Registered domain name
   - DNS management access
   - A/AAAA records pointing to server

3. **SSL Certificate**
   - Let's Encrypt (free)
   - Commercial SSL certificate
   - Cloudflare SSL (if using Cloudflare)

### Production Services Setup

#### MongoDB Atlas (Recommended)
1. Create account at https://cloud.mongodb.com
2. Create cluster (M0 free tier or paid)
3. Create database user with readWrite permissions
4. Configure IP whitelist
5. Get connection string

#### Email Service (SendGrid Example)
1. Create account at https://sendgrid.com
2. Verify sender identity
3. Create API key with Mail Send permissions
4. Configure domain authentication (optional)

#### SMS Service (Twilio Example)
1. Create account at https://twilio.com
2. Verify phone number
3. Get Account SID and Auth Token
4. Purchase phone number for sending

#### Payment Gateway (Stripe Example)
1. Create account at https://stripe.com
2. Complete business verification
3. Get API keys (publishable and secret)
4. Configure webhooks (optional)

### Production Environment Variables

Complete production setup requires:
```env
# Security (Generate strong secrets)
BC_JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
BC_COOKIE_SECRET=your-super-secure-cookie-secret-32-chars-min

# Database (MongoDB Atlas)
BC_DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookdress

# Email (SendGrid)
BC_SMTP_HOST=smtp.sendgrid.net
BC_SMTP_USER=apikey
BC_SMTP_PASS=your-sendgrid-api-key

# SMS (Twilio)
BC_TWILIO_ACCOUNT_SID=your-twilio-sid
BC_TWILIO_AUTH_TOKEN=your-twilio-token

# Payments (Stripe)
BC_STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key

# HTTPS
BC_HTTPS=true
BC_PRIVATE_KEY=/etc/ssl/privkey.pem
BC_CERTIFICATE=/etc/ssl/fullchain.pem
```

## 🌐 Network Requirements

### Port Requirements

**Development:**
- `3000` - Frontend (Customer App)
- `3001` - Backend (Admin Dashboard)
- `4002` - API Server
- `8084` - MongoDB Express
- `27018` - MongoDB (external access)

**Production:**
- `80` - HTTP (redirects to HTTPS)
- `443` - HTTPS (main application)
- `22` - SSH (server management)

### Firewall Configuration

**Development:**
```bash
# No special firewall configuration needed
# Docker handles port mapping
```

**Production:**
```bash
# Ubuntu/Debian with UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### DNS Configuration

**Production DNS Records:**
```
# Main domain
A     yourdomain.com        -> your-server-ip
AAAA  yourdomain.com        -> your-server-ipv6 (if available)

# Subdomains (optional)
CNAME api.yourdomain.com    -> yourdomain.com
CNAME admin.yourdomain.com  -> yourdomain.com
CNAME www.yourdomain.com    -> yourdomain.com
```

## 🔒 Security Requirements

### 🛡️ Built-in Security Features

BookDress includes enterprise-grade security features that are automatically configured:

#### ✅ Automatically Configured
- **Content Security Policy (CSP)** with nonce support
- **Security Headers** (HSTS, X-Frame-Options, etc.)
- **Threat Detection** with 50+ attack patterns
- **Rate Limiting** with intelligent IP blocking
- **CORS Protection** with abuse detection
- **Input Sanitization** and validation
- **Real-time Security Monitoring**

#### 🔧 Manual Configuration Required

**Production Security Secrets:**
- **JWT Secret**: 32+ character random string
- **Cookie Secret**: 32+ character random string
- **Database Passwords**: Strong passwords (12+ characters)
- **API Keys**: Secure payment gateway and service keys

**SSL/TLS Requirements:**

**Development:**
- HTTP is acceptable for local development
- Self-signed certificates auto-generated if needed

**Production:**
- **HTTPS required** for production deployment
- **Valid SSL certificate** from trusted CA (Let's Encrypt recommended)
- **TLS 1.2+** minimum version
- **Strong cipher suites** (automatically configured)

### 🔐 Security Configuration Levels

#### Development Mode (Relaxed)
- CSP in report-only mode
- Higher rate limits (1000 requests)
- No IP blocking
- Detailed security logging
- Unsafe-inline allowed for debugging

#### Production Mode (Strict)
- CSP enforcement enabled
- Strict rate limits (100 requests)
- Automatic IP blocking
- Real-time threat blocking
- Security headers enforced

### 🚨 Security Monitoring

**Included Monitoring:**
- Real-time security dashboard
- Threat intelligence tracking
- Security incident logging
- Automated alerting system
- IP reputation monitoring

**Access Security Dashboard:**
- URL: `http://localhost:4002/api/security/dashboard`
- Health Check: `http://localhost:4002/api/security/health`
- Self-signed certificates for testing

**Production:**
- HTTPS is mandatory
- Valid SSL certificate required
- TLS 1.2+ support
- Strong cipher suites

### Authentication Requirements

1. **Strong Passwords**
   - Minimum 8 characters
   - Mix of letters, numbers, symbols
   - Different passwords for each service

2. **API Keys and Secrets**
   - 32+ character random strings
   - Unique for each environment
   - Regular rotation

3. **Database Security**
   - Authentication enabled
   - Strong database passwords
   - Network access restrictions

### Security Best Practices

1. **Server Security**
   - Regular security updates
   - SSH key authentication
   - Fail2ban for intrusion prevention
   - Regular security audits

2. **Application Security**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF protection

3. **Data Protection**
   - Regular backups
   - Encrypted data transmission
   - Secure file storage
   - GDPR compliance (if applicable)

## 📦 Installation Guides

### Docker Installation

#### Windows
1. Download Docker Desktop from https://docker.com
2. Run installer and follow setup wizard
3. Restart computer when prompted
4. Verify installation:
   ```cmd
   docker --version
   docker-compose --version
   ```

#### macOS
1. Download Docker Desktop from https://docker.com
2. Drag Docker.app to Applications folder
3. Launch Docker Desktop
4. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

#### Ubuntu/Debian
```bash
# Update package index
sudo apt update

# Install dependencies
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

#### CentOS/RHEL
```bash
# Install dependencies
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

### Git Installation

#### Windows
1. Download Git from https://git-scm.com
2. Run installer with default settings
3. Verify installation:
   ```cmd
   git --version
   ```

#### macOS
```bash
# Using Homebrew (recommended)
brew install git

# Or download from https://git-scm.com
# Verify installation
git --version
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL
sudo yum install git

# Verify installation
git --version
```

### Node.js Installation (Optional)

#### Windows/macOS
1. Download from https://nodejs.org
2. Choose LTS version (18.x)
3. Run installer with default settings
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### MongoDB Installation (Self-Hosted Option)

#### Ubuntu/Debian
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongod --version
```

#### CentOS/RHEL
```bash
# Create MongoDB repository file
sudo tee /etc/yum.repos.d/mongodb-org-5.0.repo << EOF
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF

# Install MongoDB
sudo yum install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongod --version
```

### SSL Certificate Setup (Production)

#### Let's Encrypt with Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
echo "0 12 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab
```

## ✅ Prerequisites Checklist

### Development Environment
- [ ] Docker Desktop installed and running
- [ ] Git installed and configured
- [ ] Code editor installed
- [ ] 4GB+ RAM available
- [ ] 10GB+ free disk space
- [ ] Internet connection for downloading images

### Production Environment
- [ ] Linux server provisioned (4GB+ RAM, 2+ CPU)
- [ ] Docker and Docker Compose installed
- [ ] Domain name registered and configured
- [ ] DNS records pointing to server
- [ ] SSL certificate obtained
- [ ] MongoDB Atlas cluster created (or MongoDB installed)
- [ ] Email service account created (SendGrid/Mailgun)
- [ ] SMS service account created (Twilio)
- [ ] Payment gateway accounts created (Stripe/PayPal)
- [ ] Firewall configured
- [ ] Backup strategy planned

### Security Checklist
- [ ] Strong passwords generated for all services
- [ ] SSH key authentication configured
- [ ] Firewall rules configured
- [ ] SSL certificate installed and tested
- [ ] Environment variables secured
- [ ] Database authentication enabled
- [ ] Regular backup schedule planned

## 📞 Support and Resources

### Official Documentation
- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Git Documentation](https://git-scm.com/doc)

### Service Provider Documentation
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [SendGrid](https://docs.sendgrid.com/)
- [Twilio](https://www.twilio.com/docs)
- [Stripe](https://stripe.com/docs)
- [Let's Encrypt](https://letsencrypt.org/docs/)

### Community Resources
- [Docker Hub](https://hub.docker.com/)
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Issues](https://github.com/)

---

With all prerequisites met, you're ready to deploy BookDress! 🎉👗

Next steps:
- For development: See [Development Guide](DEVELOPMENT_GUIDE.md)
- For production: See [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md)
- For configuration: See [Environment Variables Guide](ENVIRONMENT_VARIABLES.md)
