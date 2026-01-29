Write-Host "========================================" -ForegroundColor Green
Write-Host "TOMATO Food Ordering Platform" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Get the script directory (absolute path)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Script directory: $ScriptDir" -ForegroundColor Gray

# Check if node_modules exist
$backendDir = Join-Path $ScriptDir "backend"
$frontendDir = Join-Path $ScriptDir "frontend"

if (!(Test-Path "$backendDir\node_modules")) {
    Write-Host "Warning: Backend dependencies not found!" -ForegroundColor Yellow
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location $backendDir
    npm install
    Set-Location $ScriptDir
    Write-Host "Backend dependencies installed" -ForegroundColor Green
    Write-Host ""
}

if (!(Test-Path "$frontendDir\node_modules")) {
    Write-Host "Warning: Frontend dependencies not found!" -ForegroundColor Yellow
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location $frontendDir
    npm install
    Set-Location $ScriptDir
    Write-Host "Frontend dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Start MongoDB
Write-Host "Starting MongoDB..." -ForegroundColor Cyan
$mongoBinDir = Join-Path $ScriptDir "mongodb\mongodb-win32-x86_64-windows-7.0.4\bin"
$mongodPath = Join-Path $mongoBinDir "mongod.exe"

if (Test-Path $mongodPath) {
    try {
        # Try to start MongoDB service first
        $mongoResult = net start MongoDB 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "MongoDB service started" -ForegroundColor Green
        } else {
            Write-Host "MongoDB service not running, starting mongod directly..." -ForegroundColor Yellow
            # Create data directory if it doesn't exist
            $dataDir = "C:\data\db"
            if (!(Test-Path $dataDir)) {
                New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
            }
            # Start mongod process
            Start-Process -FilePath $mongodPath -ArgumentList "--dbpath $dataDir" -NoNewWindow
            Start-Sleep -Seconds 3
            Write-Host "MongoDB started" -ForegroundColor Green
        }
    } catch {
        Write-Host "MongoDB service not available, starting mongod directly..." -ForegroundColor Yellow
        # Create data directory if it doesn't exist
        $dataDir = "C:\data\db"
        if (!(Test-Path $dataDir)) {
            New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
        }
        # Start mongod process
        Start-Process -FilePath $mongodPath -ArgumentList "--dbpath $dataDir" -NoNewWindow
        Start-Sleep -Seconds 3
        Write-Host "MongoDB started" -ForegroundColor Green
    }
} else {
    Write-Host "MongoDB not found in extracted folder" -ForegroundColor Red
    Write-Host "Please ensure mongodb.zip is properly extracted" -ForegroundColor Red
}

# Check if admin exists, if not create one
Write-Host ""
Write-Host "Checking admin account..." -ForegroundColor Cyan
Set-Location $backendDir
npm run create-admin 2>$null
Set-Location $ScriptDir

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@tomato.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Green

# Start backend job
$backendJob = Start-Job -ScriptBlock {
    param($backendDir)
    Set-Location $backendDir
    npm run dev
} -ArgumentList $backendDir

# Start frontend job
$frontendJob = Start-Job -ScriptBlock {
    param($frontendDir)
    Set-Location $frontendDir
    npm run dev
} -ArgumentList $frontendDir

# Wait for jobs and display output
try {
    while ($true) {
        $backendOutput = Receive-Job $backendJob
        if ($backendOutput) {
            Write-Host "BACKEND: $backendOutput" -ForegroundColor Blue
        }

        $frontendOutput = Receive-Job $frontendJob
        if ($frontendOutput) {
            Write-Host "FRONTEND: $frontendOutput" -ForegroundColor Magenta
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob
    Stop-Job $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "Servers stopped" -ForegroundColor Green
}
