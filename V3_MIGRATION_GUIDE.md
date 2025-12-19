# PrimeX IPTV System - v3.0 Migration Guide

**Developer:** PAX  
**Support:** info@paxdes.com

---

## 🎯 Overview

Version 3.0 is a **major release** that fixes critical authentication issues and rebuilds the auth system from scratch.

**Key Changes:**
- Complete authentication rebuild
- Fixed admin login
- Unified response format
- Better error handling
- Comprehensive logging

---

## ⚠️ Breaking Changes

### API Endpoints

**Old (v2):**
```
POST /api/v1/auth/admin-login
POST /api/v1/auth/login
POST /api/v1/auth/login-code
```

**New (v3):**
```
POST /api/v1/auth/admin/login
POST /api/v1/auth/user/login
POST /api/v1/auth/code/activate
```

### Response Format

All endpoints now return consistent format:

```json
{
  "success": true|false,
  "data": { ... },
  "message": "...",
  "errors": [ ... ]
}
```

---

## 🔧 Migration Steps

### For VPS Deployment

```bash
# 1. Backup database
mysqldump -u primex_user -p primex > backup_v2_$(date +%Y%m%d).sql

# 2. Pull latest code
cd /var/www/PrimeX
git pull origin main

# 3. Install dependencies
npm install

# 4. Restart PM2
pm2 restart primex-iptv

# 5. Verify
pm2 logs primex-iptv --lines 50
```

### Verify Admin Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "info@paxdes.com",
      "role": "super_admin"
    }
  }
}
```

---

## 📝 Code Changes

### If You Have Custom Clients

Update API endpoints in your client code:

**JavaScript/TypeScript:**
```javascript
// Old
const response = await fetch('/api/v1/auth/admin-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// New
const response = await fetch('/api/v1/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
```

**Response Handling:**
```javascript
// Old - inconsistent format
if (data.success) {
  const token = data.data.token;
}

// New - consistent format
if (data.success) {
  const token = data.data.token;
  const admin = data.data.admin;
}
```

---

## 🗄️ Database

**No database migration required!**

The database schema is fully compatible with v3. Your existing data will work without changes.

---

## 🧪 Testing

### Test bcrypt
```bash
node test-auth.js
```

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type": "application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### Test User Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/user/login \
  -H "Content-Type": "application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Test Health
```bash
curl http://localhost:3000/health
```

---

## 🐛 Troubleshooting

### Admin Login Still Fails

1. **Check logs:**
   ```bash
   pm2 logs primex-iptv --lines 100
   ```

2. **Verify admin exists:**
   ```bash
   mysql -u primex_user -p primex -e "SELECT id, username, status FROM admin_users;"
   ```

3. **Reset admin password:**
   ```bash
   # Stop server
   pm2 stop primex-iptv
   
   # Reinitialize database
   npm run init-db
   
   # Start server
   pm2 start primex-iptv
   ```

### Wrong Endpoint Error

If you get 404 errors, verify you're using the new endpoints:
- ✅ `/api/v1/auth/admin/login`
- ❌ `/api/v1/auth/admin-login`

### Token Issues

If tokens aren't working:
1. Check JWT_SECRET in .env
2. Verify token format in Authorization header: `Bearer <token>`
3. Check token expiry

---

## 📊 What's New in v3

### Authentication Service
- Complete rebuild from scratch
- Proper bcrypt handling
- Comprehensive logging
- Clear error messages
- No silent failures

### Authentication Controller
- Input validation
- Unified response format
- Proper HTTP status codes
- Clean separation from service

### Authentication Middleware
- Separate admin/user authentication
- Token validation
- Subscription checking
- Device limit validation

### Routes
- Organized under `/auth/`
- Rate limiting
- Clear structure

---

## ✅ Verification Checklist

After migration:

- [ ] Server starts without errors
- [ ] Admin login works
- [ ] User login works
- [ ] Token validation works
- [ ] API endpoints respond correctly
- [ ] Logs show proper authentication flow
- [ ] No errors in PM2 logs

---

## 📞 Support

**Need help with migration?**

Email: info@paxdes.com

**Include:**
- Current version
- Error logs
- Steps you've tried
- Environment details

---

## 🎉 Benefits of v3

1. **Admin login works** - No more authentication failures
2. **Better debugging** - Comprehensive logging
3. **Cleaner code** - No dead logic
4. **Consistent API** - Unified response format
5. **Production stable** - Thoroughly tested
6. **Easy maintenance** - Clear architecture

---

**Version 3.0 is ready for production use.**

**Developer:** PAX  
**Support:** info@paxdes.com
