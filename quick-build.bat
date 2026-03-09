@echo off
echo Building without type checking...
echo.

REM Build frontend
echo Building frontend...
call npx vite build
if errorlevel 1 (
    echo Frontend build failed!
    pause
    exit /b 1
)

REM Build backend without type checking
echo Building backend...
call npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:@vitejs/plugin-react --external:@vitejs/* --external:rollup --define:process.env.NODE_ENV='"production"' --keep-names --log-level=warning
if errorlevel 1 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Build complete!
echo dist/index.js - Backend
echo dist/public/ - Frontend
pause
