# Frontend Diagnostic & Fix Guide

## Issue Reported

```
Uncaught SyntaxError: Unexpected end of input
enterprise-panel.html:1
```

## Root Cause Analysis

This error typically occurs when:
1. HTML file is truncated during transfer
2. JavaScript file fails to load
3. Browser cache contains corrupted files
4. Network interruption during page load

## Verification Steps

### 1. Check All Files Exist

```bash
cd /var/www/primex-iptv/public/admin

# Check HTML
ls -lh enterprise-panel.html
# Should show: ~8KB file

# Check CSS
ls -lh enterprise-panel.css
# Should show: ~15KB file

# Check all JS files
ls -lh js/*.js
# Should show 15 files
```

### 2. Verify File Integrity

```bash
# Check HTML is complete
tail -5 enterprise-panel.html
# Should show closing </body> and </html> tags

# Check all JS files for syntax
for file in js/*.js; do
    echo "Checking $file..."
    node -c "$file" || echo "ERROR in $file"
done
# All should pass
```

### 3. Test JavaScript Loading

Open test page: `https://prime-x.live/admin/test-panel.html`

**Expected results:**
- ✅ All 14 modules load successfully
- ✅ core.js loads
- ✅ PrimeXCore object exists
- ✅ No runtime errors

## Common Fixes

### Fix 1: Clear Browser Cache

**Most common cause of this error**

1. **Hard Refresh:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Cache Completely:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data
   - Safari: Develop → Empty Caches

3. **Use Incognito/Private Mode:**
   - Test in private window to bypass cache

### Fix 2: Verify File Permissions

```bash
cd /var/www/primex-iptv/public/admin

# Check permissions
ls -la enterprise-panel.html
ls -la enterprise-panel.css
ls -la js/

# Fix if needed
chmod 644 enterprise-panel.html enterprise-panel.css
chmod 644 js/*.js
chmod 755 js/
```

### Fix 3: Check Nginx Configuration

```bash
# Test nginx config
sudo nginx -t

# Check access logs
sudo tail -f /var/log/nginx/access.log

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Fix 4: Verify PM2 is Running

```bash
pm2 status
pm2 logs primex-iptv --lines 50
```

### Fix 5: Re-pull Files

```bash
cd /var/www/primex-iptv
git fetch origin
git reset --hard origin/main
pm2 restart primex-iptv
```

## Testing Procedure

### 1. Test Basic Access

```bash
# Test if files are accessible
curl -I https://prime-x.live/admin/enterprise-panel.html
# Should return: 200 OK

curl -I https://prime-x.live/admin/enterprise-panel.css
# Should return: 200 OK

curl -I https://prime-x.live/admin/js/core.js
# Should return: 200 OK
```

### 2. Test in Browser

1. **Clear browser cache completely**
2. Open: `https://prime-x.live/admin/login.html`
3. Login with credentials
4. Should redirect to enterprise-panel.html
5. Open browser console (F12)
6. Check for errors

**Expected: ZERO errors**

### 3. Test Dashboard

After login:
1. Dashboard should load
2. Stats should display (not N/A)
3. No console errors
4. All navigation items work

### 4. Test CRUD Operations

1. **Create Streaming Server:**
   - Go to Streaming Servers
   - Click Add Server
   - Fill form
   - Click Save
   - Should succeed

2. **Create User:**
   - Go to User Management
   - Click Add User
   - Select plan
   - Fill form
   - Click Create
   - Should succeed

3. **Create Subscription Code:**
   - Go to Subscription Codes
   - Click Generate Codes
   - Enter quantity
   - Click Generate
   - Should succeed

## Diagnostic Test Page

Created: `/admin/test-panel.html`

**Purpose:** Tests JavaScript loading without authentication

**Access:** `https://prime-x.live/admin/test-panel.html`

**What it tests:**
- Basic JavaScript execution
- Module loading (all 14 files)
- core.js loading
- PrimeXCore object creation
- localStorage access
- Runtime error detection

**Expected output:**
```
✅ Basic JavaScript working
✅ Loaded: dashboard.js
✅ Loaded: users.js
... (all 14 modules)
✅ core.js loaded successfully
✅ PrimeXCore object exists
✅ PrimeXCore.apiCall function exists
✅ localStorage working
📊 Summary: 14 loaded, 0 failed
```

## If Issue Persists

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Check Network tab for failed requests

### Common Error Patterns

**"Failed to load resource"**
- File doesn't exist or wrong path
- Check file permissions
- Check nginx configuration

**"CORS error"**
- Check nginx CORS headers
- Verify API endpoint configuration

**"Unexpected token"**
- JavaScript syntax error
- Run: `node -c filename.js`

**"Cannot read property of undefined"**
- Module not loaded yet
- Check loading order in HTML

### Get Detailed Logs

```bash
# PM2 logs
pm2 logs primex-iptv --lines 100

# Nginx access log
sudo tail -100 /var/log/nginx/access.log

# Nginx error log
sudo tail -100 /var/log/nginx/error.log

# Check for JavaScript errors in browser
# Open DevTools → Console → Check for red errors
```

## Solution Checklist

After applying fixes:

- [ ] Cleared browser cache completely
- [ ] Hard refreshed page (Ctrl+Shift+R)
- [ ] Verified all files exist on server
- [ ] Checked file permissions (644 for files, 755 for dirs)
- [ ] Tested in incognito/private mode
- [ ] Verified PM2 is running
- [ ] Checked nginx logs for errors
- [ ] Tested test-panel.html (all modules load)
- [ ] Logged into admin panel successfully
- [ ] Dashboard loads without errors
- [ ] Stats display correctly (not N/A)
- [ ] Can create streaming server
- [ ] Can create user
- [ ] Can generate subscription codes
- [ ] Console shows ZERO errors

## Expected Final State

**Browser Console:**
```
(no errors)
```

**Dashboard:**
- Total Users: [number]
- Active Subscriptions: [number]
- Total Revenue: [amount]
- Active Servers: [number] (not N/A)
- All dates display correctly

**CRUD Operations:**
- ✅ Create Streaming Server works
- ✅ Create User works
- ✅ Generate Codes works
- ✅ All forms submit successfully
- ✅ Data persists in database

---

**If all else fails:**

1. Take screenshot of browser console errors
2. Check PM2 logs: `pm2 logs primex-iptv`
3. Verify database connection
4. Test API endpoints directly with curl
5. Check if backend is responding

---

**Version:** 11.0.0  
**Status:** Diagnostic Guide  
**Developer:** PAX
