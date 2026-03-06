# Scheduled - cPanel Deployment Guide

Complete guide for deploying the Scheduled application to cPanel with Node.js and PostgreSQL.

## Prerequisites

- cPanel/WHM access to your server
- Node.js 20+ installed on server (via Application Manager)
- PostgreSQL database created with credentials
- Domain pointed to your server
- SSH access to server

## Environment Configuration

The `.env` file contains all configuration. **IMPORTANT**: Values must NOT have quotes.

```env
NODE_ENV=production
PORT=5000

# PostgreSQL Database - Use connection string format
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Session encryption key (generate: openssl rand -base64 64)
SESSION_SECRET=your-random-secret-here

# Stripe Payment Keys
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key

# Application URLs
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api
```

## Deployment Steps

### 1. Build the Production Package (Local Machine)

On your Windows machine, run:

```bash
build-for-cpanel.bat
```

This will:
- Install dependencies
- Run TypeScript type checking
- Build frontend (React + Vite)
- Build backend (Express + esbuild)
- Copy necessary files
- Install production dependencies with Linux binaries
- Create `scheduled-deploy.zip` in `..\deploy\` folder

### 2. Set Up PostgreSQL Database (cPanel)

1. Go to **cPanel → PostgreSQL Databases**
2. Create a new database: `username_scheduled`
3. Create a database user with strong password
4. Add user to database with ALL PRIVILEGES
5. Note your connection details:
   ```
   Host: localhost
   Port: 5432
   Database: username_scheduled
   Username: username_dbuser
   Password: your_password
   ```

### 3. Upload to Server

1. Go to **cPanel → File Manager**
2. Navigate to `/home/username/nodeapp/`
3. **Delete old files** (if updating):
   - Delete `dist/` folder
   - Delete `server/` folder
   - Delete `node_modules/` folder
   - Keep `.env` if you've customized it
4. Upload `scheduled-deploy.zip`
5. Right-click → Extract

### 4. Configure Environment (SSH Terminal)

```bash
cd /home/username/nodeapp

# Copy and edit environment file
cp .env.production .env
nano .env
```

Update the `.env` file with your actual values:

```env
DATABASE_URL=postgresql://username_dbuser:your_password@localhost:5432/username_scheduled
SESSION_SECRET=<run: openssl rand -base64 64>
STRIPE_SECRET_KEY=sk_live_your_actual_key
RESEND_API_KEY=re_your_actual_key
APP_URL=https://yourdomain.com
```

**IMPORTANT**:
- No quotes around values
- Use actual credentials
- Generate a strong SESSION_SECRET

### 5. Set Permissions

```bash
cd /home/username/nodeapp

# Make scripts executable
chmod +x start-production.sh stop-production.sh

# Set proper ownership
chown -R username:username /home/username/nodeapp

# Create uploads directory if needed
mkdir -p uploads
chmod -R 755 uploads
```

### 6. Run Database Migrations

```bash
cd /home/username/nodeapp

# Install Drizzle Kit (if not already in node_modules)
npm install drizzle-kit --save-dev

# Push schema to database
npx drizzle-kit push
```

This will create all necessary tables in your PostgreSQL database.

### 7. Start the Application

```bash
cd /home/username/nodeapp
./start-production.sh
```

This script:
- Loads all environment variables from `.env`
- Starts the app on port 5000
- Runs in background with `nohup`
- Logs to `app.log`

Verify it's running:

```bash
lsof -i :5000
tail -f app.log
```

You should see:
```
Server running on port 5000
Database connected
```

### 8. Set Up Proxy (One-Time Setup)

The domain's document root needs to proxy requests to the Node.js app.

```bash
cd /home/username/public_html/yourdomain.com

# Backup existing .htaccess
if [ -f .htaccess ]; then cp .htaccess .htaccess.backup; fi

# Create proxy .htaccess
cat > .htaccess << 'EOF'
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy all requests to Node.js app on port 5000
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]

# Preserve host header
RewriteCond %{HTTP:X-Forwarded-Host} ^$
RewriteRule ^(.*)$ - [E=HTTP_X_FORWARDED_HOST:%{HTTP_HOST}]
EOF
```

### 9. Test Your Application

Visit `https://yourdomain.com` and verify:

- ✅ Homepage loads
- ✅ API endpoints respond
- ✅ Database connection works
- ✅ Authentication works
- ✅ Health check: `https://yourdomain.com/api/health`

## Management Commands

### View Logs

```bash
cd /home/username/nodeapp
tail -f app.log
```

### Stop Application

```bash
cd /home/username/nodeapp
./stop-production.sh
```

### Restart Application

```bash
cd /home/username/nodeapp
./stop-production.sh && ./start-production.sh
```

### Check if Running

```bash
# Check port 5000
lsof -i :5000

# Check process
ps aux | grep "node dist/index.js" | grep -v grep
```

### Kill Stuck Process

```bash
pkill -f "node dist/index.js"
```

### Run Database Migrations

```bash
cd /home/username/nodeapp
npx drizzle-kit push
```

## Updating the Application

When you need to deploy changes:

1. **On local machine**: Run `build-for-cpanel.bat`
2. **Stop the app**: `./stop-production.sh`
3. **Upload new `scheduled-deploy.zip`** to `/home/username/nodeapp/`
4. **Backup your .env**:
   ```bash
   cp .env .env.backup
   ```
5. **Delete old files**:
   ```bash
   rm -rf dist/ server/ migrations/ shared/
   ```
6. **Extract**: `unzip -o scheduled-deploy.zip`
7. **Restore .env**: `cp .env.backup .env`
8. **Reinstall dependencies** (only if package.json changed):
   ```bash
   rm -rf node_modules package-lock.json
   npm install --production
   ```
9. **Run migrations**: `npx drizzle-kit push`
10. **Start the app**: `./start-production.sh`

## Troubleshooting

### App not starting

Check the log:
```bash
tail -50 app.log
```

Common issues:
- **Port already in use**: Kill existing process with `pkill -f "node dist/index.js"`
- **MODULE_NOT_FOUND errors**: Run `npm install` to reinstall dependencies
- **Database connection errors**: Check `.env` has correct DATABASE_URL

### Database connection errors

Error: `connect ECONNREFUSED` or `authentication failed`

**Solutions**:
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check DATABASE_URL format: `postgresql://user:pass@localhost:5432/dbname`
3. Verify database exists: `psql -l`
4. Check user permissions:
   ```bash
   psql -U postgres
   \du  # List users
   GRANT ALL PRIVILEGES ON DATABASE dbname TO username;
   ```

### API calls return 500

Check app.log for errors. Common causes:
- Missing environment variables
- Database schema not migrated
- Invalid API keys (Stripe, Resend)

### Website shows "Service Unavailable"

The app isn't running or proxy isn't working.

1. Check if app is running: `lsof -i :5000`
2. If not running: `./start-production.sh`
3. Check proxy `.htaccess` in document root
4. Verify Apache mod_proxy is enabled

### Port 5000 already in use

```bash
# Find what's using it
lsof -i :5000

# Kill it
kill <PID>

# Or kill all node processes
pkill -f "node dist/index.js"
```

### TypeScript errors during build

```bash
# Check for type errors
npm run check

# If errors are non-critical, you can skip and build anyway
# The build script will prompt you to continue
```

### Stripe webhook errors

Ensure Stripe webhook endpoint is configured:
- Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `payment_intent.succeeded`
- Webhook secret in `.env` matches Stripe dashboard

### Email sending fails

Check RESEND_API_KEY in `.env`:
1. Verify key is valid in Resend dashboard
2. Check domain is verified in Resend
3. Review app.log for specific errors

## File Structure on Server

```
/home/username/nodeapp/
├── dist/
│   ├── index.js           # Backend entry point (bundled)
│   └── public/            # Frontend static files
│       ├── index.html
│       ├── assets/        # JS/CSS bundles
│       └── ...
├── server/                # Original server source (for reference)
├── migrations/            # Database migration files
├── shared/                # Shared schemas and types
├── node_modules/          # Production dependencies
├── uploads/               # User uploaded files (if applicable)
├── .env                   # Environment variables (NO QUOTES)
├── package.json
├── drizzle.config.ts      # Database configuration
├── start-production.sh    # Startup script
├── stop-production.sh     # Stop script
└── app.log               # Application logs
```

## Important Notes

1. **No Quotes in .env**: Environment values must NOT have quotes
   - ❌ `DATABASE_URL="postgresql://..."`
   - ✅ `DATABASE_URL=postgresql://...`

2. **DATABASE_URL Format**: Must be complete connection string
   ```
   postgresql://username:password@host:port/database
   ```

3. **Rebuild node_modules on Server**: Never upload node_modules from Windows
   - Always run `npm install` on the Linux server

4. **Run Migrations After Deploy**: Database schema must be pushed
   ```bash
   npx drizzle-kit push
   ```

5. **Secure API Keys**: Never commit real API keys to git
   - Use `.env` for all secrets
   - Add `.env` to `.gitignore`

6. **Process Management**: App runs with `nohup` in background
   - Not using PM2 or Application Manager
   - Must manually start/stop with provided scripts

7. **Port Configuration**: Default is 5000 (configurable via PORT in .env)

8. **PostgreSQL vs MySQL**: This app requires PostgreSQL, not MySQL
   - Drizzle ORM is configured for PostgreSQL
   - Connection string format is different

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Session encryption key | (64-char random string) |
| `STRIPE_SECRET_KEY` | Stripe API secret | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing | `whsec_...` |
| `RESEND_API_KEY` | Email service API key | `re_...` |
| `APP_URL` | Application base URL | `https://yourdomain.com` |
| `API_URL` | API base URL | `https://yourdomain.com/api` |

## Health Check Endpoint

Monitor your application health:

```bash
curl https://yourdomain.com/api/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2025-12-26T..."
}
```

## Database Management

### Backup Database

```bash
pg_dump -U username_dbuser -h localhost username_scheduled > backup.sql
```

### Restore Database

```bash
psql -U username_dbuser -h localhost username_scheduled < backup.sql
```

### View Database Schema

```bash
psql -U username_dbuser -h localhost username_scheduled
\dt  # List tables
\d table_name  # Describe table
```

## Support

If you encounter issues:

1. Check `app.log` for errors
2. Verify all environment variables are set correctly
3. Ensure port 5000 is available
4. Confirm database credentials and connection
5. Verify PostgreSQL is running
6. Check file permissions
7. Test API health endpoint

---

**Last updated**: December 2025
