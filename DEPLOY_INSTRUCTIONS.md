# 🚀 PrimeX IPTV v11.0 - Zero-Configuration Deployment

**Complete automated deployment - No manual configuration needed**

---

## 📋 Prerequisites

Before deployment, ensure your server has:

- **Ubuntu 20.04+** (or similar Linux distribution)
- **Node.js 18+** installed
- **MySQL 8.0+** installed and running
- **Root or sudo access** for initial setup
- **Port 3000** available

---

## ⚡ One-Command Deployment

### Step 1: Clone Repository

```bash
cd /var/www
git clone https://github.com/Black10998/PrimeX.git
cd PrimeX
```

### Step 2: Run Deployment Script

```bash
./deploy.sh
```

**That's it!** The script will:
- ✅ Check all prerequisites
- ✅ Install Node.js dependencies
- ✅ Generate secure secrets automatically
- ✅ Create production .env file
- ✅ Setup MySQL database and user
- ✅ Initialize database schema
- ✅ Create admin account
- ✅ Start application with PM2
- ✅ Configure auto-restart on reboot

---

## 🔐 What You'll Need

The script will ask for:
- **MySQL root password** (one time only, for database setup)

Everything else is automated.

---

## 📊 After Deployment

### Access Your System

- **Admin Panel**: `http://YOUR_SERVER_IP:3000`
- **Health Check**: `http://YOUR_SERVER_IP:3000/health`

### Admin Credentials

The script will display your auto-generated admin credentials:
```
Username: admin
Password: [Auto-generated - shown after setup]
```

**⚠️ Save these credentials immediately!**

---

## 🛠️ Management Commands

### View Application Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs primex-iptv
```

### Restart Application
```bash
pm2 restart primex-iptv
```

### Stop Application
```bash
pm2 stop primex-iptv
```

### Monitor Resources
```bash
pm2 monit
```

---

## 🔄 Update to Latest Version

```bash
cd /var/www/PrimeX
git pull origin main
npm install --production
pm2 restart primex-iptv
```

---

## 🔒 Security Recommendations

### 1. Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PrimeX port
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### 2. Setup SSL/HTTPS (Recommended)

Use Nginx as reverse proxy with Let's Encrypt:

```bash
# Install Nginx
sudo apt install nginx

# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

**Nginx Configuration** (`/etc/nginx/sites-available/primex`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/primex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Regular Backups

```bash
# Backup database
mysqldump -u primex_user -p primex > backup-$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs primex-iptv --lines 100

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart primex-iptv
```

### Database Connection Error

```bash
# Test MySQL connection
mysql -u primex_user -p primex

# Check .env file
cat .env | grep DB_

# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'primex';"
```

### Can't Access Admin Panel

```bash
# Check firewall
sudo ufw status

# Check if application is running
pm2 status

# Check port binding
sudo netstat -tulpn | grep 3000
```

---

## 📞 Support

**Developer**: PAX  
**Email**: info@paxdes.com  
**Website**: https://paxdes.com/

---

## 📝 System Information

- **Version**: v11.0.0
- **Node.js**: 18+
- **Database**: MySQL 8.0+
- **Process Manager**: PM2
- **Port**: 3000 (default)

---

## ✅ Deployment Checklist

- [ ] Server meets prerequisites
- [ ] MySQL root password ready
- [ ] Port 3000 available
- [ ] Firewall configured
- [ ] SSL certificate obtained (optional but recommended)
- [ ] Backup strategy in place
- [ ] Admin credentials saved securely

---

**Built with ❤️ by PAX**
