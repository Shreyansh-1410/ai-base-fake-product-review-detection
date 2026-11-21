@echo off
title ReviewGuard - Real AI Fake Review Detection
echo =======================================================
echo    ReviewGuard - Real AI Fake Review Detector
echo =======================================================
echo.
echo [*] Starting ReviewGuard AI System...
cd /d "%~dp0"
set PYTHONPATH=%~dp0backend;%PYTHONPATH%

:: Open browser automatically after 2 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5000"

:: Start the unified web server
python run_reviewguard.py
pause
