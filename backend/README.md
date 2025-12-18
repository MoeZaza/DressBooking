# 👑 BookDress Backend - Admin Dashboard

The admin and supplier dashboard for the BookDress dress rental system, built with React 19, TypeScript, and Material-UI.

## 🚀 Features

### Admin Management
- **Analytics Dashboard**: Revenue tracking, booking analytics, and performance metrics
- **Dress Management**: Complete inventory management with CRUD operations
- **Booking Management**: View, modify, and track all reservations
- **User Management**: Manage customers, suppliers, and admin accounts
- **Financial Reporting**: Expense tracking and accounting features

### Supplier Features
- **Supplier Dashboard**: Dedicated interface for dress suppliers
- **Inventory Control**: Manage supplier-specific dress collections
- **Booking Oversight**: View bookings for supplier's dresses
- **Performance Analytics**: Supplier-specific metrics and reports
- **Data Privacy**: Suppliers only see their own data

### System Administration
- **Role Management**: Admin, supplier, and customer role assignments
- **Notification Center**: System alerts and notifications
- **Settings Management**: Global system configuration
- **Audit Logs**: Track system changes and user activities
- **Data Export**: Export reports and data for analysis

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: Material-UI (MUI) v7 with Data Grid
- **State Management**: React Context API and hooks
- **Charts**: Recharts for analytics visualization
- **Date Handling**: Date-fns for date manipulation
- **HTTP Client**: Axios for API communication

### Project Structure
```
backend/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── services/         # API service functions
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   ├── utils/            # Utility functions
│   ├── lang/             # Localization files
│   ├── assets/           # Static assets (images, CSS)
│   └── types/            # TypeScript type definitions
├── public/               # Public assets
└── dist/                 # Built application
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
nano .env

# Start development server
npm run dev
```

### Environment Configuration
```env
# API Configuration
REACT_APP_BC_API_HOST=http://localhost:4002
REACT_APP_BC_CDN_USERS=http://localhost:4002/api/cdn/users
REACT_APP_BC_CDN_DRESSES=http://localhost:4002/api/cdn/dresses

# Application Settings
REACT_APP_DEFAULT_LANGUAGE=ar
REACT_APP_WEBSITE_NAME=BookDress Admin
REACT_APP_BACKEND_HOST=http://localhost:3001
```

## 🎯 Dashboard Features

### Analytics Dashboard
- **Revenue Charts**: Monthly and yearly revenue tracking
- **Booking Analytics**: Booking trends and patterns
- **Customer Insights**: Customer behavior and preferences
- **Dress Performance**: Most popular and profitable dresses
- **Supplier Metrics**: Supplier performance comparison

### Data Visualization
- **Interactive Charts**: Recharts with hover and click interactions
- **Real-time Updates**: Live data updates without page refresh
- **Export Functionality**: Export charts and data to PDF/Excel
- **Filtering Options**: Date range and category filters
- **Responsive Charts**: Mobile-optimized chart displays

### Management Interfaces
- **Data Grids**: Advanced tables with sorting, filtering, and pagination
- **Form Validation**: Comprehensive form validation with error handling
- **Image Upload**: Drag-and-drop image upload with preview
- **Bulk Operations**: Select and perform actions on multiple items
- **Search & Filter**: Advanced search and filtering capabilities

## 🌍 Localization

### Supported Languages
- **Arabic (ar)**: Primary language with RTL support
- **English (en)**: Secondary language with LTR support

### Translation Files
```
src/lang/
├── common.ts             # Common UI elements
├── dashboard.ts          # Dashboard content
├── dresses.ts            # Dress management content
├── bookings.ts           # Booking management content
├── users.ts              # User management content
└── analytics.ts          # Analytics content
```

### RTL Support
- Automatic layout direction based on language
- RTL-aware Material-UI components
- Mirrored navigation and data grids
- Proper text alignment and spacing

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run test             # Run tests with Vitest
npm run test:coverage    # Run tests with coverage
npm run type-check       # TypeScript type checking
```

### Development Features
- **Hot Module Replacement**: Instant updates during development
- **Error Boundaries**: Graceful error handling in React components
- **Development Tools**: Redux DevTools and React Developer Tools support
- **Mock Data**: Development mode with mock data for testing

### Code Quality
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Type safety and better developer experience
- **Vitest**: Fast unit testing with Vite integration

## 🧪 Testing

### Testing Setup
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for testing
- **MSW**: Mock Service Worker for API mocking

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- AdminDashboard.test.tsx
```

### Test Coverage
- Component testing for all major components
- Integration testing for user workflows
- API service testing with mocked responses
- Utility function testing

## 🔒 Security & Access Control

### Role-Based Access
- **Admin Role**: Full system access and management
- **Supplier Role**: Limited to supplier-specific data and operations
- **Data Isolation**: Suppliers can only access their own data
- **Permission Checks**: Frontend and backend permission validation

### Security Features
- **Authentication**: JWT-based secure authentication
- **Session Management**: Automatic session timeout and renewal
- **Input Validation**: Client-side validation with server verification
- **XSS Protection**: Input sanitization and CSP headers
- **CSRF Protection**: SameSite cookies and CSRF tokens

### Audit & Monitoring
- **Activity Logging**: Track user actions and system changes
- **Error Monitoring**: Comprehensive error tracking and reporting
- **Performance Monitoring**: Track dashboard performance metrics
- **Security Alerts**: Notifications for security-related events

## 📊 Analytics & Reporting

### Financial Analytics
- **Revenue Tracking**: Daily, monthly, and yearly revenue reports
- **Expense Management**: Track and categorize business expenses
- **Profit Analysis**: Calculate profit margins and trends
- **Payment Analytics**: Payment method performance and success rates

### Operational Analytics
- **Booking Trends**: Analyze booking patterns and seasonality
- **Dress Utilization**: Track dress rental frequency and popularity
- **Customer Analytics**: Customer behavior and retention metrics
- **Supplier Performance**: Evaluate supplier contribution and performance

### Export & Reporting
- **PDF Reports**: Generate professional PDF reports
- **Excel Export**: Export data to Excel for further analysis
- **Scheduled Reports**: Automated report generation and delivery
- **Custom Dashboards**: Create personalized dashboard views

## 🎨 User Interface

### Design System
- **Material-UI Components**: Consistent design language
- **Custom Theme**: BookDress-specific color palette and typography
- **Responsive Layout**: Mobile-first responsive design
- **Dark Mode**: Optional dark theme support

### Navigation
- **Sidebar Navigation**: Collapsible sidebar with role-based menu items
- **Breadcrumbs**: Clear navigation hierarchy
- **Quick Actions**: Floating action buttons for common tasks
- **Search**: Global search functionality

### Data Presentation
- **Advanced Data Grids**: Sortable, filterable, and paginated tables
- **Interactive Charts**: Hover effects and drill-down capabilities
- **Card Layouts**: Information cards with actions
- **Modal Dialogs**: Contextual forms and confirmations

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

### Static Hosting
The backend dashboard is a static React application that can be deployed to:
- **Netlify**: Automatic deployments with form handling
- **Vercel**: Zero-configuration deployments
- **AWS S3**: Static website hosting with CloudFront
- **Azure Static Web Apps**: Microsoft Azure hosting
- **Firebase Hosting**: Google Firebase hosting

### Docker Deployment
```bash
# Build Docker image
docker build -t bookdress-backend .

# Run container
docker run -p 3001:80 bookdress-backend
```

### Environment Variables for Production
```env
REACT_APP_BC_API_HOST=https://api.yourdomain.com
REACT_APP_BC_CDN_USERS=https://cdn.yourdomain.com/users
REACT_APP_BC_CDN_DRESSES=https://cdn.yourdomain.com/dresses
REACT_APP_BACKEND_HOST=https://admin.yourdomain.com
```

## 🔧 Customization

### Dashboard Configuration
- **Widget Layout**: Customizable dashboard widget arrangement
- **Chart Types**: Multiple chart types for different data visualization
- **Color Schemes**: Configurable color palettes for charts and UI
- **Branding**: Custom logo and company branding

### Feature Toggles
- **Module Enablement**: Enable/disable specific features
- **Role Permissions**: Customize permissions for different roles
- **UI Customization**: Show/hide UI elements based on configuration
- **Integration Settings**: Configure third-party service integrations

## 🤝 Contributing

### Development Guidelines
1. Follow React best practices and Material-UI patterns
2. Use TypeScript for all new components
3. Write comprehensive tests for new features
4. Follow the established component structure
5. Document complex business logic

### Component Development
- Create reusable components in `src/components/`
- Use Material-UI components as foundation
- Implement proper TypeScript interfaces
- Add accessibility attributes
- Include comprehensive documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

For more information, see the [main project documentation](../README.md).
