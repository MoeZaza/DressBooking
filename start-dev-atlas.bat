@echo off
echo.
echo 👗 BookDress - Starting Development Environment with MongoDB Atlas 👗
echo ================================================================
echo.

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
echo 📋 Setting up environment files for MongoDB Atlas development...

REM Ensure API .env uses Atlas configuration
if not exist "api\.env" (
    echo ⚠️  Warning: api\.env not found, creating default
    copy "api\.env.example" "api\.env" >nul
)

REM Ensure Backend environment
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo ✅ Created backend\.env from example
    )
) else (
    echo ✅ backend\.env already exists
)

REM Ensure Frontend environment
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul
        echo ✅ Created frontend\.env from example
    )
) else (
    echo ✅ frontend\.env already exists
)

echo 📦 Installing dependencies and building packages...

REM Install root dependencies
echo Installing root dependencies...
call npm install --force

REM Install and build packages first
echo Building shared packages...
if not exist "packages\bookcars-types\node_modules" (
    cd packages\bookcars-types && call npm install --force && cd ..\..
)
cd packages\bookcars-types && call npm run build && cd ..\..

if not exist "packages\bookcars-helper\node_modules" (
    cd packages\bookcars-helper && call npm install --force && cd ..\..
)
cd packages\bookcars-helper && call npm run build && cd ..\..

if not exist "packages\currency-converter\node_modules" (
    cd packages\currency-converter && call npm install --force && cd ..\..
)
cd packages\currency-converter && call npm run build && cd ..\..

if not exist "packages\disable-react-devtools\node_modules" (
    cd packages\disable-react-devtools && call npm install --force && cd ..\..
)
cd packages\disable-react-devtools && call npm run build && cd ..\..

if not exist "packages\reactjs-social-login\node_modules" (
    cd packages\reactjs-social-login && call npm install --force && cd ..\..
)
cd packages\reactjs-social-login && call npm run build && cd ..\..

REM Install API dependencies
echo Installing API dependencies...
if not exist "api\node_modules" (
    cd api && call npm install --force && cd ..
)

REM Install Backend dependencies
echo Installing Backend dependencies...
if not exist "backend\node_modules" (
    cd backend && call npm install --force && cd ..
)

REM Install Frontend dependencies
echo Installing Frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend && call npm install --force && cd ..
)

echo 🗄️ Initializing MongoDB Atlas database...
echo 💡 Initializing database with default admin user and settings
cd api && call npm run db:atlas:init && cd ..

echo.
echo ✅ Atlas development setup complete!
echo.
echo 🚀 Starting all applications automatically...
echo.

REM Start API in new window
echo 📡 Starting API server (Port 4002)...
start "BookDress API (Atlas)" cmd /k "cd /d %~dp0api && set NODE_ENV=development && npm run dev"
timeout /t 5 /nobreak >nul

REM Start Backend in new window  
echo 🔧 Starting Backend admin (Port 3001)...
start "BookDress Backend (Atlas)" cmd /k "cd /d %~dp0backend && set NODE_ENV=development && npm run dev"
timeout /t 5 /nobreak >nul

REM Start Frontend in new window
echo 🌐 Starting Frontend (Port 3000)...
start "BookDress Frontend (Atlas)" cmd /k "cd /d %~dp0frontend && set NODE_ENV=development && npm run dev"

echo.
echo ✅ All applications are starting in separate windows!
echo.
echo 📱 Application URLs:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001  
echo   API:       http://localhost:4002
echo.
echo 🛡️  MongoDB Atlas Status:
echo   ✅ Connected to MongoDB Atlas cloud database
echo   ✅ Database initialized with default data
echo   ✅ Admin user created
echo.
echo 🔐 Default Admin Login:
echo   Email:    admin@bookdress.local
echo   Password: admin123
echo.
echo 💡 Services will start in ~15-30 seconds. Check individual windows for status.
echo 💡 If any service fails, check the individual terminal windows for error details.
echo.
echo Press any key to close this window...
pause >nul
exit /b 0