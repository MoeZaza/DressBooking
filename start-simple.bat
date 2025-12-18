@echo off
echo Starting BookDress Development Environment...
echo.

REM Start API in new window
echo Starting API...
start "API" cmd /k "cd /d %~dp0api && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Backend in new window
echo Starting Backend...
start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services are starting in separate windows.
echo Check each window for status.
echo.
echo URLs:
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo API:      http://localhost:4002
echo.
pause