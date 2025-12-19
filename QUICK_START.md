# PrimeX IPTV v11.0 - Quick Start Guide

## 🚀 For Existing Installation (3 Steps)

If you already have PrimeX running and just need to update:

### 1. Pull Latest Code
```bash
cd /var/www/primex-iptv
git pull origin main
```

### 2. Restart Server
```bash
pm2 restart primex-iptv
```

### 3. Complete Web Setup
Open browser: **https://prime-x.live/setup**

Fill in:
- Username: `admin`
- Email: `admin@prime-x.live`
- Password: `PAX430550!!!` (or your choice)

Click "Create Admin Account" → Done!

**Login:** https://prime-x.live/admin/login.html

---

## 📦 Fresh Installation

Get your IPTV system running in 10 minutes!

### Prerequisites

- Linux VPS (Ubuntu 20.04+)
- Root or sudo access
- Domain name (optional but recommended)

---

## Installation (5 minutes)

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL
sudo mysql_secure_installation
```

### 2. Setup Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE primex_iptv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'primex_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON primex_iptv.* TO 'primex_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Install PrimeX

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/Black10998/PrimeX.git
cd PrimeX

# Install packages
npm install

# Configure environment
cp .env.example .env
nano .env
```

**Update these values in .env:**
```env
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=your_random_64_character_secret_here
ADMIN_PASSWORD=ChangeThisImmediately123!
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialize System

```bash
# Create database tables
npm run init-db

# Generate 200 subscription codes
npm run generate-codes

# Start server
npm start
```

Visit: `http://your-server-ip:3000`

---

## First Login (2 minutes)

1. Open browser: `http://your-server-ip:3000`
2. Login with:
   - Username: `admin`
   - Password: (from init-db output)
3. **IMMEDIATELY change password!**

---

## Basic Setup (3 minutes)

### Add a Streaming Server

1. Navigate to **Servers**
2. Click **Add Server**
3. Fill in:
   - Name: "Primary Server"
   - URL: Your streaming server URL
   - Type: Primary
   - Priority: 10
4. Save

### Add a Channel

1. Navigate to **Channels**
2. Click **Add Channel**
3. Fill in:
   - Name (English): "Test Channel"
   - Name (Arabic): "قناة تجريبية"
   - Category: Select any
   - Stream URL: Your stream URL
4. Save

### Test with IPTV Player

1. Open any Xtream-compatible IPTV player
2. Add server:
   - URL: `http://your-server-ip:3000`
   - Username: Create a test user first
   - Password: User's password
3. Browse channels

---

## Production Deployment (Optional)

### Install PM2

```bash
sudo npm install -g pm2
pm2 start src/server.js --name primex-iptv
pm2 save
pm2 startup
```

### Install Nginx

```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/primex
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/primex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Add SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Common Commands

```bash
# View logs
pm2 logs primex-iptv

# Restart
pm2 restart primex-iptv

# Stop
pm2 stop primex-iptv

# Status
pm2 status

# Generate more codes
npm run generate-codes

# Database backup
mysqldump -u primex_user -p primex_iptv > backup.sql
```

---

## Next Steps

1. ✅ Change admin password
2. ✅ Add your streaming servers
3. ✅ Add channels with stream URLs
4. ✅ Create subscription plans
5. ✅ Generate subscription codes
6. ✅ Create test user
7. ✅ Test with IPTV player
8. ✅ Configure firewall
9. ✅ Setup SSL certificate
10. ✅ Regular backups

---

## Need Help?

- **Full Guide:** See INSTALLATION_GUIDE.md
- **API Docs:** See API_DOCUMENTATION.md
- **Admin Manual:** See ADMIN_GUIDE.md
- **Support:** info@paxdes.com

---

## Important Reminders

⚠️ **Change default admin password immediately**  
⚠️ **Only add content you have rights to use**  
⚠️ **Setup regular database backups**  
⚠️ **Use SSL/HTTPS in production**  
⚠️ **Monitor system logs regularly**

---

**System by PAX | Support: info@paxdes.com**
