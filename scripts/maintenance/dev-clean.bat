@echo off
echo 🧹 SITU8 Development Server - Fresh Start Script
echo =================================================

REM Colors for Windows (limited support)
setlocal enabledelayedexpansion

REM Clear Vite caches
echo [INFO] Clearing Vite development caches...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist ".vite" rmdir /s /q ".vite"
echo ✅ Vite caches cleared

REM Clear build artifacts
echo [INFO] Removing build artifacts...
if exist "dist" rmdir /s /q "dist"
echo ✅ Build artifacts removed

REM Check environment files
if exist ".env.local" (
    echo [INFO] .env.local found - environment variables ready
) else (
    echo [WARN] .env.local not found - copying from .env.example
    if exist ".env.example" (
        copy ".env.example" ".env.local"
        echo [INFO] Created .env.local from .env.example
    ) else (
        echo [ERROR] .env.example not found - please create .env.local manually
    )
)

REM Check dependencies
echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [WARN] node_modules not found - running npm install...
    call npm install
    echo ✅ Dependencies installed
) else (
    echo [INFO] Dependencies already installed
)

REM Start the development server
echo [INFO] Starting development server with fresh state...
echo.
echo 🚀 Starting Vite development server...
echo 📱 Your app will be available at: http://localhost:5173
echo 🧪 Test authentication at: http://localhost:5173/auth-test.html
echo.

REM Start the server
call npm run dev

pause