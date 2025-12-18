# 🚀 BookDress - Production Deployment Guide

This is the comprehensive guide for deploying the BookDress dress rental system to production using Docker with enterprise-grade security features. This guide covers everything needed for a secure, production-ready deployment.

## 📋 Table of Contents

1. [Quick Production Setup](#quick-production-setup)
2. [Prerequisites](#prerequisites)
3. [System Requirements](#system-requirements)
4. [Security Configuration](#security-configuration)
5. [Environment Setup](#environment-setup)
6. [Docker Production Deployment](#docker-production-deployment)
7. [Database Configuration](#database-configuration)
8. [SSL/TLS Setup](#ssltls-setup)
9. [Email & SMS Configuration](#email--sms-configuration)
10. [Payment Gateway Setup](#payment-gateway-setup)
11. [Security Monitoring](#security-monitoring)
12. [Monitoring & Maintenance](#monitoring--maintenance)
13. [Troubleshooting](#troubleshooting)
14. [Production Checklist](#production-checklist)

## ⚡ Quick Production Setup

### 🚀 One-Command Production Deployment

```bash
# 1. Clone repository
git clone https://github.com/yourusername/bookdress.git
cd bookdress

# 2. Run production setup
./setup-bookdress.bat
# Choose option 2: Production (Docker with full security)

# 3. Follow prompts to configure:
# - Database passwords
# - JWT secrets
# - Payment gateway keys
# - Email/SMS settings
# - SSL certificates
```

### 🛡️ Security Features Included

The production deployment automatically includes:
- ✅ **Content Security Policy** enforcement
- ✅ **Advanced threat detection** (50+ attack patterns)
- ✅ **Real-time security monitoring**
- ✅ **Intelligent rate limiting** with IP blocking
- ✅ **Security headers** enforcement
- ✅ **CORS protection** with abuse detection
- ✅ **Input sanitization** and validation
- ✅ **SSL/TLS** configuration
- ✅ **Database security** with query sanitization
- ✅ **Field-level encryption** for sensitive data
- ✅ **NoSQL injection protection**
- ✅ **Database audit logging**

## 📋 Prerequisites

### Required Services
- **Domain Name**: Your own domain with DNS control
- **Server/VPS**: Linux server with Docker support
- **MongoDB**: MongoDB Atlas (recommended) or self-hosted MongoDB 5.0+
- **Email Service**: SendGrid, Mailgun, or SMTP provider
- **SMS Service**: Twilio or similar SMS provider

### Optional Services
- **Payment Processing**: Stripe and/or PayPal accounts
- **SSL Certificate**: Let's Encrypt (free) or commercial certificate
- **Monitoring**: Sentry, LogRocket, or similar (optional)
- **CDN**: CloudFlare or similar (optional)

## 🖥️ System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps connection
- **Backup**: Automated backup solution

### Port Requirements
Ensure these ports are available and properly configured in your firewall:
- `80` - HTTP (redirects to HTTPS)
- `443` - HTTPS (main application)
- `22` - SSH (for server management)

## ⚙️ Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/bookdress.git
cd bookdress

# Create production environment files
cp api/.env.docker.example api/.env.production
cp backend/.env.docker.example backend/.env.production
cp frontend/.env.docker.example frontend/.env.production

# Create SSL directory
mkdir -p deployment/nginx/ssl

# Create necessary directories
mkdir -p api/cdn/bookdress/{users,dresses,locations,contracts,licenses}
mkdir -p api/cdn/bookdress/temp/{users,dresses,locations,contracts,licenses}
chmod -R 755 api/cdn/
```

## 🐳 Docker Production Deployment

### Production Docker Compose

The production deployment uses `deployment/docker-compose.production.yml` which includes:
- **MongoDB**: Database with persistent storage
- **BookDress API**: Backend API server
- **BookDress Backend**: Admin dashboard
- **BookDress Frontend**: Customer interface
- **Nginx**: Load balancer and SSL termination

### Deploy to Production

```bash
# Navigate to deployment directory
cd deployment

# Configure environment variables (see Environment Variables section)
nano ../api/.env.production
nano ../backend/.env.production
nano ../frontend/.env.production

# Start production deployment
docker-compose -f docker-compose.production.yml up -d --build

# Verify deployment
docker-compose -f docker-compose.production.yml ps
```

### Production Services

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| `mongo` | 27018 | Database | MongoDB ismaster |
| `bookdress-api` | 4002 | API Server | `/api/status` |
| `bookdress-backend` | 3001 | Admin Dashboard | `/` |
| `bookdress-frontend` | 3000/3443 | Customer App | `/` |
| `nginx` | 80/443 | Load Balancer | HTTP response |

## 🗄️ Database Configuration

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to https://cloud.mongodb.com
   - Create a new cluster (M0 free tier or paid)
   - Create database user with `readWrite` permissions
   - Configure IP whitelist (0.0.0.0/0 for all IPs or specific IPs)

2. **Get Connection String**
   ```bash
   # Example connection string format
   mongodb+srv://username:password@cluster.mongodb.net/bookdress?retryWrites=true&w=majority
   ```

3. **Configure in Environment**
   ```env
   # In api/.env.production
   BC_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookdress?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB (Alternative)

```bash
# Install MongoDB 5.0
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
> use bookdress
> db.createUser({
    user: "admin",
    pwd: "your-secure-password",
    roles: ["readWrite", "dbAdmin"]
  })

# Configure connection string
BC_DB_URI=mongodb://admin:your-secure-password@localhost:27017/bookdress?authSource=bookdress
```

### Database Security Configuration

BookDress includes comprehensive database security features:

```env
# Database Security Settings (Production)
DB_ENCRYPTION_KEY=your-secure-32-character-encryption-key-here
BC_DB_QUERY_SANITIZATION=true
BC_DB_AUDIT_LOGGING=true
BC_DB_FIELD_ENCRYPTION=true
BC_DB_MAX_QUERY_COMPLEXITY=50
BC_DB_QUERY_TIMEOUT=30000
```

**Security Features:**
- ✅ **Query Sanitization**: Automatic NoSQL injection protection
- ✅ **Field Encryption**: AES-256-GCM encryption for sensitive data
- ✅ **Audit Logging**: Complete database operation tracking
- ✅ **Connection Security**: SSL/TLS encryption and validation
- ✅ **Query Complexity Limiting**: Protection against complex attack queries
- ✅ **Threat Detection**: Real-time security threat identification

**Security Endpoints:**
- `/api/security/database-health` - Database security status
- `/api/security/database-test` - Security testing endpoint

### Database Initialization

The system automatically creates these collections on first run:
- **Users**: Customer and admin accounts
- **Dresses**: Dress inventory with details
- **Bookings**: Rental bookings and payments
- **FittingAppointments**: Fitting appointment scheduling
- **Suppliers**: Dress suppliers and locations
- **Locations**: Available pickup/delivery locations
- **Payments**: Payment transaction records
- **Expenses**: Business expense tracking
- **Analytics**: Business intelligence data
- **CustomerInsights**: Customer behavior analytics
- **AccessorySettings**: Dynamic accessory pricing

## 🔒 SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Stop nginx temporarily
docker-compose -f docker-compose.production.yml stop nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem deployment/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem deployment/nginx/ssl/

# Set proper permissions
sudo chown $USER:$USER deployment/nginx/ssl/*
chmod 644 deployment/nginx/ssl/fullchain.pem
chmod 600 deployment/nginx/ssl/privkey.pem

# Restart nginx
docker-compose -f docker-compose.production.yml start nginx
```

### Option 2: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout deployment/nginx/ssl/privkey.pem -out deployment/nginx/ssl/fullchain.pem -days 365 -nodes

# Set permissions
chmod 644 deployment/nginx/ssl/fullchain.pem
chmod 600 deployment/nginx/ssl/privkey.pem
```

### SSL Auto-Renewal

```bash
# Create renewal script
sudo tee /etc/cron.d/certbot-renew << EOF
0 12 * * * root certbot renew --quiet --deploy-hook "docker-compose -f /path/to/bookdress/deployment/docker-compose.production.yml restart nginx"
EOF
```

## 📧 Email & SMS Configuration

### Email Service Setup (Required)

#### SendGrid (Recommended)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Create account and verify email
   - Create API key with "Mail Send" permissions

2. **Configure Environment Variables**
   ```env
   # In api/.env.production
   BC_SMTP_HOST=smtp.sendgrid.net
   BC_SMTP_PORT=587
   BC_SMTP_USER=apikey
   BC_SMTP_PASS=your-sendgrid-api-key
   BC_SMTP_FROM=no-reply@yourdomain.com
   BC_ADMIN_EMAIL=admin@yourdomain.com
   ```

#### Alternative Email Providers

**Mailgun:**
```env
BC_SMTP_HOST=smtp.mailgun.org
BC_SMTP_PORT=587
BC_SMTP_USER=postmaster@mg.yourdomain.com
BC_SMTP_PASS=your-mailgun-password
```

**Gmail (App Password):**
```env
BC_SMTP_HOST=smtp.gmail.com
BC_SMTP_PORT=587
BC_SMTP_USER=your-email@gmail.com
BC_SMTP_PASS=your-app-password
```

### SMS Service Setup (Required)

#### Twilio (Recommended)

1. **Create Twilio Account**
   - Go to https://twilio.com
   - Create account and verify phone number
   - Get Account SID, Auth Token, and Phone Number

2. **Configure Environment Variables**
   ```env
   # In api/.env.production
   BC_TWILIO_ACCOUNT_SID=your-account-sid
   BC_TWILIO_AUTH_TOKEN=your-auth-token
   BC_TWILIO_PHONE_NUMBER=+1234567890
   ```

### Notification Features

The system sends notifications for:
- **Booking Confirmations**: Email + SMS to customers
- **Payment Receipts**: Email to customers
- **Fitting Reminders**: Email + SMS 24 hours before appointment
- **Admin Alerts**: Dashboard notifications for new bookings
- **Cancellation Notices**: Email + SMS for booking cancellations

## 💳 Payment Gateway Setup

### Stripe (Primary Payment Method)

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Create account and complete verification
   - Get API keys from Dashboard > Developers > API keys

2. **Configure Environment Variables**
   ```env
   # In api/.env.production
   BC_STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
   BC_STRIPE_SESSION_EXPIRE_AT=82800

   # In frontend/.env.production
   VITE_BC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
   ```

### PayPal (Alternative Payment Method)

1. **Create PayPal Business Account**
   - Go to https://paypal.com
   - Create business account
   - Create app in Developer Dashboard

2. **Configure Environment Variables**
   ```env
   # In api/.env.production
   BC_PAYPAL_CLIENT_ID=your-paypal-client-id
   BC_PAYPAL_CLIENT_SECRET=your-paypal-client-secret
   BC_PAYPAL_SANDBOX=false

   # In frontend/.env.production
   VITE_BC_PAYPAL_CLIENT_ID=your-paypal-client-id
   ```

## 🔐 Security Configuration

### Environment Variables Security

**Required Security Variables:**
```env
# Strong secrets (32+ characters each)
BC_JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
BC_COOKIE_SECRET=your-super-secure-cookie-secret-at-least-32-characters-long

# Session configuration
BC_JWT_EXPIRE_AT=86400
BC_TOKEN_EXPIRE_AT=86400
BC_AUTH_COOKIE_DOMAIN=yourdomain.com
```

### Security Best Practices

1. **Generate Strong Secrets**
   ```bash
   # Generate secure random strings
   openssl rand -base64 32
   ```

2. **Firewall Configuration**
   ```bash
   # Configure UFW firewall
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **SSH Security**
   ```bash
   # Disable password authentication
   sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```

4. **Docker Security**
   ```bash
   # Run containers as non-root user
   # Configure in Dockerfiles with USER directive
   # Limit container resources in docker-compose.yml
   ```

### HTTPS Configuration

```env
# Force HTTPS in production
BC_HTTPS=true
BC_PRIVATE_KEY=/etc/ssl/privkey.pem
BC_CERTIFICATE=/etc/ssl/fullchain.pem
```

## 📊 Monitoring & Maintenance

### Health Checks

The production deployment includes automatic health checks for all services:

```bash
# Check all services status
docker-compose -f docker-compose.production.yml ps

# Check specific service health
docker-compose -f docker-compose.production.yml exec bookdress-api curl -f http://localhost:4002/api/status

# View service logs
docker-compose -f docker-compose.production.yml logs bookdress-api
docker-compose -f docker-compose.production.yml logs nginx
```

### Backup Strategy

#### Database Backup

```bash
# Create backup script
sudo tee /usr/local/bin/bookdress-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/bookdress"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
docker-compose -f /path/to/bookdress/deployment/docker-compose.production.yml exec -T mongo mongodump \
  --host mongo:27017 \
  --username admin \
  --password admin \
  --db bookdress \
  --out /backup/$DATE

# Copy from container
docker cp $(docker-compose -f /path/to/bookdress/deployment/docker-compose.production.yml ps -q mongo):/backup/$DATE $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR/bookdress_backup_$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "bookdress_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/bookdress_backup_$DATE.tar.gz"
EOF

# Make executable
sudo chmod +x /usr/local/bin/bookdress-backup.sh

# Schedule daily backups
echo "0 2 * * * root /usr/local/bin/bookdress-backup.sh" | sudo tee /etc/cron.d/bookdress-backup
```

#### File Backup

```bash
# Backup CDN files
docker run --rm -v bookdress_cdn_data:/data -v $(pwd):/backup alpine tar czf /backup/cdn_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### Log Management

```bash
# Configure log rotation in docker-compose.production.yml
services:
  bookdress-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Updates and Maintenance

```bash
# Update application
cd /path/to/bookdress
git pull origin main
docker-compose -f deployment/docker-compose.production.yml down
docker-compose -f deployment/docker-compose.production.yml up -d --build

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker resources
docker system prune -f
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose -f docker-compose.production.yml restart service-name
```

#### 2. Database Connection Issues
```bash
# Test MongoDB connection
docker-compose -f docker-compose.production.yml exec bookdress-api node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.BC_DB_URI)
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Error:', err));
"
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in deployment/nginx/ssl/fullchain.pem -text -noout

# Test SSL configuration
curl -I https://yourdomain.com
```

#### 4. Email/SMS Not Working
```bash
# Test email configuration
docker-compose -f docker-compose.production.yml exec bookdress-api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.BC_SMTP_HOST,
  port: process.env.BC_SMTP_PORT,
  auth: {
    user: process.env.BC_SMTP_USER,
    pass: process.env.BC_SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### Performance Optimization

1. **Enable Gzip Compression** (configured in nginx)
2. **Database Indexing** (automatically created)
3. **Resource Limits** (configured in docker-compose)
4. **CDN Integration** (optional)

## ✅ Production Checklist

Before going live, ensure all items are completed:

### Infrastructure
- [ ] Server provisioned with adequate resources (4GB+ RAM, 2+ CPU)
- [ ] Domain name configured and DNS pointing to server
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Backup strategy implemented and tested

### Database
- [ ] MongoDB Atlas cluster created or MongoDB installed
- [ ] Database user created with appropriate permissions
- [ ] Connection string tested and working
- [ ] Database backups configured and automated
- [ ] Database security features enabled and tested
- [ ] Database encryption key configured (DB_ENCRYPTION_KEY)
- [ ] Query sanitization verified working
- [ ] Field encryption tested for sensitive data
- [ ] Database security health check passing

### Application
- [ ] Environment variables configured for production
- [ ] Strong secrets generated for JWT and cookies (32+ characters)
- [ ] HTTPS enabled and HTTP redirects working
- [ ] Email service configured and tested
- [ ] SMS service configured and tested
- [ ] Payment gateways configured and tested

### Security
- [ ] All default passwords changed
- [ ] SSH key authentication enabled
- [ ] Firewall configured and enabled
- [ ] Security headers configured in nginx
- [ ] API authentication working correctly

### Dress Rental Features
- [ ] Dress inventory management working
- [ ] Booking system functional
- [ ] Fitting appointment scheduling working
- [ ] Payment processing tested
- [ ] Email/SMS notifications working
- [ ] Analytics and reporting functional
- [ ] Admin dashboard accessible

### Testing
- [ ] API endpoints tested and working
- [ ] Email sending tested
- [ ] SMS sending tested
- [ ] Payment processing tested
- [ ] Authentication and authorization tested
- [ ] Dress booking flow tested end-to-end
- [ ] Admin functions tested
- [ ] Mobile responsiveness tested

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs: `docker-compose -f docker-compose.production.yml logs`
3. Verify environment configuration
4. Check service health: `docker-compose -f docker-compose.production.yml ps`

## 🔄 Maintenance Schedule

### Daily
- Monitor service status
- Check error logs
- Verify backup completion

### Weekly
- Update Docker images
- Review security logs
- Test backup restoration

### Monthly
- Update system packages
- Review and rotate logs
- Performance optimization review
- Security audit

---

Your BookDress dress rental system is now ready for production! 🎉👗

For environment variables reference, see the [Environment Variables Guide](ENVIRONMENT_VARIABLES.md).
For local development setup, see the [Development Guide](DEVELOPMENT_GUIDE.md).
