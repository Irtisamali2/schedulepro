@echo off
echo ========================================
echo Building Complete Production Package
echo ========================================
echo.

REM Step 1: Build the project
echo Step 1: Building project...
call npm run build

if errorlevel 1 (
    echo [WARNING] Build had errors, but continuing...
    echo Press Y to continue anyway, or N to stop
    choice /C YN /M "Continue with deployment"
    if errorlevel 2 exit /b 1
)

echo [OK] Build complete
echo.

REM Step 2: Create deploy folder
echo Step 2: Creating deploy folder...
cd ..
if exist deploy rmdir /s /q deploy
mkdir deploy
cd deploy

echo [OK] Deploy folder created
echo.

REM Step 3: Copy built files
echo Step 3: Copying production files...
cd ..\Scheduled

REM Copy dist folder
xcopy dist ..\deploy\dist /E /I /Y

REM Copy server folder
xcopy server ..\deploy\server /E /I /Y

REM Copy migrations folder
if exist migrations xcopy migrations ..\deploy\migrations /E /I /Y

REM Copy shared folder
if exist shared xcopy shared ..\deploy\shared /E /I /Y

REM Copy configuration files
copy package.json ..\deploy\
copy package-lock.json ..\deploy\
copy drizzle.config.ts ..\deploy\
copy .env ..\deploy\

REM Copy startup scripts
if exist start-production.sh copy start-production.sh ..\deploy\
if exist stop-production.sh copy stop-production.sh ..\deploy\

REM Copy .htaccess if exists
if exist .htaccess copy .htaccess ..\deploy\

echo [OK] Files copied
echo.

REM Step 4: Create upload directory structure
echo Step 4: Creating upload directories...
cd ..\deploy
if not exist server\uploads mkdir server\uploads
if not exist server\uploads\testimonials mkdir server\uploads\testimonials
if not exist server\uploads\profile-pictures mkdir server\uploads\profile-pictures
if not exist server\uploads\documents mkdir server\uploads\documents

REM Create .gitkeep files
echo. > server\uploads\.gitkeep
echo. > server\uploads\testimonials\.gitkeep
echo. > server\uploads\profile-pictures\.gitkeep
echo. > server\uploads\documents\.gitkeep

echo [OK] Upload directories created
echo.

REM Step 5: Convert line endings to Unix format
echo Step 5: Converting line endings to Unix format...
powershell -Command "$files = '.env', 'start-production.sh', 'stop-production.sh'; foreach ($file in $files) { if (Test-Path $file) { $content = Get-Content $file -Raw; $content = $content -replace \"`r`n\", \"`n\"; [System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.UTF8Encoding]::new($false)); Write-Host \"[OK] Converted $file\" } }"
echo.

REM Step 6: Create deployment package
echo Step 6: Creating deploy.zip...
echo NOTE: Excluding node_modules - install fresh on server with Linux binaries
echo.

REM Try WinRAR first (much faster)
if exist "C:\Program Files\WinRAR\WinRAR.exe" (
    echo [INFO] Using WinRAR for fast compression...
    "C:\Program Files\WinRAR\WinRAR.exe" a -afzip -ep1 deploy.zip dist server shared migrations package.json package-lock.json drizzle.config.ts .env start-production.sh stop-production.sh .htaccess
    if not errorlevel 1 (
        goto :package_created
    )
)

REM Fallback to PowerShell
echo [INFO] Using PowerShell compression...
powershell -Command "Compress-Archive -Path 'dist','server','shared','migrations','package.json','package-lock.json','drizzle.config.ts','.env','start-production.sh','stop-production.sh','.htaccess' -DestinationPath 'deploy.zip' -Force"

if errorlevel 1 (
    echo [ERROR] Failed to create deploy.zip!
    cd ..\Scheduled
    pause
    exit /b 1
)

:package_created
echo.
echo ========================================
echo DEPLOYMENT PACKAGE CREATED!
echo ========================================
echo.
echo Package location: ..\deploy\deploy.zip
echo Package size:
for %%A in (deploy.zip) do echo %%~zA bytes (%%~zAkB)
echo.
echo What's included:
echo   [OK] dist/ (built frontend + backend)
echo   [OK] server/ (including uploads directories)
echo   [OK] shared/ (shared utilities)
echo   [OK] migrations/ (database migrations)
echo   [OK] package.json (dependency list)
echo   [OK] drizzle.config.ts (database config)
echo   [OK] .env (configuration with Unix line endings)
echo   [OK] start-production.sh (startup script)
echo   [OK] stop-production.sh (stop script)
echo.
echo ========================================
echo NEXT STEPS - ON YOUR CPANEL SERVER:
echo ========================================
echo.
echo 1. Upload deploy.zip to server:
echo    Location: /home/USERNAME/nodeapp/
echo.
echo 2. SSH into server and extract:
echo    cd /home/USERNAME/nodeapp
echo    unzip -o deploy.zip
echo.
echo 3. Install dependencies (LINUX binaries):
echo    npm install --omit=dev
echo.
echo 4. Set file permissions:
echo    chmod +x start-production.sh stop-production.sh
echo    chmod 755 server/uploads -R
echo.
echo 5. Update .env with your domain:
echo    nano .env
echo    # Change APP_URL to your actual domain
echo.
echo 6. Run database migrations:
echo    npx drizzle-kit push
echo.
echo 7. Start the application:
echo    ./start-production.sh
echo.
echo 8. Verify it's running:
echo    tail -f app.log
echo.
echo ========================================
echo IMPORTANT NOTES:
echo ========================================
echo.
echo - node_modules NOT included (10-20x smaller zip!)
echo - MUST run 'npm ci --omit=dev' on server for Linux binaries
echo - All line endings converted to Unix format (LF)
echo - Database: Using Supabase cloud PostgreSQL
echo - Port: Application runs on port 5000 internally
echo.
echo Troubleshooting:
echo - If app won't start: tail -f app.log
echo - If uploads fail: chmod 755 server/uploads -R
echo - If database fails: Check .env DATABASE_URL
echo.
pause
cd ..\Scheduled
