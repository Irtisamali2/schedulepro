@echo off
echo ========================================
echo  Creating Deployment Package
echo ========================================
echo.

REM Check if dist folder exists
if not exist "dist\index.js" (
    echo [ERROR] Build not found! Run quick-build.bat first.
    pause
    exit /b 1
)

REM Create deployment directory
echo Step 1: Creating deployment folder...
if not exist "..\deploy" mkdir "..\deploy"
cd ..\deploy
if exist scheduled-deploy rmdir /s /q scheduled-deploy
mkdir scheduled-deploy
cd scheduled-deploy

REM Copy build output
echo Step 2: Copying dist folder...
xcopy /E /I /Y ..\..\Scheduled\dist dist

REM Copy server files
echo Step 3: Copying server folder...
xcopy /E /I /Y ..\..\Scheduled\server server

REM Copy migrations
echo Step 4: Copying migrations...
xcopy /E /I /Y ..\..\Scheduled\migrations migrations

REM Copy shared schema
echo Step 5: Copying shared folder...
xcopy /E /I /Y ..\..\Scheduled\shared shared

REM Copy configuration files
echo Step 6: Copying configuration files...
copy /Y ..\..\Scheduled\package.json .
copy /Y ..\..\Scheduled\drizzle.config.ts .

REM Copy .env file
if exist ..\..\Scheduled\.env (
    copy /Y ..\..\Scheduled\.env .
    echo [INFO] Copied .env file
) else (
    echo [WARNING] .env not found - you'll need to create it on server
)

REM Copy deployment scripts
echo Step 7: Copying deployment scripts...
if exist ..\..\Scheduled\start-production.sh (
    copy /Y ..\..\Scheduled\start-production.sh .
)
if exist ..\..\Scheduled\stop-production.sh (
    copy /Y ..\..\Scheduled\stop-production.sh .
)

REM Convert line endings to Unix format
echo Step 8: Converting line endings to Unix format...
powershell -Command "$files = '.env', 'start-production.sh', 'stop-production.sh'; foreach ($file in $files) { if (Test-Path $file) { $content = Get-Content $file -Raw; $content = $content -replace \"`r`n\", \"`n\"; [System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.UTF8Encoding]::new($false)); Write-Host \"[OK] Converted $file\" } }"

REM Install production dependencies
echo.
echo Step 9: Installing production dependencies...
REM call npm ci --omit=dev
if errorlevel 1 (
    echo [ERROR] npm install failed!
    cd ..\..\Scheduled
    pause
    exit /b 1
)

REM Create ZIP file
echo.
echo Step 10: Creating deployment package...
cd ..

REM Remove old zip
if exist scheduled-deploy.zip del /f /q scheduled-deploy.zip

REM Create ZIP using PowerShell
echo [INFO] Using PowerShell compression...
powershell -Command "Compress-Archive -Path 'scheduled-deploy\*' -DestinationPath 'scheduled-deploy.zip' -Force"

if not exist scheduled-deploy.zip (
    echo [ERROR] Failed to create scheduled-deploy.zip
    cd ..\Scheduled
    pause
    exit /b 1
)

REM Get file size
for %%A in (scheduled-deploy.zip) do set size=%%~zA
set /a sizeMB=!size! / 1024 / 1024

REM Clean up
echo.
echo Step 11: Cleaning up...
rmdir /s /q scheduled-deploy

REM Success
cd ..\Scheduled
echo.
echo ========================================
echo  DEPLOYMENT PACKAGE CREATED!
echo ========================================
echo.
echo Package: ..\deploy\scheduled-deploy.zip
echo Size: !sizeMB! MB
echo.
echo Next steps:
echo 1. Upload scheduled-deploy.zip to your cPanel server
echo 2. Extract in /home/USERNAME/nodeapp/
echo 3. Run: chmod +x *.sh
echo 4. Update .env with your domain
echo 5. Run: npx drizzle-kit push
echo 6. Run: ./start-production.sh
echo.
pause
