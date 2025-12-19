# PrimeX IPTV System - Installation Guide

**Developer:** PAX  
**Support:** info@paxdes.com

---

## System Requirements

### Minimum Requirements
- **OS:** Ubuntu 20.04 LTS or later / CentOS 8 or later
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 20 GB SSD
- **Network:** 100 Mbps connection

### Recommended for Production
- **OS:** Ubuntu 22.04 LTS
- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 50+ GB SSD
- **Network:** 1 Gbps connection

### Software Requirements
- Node.js 18.x or later
- MySQL 8.0 or later
- Nginx (optional, for reverse proxy)
- PM2 (for process management)

---

## Installation Steps

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x or later
```

### 3. Install MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

Follow prompts to secure MySQL installation.

### 4. Create Database and User

```bash
sudo mysql -u root -p
```

In MySQL console:

```sql
CREATE DATABASE primex_iptv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'primex_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON primex_iptv.* TO 'primex_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/Black10998/PrimeX.git
cd PrimeX
```

### 6. Install Dependencies

```bash
npm install
```

### 7. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update the following values:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=3306
DB_NAME=primex_iptv
DB_USER=primex_user
DB_PASSWORD=your_secure_password

JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=another_long_random_string
JWT_REFRESH_EXPIRES_IN=7d

ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_immediately
ADMIN_EMAIL=info@paxdes.com

BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5

CORS_ORIGIN=*

SUPPORT_EMAIL=info@paxdes.com
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 8. Initialize Database

```bash
npm run init-db
```

This will:
- Create all database tables
- Insert default categories
- Create default subscription plans
- Create super admin account

**Important:** Note the admin credentials displayed. Change the password immediately after first login.

### 9. Generate Initial Subscription Codes

```bash
npm run generate-codes
```

This creates 200 subscription codes:
- 50 weekly codes (7 days)
- 100 monthly codes (30 days)
- 50 yearly codes (365 days)

### 10. Test the Application

```bash
npm start
```

Visit: `http://your-server-ip:3000`

If everything works, stop the server (Ctrl+C) and proceed to production setup.

---

## Production Deployment

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Start Application with PM2

```bash
pm2 start src/server.js --name primex-iptv
pm2 save
pm2 startup
```

Follow the command output to enable PM2 on system boot.

### 3. Configure Firewall

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Install and Configure Nginx (Optional but Recommended)

```bash
sudo apt install -y nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/primex
```

Add:

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

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/primex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Install SSL Certificate (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow prompts to configure SSL.

---

## Post-Installation Configuration

### 1. Access Admin Panel

Visit: `http://your-domain.com` or `http://your-server-ip:3000`

Login with:
- Username: `admin`
- Password: (from initialization output)

### 2. Change Admin Password

Navigate to admin settings and change the default password immediately.

### 3. Configure System Settings

Update:
- Site name (English/Arabic)
- Support email
- Payment methods
- Device binding settings

### 4. Add Streaming Servers

Go to **Servers** section and add your streaming servers:
- Server name
- Server URL
- Type (primary/backup)
- Priority
- Max connections

### 5. Add Channels

Go to **Channels** section:
- Create channels with names (English/Arabic)
- Assign to categories
- Add stream URLs (primary and backup)
- Set EPG IDs
- Configure sort order

**Important:** Do NOT add any copyrighted content or unauthorized streams.

### 6. Configure Subscription Plans

Review and customize the default plans:
- Adjust pricing
- Set device limits
- Assign channel access
- Configure features

### 7. Manage Subscription Codes

Go to **Codes** section:
- View generated codes
- Generate additional codes
- Set source names for tracking
- Export codes for distribution

---

## Maintenance

### View Logs

```bash
pm2 logs primex-iptv
```

### Restart Application

```bash
pm2 restart primex-iptv
```

### Update Application

```bash
cd /var/www/PrimeX
git pull
npm install
pm2 restart primex-iptv
```

### Database Backup

```bash
mysqldump -u primex_user -p primex_iptv > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
mysql -u primex_user -p primex_iptv < backup_20240101.sql
```

### Monitor System

```bash
pm2 monit
```

---

## Troubleshooting

### Application Won't Start

Check logs:
```bash
pm2 logs primex-iptv --lines 100
```

Common issues:
- Database connection failed: Check `.env` credentials
- Port already in use: Change PORT in `.env`
- Permission denied: Check file ownership

### Database Connection Error

Test connection:
```bash
mysql -u primex_user -p primex_iptv
```

If fails, verify:
- MySQL is running: `sudo systemctl status mysql`
- User has correct permissions
- Password is correct in `.env`

### Can't Access Admin Panel

Check:
- Firewall allows port 3000
- Application is running: `pm2 status`
- Nginx configuration (if using)

### Subscription Codes Not Working

Verify:
- Codes were generated: Check database or admin panel
- Code status is 'active'
- Code hasn't exceeded max uses

---

## Security Best Practices

1. **Change default admin password immediately**
2. **Use strong JWT secrets** (64+ characters)
3. **Enable firewall** and only open necessary ports
4. **Use SSL/HTTPS** in production
5. **Regular backups** of database
6. **Keep system updated**: `sudo apt update && sudo apt upgrade`
7. **Monitor logs** for suspicious activity
8. **Limit SSH access** to specific IPs if possible
9. **Use strong database passwords**
10. **Regular security audits**

---

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for frequently queried fields
ALTER TABLE users ADD INDEX idx_subscription_status (status, subscription_end);
ALTER TABLE channels ADD INDEX idx_category_status (category_id, status);
```

### Enable MySQL Query Cache

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
query_cache_type = 1
query_cache_size = 128M
query_cache_limit = 2M
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### PM2 Cluster Mode

For multi-core servers:

```bash
pm2 delete primex-iptv
pm2 start src/server.js --name primex-iptv -i max
pm2 save
```

---

## Integration with IPTV Players

### Xtream API Format

Provide users with:
- **Server URL:** `http://your-domain.com`
- **Username:** Their username
- **Password:** Their password

### M3U Playlist URL

```
http://your-domain.com/get.php?username=USER&password=PASS
```

### Portal URL

```
http://your-domain.com/player_api.php
```

---

## Support

For technical support or questions:
- **Email:** info@paxdes.com
- **Documentation:** Check API_DOCUMENTATION.md
- **Logs:** Always check PM2 logs first

---

## License

This system is proprietary software. All rights reserved.
Unauthorized distribution or modification is prohibited.

---

**System developed by PAX**  
**Support: info@paxdes.com**
