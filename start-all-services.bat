@echo off
echo Starting BookDress Applications...
echo ===================================

REM Kill any existing Node processes
echo Stopping existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.cmd 2>nul

timeout /t 3 /nobreak >nul

echo.
echo Starting API service...
start "BookDress API" cmd /k "cd /d api && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Backend service...
start "BookDress Backend" cmd /k "cd /d backend && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend service...
start "BookDress Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo Checking service status...
echo.

REM Check if ports are listening
netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ✓ Frontend running on port 3000
) else (
    echo ✗ Frontend not running on port 3000
)

netstat -an | findstr ":3001" >nul
if %errorlevel%==0 (
    echo ✓ Backend running on port 3001
) else (
    echo ✗ Backend not running on port 3001
)

netstat -an | findstr ":4002" >nul
if %errorlevel%==0 (
    echo ✓ API running on port 4002
) else (
    echo ✗ API not running on port 4002
)

echo.
echo Applications URLs:
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:3001
echo API:       http://localhost:4002
echo.
echo Press any key to exit...
pause >nul