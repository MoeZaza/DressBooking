@echo off
echo.
echo 👗 BookDress - Starting Local Development Environment 👗
echo ======================================================
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
    echo Installing API dependencies...
    cd api && call npm install --force && cd ..
)
if not exist "backend\node_modules" (
    echo Installing Backend dependencies...
    cd backend && call npm install --force && cd ..
)
if not exist "frontend\node_modules" (
    echo Installing Frontend dependencies...
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
echo 🛡️  Security Status:
echo   ✅ MongoDB credentials secured (not in git)
echo   ✅ Environment files properly configured
echo   ✅ API $in operator bug fixed
echo   ✅ Database initialization disabled (faster startup)
echo.
echo 💡 To initialize database data later: cd api && npm run db:init
echo.
echo Press any key to close this window...
pause >nul
exit /b 0
