@echo off
echo.
echo 🔄 BookDress - Restarting All Applications 🔄
echo ============================================
echo.

echo Restarting all BookDress applications...
npm run restart:all

echo.
echo ✅ Restart operation completed!
echo.
echo 📱 Application URLs:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3001
echo    API:       http://localhost:4002
echo.
pause
