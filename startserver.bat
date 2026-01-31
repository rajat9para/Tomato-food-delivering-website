@echo off
title TOMATO Server
cls

echo ======================================================
echo               TOMATO FOOD DELIVERY
echo ======================================================
echo.
echo [+] Starting Database...
if not exist "mongodb\logs" mkdir "mongodb\logs" 2>nul
if not exist "mongodb\data" mkdir "mongodb\data" 2>nul
start /B "MongoDB" ".\mongodb\mongodb-win32-x86_64-windows-7.0.4\bin\mongod.exe" --dbpath ".\mongodb\data" --logpath ".\mongodb\logs\mongod.log" >nul 2>&1

echo [+] Checking Backend Dependencies...
cd backend && call npm install && cd ..

echo [+] Starting Backend...
start /B "Backend" cmd /c "cd backend && npm run dev"

echo [+] Checking Frontend Dependencies...
cd frontend && call npm install && cd ..

echo [+] Starting Frontend...
cd frontend
start /B "Frontend" cmd /c "npm run dev -- --host 0.0.0.0 --port 5175"
cd ..

timeout /t 5 /nobreak > nul
cls

setlocal enabledelayedexpansion
set "MOBILE_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set "temp_ip=%%a"
    set "temp_ip=!temp_ip: =!"
    if not "!temp_ip!"=="" (
        if not defined MOBILE_IP set "MOBILE_IP=!temp_ip!"
        echo !temp_ip! | findstr "^192\.168\." >nul && set "MOBILE_IP=!temp_ip!"
        echo !temp_ip! | findstr "^10\." >nul && set "MOBILE_IP=!temp_ip!"
        echo !temp_ip! | findstr "^172\." >nul && set "MOBILE_IP=!temp_ip!"
    )
)

echo ======================================================
echo               TOMATO IS RUNNING
echo ======================================================
echo.
echo [PC BROWSER]   Visit: http://localhost:5175
echo.
if defined MOBILE_IP (
    echo [PHONE/MOBILE] Copy this link for your phone:
    echo http://!MOBILE_IP!:5175
    echo.
    echo [INFO] Ensure your phone is on the same WiFi network.
) else (
    echo [ERROR] Could not detect local IP for mobile access.
    echo Please check your WiFi connection.
)
echo.
echo [SERVER INFO]
echo Backend API: http://localhost:5000/api
echo Frontend:   http://localhost:5175
echo Database:    MongoDB (local)
echo.
echo [TROUBLESHOOTING]
echo If you get "Network error" or "Backend not running":
echo 1. Check if both backend and frontend terminals are running
echo 2. Verify backend shows "TOMATO Backend Server Started"
echo 3. Test API: http://localhost:5000/api/health
echo 4. Make sure no other apps are using ports 5000 or 5175
echo.
echo ======================================================
echo.
echo Press any key to STOP servers and close...
pause > nul
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM mongod.exe >nul 2>&1
echo Servers stopped.
