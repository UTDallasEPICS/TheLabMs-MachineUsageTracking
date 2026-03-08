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

echo Installing/repairing dependencies with approved build-script allowlist...
call pnpm install --ignore-scripts=false
if errorlevel 1 (
  echo [ERROR] Dependency installation failed.
  echo If needed, run: pnpm approve-builds
  pause
  exit /b 1
)

echo Rebuilding dependencies to ensure native/build steps are applied...
call pnpm rebuild --recursive >nul 2>&1

echo Generating Prisma client...
call pnpm prisma generate
if errorlevel 1 (
  echo [ERROR] Prisma generate failed.
  echo If scripts are blocked, run: pnpm approve-builds
  pause
  exit /b 1
)

echo Starting Nuxt dev server...
call pnpm dev

endlocal
