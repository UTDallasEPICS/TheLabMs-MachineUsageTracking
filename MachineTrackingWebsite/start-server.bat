@echo off
setlocal EnableExtensions DisableDelayedExpansion

cd /d "%~dp0"


if not exist ".env" (
  if exist ".env.example" (
    echo .env not found. Creating it from .env.example...
    copy /Y ".env.example" ".env" >nul
    if errorlevel 1 (
      echo [ERROR] Failed to create .env from .env.example.
      pause
      exit /b 1
    )
  )
)

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

if "%DATABASE_URL%"=="" (
  echo DATABASE_URL is not set. Using fallback: file:./dev.db
  set "DATABASE_URL=file:./dev.db"
)

echo Generating Prisma client...
call pnpm prisma generate
if errorlevel 1 (
  echo [ERROR] Prisma generate failed.
  echo Check that DATABASE_URL is set in .env or system environment.
  pause
  exit /b 1
)

:prompt_admin_email
for /f "usebackq delims=" %%A in (`powershell -NoLogo -NoProfile -Command "$pattern = '^[^\s@]+@[^\s@]+\.[^\s@]+$'; do { $email = Read-Host 'Enter the admin email'; if ($email) { $email = $email.Trim().ToLower() } if ($email -and $email -match $pattern) { $email } else { Write-Host 'Please enter a valid email address, like name@domain.com.' } } while (-not ($email -and $email -match $pattern))"`) do set "ADMIN_EMAIL=%%A"

:prompt_admin_password
set "ADMIN_PASSWORD="
for /f "usebackq delims=" %%A in (`powershell -NoLogo -NoProfile -Command "$password = Read-Host 'Enter the admin password' -AsSecureString; $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password); try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }"`) do set "ADMIN_PASSWORD=%%A"
if not defined ADMIN_PASSWORD goto prompt_admin_password

echo Starting Nuxt dev server...
call pnpm run dev --host

endlocal
