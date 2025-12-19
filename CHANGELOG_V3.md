# PrimeX IPTV System - Version 3.0 Changelog

**Release Date:** December 13, 2024  
**Developer:** PAX  
**Support:** info@paxdes.com

---

## 🎯 Version 3.0 - Complete Authentication Rebuild

This is a **major release** with a complete rebuild of the authentication system and significant architectural improvements.

### ⚠️ Breaking Changes

- Authentication endpoints have been reorganized under `/api/v1/auth/`
- Old authentication files (`authController.js`, `authService.js`, `auth.js`) are replaced with v3 versions
- Response format is now unified across all endpoints
- Token validation is more strict

### 🔧 Critical Fixes

#### Authentication System
- ✅ **Fixed admin login** - Completely rebuilt with proper bcrypt handling
- ✅ **Fixed password hashing** - Consistent bcrypt rounds (10) across all operations
- ✅ **Fixed token generation** - Proper JWT payload structure for admin vs user
- ✅ **Removed bad default hash** - schema.sql no longer contains invalid admin password
- ✅ **Fixed password comparison** - Proper async/await handling in all auth flows

#### Database & Schema
- ✅ **Removed invalid admin hash** from schema.sql
- ✅ **Admin creation** now only happens via initDatabase.js with proper hashing
- ✅ **Consistent table usage** - admin_users table is the single source of truth

#### Code Quality
- ✅ **Removed dead code** - Eliminated legacy and unused logic
- ✅ **Unified response format** - All endpoints return consistent JSON structure
- ✅ **Proper error handling** - Clear error messages without exposing sensitive data
- ✅ **Comprehensive logging** - All auth attempts are logged with context

---

## 🆕 New Files (v3)

### Core Authentication
- `src/services/auth.service.js` - Complete authentication service rebuild
- `src/controllers/auth.controller.js` - Clean controller with validation
- `src/middleware/auth.middleware.js` - Unified authentication middleware
- `src/routes/auth.routes.js` - Dedicated authentication routes

### Testing & Documentation
- `test-auth.js` - bcrypt functionality test script
- `CHANGELOG_V3.md` - This file
- `V3_MIGRATION_GUIDE.md` - Migration instructions

---

## 🔄 Modified Files

### Database
- `database/schema.sql` - Removed invalid default admin hash

### Routes
- `src/routes/index.js` - Updated to use v3 authentication

### Scripts
- `src/scripts/initDatabase.js` - Already correct, verified for v3

---

## 📋 Detailed Changes

### Authentication Service (`auth.service.js`)

**New Features:**
- Separate methods for admin and user login
- Proper bcrypt comparison with error handling
- Comprehensive logging at each step
- Device registration integrated
- Subscription code activation
- Token refresh functionality

**Improvements:**
- Clear separation of concerns
- Consistent return format: `{ success, data?, message?, errors? }`
- No silent failures - all errors are logged
- IP address tracking for security
- Activity logging for audit trail

### Authentication Controller (`auth.controller.js`)

**New Features:**
- Input validation using express-validator
- Unified error response format
- Proper HTTP status codes
- IP address extraction helper

**Improvements:**
- Clean separation from service layer
- Consistent validation rules
- Clear error messages
- No business logic in controller

### Authentication Middleware (`auth.middleware.js`)

**New Features:**
- Separate middleware for admin and user authentication
- Token extraction helper
- Subscription checking
- Device limit validation

**Improvements:**
- Clear error messages
- Proper status codes
- No silent failures
- Consistent response format

### Authentication Routes (`auth.routes.js`)

**New Endpoints:**
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/user/login` - User login
- `POST /api/v1/auth/code/activate` - Activate subscription code
- `POST /api/v1/auth/token/refresh` - Refresh access token

**Features:**
- Rate limiting on all auth endpoints
- Input validation
- Clear route organization

---

## 🔐 Security Improvements

### Password Handling
- ✅ Consistent bcrypt rounds (10) everywhere
- ✅ Proper async/await for all bcrypt operations
- ✅ No password leaks in logs or responses
- ✅ Failed attempts are logged with reason

### Token Management
- ✅ Proper JWT payload structure
- ✅ Separate tokens for admin and user
- ✅ Token expiry enforced
- ✅ Refresh token support

### Logging & Auditing
- ✅ All login attempts logged
- ✅ Failed attempts tracked with reason
- ✅ IP addresses recorded
- ✅ Device IDs tracked
- ✅ No sensitive data in logs

---

## 📊 Response Format

All v3 endpoints return consistent JSON:

### Success Response
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "info@paxdes.com",
      "role": "super_admin"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

---

## 🧪 Testing

### Manual Testing

Test bcrypt functionality:
```bash
node test-auth.js
```

Test admin login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### Expected Behavior

**Admin Login:**
1. Fetch admin from database
2. Check account status
3. Compare password with bcrypt
4. Generate JWT token
5. Update last_login
6. Log activity
7. Return token and admin info

**User Login:**
1. Fetch user from database
2. Check account status
3. Compare password with bcrypt
4. Check subscription status
5. Register/validate device (if provided)
6. Generate JWT tokens
7. Update last_login
8. Log activity
9. Return tokens and user info

---

## 🚀 Deployment

### For New Installations

1. Clone repository
2. Install dependencies: `npm install`
3. Configure `.env` file
4. Initialize database: `npm run init-db`
5. Generate codes: `npm run generate-codes`
6. Start server: `pm2 start ecosystem.config.js`

### For Existing Installations

1. Pull latest code: `git pull`
2. Install dependencies: `npm install`
3. **No database migration needed** - schema is compatible
4. Restart server: `pm2 restart primex-iptv`
5. Test admin login immediately

### Verification

After deployment:
```bash
# Check server status
pm2 status

# View logs
pm2 logs primex-iptv

# Test health endpoint
curl http://localhost:3000/health

# Test admin login
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

---

## 📝 Migration Notes

### API Endpoint Changes

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

### Code Changes Required

If you have custom clients, update endpoints:

```javascript
// Old
fetch('/api/v1/auth/admin-login', { ... })

// New
fetch('/api/v1/auth/admin/login', { ... })
```

### No Database Changes

The database schema is fully compatible. No migration scripts needed.

---

## 🐛 Known Issues Fixed

1. ✅ Admin login failing with correct credentials
2. ✅ bcrypt password comparison not working
3. ✅ Inconsistent response formats
4. ✅ Silent authentication failures
5. ✅ Missing error logging
6. ✅ Token validation issues
7. ✅ Device registration failures

---

## 🎯 What's Next

### Future Improvements (v3.1+)
- Two-factor authentication (2FA)
- Password reset functionality
- Session management
- Advanced rate limiting
- Brute force protection
- OAuth integration

---

## 📞 Support

**Issues with v3?**

1. Check logs: `pm2 logs primex-iptv`
2. Verify environment: Check `.env` file
3. Test bcrypt: `node test-auth.js`
4. Contact support: info@paxdes.com

**Include in support requests:**
- Version: 3.0
- Error logs
- Steps to reproduce
- Environment details

---

## ✅ Upgrade Checklist

- [ ] Backup database
- [ ] Pull latest code
- [ ] Run `npm install`
- [ ] Restart PM2: `pm2 restart primex-iptv`
- [ ] Test admin login
- [ ] Test user login
- [ ] Verify API endpoints
- [ ] Check logs for errors
- [ ] Update client applications (if needed)

---

**Version 3.0 is production-ready and stable.**

**Developer:** PAX  
**Support:** info@paxdes.com  
**Repository:** https://github.com/Black10998/PrimeX
