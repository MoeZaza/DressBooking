@echo off
echo 🎭 BookDress Application Starter 🎭
echo ===================================

REM Add Node.js to PATH
set PATH=%PATH%;C:\Program Files\nodejs

echo 📦 Setting up environment and installing dependencies...

REM Create .env files from examples
echo Creating environment files...
if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env"
    echo ✅ Created frontend .env file
)
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo ✅ Created backend .env file
)

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)

REM Install backend dependencies
echo Installing backend dependencies...
cd ..\backend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)

REM Install API dependencies
echo Installing API dependencies...
cd ..\api
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ API dependency installation failed
    pause
    exit /b 1
)

echo ✅ All dependencies installed successfully!

echo 🚀 Starting applications...

REM Start API in background
echo Starting API server on port 4002...
cd ..\api
start "BookDress API" cmd /k "npm run dev"

REM Wait a bit for API to start
timeout /t 5 /nobreak >nul

REM Start Backend in background
echo Starting Backend server on port 3001...
cd ..\backend
start "BookDress Backend" cmd /k "npm run dev"

REM Wait a bit for Backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend in background
echo Starting Frontend server on port 3000...
cd ..\frontend
start "BookDress Frontend" cmd /k "npm run dev"

echo ✅ All applications are starting...
echo 🌐 Frontend: http://localhost:3000
echo 🖥️ Backend: http://localhost:3001
echo 🔌 API: http://localhost:4002

echo 📝 Note: Each application will open in its own window.
echo    Close the windows to stop the applications.

pause
