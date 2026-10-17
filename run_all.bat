@echo off
echo ========================================================
echo   Starting HarvestMitra AI (Backend + Frontend)
echo ========================================================
echo.
echo [1/2] Starting Backend Server (http://localhost:5000)...
start "HarvestMitra Backend (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo [2/2] Starting Frontend Client (http://localhost:5173)...
start "HarvestMitra Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Launching browser...
start http://localhost:5173
echo.
echo HarvestMitra AI is running! Keep the two command windows open.
pause
