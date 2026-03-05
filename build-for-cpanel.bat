@echo off
REM ========================================
REM Scheduled - cPanel Deployment Builder
REM ========================================
REM
REM This script builds the application for production deployment to cPanel.
REM It creates a clean, optimized package ready to upload and run on Linux servers.
REM

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Scheduled - Building for cPanel
echo ========================================
echo.

REM Step 0: Check if WinRAR is available
set "WINRAR=C:\Program Files\WinRAR\WinRAR.exe"
if not exist "!WINRAR!" (
    echo [WARNING] WinRAR not found at: !WINRAR!
    echo [INFO] Will use PowerShell compression (slower but works)
    set "USE_WINRAR=0"
) else (
    echo [INFO] Using WinRAR for fast compression
    set "USE_WINRAR=1"
)

REM Step 1: Clean previous build
echo Step 1: Cleaning previous build...
if exist dist rmdir /s /q dist
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json
echo [OK] Clean complete

REM Step 2: Install dependencies
echo.
echo Step 2: Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed

REM Step 3: TypeScript type check
echo.
echo Step 3: Running TypeScript type check...
call npm run check
if errorlevel 1 (
    echo [WARNING] TypeScript check found errors. Continue anyway? (Y/N)
    set /p continue=
    if /i not "!continue!"=="Y" (
        echo Build cancelled.
        pause
        exit /b 1
    )
)
echo [OK] Type check complete

REM Step 4: Build production bundle
echo.
echo Step 4: Building production bundle...
echo [INFO] Building frontend with Vite...
echo [INFO] Building backend with esbuild...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build complete

REM Step 4.5: Verify build output
echo.
echo Step 4.5: Verifying build output...
if not exist "dist\index.js" (
    echo [ERROR] Backend build failed - dist\index.js not found!
    pause
    exit /b 1
)
if not exist "dist\public\index.html" (
    echo [ERROR] Frontend build failed - dist\public\index.html not found!
    pause
    exit /b 1
)
echo [OK] Build verification passed

REM Step 5: Prepare deployment folder
echo.
echo Step 5: Preparing deployment folder...

REM Create deployment directory structure
if not exist ..\deploy mkdir ..\deploy
cd ..\deploy
if exist scheduled-deploy rmdir /s /q scheduled-deploy
mkdir scheduled-deploy
cd scheduled-deploy

REM Copy build output
echo [INFO] Copying dist folder...
xcopy /E /I /Y ..\..\Scheduled\dist dist

REM Copy server files (for migrations, etc.)
echo [INFO] Copying server folder...
xcopy /E /I /Y ..\..\Scheduled\server server

REM Copy migrations
echo [INFO] Copying migrations...
xcopy /E /I /Y ..\..\Scheduled\migrations migrations

REM Copy shared schema
echo [INFO] Copying shared folder...
xcopy /E /I /Y ..\..\Scheduled\shared shared

REM Copy configuration files
echo [INFO] Copying configuration files...
copy /Y ..\..\Scheduled\package.json .
copy /Y ..\..\Scheduled\drizzle.config.ts .

REM Copy production environment template
if exist ..\..\Scheduled\.env.production (
    copy /Y ..\..\Scheduled\.env.production .env
    echo [INFO] Copied .env.production
) else (
    echo [WARNING] .env.production not found - you'll need to create .env manually
)

REM Copy deployment scripts
if exist ..\..\Scheduled\start-production.sh (
    copy /Y ..\..\Scheduled\start-production.sh .
)
if exist ..\..\Scheduled\stop-production.sh (
    copy /Y ..\..\Scheduled\stop-production.sh .
)
if exist ..\..\Scheduled\.htaccess (
    copy /Y ..\..\Scheduled\.htaccess .
)

echo [OK] Files copied

REM Step 5.5: Convert line endings to Unix format
echo.
echo Step 5.5: Converting line endings to Unix format...
powershell -Command "$files = '.env', 'start-production.sh', 'stop-production.sh'; foreach ($file in $files) { if (Test-Path $file) { $content = Get-Content $file -Raw; $content = $content -replace \"`r`n\", \"`n\"; [System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.UTF8Encoding]::new($false)); Write-Host \"[OK] Converted $file\" } }"

REM Step 6: Install production dependencies ONLY
echo.
echo Step 6: Installing production dependencies...
echo [INFO] This will install Linux-compatible binaries
call npm ci --omit=dev
if errorlevel 1 (
    echo [ERROR] Production npm install failed!
    cd ..\..\Scheduled
    pause
    exit /b 1
)
echo [OK] Production dependencies installed

REM Step 7: Create deployment package
echo.
echo Step 7: Creating deployment package...

REM Go back to deploy folder
cd ..

REM Remove old deploy.zip if exists
if exist scheduled-deploy.zip del /f /q scheduled-deploy.zip

REM Create ZIP based on available tool
if "!USE_WINRAR!"=="1" (
    echo [INFO] Using WinRAR for compression...
    "!WINRAR!" a -afzip -r -ep1 scheduled-deploy.zip scheduled-deploy\*
) else (
    echo [INFO] Using PowerShell compression...
    powershell -Command "Compress-Archive -Path 'scheduled-deploy\*' -DestinationPath 'scheduled-deploy.zip' -Force"
)

if not exist scheduled-deploy.zip (
    echo [ERROR] Failed to create scheduled-deploy.zip
    cd ..\Scheduled
    pause
    exit /b 1
)

REM Get ZIP file size
for %%A in (scheduled-deploy.zip) do set size=%%~zA
set /a sizeMB=!size! / 1024 / 1024
echo [OK] Deploy package created: scheduled-deploy.zip (!sizeMB! MB)

REM Step 8: Clean up temporary folder
echo.
echo Step 8: Cleaning up...
rmdir /s /q scheduled-deploy
echo [OK] Cleanup complete

REM Step 9: Success summary
cd ..\Scheduled
echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Package location: ..\deploy\scheduled-deploy.zip
echo Package size: !sizeMB! MB
echo.
echo Next steps:
echo 1. Upload scheduled-deploy.zip to your cPanel server
echo 2. Extract in /home/USERNAME/nodeapp/
echo 3. Run: chmod +x start-production.sh stop-production.sh
echo 4. Configure .env with your database and API keys
echo 5. Run: ./start-production.sh
echo.
echo See DEPLOYMENT-GUIDE.md for detailed instructions.
echo.
pause
