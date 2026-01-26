# Check for Administrator privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Please run this script as Administrator to configure the Firewall." -ForegroundColor Red
    Write-Host "Right-click on this file (or PowerShell) and select 'Run as administrator'."
    Read-Host -Prompt "Press Enter to exit"
    exit
}

Write-Host "Configuring Windows Firewall for TOMATO Project..." -ForegroundColor Cyan

# Rule for Frontend (Vite)
$frontendRule = Get-NetFirewallRule -DisplayName "Tomato Frontend (5173)" -ErrorAction SilentlyContinue
if ($frontendRule) {
    Write-Host "Frontend rule already exists." -ForegroundColor Yellow
} else {
    New-NetFirewallRule -DisplayName "Tomato Frontend (5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
    Write-Host "Allowed Port 5173 (Frontend)." -ForegroundColor Green
}

# Rule for Backend (Express)
$backendRule = Get-NetFirewallRule -DisplayName "Tomato Backend (5000)" -ErrorAction SilentlyContinue
if ($backendRule) {
    Write-Host "Backend rule already exists." -ForegroundColor Yellow
} else {
    New-NetFirewallRule -DisplayName "Tomato Backend (5000)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
    Write-Host "Allowed Port 5000 (Backend)." -ForegroundColor Green
}

Write-Host "Firewall configuration complete! You can now access the app on mobile." -ForegroundColor Cyan
Read-Host -Prompt "Press Enter to close"
