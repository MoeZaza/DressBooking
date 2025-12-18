# 🔧 BookDress - Environment Variables Reference

This comprehensive guide documents all environment variables used in the BookDress dress rental system, including the new enterprise-grade security features, for both development and production environments.

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Environment Variables](#api-environment-variables)
3. [Security Environment Variables](#security-environment-variables)
4. [Frontend Environment Variables](#frontend-environment-variables)
5. [Backend Environment Variables](#backend-environment-variables)
6. [Development vs Production](#development-vs-production)
7. [Security Considerations](#security-considerations)
8. [Quick Setup Templates](#quick-setup-templates)

## 📖 Overview

### Environment Files

The BookDress system uses separate environment files for each component:

| Component | Development | Production | Purpose |
|-----------|-------------|------------|---------|
| API | `api/.env.docker` | `api/.env.production` | Backend API server |
| Frontend | `frontend/.env.docker` | `frontend/.env.production` | Customer interface |
| Backend | `backend/.env.docker` | `backend/.env.production` | Admin dashboard |

### Variable Naming Convention

All BookDress variables use the `BC_` prefix (BookDress/BookClothes) or `VITE_BC_` for frontend variables.

### Required vs Optional

- ✅ **Required**: Must be set for the system to function
- 🔶 **Recommended**: Should be set for full functionality
- ⚪ **Optional**: Can be omitted, defaults will be used

## 🔧 API Environment Variables

### Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | `development` | Node.js environment mode |
| `BC_PORT` | ✅ | `4002` | API server port |
| `BC_WEBSITE_NAME` | ✅ | `BookDress` | Application name |
| `BC_DEFAULT_LANGUAGE` | ✅ | `ar` | Default language (ar/en/fr/es) |
| `BC_BASE_CURRENCY` | ✅ | `ILS` | Default currency code |
| `BC_TIMEZONE` | ✅ | `Asia/Jerusalem` | Application timezone |
| `BC_IPINFO_DEFAULT_COUNTRY` | ✅ | `PS` | Default country code |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_DB_URI` | ✅ | - | MongoDB connection string |
| `BC_DB_SSL` | ⚪ | `false` | Enable SSL for database |
| `BC_DB_SSL_CERT` | ⚪ | - | SSL certificate path |
| `BC_DB_SSL_CA` | ⚪ | - | SSL CA certificate path |
| `BC_DB_DEBUG` | ⚪ | `false` | Enable database debug logs |

### Database Security Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_ENCRYPTION_KEY` | 🔶 | `default-key-for-development-only-change-in-production` | Database field encryption key (32+ chars) |
| `BC_DB_QUERY_SANITIZATION` | 🔶 | `true` | Enable query sanitization |
| `BC_DB_AUDIT_LOGGING` | 🔶 | `true` | Enable database audit logging |
| `BC_DB_FIELD_ENCRYPTION` | 🔶 | `true` | Enable field-level encryption |
| `BC_DB_MAX_QUERY_COMPLEXITY` | 🔶 | `100` | Maximum query complexity limit |
| `BC_DB_QUERY_TIMEOUT` | 🔶 | `30000` | Query timeout in milliseconds |
| `BC_DB_CONNECTION_POOL_SIZE` | 🔶 | `10` | Database connection pool size |

**Database Security Features:**
```env
# Database Security Configuration (Production)
DB_ENCRYPTION_KEY=your-secure-32-character-encryption-key-here
BC_DB_QUERY_SANITIZATION=true
BC_DB_AUDIT_LOGGING=true
BC_DB_FIELD_ENCRYPTION=true
BC_DB_MAX_QUERY_COMPLEXITY=50
BC_DB_QUERY_TIMEOUT=30000

# Development (Relaxed Security)
DB_ENCRYPTION_KEY=default-key-for-development-only-change-in-production
BC_DB_MAX_QUERY_COMPLEXITY=100
```

**Example Database URIs:**
```env
# Local MongoDB (Development)
BC_DB_URI=mongodb://admin:admin@mongo:27017/bookdress?authSource=admin

# MongoDB Atlas (Production)
BC_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookdress?retryWrites=true&w=majority

# Self-hosted MongoDB (Production)
BC_DB_URI=mongodb://username:password@localhost:27017/bookdress?authSource=bookdress
```

### Basic Security Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_JWT_SECRET` | ✅ | - | JWT token secret (32+ chars) |
| `BC_COOKIE_SECRET` | ✅ | - | Cookie encryption secret (32+ chars) |
| `BC_JWT_EXPIRE_AT` | 🔶 | `86400` | JWT expiration (seconds) |
| `BC_TOKEN_EXPIRE_AT` | 🔶 | `86400` | Token expiration (seconds) |
| `BC_AUTH_COOKIE_DOMAIN` | 🔶 | `localhost` | Cookie domain |

## 🛡️ Security Environment Variables

### Content Security Policy (CSP)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_CSP_REPORT_URI` | 🔶 | `/api/security/csp-report` | CSP violation report endpoint |
| `BC_CSP_REPORT_ONLY` | 🔶 | `true` (dev), `false` (prod) | CSP report-only mode |

### Security Headers

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_HSTS_MAX_AGE` | 🔶 | `31536000` | HSTS max age (seconds) |
| `BC_HSTS_INCLUDE_SUBDOMAINS` | 🔶 | `true` | Include subdomains in HSTS |
| `BC_HSTS_PRELOAD` | 🔶 | `true` | Enable HSTS preload |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_RATE_LIMIT_WINDOW_MS` | 🔶 | `900000` | Rate limit window (15 min) |
| `BC_RATE_LIMIT_MAX_REQUESTS` | 🔶 | `100` (prod), `1000` (dev) | Max requests per window |
| `BC_AUTH_RATE_LIMIT_MAX` | 🔶 | `5` (prod), `50` (dev) | Auth endpoint rate limit |
| `BC_PAYMENT_RATE_LIMIT_MAX` | 🔶 | `10` (prod), `100` (dev) | Payment endpoint rate limit |

### Security Monitoring

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_ENABLE_SECURITY_LOGGING` | 🔶 | `true` | Enable security event logging |
| `BC_ENABLE_THREAT_DETECTION` | 🔶 | `true` | Enable threat pattern detection |
| `BC_BLOCK_SUSPICIOUS_REQUESTS` | 🔶 | `true` (prod), `false` (dev) | Block suspicious requests |

### IP Blocking

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_ENABLE_IP_BLOCKING` | 🔶 | `true` (prod), `false` (dev) | Enable automatic IP blocking |
| `BC_IP_BLOCK_THRESHOLD` | 🔶 | `10` | Violations before IP block |
| `BC_IP_BLOCK_DURATION` | 🔶 | `3600` | IP block duration (seconds) |

### Admin Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_ADMIN_IP_WHITELIST` | 🔶 | `127.0.0.1,::1` | Admin IP whitelist (comma-separated) |
| `BC_TRUSTED_PROXIES` | 🔶 | `127.0.0.1,::1` | Trusted proxy IPs |

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_FRONTEND_HOST` | 🔶 | `http://localhost:3000` | Frontend origin URL |
| `BC_BACKEND_HOST` | 🔶 | `http://localhost:3001` | Backend origin URL |

### HTTPS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_HTTPS` | 🔶 | `false` | Enable HTTPS |
| `BC_PRIVATE_KEY` | ⚪ | - | SSL private key path |
| `BC_CERTIFICATE` | ⚪ | - | SSL certificate path |

### Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_SMTP_HOST` | ✅ | - | SMTP server hostname |
| `BC_SMTP_PORT` | ✅ | `587` | SMTP server port |
| `BC_SMTP_USER` | ✅ | - | SMTP username |
| `BC_SMTP_PASS` | ✅ | - | SMTP password/API key |
| `BC_SMTP_FROM` | ✅ | - | From email address |
| `BC_ADMIN_EMAIL` | ✅ | - | Admin notification email |

**Email Provider Examples:**
```env
# SendGrid
BC_SMTP_HOST=smtp.sendgrid.net
BC_SMTP_PORT=587
BC_SMTP_USER=apikey
BC_SMTP_PASS=your-sendgrid-api-key

# Mailgun
BC_SMTP_HOST=smtp.mailgun.org
BC_SMTP_PORT=587
BC_SMTP_USER=postmaster@mg.yourdomain.com
BC_SMTP_PASS=your-mailgun-password

# Gmail
BC_SMTP_HOST=smtp.gmail.com
BC_SMTP_PORT=587
BC_SMTP_USER=your-email@gmail.com
BC_SMTP_PASS=your-app-password
```

### SMS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_TWILIO_ACCOUNT_SID` | 🔶 | - | Twilio Account SID |
| `BC_TWILIO_AUTH_TOKEN` | 🔶 | - | Twilio Auth Token |
| `BC_TWILIO_PHONE_NUMBER` | 🔶 | - | Twilio phone number |

### Payment Gateway Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_STRIPE_SECRET_KEY` | 🔶 | - | Stripe secret key |
| `BC_STRIPE_SESSION_EXPIRE_AT` | ⚪ | `82800` | Stripe session timeout |
| `BC_PAYPAL_CLIENT_ID` | ⚪ | - | PayPal client ID |
| `BC_PAYPAL_CLIENT_SECRET` | ⚪ | - | PayPal client secret |
| `BC_PAYPAL_SANDBOX` | ⚪ | `true` | Use PayPal sandbox |

### File Storage Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_CDN_ROOT` | ✅ | `/var/www/cdn` | CDN root directory |
| `BC_CDN_USERS` | ✅ | `/var/www/cdn/bookdress/users` | User files path |
| `BC_CDN_TEMP_USERS` | ✅ | `/var/www/cdn/bookdress/temp/users` | Temp user files |
| `BC_CDN_DRESSES` | ✅ | `/var/www/cdn/bookdress/dresses` | Dress images path |
| `BC_CDN_TEMP_DRESSES` | ✅ | `/var/www/cdn/bookdress/temp/dresses` | Temp dress images |
| `BC_CDN_LOCATIONS` | ✅ | `/var/www/cdn/bookdress/locations` | Location images |
| `BC_CDN_TEMP_LOCATIONS` | ✅ | `/var/www/cdn/bookdress/temp/locations` | Temp location images |
| `BC_CDN_CONTRACTS` | ✅ | `/var/www/cdn/bookdress/contracts` | Contract files |
| `BC_CDN_TEMP_CONTRACTS` | ✅ | `/var/www/cdn/bookdress/temp/contracts` | Temp contracts |
| `BC_CDN_LICENSES` | ✅ | `/var/www/cdn/bookdress/licenses` | License files |
| `BC_CDN_TEMP_LICENSES` | ✅ | `/var/www/cdn/bookdress/temp/licenses` | Temp licenses |

### Application URLs

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_FRONTEND_HOST` | ✅ | `http://localhost:3000/` | Frontend URL |
| `BC_BACKEND_HOST` | ✅ | `http://localhost:3001/` | Backend URL |

### Optional Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BC_RECAPTCHA_SECRET` | ⚪ | - | Google reCAPTCHA secret |
| `BC_IPINFO_API_KEY` | ⚪ | - | IPInfo API key |
| `BC_EXPO_ACCESS_TOKEN` | ⚪ | - | Expo access token (mobile) |

## 🎨 Frontend Environment Variables

### Core Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_NODE_ENV` | ✅ | `production` | Build environment |
| `VITE_BC_API_HOST` | ✅ | `http://localhost:4002` | API server URL |
| `VITE_BC_DEFAULT_LANGUAGE` | ✅ | `ar` | Default language |
| `VITE_BC_BASE_CURRENCY` | ✅ | `ILS` | Default currency |
| `VITE_BC_WEBSITE_NAME` | ✅ | `BookDress` | Website name |

### UI Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_PAGE_SIZE` | ⚪ | `30` | Default page size |
| `VITE_BC_DRESSES_PAGE_SIZE` | ⚪ | `15` | Dresses per page |
| `VITE_BC_BOOKINGS_PAGE_SIZE` | ⚪ | `20` | Bookings per page |
| `VITE_BC_BOOKINGS_MOBILE_PAGE_SIZE` | ⚪ | `10` | Mobile bookings per page |
| `VITE_BC_PAGINATION_MODE` | ⚪ | `classic` | Pagination style |

### CDN Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_CDN_USERS` | ✅ | `http://localhost:4002/cdn/bookdress/users` | User images URL |
| `VITE_BC_CDN_DRESSES` | ✅ | `http://localhost:4002/cdn/bookdress/dresses` | Dress images URL |
| `VITE_BC_CDN_TEMP_DRESSES` | ✅ | `http://localhost:4002/cdn/bookdress/temp/dresses` | Temp dress images |
| `VITE_BC_CDN_LOCATIONS` | ✅ | `http://localhost:4002/cdn/bookdress/locations` | Location images |
| `VITE_BC_CDN_LICENSES` | ⚪ | `http://localhost:4002/cdn/bookdress/licenses` | License files |
| `VITE_BC_CDN_TEMP_LICENSES` | ⚪ | `http://localhost:4002/cdn/bookdress/temp/licenses` | Temp licenses |

### Image Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_SUPPLIER_IMAGE_WIDTH` | ⚪ | `60` | Supplier image width |
| `VITE_BC_SUPPLIER_IMAGE_HEIGHT` | ⚪ | `30` | Supplier image height |
| `VITE_BC_DRESS_IMAGE_WIDTH` | ⚪ | `300` | Dress image width |
| `VITE_BC_DRESS_IMAGE_HEIGHT` | ⚪ | `200` | Dress image height |

### Payment Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_PAYMENT_GATEWAY` | 🔶 | `Stripe` | Primary payment gateway |
| `VITE_BC_STRIPE_PUBLISHABLE_KEY` | 🔶 | - | Stripe publishable key |
| `VITE_BC_PAYPAL_CLIENT_ID` | ⚪ | - | PayPal client ID |

### Feature Toggles

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_RECAPTCHA_ENABLED` | ⚪ | `false` | Enable reCAPTCHA |
| `VITE_BC_RECAPTCHA_SITE_KEY` | ⚪ | - | reCAPTCHA site key |
| `VITE_BC_SET_LANGUAGE_FROM_IP` | ⚪ | `false` | Auto-detect language |
| `VITE_BC_HIDE_SUPPLIERS` | ⚪ | `false` | Hide supplier information |
| `VITE_BC_GOOGLE_ANALYTICS_ENABLED` | ⚪ | `false` | Enable Google Analytics |
| `VITE_BC_GOOGLE_ANALYTICS_ID` | ⚪ | - | Google Analytics ID |

### Business Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_CONTACT_EMAIL` | ✅ | `info@bookdress.com` | Contact email |
| `VITE_BC_DEPOSIT_FILTER_VALUE_1` | ⚪ | `250` | First deposit filter |
| `VITE_BC_DEPOSIT_FILTER_VALUE_2` | ⚪ | `500` | Second deposit filter |
| `VITE_BC_DEPOSIT_FILTER_VALUE_3` | ⚪ | `750` | Third deposit filter |
| `VITE_BC_MIN_LOCATIONS` | ⚪ | `4` | Min locations for tabs |
| `VITE_BC_MIN_RENTAL_HOURS` | ⚪ | `1` | Min rental duration |
| `VITE_BC_MIN_RENTAL_START_HOURS` | ⚪ | `1` | Min hours before rental |

### Social Media Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_FB_APP_ID` | ⚪ | - | Facebook App ID |
| `VITE_BC_APPLE_ID` | ⚪ | - | Apple ID |
| `VITE_BC_GG_APP_ID` | ⚪ | - | Google App ID |

### Map Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BC_MAP_LATITUDE` | ⚪ | `31.7683` | Default map latitude |
| `VITE_BC_MAP_LONGITUDE` | ⚪ | `35.2137` | Default map longitude |
| `VITE_BC_MAP_ZOOM` | ⚪ | `5` | Default map zoom |

### Development Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_PORT` | ⚪ | `3000` | Development server port |
| `VITE_HMR_HOST` | ⚪ | `localhost` | Hot reload host |
| `VITE_HMR_PORT` | ⚪ | `3000` | Hot reload port |
| `VITE_HMR_CLIENT_PORT` | ⚪ | `3000` | Client hot reload port |

## 🎛️ Backend Environment Variables

The backend (admin dashboard) uses similar variables to the frontend but with different defaults:

### Core Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_NODE_ENV` | ✅ | `production` | Build environment |
| `VITE_BC_API_HOST` | ✅ | `http://localhost:4002` | API server URL |
| `VITE_BC_DEFAULT_LANGUAGE` | ✅ | `ar` | Default language |
| `VITE_BC_PAGE_SIZE` | ⚪ | `30` | Default page size |
| `VITE_BC_DRESSES_PAGE_SIZE` | ⚪ | `15` | Dresses per page |
| `VITE_BC_BOOKINGS_PAGE_SIZE` | ⚪ | `20` | Bookings per page |

### CDN Configuration (Same as Frontend)

All `VITE_BC_CDN_*` variables are the same as frontend configuration.

### Development Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_PORT` | ⚪ | `3001` | Development server port |
| `VITE_HMR_HOST` | ⚪ | `localhost` | Hot reload host |
| `VITE_HMR_PORT` | ⚪ | `3001` | Hot reload port |
| `VITE_HMR_CLIENT_PORT` | ⚪ | `3001` | Client hot reload port |

## 🔄 Development vs Production

### Development Environment

**Characteristics:**
- Local MongoDB database
- Mock email/SMS services
- Sandbox payment gateways
- Debug logging enabled
- HTTP (no SSL)
- Relaxed security settings

**Key Differences:**
```env
# Development
NODE_ENV=development
BC_DB_URI=mongodb://admin:admin@mongo:27017/bookdress?authSource=admin
BC_HTTPS=false
BC_DB_DEBUG=true
BC_PAYPAL_SANDBOX=true
BC_RECAPTCHA_ENABLED=false
```

### Production Environment

**Characteristics:**
- MongoDB Atlas or production database
- Real email/SMS services
- Live payment gateways
- Minimal logging
- HTTPS required
- Strong security settings

**Key Differences:**
```env
# Production
NODE_ENV=production
BC_DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookdress
BC_HTTPS=true
BC_DB_DEBUG=false
BC_PAYPAL_SANDBOX=false
BC_RECAPTCHA_ENABLED=true
```

## 🔒 Security Considerations

### Secret Generation

Generate strong secrets for production:

```bash
# Generate 32-character random strings
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Environment File Security

1. **Never commit secrets to version control**
   ```bash
   # Add to .gitignore
   .env
   .env.production
   .env.local
   ```

2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use environment-specific configurations**

### Production Security Checklist

- [ ] Strong JWT and cookie secrets (32+ characters)
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Database connection uses authentication
- [ ] Email/SMS credentials are secure
- [ ] Payment gateway keys are live (not test)
- [ ] reCAPTCHA enabled for forms
- [ ] Debug logging disabled
- [ ] Proper CORS configuration

## 📝 Quick Setup Templates

### Development Template

```env
# api/.env.docker
NODE_ENV=development
BC_PORT=4002
BC_HTTPS=false
BC_DB_URI=mongodb://admin:admin@mongo:27017/bookdress?authSource=admin
BC_COOKIE_SECRET=dev-cookie-secret-change-in-production
BC_JWT_SECRET=dev-jwt-secret-change-in-production
BC_JWT_EXPIRE_AT=86400
BC_DEFAULT_LANGUAGE=ar
BC_BASE_CURRENCY=ILS
BC_TIMEZONE=Asia/Jerusalem
BC_WEBSITE_NAME=BookDress
BC_IPINFO_DEFAULT_COUNTRY=PS
BC_FRONTEND_HOST=http://localhost:3000/
BC_BACKEND_HOST=http://localhost:3001/
BC_ADMIN_EMAIL=admin@bookdress.local
BC_SMTP_HOST=smtp.sendgrid.net
BC_SMTP_PORT=587
BC_SMTP_USER=apikey
BC_SMTP_PASS=your-sendgrid-api-key
BC_SMTP_FROM=no-reply@bookdress.local
BC_CDN_ROOT=/var/www/cdn
BC_CDN_USERS=/var/www/cdn/bookdress/users
BC_CDN_DRESSES=/var/www/cdn/bookdress/dresses
BC_CDN_LOCATIONS=/var/www/cdn/bookdress/locations
BC_CDN_CONTRACTS=/var/www/cdn/bookdress/contracts
BC_CDN_LICENSES=/var/www/cdn/bookdress/licenses
BC_CDN_TEMP_USERS=/var/www/cdn/bookdress/temp/users
BC_CDN_TEMP_DRESSES=/var/www/cdn/bookdress/temp/dresses
BC_CDN_TEMP_LOCATIONS=/var/www/cdn/bookdress/temp/locations
BC_CDN_TEMP_CONTRACTS=/var/www/cdn/bookdress/temp/contracts
BC_CDN_TEMP_LICENSES=/var/www/cdn/bookdress/temp/licenses
```

### Production Template

```env
# api/.env.production
NODE_ENV=production
BC_PORT=4002
BC_HTTPS=true
BC_PRIVATE_KEY=/etc/ssl/privkey.pem
BC_CERTIFICATE=/etc/ssl/fullchain.pem
BC_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookdress?retryWrites=true&w=majority
BC_DB_SSL=true
BC_DB_DEBUG=false
BC_COOKIE_SECRET=your-super-secure-cookie-secret-at-least-32-characters-long
BC_AUTH_COOKIE_DOMAIN=yourdomain.com
BC_JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
BC_JWT_EXPIRE_AT=86400
BC_TOKEN_EXPIRE_AT=86400
BC_DEFAULT_LANGUAGE=ar
BC_BASE_CURRENCY=ILS
BC_TIMEZONE=Asia/Jerusalem
BC_WEBSITE_NAME=BookDress
BC_IPINFO_DEFAULT_COUNTRY=PS
BC_FRONTEND_HOST=https://yourdomain.com/
BC_BACKEND_HOST=https://admin.yourdomain.com/
BC_ADMIN_EMAIL=admin@yourdomain.com
BC_SMTP_HOST=smtp.sendgrid.net
BC_SMTP_PORT=587
BC_SMTP_USER=apikey
BC_SMTP_PASS=your-sendgrid-api-key
BC_SMTP_FROM=no-reply@yourdomain.com
BC_TWILIO_ACCOUNT_SID=your-twilio-account-sid
BC_TWILIO_AUTH_TOKEN=your-twilio-auth-token
BC_TWILIO_PHONE_NUMBER=+1234567890
BC_STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
BC_STRIPE_SESSION_EXPIRE_AT=82800
BC_PAYPAL_CLIENT_ID=your-paypal-client-id
BC_PAYPAL_CLIENT_SECRET=your-paypal-client-secret
BC_PAYPAL_SANDBOX=false
BC_RECAPTCHA_SECRET=your-recaptcha-secret
BC_IPINFO_API_KEY=your-ipinfo-api-key
BC_CDN_ROOT=/var/www/cdn
BC_CDN_USERS=/var/www/cdn/bookdress/users
BC_CDN_DRESSES=/var/www/cdn/bookdress/dresses
BC_CDN_LOCATIONS=/var/www/cdn/bookdress/locations
BC_CDN_CONTRACTS=/var/www/cdn/bookdress/contracts
BC_CDN_LICENSES=/var/www/cdn/bookdress/licenses
BC_CDN_TEMP_USERS=/var/www/cdn/bookdress/temp/users
BC_CDN_TEMP_DRESSES=/var/www/cdn/bookdress/temp/dresses
BC_CDN_TEMP_LOCATIONS=/var/www/cdn/bookdress/temp/locations
BC_CDN_TEMP_CONTRACTS=/var/www/cdn/bookdress/temp/contracts
BC_CDN_TEMP_LICENSES=/var/www/cdn/bookdress/temp/licenses
```

### Frontend Production Template

```env
# frontend/.env.production
VITE_NODE_ENV=production
VITE_BC_API_HOST=https://api.yourdomain.com
VITE_BC_DEFAULT_LANGUAGE=ar
VITE_BC_BASE_CURRENCY=ILS
VITE_BC_WEBSITE_NAME=BookDress
VITE_BC_CONTACT_EMAIL=info@yourdomain.com
VITE_BC_PAGE_SIZE=30
VITE_BC_DRESSES_PAGE_SIZE=15
VITE_BC_BOOKINGS_PAGE_SIZE=20
VITE_BC_BOOKINGS_MOBILE_PAGE_SIZE=10
VITE_BC_CDN_USERS=https://api.yourdomain.com/cdn/bookdress/users
VITE_BC_CDN_DRESSES=https://api.yourdomain.com/cdn/bookdress/dresses
VITE_BC_CDN_TEMP_DRESSES=https://api.yourdomain.com/cdn/bookdress/temp/dresses
VITE_BC_CDN_LOCATIONS=https://api.yourdomain.com/cdn/bookdress/locations
VITE_BC_CDN_LICENSES=https://api.yourdomain.com/cdn/bookdress/licenses
VITE_BC_CDN_TEMP_LICENSES=https://api.yourdomain.com/cdn/bookdress/temp/licenses
VITE_BC_SUPPLIER_IMAGE_WIDTH=60
VITE_BC_SUPPLIER_IMAGE_HEIGHT=30
VITE_BC_DRESS_IMAGE_WIDTH=300
VITE_BC_DRESS_IMAGE_HEIGHT=200
VITE_BC_PAGINATION_MODE=classic
VITE_BC_PAYMENT_GATEWAY=Stripe
VITE_BC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
VITE_BC_PAYPAL_CLIENT_ID=your-paypal-client-id
VITE_BC_RECAPTCHA_ENABLED=true
VITE_BC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
VITE_BC_SET_LANGUAGE_FROM_IP=false
VITE_BC_GOOGLE_ANALYTICS_ENABLED=true
VITE_BC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_BC_DEPOSIT_FILTER_VALUE_1=250
VITE_BC_DEPOSIT_FILTER_VALUE_2=500
VITE_BC_DEPOSIT_FILTER_VALUE_3=750
VITE_BC_MIN_LOCATIONS=4
VITE_BC_HIDE_SUPPLIERS=false
VITE_BC_MIN_RENTAL_START_HOURS=1
VITE_BC_MIN_RENTAL_HOURS=1
VITE_BC_MAP_LATITUDE=31.7683
VITE_BC_MAP_LONGITUDE=35.2137
VITE_BC_MAP_ZOOM=5
```

### Backend Production Template

```env
# backend/.env.production
VITE_NODE_ENV=production
VITE_BC_API_HOST=https://api.yourdomain.com
VITE_BC_DEFAULT_LANGUAGE=ar
VITE_BC_PAGE_SIZE=30
VITE_BC_DRESSES_PAGE_SIZE=15
VITE_BC_BOOKINGS_PAGE_SIZE=20
VITE_BC_CDN_USERS=https://api.yourdomain.com/cdn/bookdress/users
VITE_BC_CDN_TEMP_USERS=https://api.yourdomain.com/cdn/bookdress/temp/users
VITE_BC_CDN_DRESSES=https://api.yourdomain.com/cdn/bookdress/dresses
VITE_BC_CDN_TEMP_DRESSES=https://api.yourdomain.com/cdn/bookdress/temp/dresses
VITE_BC_CDN_LOCATIONS=https://api.yourdomain.com/cdn/bookdress/locations
VITE_BC_CDN_TEMP_LOCATIONS=https://api.yourdomain.com/cdn/bookdress/temp/locations
VITE_BC_CDN_CONTRACTS=https://api.yourdomain.com/cdn/bookdress/contracts
VITE_BC_CDN_TEMP_CONTRACTS=https://api.yourdomain.com/cdn/bookdress/temp/contracts
VITE_BC_CDN_LICENSES=https://api.yourdomain.com/cdn/bookdress/licenses
VITE_BC_CDN_TEMP_LICENSES=https://api.yourdomain.com/cdn/bookdress/temp/licenses
VITE_BC_SUPPLIER_IMAGE_WIDTH=60
VITE_BC_SUPPLIER_IMAGE_HEIGHT=30
VITE_BC_DRESS_IMAGE_WIDTH=300
VITE_BC_DRESS_IMAGE_HEIGHT=200
VITE_BC_PAGINATION_MODE=classic
VITE_BC_WEBSITE_NAME=BookDress
VITE_BC_CONTACT_EMAIL=info@yourdomain.com
VITE_BC_RECAPTCHA_ENABLED=true
VITE_BC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

## 🔍 Environment Validation

### Required Variables Check

Before deployment, ensure all required variables are set:

```bash
# Check API required variables
docker-compose exec bc-api node -e "
const required = ['BC_DB_URI', 'BC_JWT_SECRET', 'BC_COOKIE_SECRET', 'BC_SMTP_HOST', 'BC_SMTP_PASS'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing required variables:', missing);
  process.exit(1);
} else {
  console.log('All required variables are set');
}
"
```

### Environment Testing

```bash
# Test database connection
docker-compose exec bc-api node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.BC_DB_URI)
  .then(() => console.log('✅ Database connection successful'))
  .catch(err => console.error('❌ Database connection failed:', err.message));
"

# Test email configuration
docker-compose exec bc-api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.BC_SMTP_HOST,
  port: process.env.BC_SMTP_PORT,
  auth: { user: process.env.BC_SMTP_USER, pass: process.env.BC_SMTP_PASS }
});
transporter.verify()
  .then(() => console.log('✅ Email configuration successful'))
  .catch(err => console.error('❌ Email configuration failed:', err.message));
"
```

## 📚 Additional Resources

### Related Documentation
- [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)
- [Prerequisites Guide](PREREQUISITES.md)

### External Services Documentation
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [SendGrid](https://docs.sendgrid.com/)
- [Twilio](https://www.twilio.com/docs)
- [Stripe](https://stripe.com/docs)
- [PayPal](https://developer.paypal.com/docs/)

---

This comprehensive environment variables reference ensures your BookDress system is properly configured for both development and production environments! 🎉👗
