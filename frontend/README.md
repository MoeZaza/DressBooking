# 📱 BookDress Frontend - Customer Application

The customer-facing web application for the BookDress dress rental system, built with React 19, TypeScript, and Material-UI.

## 🚀 Features

### Customer Experience
- **Dress Browsing**: Search and filter dresses by size, color, style, and availability
- **Booking System**: Seamless dress rental with date selection and payment
- **Account Management**: User profiles with booking history and preferences
- **Fitting Appointments**: Schedule dress fitting sessions
- **Payment Integration**: Secure checkout with multiple payment options

### User Interface
- **Responsive Design**: Mobile-first design that works on all devices
- **Arabic/English Support**: Complete RTL/LTR interface with translations
- **Modern UI**: Material-UI components with custom theming
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Performance**: Optimized loading with code splitting and lazy loading

### Authentication & Security
- **Google OAuth**: Social login integration
- **Guest Checkout**: Allow bookings without account creation
- **Secure Sessions**: JWT-based authentication with secure cookies
- **Data Protection**: Input validation and XSS protection

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: Material-UI (MUI) v7
- **State Management**: React Context API and hooks
- **Routing**: React Router v6
- **HTTP Client**: Axios for API communication
- **Styling**: CSS-in-JS with MUI's styled system

### Project Structure
```
frontend/
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

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# Payment Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
REACT_APP_PAYPAL_CLIENT_ID=your-paypal-client-id

# Application Settings
REACT_APP_DEFAULT_LANGUAGE=ar
REACT_APP_WEBSITE_NAME=BookDress
```

## 🎨 User Interface

### Pages & Components
- **Home Page**: Featured dresses and search functionality
- **Dress Catalog**: Browse and filter available dresses
- **Dress Details**: Detailed view with images and booking options
- **Checkout**: Secure payment and booking confirmation
- **User Account**: Profile management and booking history
- **Fitting Appointments**: Schedule and manage appointments

### Responsive Design
- **Mobile**: Optimized for smartphones (320px+)
- **Tablet**: Enhanced experience for tablets (768px+)
- **Desktop**: Full-featured desktop interface (1024px+)
- **Large Screens**: Optimized for large displays (1440px+)

### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **High Contrast**: Support for high contrast mode
- **Font Scaling**: Responsive to user font size preferences

## 🌍 Localization

### Supported Languages
- **Arabic (ar)**: Primary language with RTL support
- **English (en)**: Secondary language with LTR support

### Translation Files
```
src/lang/
├── common.ts             # Common UI elements
├── dresses.ts            # Dress-related content
├── booking.ts            # Booking and payment content
├── auth.ts               # Authentication content
└── validation.ts         # Form validation messages
```

### RTL Support
- Automatic text direction based on language
- Mirrored layouts for Arabic interface
- RTL-aware CSS with logical properties
- Icon and image orientation adjustments

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run test             # Run tests
npm run test:coverage    # Run tests with coverage
npm run type-check       # TypeScript type checking
```

### Development Server
- **Hot Reload**: Instant updates during development
- **Error Overlay**: Detailed error information in browser
- **Source Maps**: Debug original TypeScript code
- **Proxy Setup**: API requests proxied to backend server

### Code Quality
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Type safety and better developer experience
- **Husky**: Git hooks for pre-commit checks

## 🧪 Testing

### Testing Setup
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **MSW**: Mock Service Worker for API mocking
- **User Event**: Simulate user interactions

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- DressCard.test.tsx
```

### Test Structure
```
src/
├── components/
│   └── __tests__/        # Component tests
├── pages/
│   └── __tests__/        # Page tests
├── services/
│   └── __tests__/        # Service tests
└── utils/
    └── __tests__/        # Utility tests
```

## 🎯 Performance

### Optimization Features
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching**: Service worker for offline functionality
- **Compression**: Gzip compression for production builds

### Performance Metrics
- **Lighthouse Score**: 90+ for all categories
- **Core Web Vitals**: Optimized for Google's metrics
- **Bundle Size**: Optimized bundle splitting
- **Loading Speed**: Fast initial page load

## 🔒 Security

### Security Features
- **XSS Protection**: Input sanitization and CSP headers
- **CSRF Protection**: SameSite cookies and CSRF tokens
- **Secure Communication**: HTTPS in production
- **Input Validation**: Client-side validation with server verification
- **Authentication**: Secure JWT token handling

### Best Practices
- Environment variables for sensitive data
- No sensitive data in client-side code
- Regular dependency updates
- Security headers configuration
- Content Security Policy implementation

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

### Static Hosting
The frontend is a static React application that can be deployed to:
- **Netlify**: Automatic deployments from Git
- **Vercel**: Zero-configuration deployments
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for open source
- **CDN**: Any CDN with static hosting support

### Docker Deployment
```bash
# Build Docker image
docker build -t bookdress-frontend .

# Run container
docker run -p 3000:80 bookdress-frontend
```

### Environment Variables for Production
```env
REACT_APP_BC_API_HOST=https://api.yourdomain.com
REACT_APP_BC_CDN_USERS=https://cdn.yourdomain.com/users
REACT_APP_BC_CDN_DRESSES=https://cdn.yourdomain.com/dresses
REACT_APP_GOOGLE_CLIENT_ID=your-production-google-client-id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-production-stripe-key
```

## 🎨 Customization

### Theming
- **Material-UI Theme**: Customizable color palette and typography
- **CSS Variables**: Global CSS custom properties
- **Component Overrides**: Custom component styling
- **Responsive Breakpoints**: Configurable screen size breakpoints

### Branding
- **Logo**: Replace logo files in `src/assets/images/`
- **Colors**: Update theme colors in `src/theme/`
- **Typography**: Configure fonts in theme configuration
- **Favicon**: Replace favicon files in `public/`

## 🤝 Contributing

### Development Guidelines
1. Follow React best practices and hooks patterns
2. Use TypeScript for type safety
3. Write tests for new components
4. Follow the established folder structure
5. Use conventional commit messages

### Component Development
- Create reusable components in `src/components/`
- Use Material-UI components as base
- Implement proper TypeScript interfaces
- Add comprehensive prop documentation
- Include accessibility attributes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

For more information, see the [main project documentation](../README.md).
