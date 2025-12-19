# PrimeX IPTV v11.0 - System Test Checklist

## Pre-Deployment Tests

### ✅ File Syntax Validation
```bash
# Test all JavaScript files for syntax errors
node -c src/server.js
node -c src/services/setup.service.js
node -c src/controllers/setup.controller.js
node -c src/controllers/notificationController.js
node -c src/controllers/twoFactorController.js
node -c src/services/adminSession.service.js
```

### ✅ Database Schema
```bash
# Apply schema fixes
node apply-schema-fix.js
```

**Expected tables:**
- ✅ admin_users (with two_factor_enabled_at column)
- ✅ admin_sessions (with last_activity column)
- ✅ user_devices (with last_seen column)
- ✅ notifications (with admin_id and user_id)
- ✅ users
- ✅ subscriptions
- ✅ plans
- ✅ categories
- ✅ channels
- ✅ subscription_codes
- ✅ activity_logs
- ✅ system_settings

## Post-Deployment Tests

### 1. Server Health Check
```bash
curl https://prime-x.live/health
```
**Expected:** `{"status":"healthy","database":"connected","version":"11.0.0"}`

### 2. Setup Page
**URL:** https://prime-x.live/setup
- [ ] Page loads without errors
- [ ] Form displays correctly
- [ ] Can create admin account
- [ ] Redirects to login after success

### 3. Login Page
**URL:** https://prime-x.live/admin/login.html
- [ ] Page loads without errors
- [ ] Can login with created credentials
- [ ] JWT token stored in localStorage
- [ ] Redirects to dashboard

### 4. Admin Panel
**URL:** https://prime-x.live/admin/enterprise-panel.html
- [ ] Page loads without errors
- [ ] All CSS loads correctly
- [ ] All JavaScript modules load
- [ ] No console errors
- [ ] Sidebar navigation works

### 5. Dashboard Module
- [ ] Statistics cards display
- [ ] Charts render correctly
- [ ] Real-time data loads
- [ ] No API errors

### 6. User Management Module
- [ ] User list loads
- [ ] Can create new user
- [ ] Can edit user
- [ ] Can delete user
- [ ] Device management works
- [ ] Search/filter works

### 7. Channels Module
- [ ] Channel list loads
- [ ] Can create channel
- [ ] Can edit channel
- [ ] Can delete channel
- [ ] M3U import works

### 8. Categories Module
- [ ] Category list loads
- [ ] Can create category
- [ ] Can edit category
- [ ] Can delete category
- [ ] Bilingual support works

### 9. Plans Module
- [ ] Plan list loads
- [ ] Can create plan
- [ ] Can edit plan
- [ ] Can delete plan
- [ ] Pricing configuration works

### 10. Subscriptions Module
- [ ] Subscription list loads
- [ ] Can extend subscription
- [ ] Can deactivate subscription
- [ ] Status filtering works
- [ ] Bulk operations work

### 11. Codes Module
- [ ] Code list loads
- [ ] Can generate codes
- [ ] Bulk generation works
- [ ] CSV export works
- [ ] Code validation works

### 12. Servers Module
- [ ] Server list loads
- [ ] Can create server
- [ ] Can edit server
- [ ] Can delete server
- [ ] Health monitoring works

### 13. Devices Module
- [ ] Device list loads
- [ ] Active devices display
- [ ] Can kick device
- [ ] Can remove device
- [ ] Connection tracking works

### 14. Logs Module
- [ ] Activity logs load
- [ ] Search works
- [ ] Date filtering works
- [ ] CSV export works
- [ ] Pagination works

### 15. Settings Module
- [ ] Settings load
- [ ] Can update company info
- [ ] Can configure email
- [ ] Can configure payment
- [ ] Changes save correctly

### 16. API Settings Module
- [ ] API settings load
- [ ] Can generate API key
- [ ] Can configure rate limits
- [ ] Can configure CORS
- [ ] Webhook management works

### 17. Security Module
**Critical Tests:**
- [ ] 2FA status loads (no 500 error)
- [ ] Can enable 2FA
- [ ] QR code generates
- [ ] Backup codes generate
- [ ] Can disable 2FA
- [ ] Password change works
- [ ] Session management works

### 18. Notifications Module
**Critical Tests:**
- [ ] Notifications load (no 401 error)
- [ ] Can create notification
- [ ] Can mark as read
- [ ] Can mark all as read
- [ ] Unread count displays
- [ ] Real-time updates work

## API Endpoint Tests

### Authentication
```bash
# Admin login
curl -X POST https://prime-x.live/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"PAX430550!!!"}'
```

### 2FA Status (Must return 200, not 500)
```bash
curl https://prime-x.live/api/v1/admin/2fa/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Notifications (Must return 200, not 401)
```bash
curl https://prime-x.live/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Dashboard Stats
```bash
curl https://prime-x.live/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Browser Console Tests

### Zero Errors Required
Open browser console (F12) and check:
- [ ] No 404 errors (missing files)
- [ ] No 500 errors (server errors)
- [ ] No 401 errors (auth errors)
- [ ] No CORS errors
- [ ] No MIME type errors
- [ ] No JavaScript errors
- [ ] All modules load successfully

### Network Tab
- [ ] All CSS files load (200 status)
- [ ] All JS files load (200 status)
- [ ] All API calls succeed (200 status)
- [ ] No failed requests

## PM2 Logs Test

```bash
pm2 logs primex-iptv --lines 100
```

### Zero Errors Required
- [ ] No database connection errors
- [ ] No "Unknown column" errors
- [ ] No "Table doesn't exist" errors
- [ ] No authentication errors
- [ ] No route errors
- [ ] Server starts successfully

## Performance Tests

### Response Times
- [ ] Health check < 100ms
- [ ] Login < 500ms
- [ ] Dashboard load < 1s
- [ ] API calls < 500ms

### Resource Usage
```bash
pm2 monit
```
- [ ] Memory usage stable
- [ ] CPU usage reasonable
- [ ] No memory leaks

## Security Tests

### Authentication
- [ ] Cannot access admin panel without login
- [ ] Token expires correctly
- [ ] Invalid tokens rejected
- [ ] Password hashing works (bcrypt)

### Authorization
- [ ] Admin routes protected
- [ ] User routes protected
- [ ] Role-based access works

## Final Verification

### System Status
```bash
# Check all services
pm2 status

# Check logs
pm2 logs primex-iptv --lines 50

# Check database
mysql -u primex_user -p primex_db -e "SHOW TABLES;"
```

### Admin Panel Checklist
- [ ] All 14 modules accessible
- [ ] No console errors
- [ ] No PM2 errors
- [ ] All features functional
- [ ] UI/UX responsive
- [ ] Mobile view works

## Success Criteria

✅ **System is ready when:**
1. All database tables exist with correct schema
2. All API endpoints return correct status codes
3. Admin panel loads without errors
4. All 14 modules work correctly
5. Browser console shows ZERO errors
6. PM2 logs show ZERO errors
7. Authentication works correctly
8. 2FA status endpoint returns 200
9. Notifications endpoint returns 200
10. All CRUD operations work

## Failure Indicators

❌ **System needs fixes if:**
- Any 500 errors in API responses
- Any 401 errors for authenticated requests
- "Unknown column" errors in logs
- "Table doesn't exist" errors
- JavaScript errors in console
- Missing files (404 errors)
- CORS errors
- MIME type errors
- PM2 restart loops

---

**Test Date:** _____________
**Tested By:** _____________
**Result:** ⬜ PASS  ⬜ FAIL
**Notes:** _____________________________________________
