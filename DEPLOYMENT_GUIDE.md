# PrimeX IPTV v11.0 - Deployment Guide

## 🚀 Quick Deployment (3 Steps)

Since MySQL is locked on your server, we've created a **web-based setup** that doesn't require direct database access.

### Step 1: Pull Latest Code

```bash
cd /var/www/primex-iptv
git pull origin main
```

### Step 2: Restart PM2

```bash
pm2 restart primex-iptv
```

### Step 3: Complete Web Setup

1. Open your browser and navigate to: **https://prime-x.live/setup**
2. Fill in the admin account details:
   - Username: `admin`
   - Email: `admin@prime-x.live`
   - Password: `PAX430550!!!` (or your preferred password)
3. Click "Create Admin Account"
4. You'll be redirected to the login page automatically

### Step 4: Login

Navigate to: **https://prime-x.live/admin/login.html**
- Username: `admin`
- Password: (the password you set in setup)

---

## 🔧 How It Works

The web-based setup:
1. **Creates all necessary database tables** automatically
2. **Hashes your password** with bcrypt (10 rounds)
3. **Creates the admin user** with super_admin role
4. **Initializes the system** with proper schema
5. **Disables itself** after first use (security)

### Database Tables Created

The setup automatically creates:
- ✅ `admin_users` - Admin accounts with 2FA support
- ✅ `users` - IPTV user accounts
- ✅ `subscriptions` - Active subscriptions
- ✅ `plans` - Subscription plans
- ✅ `categories` - Channel categories
- ✅ `channels` - IPTV channels
- ✅ `devices` - Connected devices
- ✅ `subscription_codes` - Activation codes
- ✅ `activity_logs` - System audit logs
- ✅ `system_settings` - Configuration

---

## 🎯 What's New in v11.0

### Enterprise Admin Panel
- **14 Fully Functional Modules**:
  1. Dashboard - Real-time statistics
  2. Users Management - Full CRUD operations
  3. Channels - M3U import support
  4. Categories - Bilingual (EN/AR)
  5. Subscription Plans - Pricing management
  6. Subscriptions - Tracking & renewal
  7. Codes - Bulk generation
  8. Servers - Health monitoring
  9. Devices - Active tracking
  10. Logs - Activity monitoring
  11. Settings - System configuration
  12. API Settings - Rate limiting
  13. Security - 2FA & sessions
  14. Notifications - System alerts

### Professional UI/UX
- Hostinger/WHM-style interface
- Dark theme (#1a1d29 primary)
- Responsive design (mobile-ready)
- Real-time updates
- Toast notifications

### Security Features
- JWT authentication
- Bcrypt password hashing (10 rounds)
- Two-factor authentication (2FA)
- Session management
- IP whitelisting
- Rate limiting
- Activity logging

---

## 🔍 Troubleshooting

### Setup Page Shows "Setup Already Complete"

This means an admin user already exists. You have two options:

**Option A: Use Existing Admin**
- Try logging in with your existing credentials
- If you forgot the password, continue to Option B

**Option B: Reset Admin (Requires MySQL Access)**
If you regain MySQL access later, you can reset:

```sql
-- Delete existing admin
DELETE FROM admin_users WHERE username = 'admin';

-- Then visit /setup again
```

### Login Returns 401 Unauthorized

**Possible causes:**
1. Wrong username/password
2. Admin account not created yet → Visit `/setup`
3. Database connection issue → Check `.env` file

**Check database connection:**
```bash
# Test if server can connect to MySQL
node -e "require('./src/config/database').testConnection(require('./src/config/database').pool)"
```

### Setup Page Not Loading

**Check if server is running:**
```bash
pm2 status
pm2 logs primex-iptv
```

**Restart if needed:**
```bash
pm2 restart primex-iptv
```

### API Endpoints Not Working

**Verify routes are loaded:**
```bash
# Check server logs
pm2 logs primex-iptv --lines 50
```

**Test health endpoint:**
```bash
curl https://prime-x.live/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "11.0.0"
}
```

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] Setup page loads: `https://prime-x.live/setup`
- [ ] Admin account created successfully
- [ ] Login page loads: `https://prime-x.live/admin/login.html`
- [ ] Login works with credentials
- [ ] Dashboard displays correctly
- [ ] All 14 modules load without errors
- [ ] API endpoints respond correctly
- [ ] JWT token authentication works

---

## 🔐 Security Recommendations

### After First Login:

1. **Change Default Password**
   - Navigate to Security module
   - Use a strong, unique password

2. **Enable Two-Factor Authentication**
   - Go to Security → 2FA Settings
   - Scan QR code with authenticator app
   - Save backup codes securely

3. **Configure IP Whitelist** (Optional)
   - Security → IP Whitelist
   - Add your trusted IP addresses

4. **Review Activity Logs**
   - Logs module shows all admin actions
   - Monitor for suspicious activity

---

## 🆘 Support

If you encounter issues:

1. **Check PM2 Logs:**
   ```bash
   pm2 logs primex-iptv --lines 100
   ```

2. **Check Database Connection:**
   - Verify `.env` file has correct MySQL credentials
   - Test connection: `mysql -u primex_user -p primex_db`

3. **Check File Permissions:**
   ```bash
   ls -la /var/www/primex-iptv
   # Ensure files are readable by PM2 user
   ```

4. **Restart Everything:**
   ```bash
   pm2 restart primex-iptv
   pm2 save
   ```

---

## 📝 Environment Variables

Ensure your `.env` file contains:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_USER=primex_user
DB_PASSWORD=your_password
DB_NAME=primex_db
DB_PORT=3306

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://prime-x.live
```

---

## 🎉 Success!

Once you complete the setup and login successfully, you'll have access to the full enterprise admin panel with all 14 modules ready to manage your IPTV service.

**Admin Panel URL:** https://prime-x.live/
**Login URL:** https://prime-x.live/admin/login.html

---

**Developer:** PAX  
**Support:** info@paxdes.com  
**Version:** 11.0.0  
**Last Updated:** December 2024
