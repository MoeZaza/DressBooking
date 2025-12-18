# BookDress Application Management Script
# This script provides comprehensive application management

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "")]
    [string]$Action = ""
)

# Display help if no action provided
if ($Action -eq "") {
    Write-Host "👗 BookDress Application Manager 👗" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-all.ps1 [action]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start    - Start all applications" -ForegroundColor White
    Write-Host "  stop     - Stop all applications" -ForegroundColor White
    Write-Host "  restart  - Restart all applications" -ForegroundColor White
    Write-Host "  status   - Check application status" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start-all.ps1 start" -ForegroundColor Gray
    Write-Host "  .\start-all.ps1 stop" -ForegroundColor Gray
    Write-Host "  .\start-all.ps1 status" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📱 Application URLs (when running):" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
    Write-Host "   API:       http://localhost:4002" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Execute the requested action
switch ($Action) {
    "start" {
        Write-Host "🚀 Starting all BookDress applications..." -ForegroundColor Green
        npm run start:all
    }
    "stop" {
        Write-Host "🛑 Stopping all BookDress applications..." -ForegroundColor Red
        npm run stop:all
    }
    "restart" {
        Write-Host "🔄 Restarting all BookDress applications..." -ForegroundColor Yellow
        npm run restart:all
    }
    "status" {
        Write-Host "📊 Checking BookDress application status..." -ForegroundColor Cyan
        npm run status:all
    }
}
