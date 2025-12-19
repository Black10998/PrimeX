# PrimeX IPTV System - VPS Deployment Guide

**Developer:** PAX  
**Support:** info@paxdes.com  
**Version:** 2.0 (Rebuilt)

---

## Prerequisites

- VPS with Ubuntu 20.04+ (already provisioned)
- Root or sudo access
- MySQL 8.0+ installed
- Node.js 18+ installed

---

## Architecture Overview

```
PrimeX IPTV System
├── Node.js + Express (Backend)
├── MySQL 8.0 (Database: primex)
├── PM2 (Process Manager)
└── Nginx (Reverse Proxy - Optional)
```

**Key Principles:**
- Single database connection pool
- Environment variables only (NO hardcoded values)
- Fail-fast on missing configuration
- Clear startup logging
- Production-ready error handling

---

## Step 1: Database Setup

### Create Database and User

```bash
# Login to MySQL as root
sudo mysql -u root -p
```

```sql
-- Create database with utf8mb4 charset
CREATE DATABASE primex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user (NOT root)
-- Replace 'YOUR_HOST' with actual host (e.g., 'localhost', '127.0.0.1', or '%' for any)
CREATE USER 'primex_user'@'YOUR_HOST' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON primex.* TO 'primex_user'@'YOUR_HOST';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'primex_user';

EXIT;
```

**Note:** For local MySQL, use `'localhost'` or `'127.0.0.1'` as YOUR_HOST. For remote MySQL, use the appropriate host or `'%'` for any host.

### Test Connection

```bash
mysql -u primex_user -p primex
# Enter password and verify you can connect
EXIT;
```

---

## Step 2: Application Setup

### Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/Black10998/PrimeX.git
cd PrimeX
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required Configuration:**

```env
# Database (CRITICAL - NO DEFAULTS)
# You MUST set these values - application will fail if missing
DB_HOST=YOUR_DATABASE_HOST
DB_PORT=3306
DB_NAME=primex
DB_USER=primex_user
DB_PASSWORD=your_actual_password_here

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_64_character_secret_here
JWT_REFRESH_SECRET=another_64_character_secret_here

# Admin Account
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_now
ADMIN_EMAIL=info@paxdes.com

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

**Generate Secure Secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 3: Initialize Database

```bash
npm run init-db
```

**Expected Output:**
```
✅ Environment file loaded
✅ Database environment variables validated
✅ Database connection successful
✅ Database schema created successfully
✅ Super admin account created
✅ Default subscription plans created
✅ Default categories created
```

**Save the admin credentials shown!**

---

## Step 4: Generate Subscription Codes

```bash
npm run generate-codes
```

This creates 200 codes (50 weekly, 100 monthly, 50 yearly).

---

## Step 5: Test Application

```bash
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║              🎬 PrimeX IPTV System 🎬                  ║
║                   Developer: PAX                       ║
║              Support: info@paxdes.com                  ║
╚════════════════════════════════════════════════════════╝

✅ Environment file loaded
✅ Database environment variables validated
✅ Database connection successful

🚀 Starting PrimeX IPTV System...

📊 Testing database connection...
✅ Database connection successful
   Host: YOUR_HOST:3306
   Database: primex
   User: primex_user

╔════════════════════════════════════════════════════════╗
║           ✅ SERVER STARTED SUCCESSFULLY ✅            ║
╚════════════════════════════════════════════════════════╝

🌐 Server Information:
   URL: http://0.0.0.0:3000
   Environment: production

📡 API Endpoints:
   REST API: http://0.0.0.0:3000/api/v1
   Xtream API: http://0.0.0.0:3000/player_api.php
   Health Check: http://0.0.0.0:3000/health

🎛️  Admin Panel:
   URL: http://0.0.0.0:3000/
   Username: admin

⚡ Ready to accept connections!
```

**Test Health Endpoint:**

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 5.123,
  "database": "connected",
  "version": "1.0.0"
}
```

If working, press `Ctrl+C` to stop and proceed to PM2 setup.

---

## Step 6: Production Deployment with PM2

### Install PM2

```bash
sudo npm install -g pm2
```

### Start Application

```bash
pm2 start ecosystem.config.js
```

### Save PM2 Configuration

```bash
pm2 save
```

### Enable PM2 on System Boot

```bash
pm2 startup
# Follow the command output
```

### Verify Status

```bash
pm2 status
```

Expected output:
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ primex-iptv  │ fork        │ 0       │ online  │ 0%       │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### View Logs

```bash
# Real-time logs
pm2 logs primex-iptv

# Last 100 lines
pm2 logs primex-iptv --lines 100

# Error logs only
pm2 logs primex-iptv --err
```

---

## Step 7: Firewall Configuration

```bash
# Allow HTTP
sudo ufw allow 3000/tcp

# Allow HTTPS (if using Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 8: Access Admin Panel

1. Open browser: `http://your-server-ip:3000`
2. Login with admin credentials
3. **IMMEDIATELY change the password**

---

## PM2 Commands Reference

```bash
# Start
pm2 start ecosystem.config.js

# Restart
pm2 restart primex-iptv

# Stop
pm2 stop primex-iptv

# Delete
pm2 delete primex-iptv

# Logs
pm2 logs primex-iptv

# Monitor
pm2 monit

# Status
pm2 status

# Info
pm2 info primex-iptv
```

---

## Troubleshooting

### Server Won't Start

**Check logs:**
```bash
pm2 logs primex-iptv --lines 50
```

**Common issues:**

1. **Missing .env file**
   ```
   ❌ FATAL: .env file not found
   ```
   Solution: Copy .env.example to .env and configure

2. **Database connection failed**
   ```
   ❌ Database connection failed
   ```
   Solutions:
   - Verify MySQL is running: `sudo systemctl status mysql`
   - Check credentials in .env
   - Test connection: `mysql -u primex_user -p primex`

3. **Missing environment variables**
   ```
   ❌ Missing required environment variables: JWT_SECRET
   ```
   Solution: Add missing variables to .env

4. **Port already in use**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   Solution: Change PORT in .env or kill process using port

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log

# Test connection
mysql -u primex_user -p primex
```

### View Application Logs

```bash
# PM2 logs
pm2 logs primex-iptv

# Application logs
tail -f logs/app.log

# PM2 error logs
tail -f logs/pm2-error.log
```

---

## Maintenance

### Update Application

```bash
cd /var/www/PrimeX
git pull
npm install
pm2 restart primex-iptv
```

### Database Backup

```bash
# Backup
mysqldump -u primex_user -p primex > backup_$(date +%Y%m%d).sql

# Restore
mysql -u primex_user -p primex < backup_20240101.sql
```

### View System Status

```bash
# PM2 status
pm2 status

# System resources
pm2 monit

# Health check
curl http://localhost:3000/health
```

---

## Nginx Reverse Proxy (Optional)

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure

```bash
sudo nano /etc/nginx/sites-available/primex
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable

```bash
sudo ln -s /etc/nginx/sites-available/primex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## System Endpoints

### Health Check
```
GET http://your-server:3000/health
```

### Admin Panel
```
http://your-server:3000/
```

### REST API
```
http://your-server:3000/api/v1
```

### Xtream API
```
http://your-server:3000/player_api.php
```

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure JWT secrets (64+ characters)
- [ ] Database user is NOT root
- [ ] Firewall configured
- [ ] SSL certificate installed (production)
- [ ] Regular database backups configured
- [ ] PM2 startup enabled
- [ ] Logs monitored regularly

---

## Support

**Developer:** PAX  
**Email:** info@paxdes.com

**Include in support requests:**
- PM2 logs: `pm2 logs primex-iptv --lines 100`
- Health check output: `curl http://localhost:3000/health`
- Environment: `pm2 info primex-iptv`

---

**System Architecture:**
- Single database connection pool
- Environment-driven configuration
- Fail-fast validation
- Production-ready logging
- PM2 process management
