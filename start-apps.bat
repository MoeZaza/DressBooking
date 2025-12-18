@echo off
echo.
echo 👗 BookDress Application Manager 👗
echo ==================================
echo.

if "%1"=="" goto show_help
if "%1"=="start" goto start_apps
if "%1"=="stop" goto stop_apps
if "%1"=="restart" goto restart_apps
if "%1"=="status" goto status_apps
goto show_help

:show_help
echo Usage: start-apps.bat [action]
echo.
echo Actions:
echo   start    - Start all applications
echo   stop     - Stop all applications  
echo   restart  - Restart all applications
echo   status   - Check application status
echo.
echo Examples:
echo   start-apps.bat start
echo   start-apps.bat stop
echo   start-apps.bat status
echo.
echo 📱 Application URLs (when running):
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3001
echo    API:       http://localhost:4002
echo.
pause
exit /b 0

:start_apps
echo 🚀 Starting all BookDress applications...
npm run start:all
pause
exit /b 0

:stop_apps
echo 🛑 Stopping all BookDress applications...
npm run stop:all
pause
exit /b 0

:restart_apps
echo 🔄 Restarting all BookDress applications...
npm run restart:all
pause
exit /b 0

:status_apps
echo 📊 Checking BookDress application status...
npm run status:all
pause
exit /b 0
