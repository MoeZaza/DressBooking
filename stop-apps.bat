@echo off
echo.
echo 🛑 BookDress - Stopping All Applications 🛑
echo ==========================================
echo.

echo Stopping all BookDress applications...
npm run stop:all

echo.
echo ✅ Stop operation completed!
echo.
echo 💡 To start applications again:
echo    start-apps.bat start
echo    npm run start:all
echo.
pause
