@echo off
title AtlasTime
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed.
  echo Install the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

echo Configuring the public npm registry...
call npm config set registry https://registry.npmjs.org/
call npm config delete proxy >nul 2>nul
call npm config delete https-proxy >nul 2>nul

if exist node_modules (
  echo Removing incomplete previous installation...
  rmdir /s /q node_modules
)

if exist package-lock.json (
  del /q package-lock.json
)

echo Installing AtlasTime dependencies from the public npm registry...
call npm install
if %errorlevel% neq 0 (
  echo.
  echo Installation failed.
  echo Please send a screenshot of this window.
  pause
  exit /b 1
)

echo.
echo Starting AtlasTime...
call npm run dev
pause
