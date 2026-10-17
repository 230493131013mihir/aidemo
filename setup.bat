@echo off
echo ========================================================
echo   HarvestMitra AI - One-Click Team Setup
echo ========================================================
echo.
echo [1/3] Installing backend dependencies...
cd backend
call npm install
if not exist .env (
    if exist ..\.env.example (
        copy ..\.env.example .env
    )
)
echo.
echo [2/3] Seeding Maharashtra APMC Database...
call npm run seed
echo.
echo [3/3] Installing frontend dependencies...
cd ..\frontend
call npm install
cd ..
echo.
echo ========================================================
echo   Setup Complete! Run "run_all.bat" to start servers.
echo ========================================================
pause
