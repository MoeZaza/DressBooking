#!/bin/bash

# BookDress - Dress Rental System Setup Script
# This script sets up the complete dress rental platform with Docker

echo ""
echo "👗 BookDress - Dress Rental System Setup 👗"
echo "=========================================="
echo ""
echo "Setting up your complete dress rental platform..."
echo "- Customer Frontend (Arabic/English)"
echo "- Admin Dashboard with Analytics"
echo "- Payment Processing (Stripe/PayPal)"
echo "- Fitting Appointment Booking"
echo "- Email/SMS Notifications"
echo "- Business Intelligence & Reports"
echo ""

# Check if Docker is installed
echo "🔍 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "📥 Installation guide: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available (either standalone or plugin)
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo "✅ Docker Compose (standalone) found"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo "✅ Docker Compose (plugin) found"
else
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    echo "📥 For Docker Engine: sudo apt-get install docker-compose-plugin"
    echo "📥 For standalone: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    echo "💡 For systemd: sudo systemctl start docker"
    echo "💡 For Docker Desktop: Start Docker Desktop application"
    echo "💡 For Docker Engine: sudo service docker start"
    exit 1
fi

echo "✅ Docker is running"

# Check Docker permissions
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker permission issue detected."
    echo "💡 You may need to add your user to the docker group:"
    echo "   sudo usermod -aG docker $USER"
    echo "   newgrp docker"
    echo "💡 Or run this script with sudo"
    exit 1
fi

# Create necessary directories
echo ""
echo "📁 Creating CDN directories for file uploads..."
mkdir -p api/cdn/bookdress/{users,dresses,locations,contracts,licenses}
mkdir -p api/cdn/bookdress/temp/{users,dresses,locations,contracts,licenses}

# Set permissions for CDN directories
chmod -R 755 api/cdn/

echo "✅ CDN directories created"

# Check for environment files
echo ""
echo "🔧 Checking environment configuration..."
echo "✅ Using consolidated environment files (.env.docker per project)"

if [ ! -f "api/.env.docker" ]; then
    echo "❌ API Docker environment file not found!"
    echo "Please ensure api/.env.docker exists with proper configuration."
    exit 1
else
    echo "✅ API environment file ready"
fi

if [ ! -f "backend/.env.docker" ]; then
    echo "❌ Backend Docker environment file not found!"
    echo "Please ensure backend/.env.docker exists with proper configuration."
    exit 1
else
    echo "✅ Backend environment file ready"
fi

if [ ! -f "frontend/.env.docker" ]; then
    echo "❌ Frontend Docker environment file not found!"
    echo "Please ensure frontend/.env.docker exists with proper configuration."
    exit 1
else
    echo "✅ Frontend environment file ready"
fi

echo "✅ Environment configuration ready"

# Build and start the application
echo ""
echo "🚀 Building and starting BookDress application..."
echo "This may take several minutes on first run..."
echo ""
echo "Building services:"
echo "- 📱 Customer Frontend (React + Vite)"
echo "- 👑 Admin Dashboard (React + Vite)"
echo "- 🔧 API Server (Node.js + Express)"
echo "- 🗄️  MongoDB Database"
echo "- 🌐 MongoDB Express (DB Admin)"
echo ""

# Build the images
echo "🔨 Building Docker images..."
if ! $DOCKER_COMPOSE_CMD build --no-cache; then
    echo "❌ Build failed. Please check the error messages above."
    echo "💡 Try: $DOCKER_COMPOSE_CMD logs"
    exit 1
fi

echo "✅ Build completed successfully"

# Start the services
echo ""
echo "🚀 Starting all services..."
if ! $DOCKER_COMPOSE_CMD up -d; then
    echo "❌ Failed to start services. Please check Docker logs."
    echo "💡 Try: $DOCKER_COMPOSE_CMD logs"
    exit 1
fi

echo "⏳ Waiting for services to initialize..."
echo "   - Database initialization may take 30-60 seconds"
echo "   - API server will create sample data automatically"
echo "   - You can monitor progress with: $DOCKER_COMPOSE_CMD logs -f"
sleep 60

# Check if services are running
echo ""
echo "🔍 Checking service status..."
$DOCKER_COMPOSE_CMD ps

# Verify services are healthy
echo ""
echo "🏥 Checking service health..."
for i in {1..12}; do
    if $DOCKER_COMPOSE_CMD ps | grep -q "healthy"; then
        echo "✅ Services are becoming healthy..."
        break
    elif [ $i -eq 12 ]; then
        echo "⚠️  Services may still be starting. Check logs if needed:"
        echo "   $DOCKER_COMPOSE_CMD logs"
    else
        echo "⏳ Waiting for services to become healthy... ($i/12)"
        sleep 10
    fi
done

echo ""
echo "🎉 BookDress Setup Complete! 🎉"
echo "==============================="
echo ""
echo "📱 Access your applications:"
echo "   👗 Customer App:     http://localhost:3000"
echo "   👑 Admin Dashboard:  http://localhost:3001"
echo "   🔧 API Server:       http://localhost:4002"
echo "   🗄️  Database Admin:   http://localhost:8084"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Email:    admin@bookdress.local"
echo "   Password: admin123"
echo "   Language: Arabic (العربية)"
echo ""
echo "⚠️  SECURITY: Change the admin password immediately after first login!"
echo ""
echo "🌟 System Features Ready:"
echo "   ✅ Dress inventory management"
echo "   ✅ Customer booking system"
echo "   ✅ Fitting appointment scheduling"
echo "   ✅ Payment processing (Stripe/PayPal)"
echo "   ✅ Email/SMS notifications"
echo "   ✅ Analytics and business intelligence"
echo "   ✅ Multi-language support (Arabic/English)"
echo "   ✅ Expense tracking and accounting"
echo ""
echo "📋 Quick Start Guide:"
echo "   1. 👑 Admin: Go to http://localhost:3001"
echo "      - Login with admin credentials"
echo "      - Add dress inventory"
echo "      - Configure payment settings"
echo "      - Set up email/SMS notifications"
echo ""
echo "   2. 👗 Customer: Go to http://localhost:3000"
echo "      - Browse available dresses"
echo "      - Book fitting appointments"
echo "      - Make rental reservations"
echo "      - Manage account details"
echo ""
echo "🛠️  Useful Docker Commands:"
echo "   Stop all:     $DOCKER_COMPOSE_CMD down"
echo "   Restart:      $DOCKER_COMPOSE_CMD restart"
echo "   View logs:    $DOCKER_COMPOSE_CMD logs"
echo "   Follow logs:  $DOCKER_COMPOSE_CMD logs -f"
echo "   Rebuild:      $DOCKER_COMPOSE_CMD up --build --force-recreate"
echo "   Clean reset:  $DOCKER_COMPOSE_CMD down -v && $DOCKER_COMPOSE_CMD up --build -d"
echo ""
echo "📚 Documentation:"
echo "   - Complete guide: deployment/DOCKER_COMPLETE_GUIDE.md"
echo "   - Database setup: deployment/DATABASE_SETUP.md"
echo "   - Deployment:     deployment/README.md"
echo ""
echo "🎊 Welcome to BookDress - Your Dress Rental Platform! 👗✨"
echo ""
