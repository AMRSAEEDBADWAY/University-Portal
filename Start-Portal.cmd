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

echo   If the browser does not open, use the Local URL from the terminal.
echo   For Google login, add that localhost URL in Google Cloud OAuth settings.
echo   Press Ctrl+C to stop.
echo.
call npm run dev
pause
