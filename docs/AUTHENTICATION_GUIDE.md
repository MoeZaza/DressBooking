# BookDress Authentication Configuration Guide

## 🚀 Quick Fix for Development

To disable JWT authentication during development and stop getting "No token provided!" errors:

### Option 1: Using the Helper Script (Recommended)
```bash
# Disable authentication for development
node scripts/auth-config.js disable

# Check current status
node scripts/auth-config.js status

# Re-enable authentication when needed
node scripts/auth-config.js enable
```

### Option 2: Manual Environment Variable
Add this to your `.env` file:
```env
BC_DISABLE_AUTH_IN_DEV=true
NODE_ENV=development
```

## 🔧 How It Works

The authentication middleware now checks for development mode:
- If `BC_DISABLE_AUTH_IN_DEV=true` and `NODE_ENV=development`, authentication is bypassed
- All API endpoints will work without JWT tokens
- A warning message is logged: "⚠️ Authentication disabled in development mode"

## 🏭 Production Setup Requirements

For production deployment, you MUST configure these environment variables:

### 1. Core Authentication Settings
```env
# REQUIRED: Set to production mode
NODE_ENV=production

# REQUIRED: Disable development auth bypass
BC_DISABLE_AUTH_IN_DEV=false

# REQUIRED: Strong JWT secret (32+ characters)
BC_JWT_SECRET=your-super-secure-jwt-secret-key-here-32-chars-minimum

# REQUIRED: Strong cookie secret (32+ characters)
BC_COOKIE_SECRET=your-super-secure-cookie-secret-key-here-32-chars-minimum
```

### 2. Database Security
```env
# REQUIRED: Production MongoDB connection string
BC_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookdress?retryWrites=true&w=majority

# REQUIRED: Database encryption key (32+ characters)
DB_ENCRYPTION_KEY=your-secure-32-character-encryption-key-here

# Security features (recommended)
BC_DB_QUERY_SANITIZATION=true
BC_DB_AUDIT_LOGGING=true
BC_DB_FIELD_ENCRYPTION=true
BC_DB_MAX_QUERY_COMPLEXITY=50
```

### 3. HTTPS and Security Headers
```env
# REQUIRED for production
BC_HTTPS=true
BC_PRIVATE_KEY=/path/to/your/private.key
BC_CERTIFICATE=/path/to/your/certificate.crt

# Cookie security
BC_AUTH_COOKIE_DOMAIN=yourdomain.com

# Security monitoring
BC_ENABLE_SECURITY_LOGGING=true
BC_ENABLE_THREAT_DETECTION=true
BC_BLOCK_SUSPICIOUS_REQUESTS=true
BC_ENABLE_IP_BLOCKING=true
```

### 4. Rate Limiting
```env
# API rate limiting
BC_RATE_LIMIT_WINDOW_MS=900000
BC_RATE_LIMIT_MAX_REQUESTS=100
BC_AUTH_RATE_LIMIT_MAX=5
BC_PAYMENT_RATE_LIMIT_MAX=10
```

### 5. External Services (Optional but Recommended)
```env
# Email service
BC_SMTP_HOST=your-smtp-host.com
BC_SMTP_PORT=587
BC_SMTP_USER=your-email@domain.com
BC_SMTP_PASS=your-email-password
BC_SMTP_FROM=noreply@yourdomain.com

# Payment processing
BC_STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
BC_PAYPAL_CLIENT_ID=your_paypal_client_id
BC_PAYPAL_CLIENT_SECRET=your_paypal_client_secret
BC_PAYPAL_SANDBOX=false

# SMS notifications (choose one)
BC_TWILIO_ACCOUNT_SID=your_twilio_sid
BC_TWILIO_AUTH_TOKEN=your_twilio_token
BC_TWILIO_PHONE_NUMBER=+1234567890

# OR AWS SNS
BC_AWS_ACCESS_KEY_ID=your_aws_key
BC_AWS_SECRET_ACCESS_KEY=your_aws_secret
BC_AWS_REGION=us-east-1

# Security
BC_RECAPTCHA_SECRET=your_recaptcha_secret_key
BC_ADMIN_EMAIL=admin@yourdomain.com
```

## 🔒 Security Checklist for Production

- [ ] `NODE_ENV=production`
- [ ] `BC_DISABLE_AUTH_IN_DEV=false`
- [ ] Strong JWT secret (32+ characters)
- [ ] Strong cookie secret (32+ characters)
- [ ] HTTPS enabled with valid certificates
- [ ] Database encryption key configured
- [ ] Rate limiting enabled
- [ ] Security monitoring enabled
- [ ] Admin IP whitelist configured (if needed)
- [ ] All default passwords changed
- [ ] Database connection secured

## ⚠️ Important Security Notes

1. **Never disable authentication in production**
2. **Use strong, unique secrets for JWT and cookies**
3. **Always use HTTPS in production**
4. **Regularly rotate encryption keys**
5. **Monitor security logs**
6. **Keep dependencies updated**

## 🧪 Testing Authentication

After configuration, test your setup:

```bash
# Development (auth disabled)
curl http://localhost:4002/api/some-protected-endpoint

# Production (auth required)
curl -H "x-access-token: your-jwt-token" https://yourdomain.com/api/some-protected-endpoint
```

## 📞 Support

If you encounter issues:
1. Check the console logs for authentication warnings
2. Verify your environment variables
3. Use `node scripts/auth-config.js status` to check configuration
4. Ensure your `.env` file is properly formatted
