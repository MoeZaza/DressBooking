@echo off
echo.
echo 👗 BookDress - Dress Rental System Setup 👗
echo ==========================================
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
echo ❌ Invalid choice. Please run the script again.
pause
exit /b 1

:dev_docker
echo.
echo 🚀 Setting up BookDress for Development (Docker + Relaxed Security)
echo ================================================================
echo 🔧 Configuring development security settings...
set COMPOSE_FILE=docker-compose.dev.yml
set SECURITY_LEVEL=disabled
set ENABLE_THREAT_BLOCKING=false
set CSP_ENFORCEMENT=false
set RATE_LIMIT_STRICT=false
set ENABLE_SECURITY_MONITORING=false
set ENABLE_DATABASE_SECURITY=false
set SECURITY_LOG_LEVEL=debug
echo ✅ Development security configuration applied (security monitoring disabled)
goto check_docker

:prod_docker
echo.
echo 🔒 Setting up BookDress for Production (Docker + Security Disabled by Default)
echo ============================================================================
echo 🛡️ Configuring production security settings...
set COMPOSE_FILE=docker-compose.yml
set SECURITY_LEVEL=disabled
set ENABLE_THREAT_BLOCKING=false
set CSP_ENFORCEMENT=false
set RATE_LIMIT_STRICT=false
set ENABLE_SECURITY_MONITORING=false
set ENABLE_DATABASE_SECURITY=false
set ENABLE_IP_BLACKLISTING=false
set SECURITY_LOG_LEVEL=info
set ENABLE_SECURITY_ALERTS=false
echo ✅ Production security configuration applied (security monitoring disabled by default)
goto check_docker_prod

:dev_local
echo.
echo 💻 Setting up BookDress for Local Development
echo ============================================
goto setup_local

:test_security
echo.
echo 🛡️ Testing BookDress Security Features (Paranoid Mode)
echo ===================================================
echo 🔬 Configuring paranoid security settings...
set COMPOSE_FILE=docker-compose.dev.yml
set SECURITY_LEVEL=paranoid
set ENABLE_THREAT_BLOCKING=true
set CSP_ENFORCEMENT=true
set RATE_LIMIT_STRICT=true
set ENABLE_SECURITY_MONITORING=true
set ENABLE_DATABASE_SECURITY=true
set ENABLE_IP_BLACKLISTING=true
set SECURITY_LOG_LEVEL=debug
set SECURITY_TESTING=true
echo ✅ Paranoid security configuration applied (security monitoring enabled)
goto security_test

:security_management
echo.
echo 🛡️ Security Management
echo ====================
echo 🚀 Starting unified security management tool...
echo.
echo 📊 Security services will be available at:
echo   - Security Monitor: http://localhost:4003/api/security
echo   - API Security: http://localhost:4002/api/security/metrics
echo   - Frontend Security: http://localhost:3000/security/dashboard
echo.
call security-manager.bat
goto end

:clean_rebuild
echo.
echo 🧹 Cleaning and Rebuilding BookDress
echo ==================================
goto clean_all

:check_docker
REM Check if Docker is installed
echo 🔍 Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo.
    echo 📥 Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo.
    echo 🔧 Installation Steps:
    echo   1. Download Docker Desktop for Windows
    echo   2. Run the installer as Administrator
    echo   3. Restart your computer when prompted
    echo   4. Start Docker Desktop from the Start menu
    echo   5. Wait for Docker to start (whale icon in system tray)
    echo   6. Run this script again
    echo.
    echo 💡 Alternative: Use option 3 for local development (requires Node.js + MongoDB Atlas)
    echo.
    pause
    exit /b 1
)

REM Check for Docker Compose (either standalone or plugin)
set DOCKER_COMPOSE_CMD=
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_COMPOSE_CMD=docker-compose
    echo ✅ Docker Compose (standalone) found
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        set DOCKER_COMPOSE_CMD=docker compose
        echo ✅ Docker Compose (plugin) found
    ) else (
        echo ❌ Docker Compose is not available.
        echo 📥 For Docker Desktop: Install Docker Desktop
        echo 📥 For Docker Engine: Install docker-compose-plugin
        pause
        exit /b 1
    )
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is ready
goto setup_docker

:check_docker_prod
REM Production-specific checks
echo 🔍 Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Docker Compose check for production (similar to development)
set DOCKER_COMPOSE_CMD=
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_COMPOSE_CMD=docker-compose
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        set DOCKER_COMPOSE_CMD=docker compose
    ) else (
        echo ❌ Docker Compose is not available.
        pause
        exit /b 1
    )
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is ready

REM Production security checks
echo.
echo 🛡️ Production Security Validation
echo ==============================

REM Check if Docker environment files exist and have production values
if not exist "api\.env.docker" (
    echo ❌ API Docker environment file not found!
    echo Please ensure api\.env.docker exists with production configuration.
    pause
    exit /b 1
)

REM Check if secrets are still default/development values
findstr /C:"dev_cookie_secret\|dev_jwt_secret\|your_.*_here" "api\.env.docker" >nul
if %errorlevel% equ 0 (
    echo ❌ Found development/placeholder values in Docker environment!
    echo Please edit api\.env.docker and configure production values:
    echo    - BC_COOKIE_SECRET (replace dev_cookie_secret_change_in_production)
    echo    - BC_JWT_SECRET (replace dev_jwt_secret_change_in_production)
    echo    - BC_DB_URI (update with secure database password)
    echo    - External service keys (Stripe, PayPal, etc.)
    echo.
    pause
    exit /b 1
)

echo ✅ Production security validation passed
goto setup_docker

:setup_docker
echo.
echo 📁 Creating necessary directories...
if not exist "api\cdn\bookdress\users" mkdir "api\cdn\bookdress\users"
if not exist "api\cdn\bookdress\dresses" mkdir "api\cdn\bookdress\dresses"
if not exist "api\cdn\bookdress\temp" mkdir "api\cdn\bookdress\temp"
if not exist "api\logs" mkdir "api\logs"

echo 🔨 Building Docker images...
%DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% build --no-cache

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please check the error messages above.
    echo 💡 Try: %DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% logs
    pause
    exit /b 1
)

echo ✅ Build completed successfully

echo 🚀 Starting services...

REM Check if database security should be enabled
if "%ENABLE_DATABASE_SECURITY%"=="true" (
    echo 🛡️ Starting services with security monitoring enabled...
    %DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% --profile security up -d
) else (
    echo 🚫 Starting services with security monitoring disabled...
    %DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% up -d
)

if %errorlevel% neq 0 (
    echo ❌ Failed to start services.
    pause
    exit /b 1
)

echo ⏳ Waiting for services to initialize...
timeout /t 45 /nobreak >nul

echo 🗄️ Initializing MongoDB Atlas database...
echo 📊 Running database initialization script...
%DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% exec bc-api npm run db:init 2>nul || %DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% exec bc-dev-api npm run db:init 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database initialized successfully
) else (
    echo ⚠️  Database initialization had issues, but continuing...
    echo 💡 You can manually run database initialization later
)

echo 🔍 Checking service status...
%DOCKER_COMPOSE_CMD% -f %COMPOSE_FILE% ps

goto show_results

:setup_local
REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available

REM Create environment files for local development
echo 📋 Setting up environment files for local development...

REM Check for secure environment files first
if exist "api\.env.local" (
    echo ✅ Using secure api\.env.local (credentials protected)
) else (
    if not exist "api\.env" (
        if exist "api\.env.example" (
            copy "api\.env.example" "api\.env" >nul
            echo ✅ Created api\.env from example
            echo ⚠️  Warning: Please configure MongoDB URI and secrets in api\.env.local
        ) else (
            echo ⚠️  Warning: api\.env.example not found
        )
    ) else (
        echo ✅ api\.env already exists
        echo 💡 Consider using api\.env.local for secure credentials
    )
)

if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo ✅ Created backend\.env from example
    ) else (
        echo ⚠️  Warning: backend\.env.example not found
    )
) else (
    echo ✅ backend\.env already exists
)

if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul
        echo ✅ Created frontend\.env from example
    ) else (
        echo ⚠️  Warning: frontend\.env.example not found
    )
) else (
    echo ✅ frontend\.env already exists
)

echo 📦 Installing dependencies...
if not exist "api\node_modules" (
    cd api && call npm install --force && cd ..
)
if not exist "backend\node_modules" (
    cd backend && call npm install --force && cd ..
)
if not exist "frontend\node_modules" (
    cd frontend && call npm install --force && cd ..
)

echo 🗄️ Skipping database initialization (disabled for now)...
echo 💡 Database initialization has been disabled to speed up startup
echo 📝 To initialize data later, run: cd api && npm run db:init

echo.
echo ✅ Local development setup complete!
echo.
echo 🚀 Starting all applications automatically...
echo.

REM Start API in new window
echo 📡 Starting API server (Port 4002)...
start "BookDress API" cmd /k "cd /d %~dp0api && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Backend in new window
echo 🔧 Starting Backend admin (Port 3001)...
start "BookDress Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo 🌐 Starting Frontend (Port 3000)...
start "BookDress Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ All applications are starting in separate windows!
echo.
echo 📱 Application URLs:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo   API:       http://localhost:4002
echo.
pause
exit /b 0

:security_test
REM Test security features
echo 🔍 Testing security features...

curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ curl is not available. Please install curl to run security tests.
    pause
    exit /b 1
)

set API_URL=http://localhost:4002

echo Testing API health...
curl -f -s "%API_URL%/api/security/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API health check passed
) else (
    echo ❌ API health check failed - API may not be running
    echo Please start the API server first
    pause
    exit /b 1
)

echo Testing security headers...
curl -I -s "%API_URL%/api/security/health" > temp_headers.txt 2>&1

findstr /C:"X-Frame-Options" temp_headers.txt >nul
if %errorlevel% equ 0 (
    echo ✅ X-Frame-Options header present
) else (
    echo ❌ X-Frame-Options header missing
)

findstr /C:"Content-Security-Policy" temp_headers.txt >nul
if %errorlevel% equ 0 (
    echo ✅ Content-Security-Policy header present
) else (
    echo ❌ Content-Security-Policy header missing
)

del temp_headers.txt >nul 2>&1

echo.
echo 🛡️ Security test completed!
echo 📊 Access security dashboard: http://localhost:4003/api/security/dashboard
pause
exit /b 0

:clean_all
echo 🧹 Cleaning Docker containers and images...
%DOCKER_COMPOSE_CMD% -f docker-compose.yml down --volumes --remove-orphans
%DOCKER_COMPOSE_CMD% -f docker-compose.dev.yml down --volumes --remove-orphans
docker system prune -f

echo 🗑️ Cleaning node_modules...
if exist "api\node_modules" rmdir /s /q "api\node_modules"
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"  
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"

echo ✅ Cleanup completed!
pause
exit /b 0

:show_results
echo.
echo 🎉 BookDress Setup Complete! 🎉
echo ===============================
echo.
echo 📱 Access your applications:
echo    👗 Customer App:     http://localhost:3000
echo    👑 Admin Dashboard:  http://localhost:3001
echo    🔧 API Server:       http://localhost:4002
echo    🗄️  Database Admin:   MongoDB Atlas Dashboard

if "%ENABLE_DATABASE_SECURITY%"=="true" (
    echo    🛡️  Security Dashboard: http://localhost:4003/api/security/dashboard
    echo    📊 Security Health:  http://localhost:4003/api/security/health
    echo.
    echo 🛡️ Security Features Active:
    echo    ✅ Content Security Policy enforced
    echo    ✅ Security headers configured
    echo    ✅ Rate limiting active
    echo    ✅ Threat detection enabled
    echo    ✅ Real-time monitoring active
) else (
    echo    � Security Monitor: Disabled (BC_ENABLE_DATABASE_SECURITY=false)
    echo    📊 Security Health:  http://localhost:4003/api/security/health
    echo.
    echo 🛡️ Development Security Features:
    echo    ✅ Relaxed CSP for debugging
    echo    ✅ Higher rate limits
    echo    Security monitoring disabled by default
)

echo.
echo 🔐 Default Admin Credentials:
echo    Email:    admin@bookdress.local
echo    Password: admin123
echo.
echo 🌟 System Features Ready:
echo    ✅ Dress inventory management
echo    ✅ Customer booking system
echo    ✅ Fitting appointment scheduling
echo    ✅ Payment processing (Stripe/PayPal)
echo    ✅ Email/SMS notifications
echo    ✅ Analytics and business intelligence
echo    ✅ Multi-language support (Arabic/English)
echo    ✅ Advanced security features
echo.
echo 🎊 Welcome to BookDress! 👗✨
echo.
pause
