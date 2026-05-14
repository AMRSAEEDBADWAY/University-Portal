@echo off
chcp 65001 >nul
cd /d "%~dp0"
title University Portal
echo.
echo   Starting dev server...
echo   Folder: %CD%
echo.

if not exist node_modules\ (
  echo   Running npm install...
  call npm install
  if errorlevel 1 (
    echo   npm install failed.
    pause
    exit /b 1
  )
)

echo   Browser opens automatically if configured. Else copy Local URL from terminal.
echo   Add that localhost port in Google Cloud OAuth for Google login or Drive.
echo   Press Ctrl+C to stop.
echo.
call npm run dev
pause
