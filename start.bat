@echo off
title ReviewGuard - AI-Based Fake Product Review Detector
echo =======================================================
echo    ReviewGuard - AI Fake Review Detection System
echo =======================================================
echo.
cd /d "%~dp0"
set PYTHONPATH=%~dp0backend;%PYTHONPATH%
python run_reviewguard.py
pause
