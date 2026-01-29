@echo off
title TOMATO Server
cls

echo ======================================================
echo               TOMATO FOOD DELIVERY
echo ======================================================
echo.
echo [+] Initializing Project...
if not exist "mongodb\logs" mkdir "mongodb\logs" 2>nul
if not exist "mongodb\data" mkdir "mongodb\data" 2>nul

echo [+] Starting Database (MongoDB)...
start /B "MongoDB" ".\mongodb\mongodb-win32-x86_64-windows-7.0.4\bin\mongod.exe" --dbpath ".\mongodb\data" --logpath ".\mongodb\logs\mongod.log" >nul 2>&1

echo [+] Starting Backend Server...
start /B "Backend" cmd /c "cd backend && npm run dev"

echo [+] Starting Frontend Application...
cd frontend
start /B "Frontend" cmd /c "npm run dev -- --host 0.0.0.0 --port 5175"
cd ..

timeout /t 5 /nobreak > nul
cls

echo ======================================================
echo               TOMATO IS NOW ONLINE
echo ======================================================
echo.
echo [PC BROWSER]   http://localhost:5175
echo.
echo [BACKEND API]  http://localhost:5000/api
echo.
echo ======================================================
echo.
echo Press any key to safely stop all servers...
pause > nul

taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM mongod.exe >nul 2>&1
echo.
echo All TOMATO services have been stopped.
timeout /t 2 > nul
exit
