@echo off
echo.
echo 📊 BookDress - Application Status Check 📊
echo =========================================
echo.

echo Checking BookDress application status...
npm run status:all

echo.
echo 💡 Management commands:
echo    start-apps.bat start   - Start all applications
echo    stop-apps.bat          - Stop all applications
echo    restart-apps.bat       - Restart all applications
echo.
pause
