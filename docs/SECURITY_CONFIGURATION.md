# BookDress Security Configuration Guide

## Overview

This guide explains how to configure security settings for BookDress in different environments. The security system is designed to be development-friendly while providing robust protection in production.

## Current Development Configuration

The following security features are **DISABLED** in development for easier testing:

### 1. Input Sanitization Middleware
- **Status**: Disabled in development
- **Reason**: Prevents 400 errors during development and testing
- **Location**: `api/src/app.ts` lines 50-55

### 2. CSRF Protection
- **Status**: Disabled in development
- **Reason**: Simplifies API testing and frontend development
- **Location**: `api/src/app.ts` lines 50-55

### 3. Content Security Policy (CSP)
- **Status**: Report-only mode in development
- **Reason**: Allows unsafe-inline scripts/styles for development tools
- **Configuration**: `BC_CSP_REPORT_ONLY=true` in `.env`

### 4. Permissions Policy Header
- **Status**: Disabled in development
- **Reason**: Prevents parsing errors in development browsers
- **Location**: `api/src/middlewares/security.ts` lines 157-164

### 5. Security Monitoring
- **Status**: Disabled in development
- **Configuration**:
  ```env
  BC_ENABLE_SECURITY_LOGGING=false
  BC_ENABLE_THREAT_DETECTION=false
  BC_BLOCK_SUSPICIOUS_REQUESTS=false
  BC_ENABLE_IP_BLOCKING=false
  ```

### 6. Rate Limiting
- **Status**: Relaxed limits in development
- **Configuration**:
  ```env
  BC_RATE_LIMIT_MAX_REQUESTS=1000
  BC_AUTH_RATE_LIMIT_MAX=100
  BC_PAYMENT_RATE_LIMIT_MAX=100
  ```

### 7. CORS Policy
- **Status**: Permissive for localhost in development
- **Behavior**: Allows all localhost origins automatically
- **Location**: `api/src/config/security.config.ts` lines 240-244

## Production Security Configuration

When deploying to production, follow these steps to enable full security:

### Step 1: Update Environment Variables

Create a production `.env` file with these security settings:

```env
# Production Security Settings
NODE_ENV=production
BC_CSP_REPORT_ONLY=false
BC_ENABLE_SECURITY_LOGGING=true
BC_ENABLE_THREAT_DETECTION=true
BC_BLOCK_SUSPICIOUS_REQUESTS=true
BC_ENABLE_IP_BLOCKING=true

# Strict Rate Limiting
BC_RATE_LIMIT_MAX_REQUESTS=100
BC_AUTH_RATE_LIMIT_MAX=5
BC_PAYMENT_RATE_LIMIT_MAX=10

# HSTS Configuration
BC_HSTS_MAX_AGE=31536000
BC_HSTS_INCLUDE_SUBDOMAINS=true
BC_HSTS_PRELOAD=true

# Admin IP Whitelist (comma-separated)
BC_ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.50

# CSP Reporting
BC_CSP_REPORT_URI=/api/security/csp-report
```

### Step 2: Enable Security Middlewares

Update `api/src/app.ts` to always enable security middlewares in production:

```typescript
// Security middlewares (always enabled in production)
if (env.NODE_ENV === 'production') {
  app.use(inputSanitizationMiddleware)
  app.use(provideCSRFToken)
  app.use(csrfProtectionMiddleware)
}
```

### Step 3: Configure HTTPS

Ensure HTTPS is enabled in production:

```env
BC_HTTPS=true
BC_PRIVATE_KEY=/path/to/ssl/private.key
BC_CERTIFICATE=/path/to/ssl/certificate.crt
```

### Step 4: Update CORS Origins

Configure allowed origins for production:

```typescript
// In api/src/config/security.config.ts
const allowedOrigins = [
  'https://bookdress.com',
  'https://admin.bookdress.com',
  'https://api.bookdress.com'
  // Remove localhost origins
]
```

### Step 5: Database Security

Configure MongoDB with authentication and SSL:

```env
BC_DB_URI="mongodb+srv://username:password@cluster.mongodb.net/bookdress?retryWrites=true&w=majority&ssl=true"
BC_DB_SSL=true
BC_DB_SSL_CERT=/path/to/ssl/mongodb.crt
BC_DB_SSL_CA=/path/to/ssl/mongodb-ca.pem
```

## Security Features Overview

### 1. Content Security Policy (CSP)
- Prevents XSS attacks by controlling resource loading
- Report-only in development, enforced in production
- Supports nonces for inline scripts in production

### 2. CORS Protection
- Controls which origins can access the API
- Permissive for localhost in development
- Strict whitelist in production

### 3. Rate Limiting
- Prevents brute force and DoS attacks
- Different limits for general, auth, and payment endpoints
- Higher limits in development for testing

### 4. Input Sanitization
- Removes malicious content from user inputs
- Detects XSS, SQL injection, and other threats
- Disabled in development to prevent testing issues

### 5. CSRF Protection
- Prevents cross-site request forgery
- Uses tokens for state-changing operations
- Disabled in development for API testing

### 6. Security Headers
- X-Frame-Options, X-Content-Type-Options, etc.
- HSTS for HTTPS enforcement
- Permissions Policy for feature control

### 7. IP Blocking
- Automatic blocking of suspicious IPs
- Configurable thresholds and duration
- Disabled in development

### 8. Security Monitoring
- Logs security events and threats
- Real-time threat detection
- Incident tracking and reporting

## Testing Security Configuration

### Development Testing
```bash
# Test API health
curl http://localhost:4002/api/health

# Test CORS
curl -H "Origin: http://localhost:3001" http://localhost:4002/api/health

# Test rate limiting (should work with high limits)
for i in {1..50}; do curl http://localhost:4002/api/health; done
```

### Production Testing
```bash
# Test CSP enforcement
curl -I https://api.bookdress.com

# Test rate limiting
for i in {1..200}; do curl https://api.bookdress.com/api/health; done

# Test CORS restrictions
curl -H "Origin: https://malicious-site.com" https://api.bookdress.com/api/health
```

## Security Monitoring

### Log Locations
- Security events: `api/logs/security.log`
- General logs: `api/logs/app.log`
- Error logs: `api/logs/error.log`

### Monitoring Endpoints
- Security health: `/api/security/health`
- Security metrics: `/api/security/metrics`
- CSP reports: `/api/security/csp-report`

### Alerts
Configure alerts for:
- High rate limit violations
- CORS violations
- CSP violations
- Suspicious IP activity
- Authentication failures

## Troubleshooting

### Common Development Issues

1. **400 Bad Request errors**
   - Cause: Input sanitization middleware
   - Solution: Ensure `NODE_ENV=development` in `.env`

2. **CORS errors**
   - Cause: Origin not in allowlist
   - Solution: Check CORS configuration in `security.config.ts`

3. **CSP violations in browser console**
   - Cause: Strict CSP in development
   - Solution: Ensure `BC_CSP_REPORT_ONLY=true`

### Production Issues

1. **Legitimate requests blocked**
   - Check IP blocking logs
   - Adjust rate limiting thresholds
   - Review CORS origins

2. **CSP violations**
   - Review CSP reports
   - Update CSP directives as needed
   - Add nonces for inline scripts

3. **Performance issues**
   - Monitor security middleware overhead
   - Adjust logging levels
   - Optimize rate limiting windows

## Security Checklist

### Before Production Deployment

- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure strict CORS origins
- [ ] Enable all security middlewares
- [ ] Set production rate limits
- [ ] Configure CSP enforcement mode
- [ ] Set up security monitoring
- [ ] Configure IP whitelisting for admin access
- [ ] Enable database SSL/TLS
- [ ] Set strong JWT and cookie secrets
- [ ] Configure security headers
- [ ] Set up log monitoring and alerts
- [ ] Test all security features
- [ ] Document security configuration
- [ ] Train team on security procedures

### Regular Security Maintenance

- [ ] Review security logs weekly
- [ ] Update security dependencies monthly
- [ ] Audit CORS origins quarterly
- [ ] Review rate limiting effectiveness
- [ ] Update CSP directives as needed
- [ ] Monitor for new security threats
- [ ] Update IP whitelists as needed
- [ ] Review and rotate secrets annually

## Contact

For security-related questions or to report vulnerabilities, contact the development team.
