# 🔌 BookDress API Server

The backend API server for the BookDress dress rental system, built with Node.js, Express, and TypeScript.

## 🚀 Features

### Core API Functionality
- **RESTful API**: Complete REST API with proper HTTP methods and status codes
- **Authentication**: JWT-based authentication with role-based access control
- **Database Integration**: MongoDB with Mongoose ODM for data persistence
- **File Upload**: Image upload and management for dresses and users
- **Payment Processing**: Integration with Stripe, PayPal, and Visa payment gateways

### Business Logic
- **Dress Management**: CRUD operations for dress inventory
- **Booking System**: Reservation management with availability checking
- **Fitting Appointments**: Appointment scheduling and management
- **User Management**: Customer, supplier, and admin account management
- **Notifications**: Email and SMS notification services

### Security & Performance
- **Input Validation**: Comprehensive request validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Error Handling**: Centralized error handling with proper logging
- **Health Checks**: API health monitoring endpoints

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **File Storage**: Local filesystem with CDN support
- **Testing**: Jest with Supertest

### Project Structure
```
api/
├── src/
│   ├── controllers/        # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middlewares/       # Custom middleware
│   ├── config/            # Configuration files
│   ├── common/            # Shared utilities
│   └── scripts/           # Database scripts
├── __tests__/             # Test files
├── cdn/                   # File storage
└── dist/                  # Compiled JavaScript
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
nano .env

# Initialize database
npm run db:init

# Start development server
npm run dev
```

### Environment Configuration
```env
# Server Configuration
BC_PORT=4002
BC_HTTPS=false

# Database
BC_DB_URI=mongodb://localhost:27017/bookdress

# Authentication
BC_JWT_SECRET=your-jwt-secret
BC_COOKIE_SECRET=your-cookie-secret

# Email Service
BC_SMTP_HOST=smtp.sendgrid.net
BC_SMTP_USER=apikey
BC_SMTP_PASS=your-sendgrid-api-key

# SMS Service (Twilio)
BC_TWILIO_ACCOUNT_SID=your-twilio-sid
BC_TWILIO_AUTH_TOKEN=your-twilio-token
BC_TWILIO_PHONE_NUMBER=your-twilio-phone

# Payment Gateways
BC_STRIPE_SECRET_KEY=your-stripe-secret
BC_PAYPAL_CLIENT_ID=your-paypal-client-id
BC_PAYPAL_CLIENT_SECRET=your-paypal-secret
```

## 📡 API Documentation

### 🚀 Interactive Documentation

The BookDress API provides comprehensive interactive documentation using Swagger UI:

- **Swagger UI**: [http://localhost:4002/api-docs](http://localhost:4002/api-docs)
- **OpenAPI JSON**: [http://localhost:4002/api-docs.json](http://localhost:4002/api-docs.json)
- **Health Check**: [http://localhost:4002/api/health](http://localhost:4002/api/health)

### 📚 Documentation Features

- **Interactive Testing**: Test all endpoints directly from the browser
- **Authentication Support**: Built-in JWT token management
- **Request/Response Examples**: Comprehensive examples for all endpoints
- **Schema Validation**: Detailed request/response schema documentation
- **Multi-language Support**: Arabic and English localization
- **Error Handling**: Standardized error responses with detailed descriptions

### 🛠️ Documentation Scripts

```bash
# Generate API documentation files
npm run docs:generate

# Validate API documentation
npm run docs:validate

# Serve documentation (starts dev server)
npm run docs:serve
```

### 📖 API Categories

The API is organized into the following categories:

- **Authentication**: User login, registration, and token management
- **Users**: Profile management, avatar upload, and user operations
- **Dresses**: Catalog management, search, filtering, and analytics
- **Bookings**: Reservation system, payment processing, and history
- **Fitting Appointments**: Scheduling and appointment management
- **Payments**: Stripe, PayPal, and Visa payment processing
- **Locations**: Geographic data and location management
- **Notifications**: Email, SMS, and push notifications
- **Analytics**: Business intelligence and reporting
- **Admin**: Administrative operations and system management
- **Suppliers**: Supplier-specific operations and data isolation

### 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

Obtain tokens from the authentication endpoints:
- `POST /api/sign-up` - User registration
- `POST /api/sign-in/{type}` - User login
- `POST /api/social-sign-in` - Social media login

### 🌍 Localization

The API supports Arabic (ar) and English (en) languages:

```bash
# Set language in Accept-Language header
Accept-Language: ar

# Or use language path parameters where available
GET /api/dress/{id}/ar
```

### 📊 Rate Limiting

API requests are rate-limited to prevent abuse:
- Standard limits apply per IP address
- Higher limits for authenticated users
- Contact support for enterprise limits

### 🔍 Quick Reference

#### Key Endpoints
```
# Authentication
POST   /api/sign-up                    # User registration
POST   /api/sign-in/{type}             # User login
POST   /api/sign-out                   # User logout

# Dresses
GET    /api/dress/{id}/{language}      # Get dress details
POST   /api/frontend-dresses/{page}/{size}  # Search dresses
POST   /api/create-dress               # Create dress (admin/supplier)
PUT    /api/update-dress               # Update dress (admin/supplier)

# Bookings
POST   /api/create-booking             # Create booking
POST   /api/checkout                   # Process payment
POST   /api/cancel-booking/{id}        # Cancel booking

# Fitting Appointments
POST   /api/create-fitting-appointment # Schedule appointment
PUT    /api/update-fitting-appointment # Update appointment
POST   /api/payments/paypal/orders      # Create PayPal order
POST   /api/payments/visa/process       # Process Visa payment
```

### Users
```
GET    /api/users                # List users (admin)
GET    /api/users/:id            # Get user profile
PUT    /api/users/:id            # Update user profile
DELETE /api/users/:id            # Delete user (admin)
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests in watch mode
npm run test:watch
```

### Test Structure
```
__tests__/
├── config.test.ts         # Configuration tests
├── helper.test.ts         # Utility function tests
├── logger.test.ts         # Logging tests
├── api.test.ts           # API endpoint tests
└── globalSetup.ts        # Test setup
```

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run db:init          # Initialize database with default data
npm run db:init:admin    # Create admin user only
npm run db:init:data     # Initialize sample data only
```

### Database Management
```bash
# Initialize database with all data
npm run db:init

# Reset database (development only)
npm run db:reset

# Create database backup
npm run db:backup

# Restore database from backup
npm run db:restore backup-file.json
```

## 🔒 Security

### Security Features
- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Authorization**: Role-based access control (Admin, Supplier, Customer)
- **Input Validation**: Joi schema validation for all requests
- **Rate Limiting**: Express rate limiting middleware
- **CORS**: Configured for specific origins
- **Helmet**: Security headers middleware
- **Password Hashing**: bcrypt with salt rounds

### Security Best Practices
- Environment variables for sensitive data
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF protection with SameSite cookies
- Regular dependency updates

## 📊 Monitoring & Logging

### Logging
- **Winston**: Structured logging with multiple transports
- **Log Levels**: Error, warn, info, debug
- **Log Rotation**: Daily log rotation with compression
- **Request Logging**: Morgan middleware for HTTP request logging

### Health Checks
```
GET /api/status          # API health status
GET /api/health          # Detailed health information
```

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t bookdress-api .

# Run container
docker run -p 4002:4002 bookdress-api
```

### Environment Variables for Production
- Use strong secrets (32+ characters)
- Enable HTTPS
- Configure production database
- Set up real email/SMS services
- Configure payment gateways for live mode

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write tests for new features
3. Use conventional commit messages
4. Run linting before committing
5. Update documentation for API changes

### Code Style
- ESLint configuration for code quality
- Prettier for code formatting
- TypeScript strict mode enabled
- Consistent naming conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

For more information, see the [main project documentation](../README.md).
