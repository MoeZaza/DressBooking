@echo off
echo ========================================
echo BookDress Development Environment Setup
echo ========================================
echo.

REM Go to root directory
cd /d %~dp0

echo [1/6] Installing root dependencies...
call npm install

echo.
echo [2/6] Installing and building shared packages...
echo Building bookcars-types...
cd packages\bookcars-types
call npm install
call npm run build
cd ..\..

echo Building bookcars-helper...
cd packages\bookcars-helper
call npm install
call npm run build
cd ..\..

echo Building currency-converter...
cd packages\currency-converter
call npm install
call npm run build
cd ..\..

echo Building disable-react-devtools...
cd packages\disable-react-devtools
call npm install
call npm run build
cd ..\..

echo Building reactjs-social-login...
cd packages\reactjs-social-login
call npm install
call npm run build
cd ..\..

echo.
echo [3/6] Installing API dependencies...
cd api
call npm install
cd ..

echo.
echo [4/6] Installing Backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [5/6] Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [6/6] Starting all services...
echo.
echo Starting API (Port 4002)...
start "BookDress API" cmd /k "cd /d %~dp0api && echo Starting API... && npm run dev"
timeout /t 5 /nobreak >nul

echo Starting Backend (Port 3001)...
start "BookDress Backend" cmd /k "cd /d %~dp0backend && echo Starting Backend... && npm run dev"
timeout /t 5 /nobreak >nul

echo Starting Frontend (Port 3000)...
start "BookDress Frontend" cmd /k "cd /d %~dp0frontend && echo Starting Frontend... && npm run dev"

echo.
echo ========================================
echo All services are starting...
echo ========================================
echo.
echo Application URLs:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo   API:       http://localhost:4002
echo.
echo Check the opened windows for startup progress.
echo Services may take 1-2 minutes to fully load.
echo.
pause