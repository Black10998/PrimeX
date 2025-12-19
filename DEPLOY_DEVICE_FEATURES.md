# Quick Deploy - Device Management Features

## ✅ All Changes Pushed to GitHub

Commit: `f9e6583` - Add device management and admin features

## Deploy to VPS (3 Steps)

### Step 1: Pull Latest Code
```bash
cd /var/www/PrimeX
git pull origin main
```

### Step 2: Apply Database Migration
```bash
sudo mysql primex < database/migrations/enhance_device_tracking.sql
```

**Note:** You may see errors about duplicate columns - this is normal if some already exist.

### Step 3: Restart Application
```bash
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 20
```

## Verify Deployment

### 1. Check Files Updated
```bash
cd /var/www/PrimeX
git log --oneline -1
# Should show: f9e6583 Add device management and admin features
```

### 2. Check Database Tables
```bash
sudo mysql primex -e "SHOW TABLES LIKE 'user_sessions';"
# Should show: user_sessions table exists
```

### 3. Test in Browser
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Login to https://prime-x.live
4. Check new "Online Users" menu item appears
5. View any user → Check device list appears
6. Test "Change Password" button

## New Features Available

### 1. Device Management
- **Location:** Users → View User → Devices Section
- **Actions:** Kick device, Remove device
- Shows: IP address, last seen, device type

### 2. Online Users Dashboard
- **Location:** Sidebar → Online Users (new menu item)
- Shows all users active in last 5 minutes
- Real-time device count and activity

### 3. Force Logout
- **Location:** Users → View User → "Force Logout All" button
- Logs out user from all devices immediately

### 4. Password Management
- **Location:** Users → View User → "Change Password" button
- Option to logout all sessions after password change

## Troubleshooting

### Issue: "Online Users" menu not appearing

**Solution:**
```bash
# Verify HTML file updated
grep "online-users" /var/www/PrimeX/public/admin/dashboard-v2.html
# Should show the new menu item

# Clear browser cache completely
```

### Issue: Devices not showing in user details

**Solution:**
```bash
# Check if columns exist
sudo mysql primex -e "SHOW COLUMNS FROM user_devices;" | grep ip_address
# Should show ip_address column

# If missing, run migration again
sudo mysql primex < /var/www/PrimeX/database/migrations/enhance_device_tracking.sql
```

### Issue: "Failed to fetch online users"

**Solution:**
```bash
# Check user_sessions table exists
sudo mysql primex -e "DESCRIBE user_sessions;"

# Check PM2 logs for errors
pm2 logs primex-iptv --lines 50
```

## What Changed

### Backend Files
- `src/controllers/userController.js` - Added 4 new methods
- `src/routes/index.js` - Added 5 new routes
- `database/migrations/enhance_device_tracking.sql` - New migration

### Frontend Files
- `public/admin/dashboard-v2.js` - Added device management UI
- `public/admin/dashboard-v2.html` - Added "Online Users" menu
- `public/admin/dashboard-v2.css` - Added modal-large style

### New API Endpoints
- `GET /api/v1/admin/users/online/list` - Get online users
- `POST /api/v1/admin/users/:id/devices/:deviceId/kick` - Kick device
- `POST /api/v1/admin/users/:id/force-logout` - Force logout all
- `POST /api/v1/admin/users/:id/change-password` - Change password

## Documentation

Full documentation: `DEVICE_MANAGEMENT_FEATURES.md`

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/
