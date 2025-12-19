# 🚀 Final Deployment Instructions for https://prime-x.live/

## ✅ What Was Fixed

### 1. **Base URL Integration**
- All routes now work under `https://prime-x.live/`
- No hardcoded URLs or broken paths
- Static files served correctly from `public/` directory

### 2. **Admin Login Page Created**
- Professional login page at `/admin/login.html`
- Connects to backend API
- Stores JWT token
- Redirects to enterprise panel after login

### 3. **Route Configuration**
- `/` → Enterprise Admin Panel
- `/admin` → Enterprise Admin Panel
- `/admin/login.html` → Login Page
- `/admin/legacy` → Old dashboard (backup)
- `/api/v1/*` → API endpoints

### 4. **Admin Credentials**
- Username: `admin`
- Password: `PAX430550!!!`

---

## 📋 Deployment Steps on Your Server

### Step 1: Pull Latest Code

```bash
cd /var/www/PrimeX
git pull origin main
```

### Step 2: Update Admin Password

```bash
cd /var/www/PrimeX
node update-admin-password.js
```

**Expected Output**:
```
Connecting to database...
Connected to database
Hashing password...
✅ Admin password updated successfully

=================================
Admin Credentials:
Username: admin
Password: PAX430550!!!
=================================
```

### Step 3: Restart PM2

```bash
pm2 restart primex-iptv
pm2 save
```

### Step 4: Verify Server is Running

```bash
pm2 status
pm2 logs primex-iptv --lines 50
```

---

## ✅ Testing Complete Flow

### 1. **Access Main URL**
```
URL: https://prime-x.live/
Expected: Should show enterprise admin panel or redirect to login
```

### 2. **Access Admin URL**
```
URL: https://prime-x.live/admin
Expected: Should show enterprise admin panel or redirect to login
```

### 3. **Login Page**
```
URL: https://prime-x.live/admin/login.html
Credentials:
  Username: admin
  Password: PAX430550!!!
Expected: Should login and redirect to enterprise panel
```

### 4. **Dashboard**
```
After login, should see:
- Statistics cards (users, subscriptions, channels, servers)
- Recent users table
- Recent activity logs
- All data loading from backend
```

### 5. **Test All Menu Items**
Click each sidebar item and verify it loads:
- ✅ Dashboard
- ✅ Users
- ✅ Channels
- ✅ Categories
- ✅ Plans
- ✅ Codes
- ✅ Subscriptions
- ✅ Servers
- ✅ Devices
- ✅ Logs
- ✅ Settings
- ✅ API Settings
- ✅ Security
- ✅ Notifications

### 6. **Check Console (F12)**
```
Should see: NO errors
Should NOT see: ReferenceError, undefined, 404 errors
```

---

## 🔧 Troubleshooting

### If Login Fails:

1. **Check Database Connection**:
```bash
mysql -u primex_user -p primex
SELECT * FROM admins WHERE username = 'admin';
```

2. **Verify Password Was Updated**:
```bash
cd /var/www/PrimeX
node update-admin-password.js
```

3. **Check API Endpoint**:
```bash
curl -X POST https://prime-x.live/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"PAX430550!!!"}'
```

### If Static Files Don't Load:

1. **Check File Permissions**:
```bash
cd /var/www/PrimeX
chmod -R 755 public/
```

2. **Verify Files Exist**:
```bash
ls -la public/admin/
ls -la public/admin/js/
```

3. **Check PM2 Logs**:
```bash
pm2 logs primex-iptv --lines 100
```

### If Routes Don't Work:

1. **Restart PM2**:
```bash
pm2 restart primex-iptv
```

2. **Check Server.js**:
```bash
grep -A 5 "Admin panel" src/server.js
```

3. **Test Health Endpoint**:
```bash
curl https://prime-x.live/health
```

---

## 📁 File Structure

```
/var/www/PrimeX/
├── public/
│   └── admin/
│       ├── enterprise-panel.html    ← Main admin panel
│       ├── enterprise-panel.css     ← Styles
│       ├── login.html               ← Login page (NEW)
│       ├── index.html               ← Redirects to enterprise panel
│       └── js/
│           ├── core.js              ← Core framework (UPDATED)
│           ├── dashboard.js         ← Dashboard module
│           ├── users.js             ← Users module
│           └── ... (all 14 modules)
├── src/
│   └── server.js                    ← Routes (UPDATED)
└── update-admin-password.js         ← Password update script (NEW)
```

---

## ✅ What Should Work Now

### URLs:
- ✅ `https://prime-x.live/` → Admin Panel
- ✅ `https://prime-x.live/admin` → Admin Panel
- ✅ `https://prime-x.live/admin/login.html` → Login
- ✅ `https://prime-x.live/health` → Health Check
- ✅ `https://prime-x.live/api/v1/*` → API Endpoints

### Features:
- ✅ Login with admin credentials
- ✅ JWT token authentication
- ✅ All 14 modules load correctly
- ✅ Dashboard shows real data
- ✅ Menu navigation works
- ✅ No console errors
- ✅ Static files load
- ✅ API calls work

### Admin Credentials:
- ✅ Username: `admin`
- ✅ Password: `PAX430550!!!`
- ✅ Stored securely with bcrypt

---

## 🎯 Complete Navigation Flow

1. **User visits** `https://prime-x.live/`
2. **Server checks** if user has JWT token
3. **If no token** → Redirect to `/admin/login.html`
4. **User enters** credentials (admin / PAX430550!!!)
5. **Backend validates** credentials
6. **Returns JWT token** if valid
7. **Frontend stores** token in localStorage
8. **Redirects to** `/admin/enterprise-panel.html`
9. **Dashboard loads** with real-time data
10. **User can navigate** all 14 modules
11. **All API calls** include JWT token
12. **Everything works** under `https://prime-x.live/`

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] Can access `https://prime-x.live/`
- [ ] Redirects to login if not authenticated
- [ ] Can login with admin / PAX430550!!!
- [ ] Dashboard loads with data
- [ ] All 14 menu items work
- [ ] No console errors (F12)
- [ ] Static files load (CSS, JS)
- [ ] API calls work
- [ ] Can logout and login again
- [ ] PM2 shows app running
- [ ] Health endpoint responds

---

## 🆘 Emergency Rollback

If something breaks:

```bash
cd /var/www/PrimeX
git log --oneline -5
git reset --hard <previous-commit-hash>
pm2 restart primex-iptv
```

---

## ✅ Final Confirmation

**All fixes have been applied and pushed to GitHub.**

**Repository**: https://github.com/Black10998/PrimeX  
**Commit**: `e016444` - Fix base URL routing and add admin login page  
**Status**: ✅ Ready for deployment

**To deploy on your server, run**:
```bash
cd /var/www/PrimeX
git pull origin main
node update-admin-password.js
pm2 restart primex-iptv
```

**Then access**: `https://prime-x.live/`

---

**Everything is now configured to work seamlessly under your main domain!** 🎉
