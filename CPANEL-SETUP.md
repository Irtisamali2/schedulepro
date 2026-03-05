# Scheduled - cPanel Server Setup Guide

Complete guide for configuring your cPanel server BEFORE deploying the Scheduled application.

## Prerequisites Checklist

- [ ] cPanel/WHM access
- [ ] SSH access (for command line)
- [ ] Root or sudo access (for Node.js installation - **optional** if using cloud database)
- [ ] Domain pointed to your server

---

## Part 1: Database Setup (PostgreSQL)

You have **TWO OPTIONS** for database setup. Choose the one that fits your needs:

---

### **OPTION A: Cloud PostgreSQL (Recommended - Easiest)**

**No cPanel installation needed. No WHM/root access required. Works with all hosting plans.**

#### Why Cloud Database?
- ✅ **Zero server setup** - No PostgreSQL installation needed
- ✅ **Free tier available** - 10GB storage with Neon
- ✅ **Better security** - Automatic backups, encryption, updates
- ✅ **Scalable** - Upgrade easily when needed
- ✅ **Multi-server friendly** - Safe for shared WHM/cPanel environments

#### Best Free PostgreSQL Services:

**1. Neon (Recommended)**
- Free tier: 10GB storage, 3 projects
- PostgreSQL 15+
- Signup: https://neon.tech

**2. Supabase**
- Free tier: 500MB storage, 2 projects
- Includes additional features (storage, auth)
- Signup: https://supabase.com

**3. Railway**
- Free tier: $5 monthly credit
- Signup: https://railway.app

#### Quick Setup Guide (Neon):

**Step 1: Create Account**
1. Go to https://neon.tech
2. Sign up with GitHub/Google/Email
3. Verify your email

**Step 2: Create Database**
1. Click **Create Project**
2. Project name: `scheduled-app`
3. Region: **Choose closest to your cPanel server**
   - US East (Ohio) for US servers
   - EU West (Frankfurt) for EU servers
4. PostgreSQL version: **15** (or latest)
5. Click **Create Project**

**Step 3: Get Connection String**
1. On project dashboard, find **Connection Details**
2. Select **Connection string** tab
3. Copy the full connection string (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this** - you'll use it in Step 4

**Step 4: Configure Your App**

When you deploy your app, use this connection string in your `.env` file:

```env
DATABASE_URL=postgresql://your-neon-connection-string-here
```

**Done!** Skip to [Part 2: Node.js Setup](#part-2-nodejs-setup)

---

### **OPTION B: Local PostgreSQL (Advanced - Requires WHM Root Access)**

**Use this if you prefer to host the database on your cPanel server.**

⚠️ **Requirements:**
- Root/sudo access to WHM
- Won't affect other cPanel accounts (each gets isolated database)
- You manage backups and updates

#### Step 1: Check if PostgreSQL is Already Installed

```bash
# Check PostgreSQL version
psql --version

# Check if running
sudo systemctl status postgresql
```

If already installed, skip to Step 3.

#### Step 2: Install PostgreSQL (If Not Installed)

**For CentOS/AlmaLinux/CloudLinux:**
```bash
sudo yum install postgresql-server postgresql-contrib -y

# Initialize PostgreSQL
sudo postgresql-setup initdb

# Enable on startup
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**For Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo pg_ctlcluster 12 main start

# Enable on startup
sudo systemctl enable postgresql
```

#### Step 3: Create Database and User

**Access PostgreSQL as postgres user:**

```bash
# Switch to postgres user
sudo -i -u postgres

# Open PostgreSQL prompt
psql
```

**Inside PostgreSQL prompt, run these commands:**

```sql
-- Create database user (replace 'username' with your cPanel username)
CREATE USER username_scheduled WITH PASSWORD 'YourStrongPassword123!';

-- Create database
CREATE DATABASE username_scheduled;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE username_scheduled TO username_scheduled;

-- Grant schema permissions (important for tables)
\c username_scheduled
GRANT ALL ON SCHEMA public TO username_scheduled;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username_scheduled;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO username_scheduled;

-- Exit PostgreSQL
\q

-- Exit postgres user
exit
```

**Your Database Connection Details:**
```
Host: localhost
Port: 5432
Database: username_scheduled
Username: username_scheduled
Password: YourStrongPassword123!
```

**Connection String (for .env):**
```
DATABASE_URL=postgresql://username_scheduled:YourStrongPassword123!@localhost:5432/username_scheduled
```

#### Step 4: Allow Local Connections (If Needed)

Edit PostgreSQL configuration:

```bash
# Find PostgreSQL config
sudo find /var/lib/pgsql /etc/postgresql -name pg_hba.conf

# Edit the file (example path)
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

Add this line (if not exists):
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Step 5: Test Database Connection

```bash
# Test connection
psql -U username_scheduled -h localhost -d username_scheduled -W
# Enter password when prompted

# If successful, you'll see:
# username_scheduled=>

# Type \q to exit
```

---

## Part 2: Node.js Setup

### Step 1: Install Node.js 20+ (WHM/SSH)

**Option A: Using NodeSource Repository (Recommended)**

```bash
# For CentOS/AlmaLinux
sudo yum install -y gcc-c++ make
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# For Ubuntu/Debian
sudo apt-get install -y gcc g++ make
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

**Option B: Using cPanel Application Manager**

1. Login to **WHM**
2. Go to **Application Manager**
3. Install **Node.js 20.x** (latest LTS)
4. Set as system-wide or per-user

**Verify Installation:**

```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 2: Create Application Directory

```bash
# Create nodeapp directory
mkdir -p /home/username/nodeapp

# Set permissions
chmod 755 /home/username/nodeapp

# Navigate to it
cd /home/username/nodeapp
```

---

## Part 3: Domain & Proxy Configuration

### Step 1: Add Domain in cPanel (If New Domain)

1. Login to **cPanel**
2. Go to **Domains** → **Addon Domains** (or **Subdomains**)
3. Add your domain: `yourdomain.com`
4. Document Root: `/home/username/public_html/yourdomain.com`
5. Click **Add Domain**

### Step 2: Set Up Reverse Proxy

Navigate to your domain's public_html folder:

```bash
cd /home/username/public_html/yourdomain.com
```

Create `.htaccess` file with proxy configuration:

```bash
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

### Step 3: Verify Apache Modules (WHM)

In **WHM → Apache Configuration → EasyApache 4**, ensure these modules are enabled:

- [x] `mod_proxy`
- [x] `mod_proxy_http`
- [x] `mod_rewrite`
- [x] `mod_headers`

If not enabled:
1. Go to **WHM** → **EasyApache 4**
2. Search for "proxy"
3. Enable `mod_proxy` and `mod_proxy_http`
4. Search for "rewrite"
5. Enable `mod_rewrite`
6. Click **Provision** to apply changes

---

## Part 4: SSL Certificate

### Option 1: AutoSSL (Free - Recommended)

1. Go to **cPanel** → **SSL/TLS Status**
2. Select your domain
3. Click **Run AutoSSL**
4. Wait for certificate to be issued

### Option 2: Let's Encrypt (Free)

1. Go to **cPanel** → **SSL/TLS**
2. Click **Manage SSL sites**
3. Click **Install and Manage SSL for your site (HTTPS)**
4. Select domain and click **Install SSL**

### Verify SSL:

```bash
curl -I https://yourdomain.com
# Should return 200 OK (or 502 if app not started yet)
```

---

## Part 5: Firewall Configuration

### Open Port 5000 (Internal Only - Already Done)

The Node.js app runs on port 5000 **internally**. It doesn't need to be opened to the internet because Apache proxies requests.

**Verify port 5000 is available:**

```bash
# Check if anything is using port 5000
lsof -i :5000

# If nothing shows up, port is available ✓
```

---

## Part 6: Environment Variables Setup

After uploading your application, you'll need to configure `.env`:

```bash
cd /home/username/nodeapp

# Create .env file
nano .env
```

**Paste this template and fill in your values:**

```env
NODE_ENV=production
PORT=5000

# PostgreSQL Database (from Part 1)
DATABASE_URL=postgresql://username_scheduled:YourStrongPassword123!@localhost:5432/username_scheduled

# Generate session secret
# Run: openssl rand -base64 64
SESSION_SECRET=PASTE_OUTPUT_FROM_OPENSSL_COMMAND_HERE

# Stripe Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Resend Email API (from Resend Dashboard)
RESEND_API_KEY=re_your_actual_resend_api_key

# Application URLs (your actual domain)
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate SESSION_SECRET:**

```bash
openssl rand -base64 64
# Copy the output and paste it as SESSION_SECRET value
```

**IMPORTANT**:
- ❌ No quotes around values
- ✅ Replace ALL placeholder values with real ones
- ✅ Save file with Unix line endings (LF, not CRLF)

---

## Part 7: File Permissions

Set proper permissions:

```bash
cd /home/username/nodeapp

# Make scripts executable
chmod +x start-production.sh
chmod +x stop-production.sh

# Set directory permissions
chmod 755 /home/username/nodeapp

# If you have uploads directory
mkdir -p uploads
chmod 755 uploads

# Set ownership
chown -R username:username /home/username/nodeapp
```

---

## Part 8: Process Management (Optional but Recommended)

### Option A: Using systemd Service (Recommended)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/scheduled-app.service
```

Paste this:

```ini
[Unit]
Description=Scheduled Application
After=network.target
# Note: Remove 'postgresql.service' dependency if using cloud database

[Service]
Type=simple
User=username
WorkingDirectory=/home/username/nodeapp
EnvironmentFile=/home/username/nodeapp/.env
ExecStart=/usr/bin/node /home/username/nodeapp/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/username/nodeapp/app.log
StandardError=append:/home/username/nodeapp/app.log

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable scheduled-app
sudo systemctl start scheduled-app

# Check status
sudo systemctl status scheduled-app
```

### Option B: Using PM2 (Alternative)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start app
cd /home/username/nodeapp
pm2 start dist/index.js --name scheduled-app

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the command it provides

# View logs
pm2 logs scheduled-app
```

---

## Quick Reference: Where to Get API Keys

### Stripe Keys
1. Go to https://dashboard.stripe.com/
2. Login to your account
3. Click **Developers** → **API keys**
4. Copy:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
5. For webhook secret:
   - Go to **Developers** → **Webhooks**
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Resend API Key
1. Go to https://resend.com/
2. Login to your account
3. Go to **API Keys**
4. Click **Create API Key**
5. Name it: "Production - Scheduled App"
6. Copy the key → `RESEND_API_KEY`
7. Verify your domain in **Domains** section

---

## Verification Checklist

Before deploying your application, verify:

**Database (choose one):**
- [ ] **Option A:** Cloud PostgreSQL connection string obtained (Neon/Supabase/Railway)
- [ ] **Option B:** Local PostgreSQL installed, running, database created with user/permissions

**Server Setup:**
- [ ] Node.js 20+ installed
- [ ] `/home/username/nodeapp` directory exists
- [ ] Domain is set up in cPanel
- [ ] Apache proxy modules enabled
- [ ] SSL certificate installed
- [ ] Port 5000 is available

**Configuration:**
- [ ] `.env` file configured with DATABASE_URL and all API keys
- [ ] File permissions set correctly
- [ ] API keys obtained (Stripe, Resend)

---

## Testing After Setup

Once everything is configured and app is deployed:

### Test Database Connection

**If using cloud database (Option A):**
Your connection will be tested when you run migrations. Skip to "Test Node.js" below.

**If using local PostgreSQL (Option B):**
```bash
psql -U username_scheduled -h localhost -d username_scheduled -W
```

### Test Node.js
```bash
node --version  # Should show v20.x.x
```

### Test Application is Running
```bash
lsof -i :5000  # Should show node process
```

### Test Health Endpoint
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok",...}
```

### Test Domain Access
```bash
curl -I https://yourdomain.com
# Should return 200 OK
```

---

## Common Issues

### PostgreSQL won't start
```bash
# Check status
sudo systemctl status postgresql

# View logs
sudo journalctl -u postgresql -n 50

# Restart
sudo systemctl restart postgresql
```

### Can't connect to database
```bash
# Check pg_hba.conf has localhost entry
sudo cat /var/lib/pgsql/data/pg_hba.conf | grep 127.0.0.1

# Should see:
# host    all    all    127.0.0.1/32    md5
```

### Apache not proxying
```bash
# Check Apache modules
httpd -M | grep proxy
# Should show: proxy_module, proxy_http_module

# Restart Apache
sudo systemctl restart httpd
```

### Port 5000 already in use
```bash
# Find what's using it
sudo lsof -i :5000

# Kill the process
sudo kill <PID>
```

---

## Next Steps

Once cPanel is fully configured:

1. **Build your application** locally: `build-for-cpanel.bat`
2. **Upload** `scheduled-deploy.zip` to `/home/username/nodeapp/`
3. **Extract** the zip file
4. **Install dependencies**: `npm install`
5. **Run migrations**: `npx drizzle-kit push`
6. **Start the app**: `./start-production.sh`
7. **Test**: Visit `https://yourdomain.com`

See **DEPLOYMENT-GUIDE.md** for detailed deployment steps.

---

**Last Updated**: December 2025
