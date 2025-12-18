# 🛡️ BookDress Comprehensive Security Documentation

## Overview

BookDress implements enterprise-grade security across both frontend and backend systems, providing comprehensive protection against modern web threats while maintaining development-friendly workflows. This document covers the complete security architecture, implementation, configuration, and usage for the entire BookDress dress rental platform.

---

## 🎯 Complete Security Architecture

### ✅ **Full-Stack Security Implementation**

The BookDress system provides comprehensive security across all layers:

#### **Frontend Security Features**
- ✅ **XSS Protection** with DOMPurify and multi-level sanitization
- ✅ **Input Validation & Sanitization** with real-time threat detection
- ✅ **Secure Form Components** with built-in security validation
- ✅ **Content Security Policy (CSP)** with environment-specific configurations
- ✅ **Security Context & Monitoring** with React-based threat tracking
- ✅ **Validation Schemas** for all major entities with security-focused rules
- ✅ **Security Headers** and client-side protection measures

#### **Backend Security Features**
- ✅ **Advanced Input Validation** with 50+ threat detection patterns
- ✅ **Server-Side XSS Protection** with multiple sanitization levels
- ✅ **Authentication Security** with enhanced token validation
- ✅ **Real-time Security Monitoring** with incident management
- ✅ **Database Security** with query sanitization and NoSQL injection prevention
- ✅ **API Security Middleware** with comprehensive request validation
- ✅ **Automated Threat Response** with IP blacklisting and blocking

#### **Integrated Security Features**
- ✅ **Environment-aware security** (development vs production)
- ✅ **Intelligent rate limiting** with IP blocking
- ✅ **CORS protection** with abuse detection
- ✅ **Security headers** enforcement across all endpoints
- ✅ **Comprehensive logging** and security event tracking

---

## 🎨 Frontend Security Implementation

### **Core Frontend Security Services**

#### **1. ValidationService** (`frontend/src/services/ValidationService.ts`)
Comprehensive input validation with threat detection:
```typescript
import ValidationService from '@/services/ValidationService'

const result = ValidationService.validateInput(userInput, 'fieldName', {
  sanitizationLevel: 'strict',
  maxLength: 255,
  allowSpecialChars: false
})

if (result.isValid) {
  // Use result.sanitizedValue
} else {
  // Handle validation errors and threats
}
```

**Threat Detection Patterns:**
- XSS attempts (script injection, event handlers)
- SQL injection patterns
- Command injection attempts
- Template injection
- Path traversal attacks
- LDAP injection

#### **2. XSSProtectionService** (`frontend/src/services/XSSProtectionService.ts`)
Multi-level XSS protection with DOMPurify:
```typescript
import XSSProtectionService from '@/services/XSSProtectionService'

const result = XSSProtectionService.sanitizeHtml(
  userContent,
  ProtectionLevel.STRICT
)

if (result.threatLevel === 'LOW') {
  // Safe to use result.sanitizedContent
}
```

**Protection Levels:**
- **Basic**: Common HTML tags with basic filtering
- **Standard**: Moderate filtering for general use
- **Strict**: Minimal HTML allowed, high security
- **Paranoid**: No HTML allowed, maximum security

#### **3. Secure Form Components** (`frontend/src/components/SecureFormComponents.tsx`)
Security-enhanced UI components:
```tsx
import { SecureEmailField, SecurePasswordField } from '@/components/SecureFormComponents'

<SecureEmailField
  label="Email Address"
  name="email"
  required
  showSecurityIndicator={true}
  onSecureChange={(value, sanitizedValue, isValid) => {
    // Handle secure input change
  }}
/>
```

**Available Components:**
- `SecureTextField` - General text input with validation
- `SecureEmailField` - Email input with email-specific validation
- `SecurePhoneField` - Phone number input with format validation
- `SecurePasswordField` - Password input with strength indicator
- `SecureUrlField` - URL input with protocol validation
- `SecureTextArea` - Multi-line text with character counting

#### **4. Security Context & Monitoring** (`frontend/src/context/SecurityContext.tsx`)
React context for security state management:
```tsx
import { useSecurityContext } from '@/context/SecurityContext'

const { validateInput, sanitizeHtml, reportThreat, isSecure } = useSecurityContext()
```

**Security Monitoring Hooks:**
- `useSecurityMonitoring` - General security monitoring
- `useFormSecurityMonitoring` - Form-specific monitoring
- `useApiSecurityMonitoring` - API security monitoring
- `useXSSMonitoring` - XSS attack monitoring
- `useCSPMonitoring` - Content Security Policy monitoring

---

## 🔧 Backend Security Implementation

### **Core Backend Security Services**

#### **1. BackendValidationService** (`api/src/services/ValidationService.ts`)
Enhanced server-side validation with comprehensive threat detection:
```typescript
import BackendValidationService from './services/ValidationService'

const result = BackendValidationService.validateInput(userInput, 'fieldName', {
  sanitizationLevel: 'strict',
  blockOnThreats: true,
  logThreats: true
}, requestContext)

if (result.blocked) {
  throw new SecurityError(ErrorCode.SECURITY_THREAT_DETECTED, 'Input contains security threats')
}
```

**Enhanced Threat Detection:**
- XSS pattern detection and blocking
- SQL injection prevention
- NoSQL injection protection
- Command injection detection
- Template injection blocking
- Path traversal prevention
- LDAP injection protection
- XXE injection detection
- Header injection prevention

#### **2. BackendXSSProtectionService** (`api/src/services/XSSProtectionService.ts`)
Server-side XSS protection with multiple sanitization libraries:
```typescript
import BackendXSSProtectionService from './services/XSSProtectionService'

const result = BackendXSSProtectionService.sanitizeHtml(
  userContent,
  BackendProtectionLevel.STRICT,
  { logThreats: true, blockOnThreats: true },
  requestContext
)

if (result.blocked) {
  throw new SecurityError(ErrorCode.XSS_ATTEMPT_DETECTED, 'XSS attempt blocked')
}
```

#### **3. SecurityMonitoringService** (`api/src/services/SecurityMonitoringService.ts`)
Real-time security monitoring and incident management:
```typescript
import SecurityMonitoringService from './services/SecurityMonitoringService'

const analysis = SecurityMonitoringService.monitorRequest(req)

if (analysis.shouldBlock) {
  return res.status(403).json({
    error: 'Request blocked due to security threats',
    riskScore: analysis.riskScore
  })
}
```

**Monitoring Capabilities:**
- Real-time threat detection
- Risk score calculation
- IP blacklisting
- Incident tracking
- Security metrics
- Automated alerting

#### **4. Enhanced Authentication Security** (`api/src/middlewares/authJwt.ts`)
Secure token validation with threat detection:
```typescript
// Enhanced authentication with security monitoring
const tokenValidation = BackendValidationService.validateInput(token, 'authToken', {
  sanitizationLevel: 'basic',
  maxLength: 2048,
  blockOnThreats: true
}, requestContext)

if (tokenValidation.blocked) {
  SecurityMonitoringService.recordIncident({
    type: SecurityEventType.AUTHENTICATION_FAILURE,
    severity: ThreatLevel.HIGH,
    description: 'Malicious token detected'
  })
}
```

#### **5. Security Middleware** (`api/src/middlewares/security.ts`)
Comprehensive request sanitization and validation:
```typescript
// Apply security middleware to routes
app.use(sanitizeInput)

// Endpoint-specific validation
router.post('/users',
  validateSecureInput({
    email: { sanitizationLevel: 'strict', maxLength: 254 },
    fullName: { sanitizationLevel: 'strict', maxLength: 100 }
  }),
  userController.createUser
)
```

---

## 🔧 Environment-Aware Configuration

### 🚀 **Development Mode** (Relaxed for debugging)
```bash
# Start development with security features
./setup-bookdress.bat (option 1)
```

**Security Settings:**
- ✅ CSP in **report-only mode** (won't break debugging)
- ✅ **Higher rate limits** (1000 requests vs 100)
- ✅ **No IP blocking** (won't block developers)
- ✅ **Unsafe-inline allowed** for development tools
- ✅ **Localhost origins allowed** for CORS
- ✅ **Security monitoring active** but non-blocking
- ✅ **Detailed logging** for debugging

### 🔒 **Production Mode** (Strict security)
```bash
# Deploy to production with full security
./setup-bookdress.bat (option 2)
```

**Security Settings:**
- ✅ CSP **enforced** (blocks malicious content)
- ✅ **Strict rate limits** (100 requests per window)
- ✅ **Automatic IP blocking** for repeat offenders
- ✅ **No unsafe-inline** (nonce-based CSP)
- ✅ **Restricted CORS origins**
- ✅ **Request blocking** for high-risk threats
- ✅ **Real-time alerts** and monitoring

---

## 🛡️ Security Features Detail

### 1. Content Security Policy (CSP)
- **Nonce-based CSP**: Cryptographically secure nonces for inline scripts/styles
- **Environment-specific directives**: Different policies for dev/staging/production
- **Violation reporting**: Real-time CSP violation detection and logging
- **Automatic policy adjustment**: Based on environment and detected threats

### 2. Security Headers
- **HSTS**: HTTP Strict Transport Security with preload
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME type sniffing protection
- **Referrer-Policy**: Control referrer information leakage
- **Permissions-Policy**: Disable dangerous browser features
- **Cross-Origin policies**: COEP, COOP, CORP for isolation

### 3. Advanced CORS Configuration
- **Environment-specific origins**: Different allowed origins per environment
- **Preflight optimization**: Intelligent caching and validation
- **Violation tracking**: Monitor and log CORS violations
- **Abuse detection**: Identify and block CORS abuse patterns

---

## 🚀 Implementation Guide

### **Frontend Security Setup**

#### **1. Install Dependencies**
```bash
cd frontend
npm install dompurify @types/dompurify xss sanitize-html @types/sanitize-html crypto-js @types/crypto-js
```

#### **2. Initialize Security Context**
```tsx
import { SecurityProvider } from '@/context/SecurityContext'

function App() {
  return (
    <SecurityProvider>
      {/* Your app components */}
    </SecurityProvider>
  )
}
```

#### **3. Replace Standard Inputs with Secure Components**
```tsx
// Before
<TextField
  label="Email"
  name="email"
  type="email"
  onChange={handleChange}
/>

// After
<SecureEmailField
  label="Email"
  name="email"
  showSecurityIndicator={true}
  onSecureChange={handleSecureChange}
/>
```

#### **4. Implement Form Security Validation**
```tsx
import ValidationMiddleware from '@/middleware/ValidationMiddleware'
import { SecurityValidationSchemas } from '@/schemas/SecurityValidationSchemas'

const handleSubmit = async (data) => {
  const result = await ValidationMiddleware.validateWithSchema(
    data,
    SecurityValidationSchemas.User,
    {
      sanitize: true,
      blockOnThreats: true,
      logThreats: true
    }
  )

  if (result.isValid && !result.blocked) {
    await submitForm(result.sanitizedData)
  } else {
    setErrors(result.errors)
  }
}
```

### **Backend Security Setup**

#### **1. Install Dependencies**
```bash
cd api
npm install dompurify @types/dompurify xss sanitize-html joi express-validator zod
```

#### **2. Apply Security Middleware**
```typescript
import { sanitizeInput, validateSecureInput } from './middlewares/security'
import BackendValidationService from './services/ValidationService'
import SecurityMonitoringService from './services/SecurityMonitoringService'

// Apply security middleware globally
app.use(sanitizeInput)
```

#### **3. Secure Route Implementation**
```typescript
import { validateSecureInput, validateEmail } from '../middlewares/security'
import { verifyToken } from '../middlewares/authJwt'

router.post('/users',
  verifyToken,           // Enhanced authentication
  validateEmail,         // Email validation
  validateSecureInput({  // Input validation
    fullName: { sanitizationLevel: 'strict', maxLength: 100 },
    phone: { sanitizationLevel: 'strict', maxLength: 20 }
  }),
  userController.createUser
)
```

#### **4. Custom Security Middleware**
```typescript
export const customSecurityCheck = (req: Request, res: Response, next: NextFunction) => {
  const monitoring = SecurityMonitoringService.getInstance()

  const analysis = monitoring.monitorRequest(req)

  if (analysis.shouldBlock) {
    return res.status(403).json({
      error: 'Request blocked due to security threats',
      riskScore: analysis.riskScore
    })
  }

  next()
}
```

---

## 🔒 Security Best Practices

### **Frontend Security Best Practices**

#### **1. Input Handling**
- Always validate and sanitize user input
- Use appropriate protection levels for different contexts
- Implement real-time validation feedback
- Log security threats for monitoring

#### **2. Component Usage**
- Use secure form components for all user inputs
- Enable security indicators for sensitive fields
- Implement proper error handling
- Provide clear security feedback to users

#### **3. Monitoring**
- Enable security monitoring in production
- Set up threat alerting
- Regularly review security logs
- Monitor security scores and trends

### **Backend Security Best Practices**

#### **1. API Security**
- Apply security middleware to all routes
- Use endpoint-specific validation rules
- Implement proper error handling
- Monitor API usage patterns

#### **2. Authentication & Authorization**
- Validate token format and content
- Check user blacklist status
- Monitor authentication patterns
- Implement session security

#### **3. Database Security**
- Sanitize all database queries
- Use parameterized queries
- Implement access controls
- Monitor database access

#### **4. Threat Response**
- Implement automated blocking for critical threats
- Set up IP blacklisting for repeat offenders
- Configure rate limiting for suspicious activity
- Generate alerts for security teams

---

## 🐳 Production Deployment Security

### **Unified Security Management**

BookDress now includes a dedicated **Security Monitoring Service** that provides centralized security management and real-time monitoring.

#### **Security Services Architecture**
```
┌─────────────────────────────────────────┐
│     Security Monitoring Service        │
│         (Port 4002)                     │
├─────────────────────────────────────────┤
│  • Real-time threat monitoring         │
│  • Security metrics aggregation        │
│  • Incident management                 │
│  • IP blacklist management             │
│  • Configuration management            │
│  • WebSocket real-time updates         │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│         Main Application                │
├─────────────────────────────────────────┤
│  Frontend (3000) ◄──► Backend (3001)   │
│  Backend UI (3001) ◄──► API (4002)     │
└─────────────────────────────────────────┘
```

#### **Security Management Tools**

##### **1. Unified Security Manager (`security-manager.bat`)**
Single script for all security operations:
```bash
# Start security management
./security-manager.bat

# Available options:
# 1. Security dashboard (open in browser)
# 2. Real-time security monitoring
# 3. Security health check
# 4. Security logs analysis
# 5. Generate security report
# 6. Security configuration
# 7. IP blacklist management
# 8. Security maintenance
# 9. Update security settings
# 10. Backup/Restore security config
# 11. Run security tests
# 12. Vulnerability scan
# 13. Performance impact analysis
# 14. Start security monitoring service
# 15. Emergency security lockdown
# 16. Reset security to defaults
```

##### **2. Security Monitoring Service**
Dedicated service for continuous security monitoring:
```bash
# Access security monitoring dashboard
http://localhost:4002/api/security/dashboard

# Real-time security metrics
http://localhost:4002/api/security/metrics

# Security incidents
http://localhost:4002/api/security/incidents

# IP blacklist management
http://localhost:4002/api/security/blacklist
```

#### **Docker Security Configuration**

##### **1. Production Security Setup**
```yaml
# docker-compose.yml
services:
  bc-security-monitor:
    build:
      context: ./security-monitor
    environment:
      - SECURITY_LEVEL=strict
      - ENABLE_REAL_TIME_MONITORING=true
      - ALERT_THRESHOLD_CRITICAL=5
      - DATA_RETENTION_DAYS=30
    ports:
      - "4002:4002"
```

##### **2. Development Security Setup**
```yaml
# docker-compose.dev.yml
services:
  bc-dev-security-monitor:
    build:
      context: ./security-monitor
    environment:
      - SECURITY_LEVEL=standard
      - LOG_LEVEL=debug
      - ALERT_THRESHOLD_CRITICAL=10
      - DATA_RETENTION_DAYS=7
```

#### **Security Environment Variables**
```bash
# Production environment variables
SECURITY_LEVEL=strict
ENABLE_THREAT_BLOCKING=true
ENABLE_SECURITY_MONITORING=true
ENABLE_IP_BLACKLISTING=true
CSP_ENFORCEMENT=true
RATE_LIMIT_STRICT=true
SECURITY_LOG_LEVEL=info
ENABLE_SECURITY_ALERTS=true

# Development environment variables
SECURITY_LEVEL=standard
ENABLE_THREAT_BLOCKING=false
CSP_ENFORCEMENT=false
RATE_LIMIT_STRICT=false
SECURITY_LOG_LEVEL=debug
```

### **Deployment Scripts with Security**

#### **1. Enhanced setup-bookdress.bat**
```batch
@echo off
echo 🛡️ BookDress Secure Deployment
echo.
echo 🎯 Choose deployment mode:
echo   1. Development (Docker with hot reload + relaxed security)
echo   2. Production (Docker with full security + monitoring)
echo   3. Development (Local - requires Node.js)
echo   4. Test security features (Paranoid mode)
echo   5. Security management (unified security tools)
echo   6. Clean and rebuild
echo.
set /p mode="Enter your choice (1-6): "

if "%mode%"=="1" goto dev_docker
if "%mode%"=="2" goto prod_docker
if "%mode%"=="3" goto dev_local
if "%mode%"=="4" goto test_security
if "%mode%"=="5" goto security_management
if "%mode%"=="6" goto clean_rebuild

:prod_docker
echo 🔒 Setting up BookDress for Production (Docker + Strict Security)
set SECURITY_LEVEL=strict
set ENABLE_THREAT_BLOCKING=true
set CSP_ENFORCEMENT=true
set ENABLE_SECURITY_MONITORING=true
docker-compose up -d
goto end

:dev_docker
echo 🚀 Setting up BookDress for Development (Docker + Relaxed Security)
set SECURITY_LEVEL=standard
set ENABLE_THREAT_BLOCKING=false
set CSP_ENFORCEMENT=false
set ENABLE_SECURITY_MONITORING=true
docker-compose -f docker-compose.dev.yml up -d
goto end

:security_management
echo 🛡️ Security Management
echo Starting unified security management tool...
call security-manager.bat
goto end
```

#### **2. Unified Security Manager (security-manager.bat)**
```batch
@echo off
echo 🛡️ BookDress Security Manager
echo.
echo 🎯 Choose security management option:
echo.
echo 📊 MONITORING & ANALYSIS:
echo   1. Security dashboard (open in browser)
echo   2. Real-time security monitoring
echo   3. Security health check
echo   4. Security logs analysis
echo   5. Generate security report
echo.
echo 🔧 MANAGEMENT & MAINTENANCE:
echo   6. Security configuration
echo   7. IP blacklist management
echo   8. Security maintenance
echo   9. Update security settings
echo  10. Backup/Restore security config
echo.
echo 🧪 TESTING & VALIDATION:
echo  11. Run security tests
echo  12. Vulnerability scan
echo  13. Performance impact analysis
echo.
echo 🚀 QUICK ACTIONS:
echo  14. Start security monitoring service
echo  15. Emergency security lockdown
echo  16. Reset security to defaults
```

#### **3. Security Monitoring Service**
The security monitoring service runs automatically and provides:
```bash
# Real-time monitoring endpoints
GET  /api/security/dashboard      # Main security dashboard
GET  /api/security/metrics        # Security metrics
GET  /api/security/incidents      # Security incidents
GET  /api/security/alerts         # Security alerts
POST /api/security/alerts         # Create security alert
GET  /api/security/blacklist      # IP blacklist
POST /api/security/blacklist      # Add IP to blacklist
GET  /api/security/health         # Service health check

# WebSocket endpoints for real-time updates
WS   /socket.io                   # Real-time security updates
```

### 4. Threat Detection & Sanitization
**50+ threat detection patterns including:**
- SQL Injection (multiple variants)
- XSS (script tags, event handlers, protocols)
- Command Injection
- Path Traversal
- Code Injection
- Template Injection
- NoSQL Injection
- LDAP Injection
- XXE attacks
- SSRF attempts

### 5. Real-Time Monitoring
- **Threat scoring**: Dynamic risk assessment for each request
- **IP behavior analysis**: Track and analyze IP patterns over time
- **Coordinated attack detection**: Identify distributed attacks
- **Automatic incident creation**: For security events requiring attention
- **Real-time alerting**: Immediate notification of critical threats

### 6. Rate Limiting & IP Management
- **Intelligent rate limiting**: Different limits for different endpoint types
- **IP reputation tracking**: Maintain reputation scores for IP addresses
- **Automatic IP blocking**: Block IPs that exceed thresholds
- **Whitelist support**: Admin-configurable IP whitelists
- **Geographic analysis**: IP geolocation and risk assessment

---

## 📊 Security Endpoints

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `/api/security/dashboard` | Main security overview | Admin |
| `/api/security/realtime` | Real-time metrics | Admin |
| `/api/security/timeline` | Event timeline | Admin |
| `/api/security/threat-intelligence` | Threat analysis | Admin |
| `/api/security/incidents` | Incident tracking | Admin |
| `/api/security/health` | Security health check | Public |
| `/api/security/monitoring` | Monitoring metrics | Admin |
| `/api/security/cors-report` | CORS security report | Admin |
| `/api/security/csp-report` | CSP violation reports | System |

---

## 🚀 Quick Start

### Development Setup
```bash
# Clone and setup for development
git clone <repository>
cd bookdress
./setup-bookdress.bat
# Choose option 1 for development
```

### Production Deployment
```bash
# Setup for production
./setup-bookdress.bat
# Choose option 2 for production
# Follow prompts to configure security settings
```

### Security Testing
```bash
# Test security features
./setup-bookdress.bat
# Choose option 4 for security testing
```

---

## 🔐 Production Security Checklist

### Before Deployment
- [ ] Configure strong passwords and secrets in `.env.production`
- [ ] Set up valid SSL certificates (replace self-signed)
- [ ] Configure admin IP whitelist
- [ ] Set up email/SMS alerts
- [ ] Review security thresholds
- [ ] Test all security endpoints

### After Deployment
- [ ] Monitor security dashboard regularly
- [ ] Review security logs daily
- [ ] Update security thresholds as needed
- [ ] Configure backup procedures
- [ ] Set up regular security audits
- [ ] Keep system updated

---

## 🔧 Configuration

### Environment Variables

**Security Configuration:**
```bash
# Security basics
BC_COOKIE_SECRET=your_secure_cookie_secret_here_min_32_chars
BC_JWT_SECRET=your_secure_jwt_secret_here_min_32_chars

# CSP Configuration
BC_CSP_REPORT_URI=/api/security/csp-report
BC_CSP_REPORT_ONLY=false  # true for development

# Rate Limiting
BC_RATE_LIMIT_WINDOW_MS=900000
BC_RATE_LIMIT_MAX_REQUESTS=100
BC_AUTH_RATE_LIMIT_MAX=5
BC_PAYMENT_RATE_LIMIT_MAX=10

# Security Monitoring
BC_ENABLE_SECURITY_LOGGING=true
BC_ENABLE_THREAT_DETECTION=true
BC_BLOCK_SUSPICIOUS_REQUESTS=true  # false for development

# IP Blocking
BC_ENABLE_IP_BLOCKING=true  # false for development
BC_IP_BLOCK_THRESHOLD=10
BC_IP_BLOCK_DURATION=3600

# Admin Security
BC_ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.50
BC_TRUSTED_PROXIES=127.0.0.1,::1
```

### Docker Configuration

**Development (docker-compose.dev.yml):**
- Relaxed security settings
- Higher rate limits
- No IP blocking
- Development-friendly CORS

**Production (docker-compose.yml):**
- Strict security enforcement
- Production rate limits
- IP blocking enabled
- Restricted CORS origins

---

## 🚨 Security Monitoring

### Dashboard Access
- **Main Dashboard:** http://localhost:4002/api/security/dashboard
- **Real-time Metrics:** http://localhost:4002/api/security/realtime
- **Health Check:** http://localhost:4002/api/security/health

### Alert Configuration
Configure alerts for:
- Critical security events
- High threat scores
- IP blocking events
- CSP violations
- Rate limit breaches

### Log Analysis
Security logs include:
- Request details and threat scores
- IP behavior patterns
- Attack attempt details
- Security policy violations
- System security health

---

## 🛠️ Troubleshooting

### Common Issues

**CSP Violations in Development:**
- Set `BC_CSP_REPORT_ONLY=true` for development
- Check browser console for CSP errors
- Use security dashboard to review violations

**Rate Limiting Issues:**
- Increase limits for development: `BC_RATE_LIMIT_MAX_REQUESTS=1000`
- Check IP whitelist configuration
- Review rate limiting logs

**CORS Errors:**
- Verify `BC_FRONTEND_HOST` and `BC_BACKEND_HOST` settings
- Check CORS configuration in security dashboard
- Review CORS violation logs

### Security Testing
```bash
# Test security features
./setup-bookdress.bat (option 4)

# Manual testing
curl -I http://localhost:4002/api/security/health
curl http://localhost:4002/api/security/dashboard
```

---

## 📚 Additional Resources

- **API Documentation:** [api/README.md](../api/README.md)
- **Deployment Guide:** [deployment/README.md](../deployment/README.md)
- **Environment Setup:** [deployment/ENVIRONMENT_VARIABLES.md](../deployment/ENVIRONMENT_VARIABLES.md)

---

## 🆘 Support

For security-related issues:
1. Check security dashboard for real-time status
2. Review security logs for detailed information
3. Test with security validation script
4. Consult this documentation for configuration help

**Security is a continuous process - monitor regularly and keep updated!** 🛡️
