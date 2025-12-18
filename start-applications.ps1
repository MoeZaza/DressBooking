# BookDress Application Starter Script
# This script attempts to start all applications using available methods

param(
    [switch]$Force,
    [switch]$Docker,
    [switch]$Local,
    [int]$WaitTime = 60
)

$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Wait-ForApplication {
    param([string]$Name, [int]$Port, [int]$MaxWait = 60)
    
    Write-Status "Waiting for $Name on port $Port..." "Info"
    $waited = 0
    
    while ($waited -lt $MaxWait) {
        if (Test-Port -Port $Port) {
            Write-Status "$Name is responding on port $Port" "Success"
            return $true
        }
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    Write-Status "$Name did not start within $MaxWait seconds" "Warning"
    return $false
}

function Start-WithDocker {
    Write-Status "Attempting to start applications with Docker..." "Info"
    
    # Check if Docker is available
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Docker is not available" "Error"
            return $false
        }
        Write-Status "Docker found: $dockerVersion" "Success"
    }
    catch {
        Write-Status "Docker is not available" "Error"
        return $false
    }
    
    # Check if docker-compose is available
    $composeCmd = $null
    try {
        docker-compose --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $composeCmd = "docker-compose"
        }
    }
    catch { }
    
    if (-not $composeCmd) {
        try {
            docker compose version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $composeCmd = "docker compose"
            }
        }
        catch { }
    }
    
    if (-not $composeCmd) {
        Write-Status "Docker Compose is not available" "Error"
        return $false
    }
    
    Write-Status "Using: $composeCmd" "Info"
    
    # Start with development configuration
    Write-Status "Starting applications with Docker..." "Info"
    
    try {
        # Stop any existing containers
        & $composeCmd.Split() -f docker-compose.dev.yml down 2>$null
        
        # Start the applications
        & $composeCmd.Split() -f docker-compose.dev.yml up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Docker containers started successfully" "Success"
            
            # Wait for applications to be ready
            Wait-ForApplication -Name "API" -Port 4002 -MaxWait $WaitTime
            Wait-ForApplication -Name "Backend" -Port 3001 -MaxWait $WaitTime
            Wait-ForApplication -Name "Frontend" -Port 3000 -MaxWait $WaitTime
            
            return $true
        }
        else {
            Write-Status "Failed to start Docker containers" "Error"
            return $false
        }
    }
    catch {
        Write-Status "Error starting Docker containers: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Start-WithNodeJS {
    Write-Status "Attempting to start applications with Node.js..." "Info"
    
    # Check if Node.js is available
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Node.js is not available" "Error"
            return $false
        }
        Write-Status "Node.js found: $nodeVersion" "Success"
    }
    catch {
        Write-Status "Node.js is not available" "Error"
        return $false
    }
    
    # Check if npm is available
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Status "npm is not available" "Error"
            return $false
        }
        Write-Status "npm found: $npmVersion" "Success"
    }
    catch {
        Write-Status "npm is not available" "Error"
        return $false
    }
    
    # Start applications using npm scripts
    try {
        Write-Status "Starting applications with npm..." "Info"
        
        # Use the start-all script
        if (Test-Path "scripts\start-all.js") {
            node scripts\start-all.js
            
            # Wait for applications to be ready
            Wait-ForApplication -Name "API" -Port 4002 -MaxWait $WaitTime
            Wait-ForApplication -Name "Backend" -Port 3001 -MaxWait $WaitTime
            Wait-ForApplication -Name "Frontend" -Port 3000 -MaxWait $WaitTime
            
            return $true
        }
        else {
            Write-Status "start-all.js script not found" "Error"
            return $false
        }
    }
    catch {
        Write-Status "Error starting with Node.js: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Start-WithBatchFiles {
    Write-Status "Attempting to start applications with batch files..." "Info"
    
    if (Test-Path "setup-bookdress.bat") {
        Write-Status "Found setup-bookdress.bat, attempting local development setup..." "Info"
        
        # This would require user interaction, so we'll just inform
        Write-Status "Please run: .\setup-bookdress.bat and choose option 3 (Local Development)" "Warning"
        Write-Status "Then run this script again to verify the applications are running" "Warning"
        return $false
    }
    
    if (Test-Path "start-apps.bat") {
        Write-Status "Found start-apps.bat, attempting to start..." "Info"
        try {
            .\start-apps.bat start
            
            # Wait for applications to be ready
            Wait-ForApplication -Name "API" -Port 4002 -MaxWait $WaitTime
            Wait-ForApplication -Name "Backend" -Port 3001 -MaxWait $WaitTime
            Wait-ForApplication -Name "Frontend" -Port 3000 -MaxWait $WaitTime
            
            return $true
        }
        catch {
            Write-Status "Error with batch file: $($_.Exception.Message)" "Error"
            return $false
        }
    }
    
    Write-Status "No suitable batch files found" "Error"
    return $false
}

function Check-ApplicationStatus {
    Write-Status "Checking current application status..." "Info"
    
    $apps = @(
        @{ Name = "API"; Port = 4002 }
        @{ Name = "Backend"; Port = 3001 }
        @{ Name = "Frontend"; Port = 3000 }
    )
    
    $runningApps = 0
    foreach ($app in $apps) {
        if (Test-Port -Port $app.Port) {
            Write-Status "$($app.Name) is running on port $($app.Port)" "Success"
            $runningApps++
        }
        else {
            Write-Status "$($app.Name) is not running on port $($app.Port)" "Warning"
        }
    }
    
    return $runningApps -eq $apps.Count
}

# Main execution
Write-Host "🚀 BookDress Application Starter" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

# Check if applications are already running
if (-not $Force -and (Check-ApplicationStatus)) {
    Write-Status "All applications are already running!" "Success"
    Write-Status "Use -Force to restart them" "Info"
    exit 0
}

$started = $false

# Try different methods based on parameters
if ($Docker) {
    $started = Start-WithDocker
}
elseif ($Local) {
    $started = Start-WithNodeJS
}
else {
    # Try all methods in order of preference
    Write-Status "Trying all available methods..." "Info"
    
    # 1. Try Docker first (most reliable)
    if (-not $started) {
        $started = Start-WithDocker
    }
    
    # 2. Try Node.js
    if (-not $started) {
        $started = Start-WithNodeJS
    }
    
    # 3. Try batch files
    if (-not $started) {
        $started = Start-WithBatchFiles
    }
}

if ($started) {
    Write-Status "Applications started successfully!" "Success"
    Write-Host ""
    Write-Host "📱 Application URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
    Write-Host "   API:       http://localhost:4002" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Status "Failed to start applications with any method" "Error"
    Write-Host ""
    Write-Host "📋 Manual Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Install Node.js from https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Run: .\setup-bookdress.bat and choose option 3" -ForegroundColor White
    Write-Host "3. Or install Docker and run: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor White
    Write-Host ""
    exit 1
}
