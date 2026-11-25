@echo off
title NFC Card Preview
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Download it from https://nodejs.org then run this file again.
  echo.
  pause
  exit /b 1
)

node server.js --open
pause
