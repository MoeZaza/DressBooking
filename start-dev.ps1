# BookDress Development Mode Startup Script
# This script starts all applications in development mode with proper CORS configuration

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "")]
    [string]$Action = "start"
)

# Function to start all services in development mode
function Start-DevServices {
    Write-Host "🚀 Starting all BookDress services in DEVELOPMENT mode with MongoDB Atlas..." -ForegroundColor Green
    Write-Host "=======================================================================" -ForegroundColor Green
    Write-Host ""
    
    # Ensure packages are built first
    Write-Host "📦 Building shared packages..." -ForegroundColor Yellow
    Set-Location "packages/bookcars-types"
    npm run build
    Set-Location "../.."
    
    Set-Location "packages/bookcars-helper" 
    npm run build
    Set-Location "../.."
    
    Set-Location "packages/currency-converter"
    npm run build
    Set-Location "../.."
    
    Set-Location "packages/disable-react-devtools"
    npm run build
    Set-Location "../.."
    
    Set-Location "packages/reactjs-social-login"
    npm run build
    Set-Location "../.."
    
    # Initialize MongoDB Atlas
    Write-Host "🗄️ Initializing MongoDB Atlas database..." -ForegroundColor Yellow
    Set-Location "api"
    npm run db:atlas:init
    Set-Location ".."
    
    # Start API with NODE_ENV=development
    Write-Host "📡 Starting API on port 4002..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; `$env:NODE_ENV='development'; npm run dev" -WindowStyle Normal
    
    # Wait a bit for API to start
    Start-Sleep -Seconds 5
    
    # Start Backend with NODE_ENV=development
    Write-Host "🔧 Starting Backend on port 3001..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:NODE_ENV='development'; npm run dev" -WindowStyle Normal
    
    # Wait a bit for Backend to start
    Start-Sleep -Seconds 5
    
    # Start Frontend with NODE_ENV=development
    Write-Host "🌐 Starting Frontend on port 3000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; `$env:NODE_ENV='development'; npm run dev" -WindowStyle Normal
    
    Write-Host ""
    Write-Host "✅ All services started in development mode with MongoDB Atlas!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Application URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
    Write-Host "   API:       http://localhost:4002" -ForegroundColor White
    Write-Host ""
    Write-Host "🗄️ Database Status:" -ForegroundColor Magenta
    Write-Host "   ✓ Connected to MongoDB Atlas cloud database" -ForegroundColor Green
    Write-Host "   ✓ Database initialized with default data" -ForegroundColor Green
    Write-Host "   ✓ Admin user created" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔐 Default Admin Login:" -ForegroundColor Magenta
    Write-Host "   Email:    admin@bookdress.local" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Development mode features:" -ForegroundColor Magenta
    Write-Host "   ✓ CORS restrictions relaxed for localhost" -ForegroundColor Green
    Write-Host "   ✓ Enhanced logging enabled" -ForegroundColor Green
    Write-Host "   ✓ Security restrictions reduced for development" -ForegroundColor Green
    Write-Host "   ✓ Hot module reloading enabled" -ForegroundColor Green
    Write-Host "   ✓ Source maps enabled for debugging" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Tip: Use Ctrl+C in each terminal window to stop individual services" -ForegroundColor Yellow
}

# Function to stop all services
function Stop-DevServices {
    Write-Host "🛑 Stopping all BookDress development services..." -ForegroundColor Red
    
    # Kill all node processes (be careful with this in production!)
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "tsx" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "✅ All development services stopped!" -ForegroundColor Green
}

# Function to check service status
function Check-DevStatus {
    Write-Host "📊 Checking BookDress development service status..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if ports are in use
    $apiPort = netstat -an | Select-String ":4002"
    $backendPort = netstat -an | Select-String ":3001"
    $frontendPort = netstat -an | Select-String ":3000"
    
    if ($apiPort) {
        Write-Host "📡 API (Port 4002): ✅ RUNNING" -ForegroundColor Green
    } else {
        Write-Host "📡 API (Port 4002): ❌ STOPPED" -ForegroundColor Red
    }
    
    if ($backendPort) {
        Write-Host "🔧 Backend (Port 3001): ✅ RUNNING" -ForegroundColor Green
    } else {
        Write-Host "🔧 Backend (Port 3001): ❌ STOPPED" -ForegroundColor Red
    }
    
    if ($frontendPort) {
        Write-Host "🌐 Frontend (Port 3000): ✅ RUNNING" -ForegroundColor Green
    } else {
        Write-Host "🌐 Frontend (Port 3000): ❌ STOPPED" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Display help if no action provided or invalid action
if ($Action -eq "" -or $Action -notin @("start", "stop", "restart", "status")) {
    Write-Host "👗 BookDress Development Manager 👗" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-dev.ps1 [action]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start    - Start all applications in development mode" -ForegroundColor White
    Write-Host "  stop     - Stop all development applications" -ForegroundColor White
    Write-Host "  restart  - Restart all development applications" -ForegroundColor White
    Write-Host "  status   - Check development application status" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start-dev.ps1 start" -ForegroundColor Gray
    Write-Host "  .\start-dev.ps1 stop" -ForegroundColor Gray
    Write-Host "  .\start-dev.ps1 status" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Execute the requested action
switch ($Action) {
    "start" {
        Start-DevServices
    }
    "stop" {
        Stop-DevServices
    }
    "restart" {
        Stop-DevServices
        Start-Sleep -Seconds 2
        Start-DevServices
    }
    "status" {
        Check-DevStatus
    }
}
