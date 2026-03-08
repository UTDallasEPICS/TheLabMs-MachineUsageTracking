@echo off
setlocal

cd /d "%~dp0"

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pnpm is not installed or not on PATH.
  echo Install it with: npm install -g pnpm
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call pnpm install
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting Nuxt dev server...
call pnpm dev

endlocal
