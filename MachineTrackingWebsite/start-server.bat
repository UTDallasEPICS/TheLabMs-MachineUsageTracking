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

echo Ensuring pnpm build scripts are enabled for this project...
call pnpm config set ignore-scripts false --location project >nul 2>&1

echo Installing/repairing dependencies (scripts enabled)...
call pnpm install --ignore-scripts=false
if errorlevel 1 (
  echo [ERROR] Dependency installation failed.
  echo If you still see "ignored build scripts", run:
  echo   pnpm approve-builds
  pause
  exit /b 1
)

echo Rebuilding dependencies to ensure native/build steps are applied...
call pnpm rebuild --recursive >nul 2>&1

echo Starting Nuxt dev server...
call pnpm dev

endlocal
