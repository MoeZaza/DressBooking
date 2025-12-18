# BookDress Application - Deployment Guide

## 🚀 **PRODUCTION DEPLOYMENT GUIDE**

This guide provides comprehensive instructions for deploying the BookDress application to production environments.

## 📋 **SYSTEM REQUIREMENTS**

### **Minimum Requirements**
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v5.0 or higher (MongoDB Atlas recommended)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **Network**: HTTPS/SSL certificate required for production

### **Recommended Production Environment**
- **Cloud Provider**: AWS, Google Cloud, or Azure
- **Database**: MongoDB Atlas (managed service)
- **CDN**: CloudFlare or AWS CloudFront for static assets
- **Load Balancer**: For high availability
- **Monitoring**: Application performance monitoring (APM)

## 🔧 **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Configuration**
- [ ] Set production environment variables
- [ ] Configure MongoDB connection string
- [ ] Set up SSL certificates
- [ ] Configure CORS settings
- [ ] Set up email service (SMTP)
- [ ] Configure file upload storage (AWS S3 or similar)

### **2. Security Configuration**
- [ ] Update JWT secrets
- [ ] Configure rate limiting
- [ ] Set up firewall rules
- [ ] Enable HTTPS only
- [ ] Configure security headers
- [ ] Set up backup procedures

### **3. Performance Optimization**
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Optimize database indexes
- [ ] Set up CDN for static assets
- [ ] Configure connection pooling

## 🏗️ **DEPLOYMENT STEPS**

### **Step 1: Database Setup**

1. **MongoDB Atlas Setup**
   ```bash
   # Create MongoDB Atlas cluster
   # Get connection string: mongodb+srv://user:password@cluster.mongodb.net/bookdress
   ```

2. **Database Initialization**
   ```bash
   # Run database migrations if any
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

### **Step 2: API Deployment**

1. **Build API**
   ```bash
   cd api
   npm install --production
   npm run build
   ```

2. **Environment Variables**
   ```bash
   # Create .env file
   NODE_ENV=production
   PORT=4002
   DB_URI=mongodb+srv://user:password@cluster.mongodb.net/bookdress
   JWT_SECRET=your-super-secure-jwt-secret
   JWT_EXPIRE_AT=86400
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-password
   ```

3. **Start API Server**
   ```bash
   # Using PM2 for production
   npm install -g pm2
   pm2 start dist/src/index.js --name "bookdress-api"
   pm2 startup
   pm2 save
   ```

### **Step 3: Frontend Deployment**

1. **Build Frontend**
   ```bash
   cd frontend
   npm install --production
   npm run build
   ```

2. **Deploy to CDN/Static Hosting**
   ```bash
   # Upload build folder to your hosting service
   # Configure routing for SPA
   ```

### **Step 4: Backend Admin Panel Deployment**

1. **Build Backend**
   ```bash
   cd backend
   npm install --production
   npm run build
   ```

2. **Deploy Backend**
   ```bash
   # Similar to frontend deployment
   # Upload build folder to hosting service
   ```

## 🔒 **SECURITY CONFIGURATION**

### **1. Environment Variables**
```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=your-256-bit-secret-key
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com
```

### **2. MongoDB Security**
```javascript
// Connection with security options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'
}
```

### **3. Express Security Middleware**
```javascript
// Security headers
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS,
  max: process.env.RATE_LIMIT_MAX_REQUESTS
}))
```

## 📊 **MONITORING AND LOGGING**

### **1. Application Monitoring**
```bash
# Install monitoring tools
npm install --save newrelic
npm install --save @sentry/node
```

### **2. Log Configuration**
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### **3. Health Checks**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
```

## 🔄 **BACKUP AND RECOVERY**

### **1. Database Backup**
```bash
# MongoDB backup script
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/bookdress" --out=/backup/$(date +%Y%m%d)
```

### **2. File Backup**
```bash
# Backup uploaded files
aws s3 sync s3://your-bucket s3://your-backup-bucket
```

### **3. Automated Backups**
```bash
# Cron job for daily backups
0 2 * * * /path/to/backup-script.sh
```

## 🚀 **PERFORMANCE OPTIMIZATION**

### **1. Database Optimization**
```javascript
// Create indexes for better performance
db.dresses.createIndex({ "supplier": 1, "available": 1 })
db.dresses.createIndex({ "locations": 1 })
db.bookings.createIndex({ "from": 1, "to": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

### **2. Caching Strategy**
```javascript
// Redis caching
const redis = require('redis')
const client = redis.createClient(process.env.REDIS_URL)

// Cache frequently accessed data
app.get('/api/suppliers', cache(300), getSuppliers)
```

### **3. CDN Configuration**
```javascript
// Static asset optimization
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false
}))
```

## 📱 **MOBILE OPTIMIZATION**

### **1. PWA Configuration**
- Service worker for offline functionality
- Web app manifest for mobile installation
- Push notifications setup

### **2. Performance Metrics**
- Target: First Contentful Paint < 2s
- Target: Largest Contentful Paint < 4s
- Target: Cumulative Layout Shift < 0.1

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

1. **Database Connection Issues**
   ```bash
   # Check MongoDB connection
   mongosh "mongodb+srv://cluster.mongodb.net/bookdress" --username user
   ```

2. **Memory Issues**
   ```bash
   # Monitor memory usage
   pm2 monit
   ```

3. **SSL Certificate Issues**
   ```bash
   # Verify SSL certificate
   openssl s_client -connect yourdomain.com:443
   ```

## 📞 **SUPPORT AND MAINTENANCE**

### **Regular Maintenance Tasks**
- [ ] Weekly database performance review
- [ ] Monthly security updates
- [ ] Quarterly backup testing
- [ ] Annual security audit

### **Support Contacts**
- **Technical Support**: tech@bookdress.io
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.bookdress.io

---

## ✅ **DEPLOYMENT VERIFICATION**

After deployment, verify the following:

1. **API Health Check**: `GET /api/health` returns 200
2. **Authentication**: Login functionality works
3. **Database**: Data queries return expected results
4. **File Uploads**: Image uploads work correctly
5. **Email**: Notification emails are sent
6. **Performance**: Response times are acceptable
7. **Security**: HTTPS is enforced
8. **Monitoring**: Logs are being collected

---

**Last Updated**: July 30, 2025  
**Version**: 1.0.0  
**Environment**: Production Ready
