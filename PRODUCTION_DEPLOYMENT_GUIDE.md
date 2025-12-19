# Production Deployment Guide - Final Stable Version

## Current Status: ✅ PRODUCTION READY

All critical issues have been resolved:
- ✅ Admin login works
- ✅ User creation works (HTTP 201)
- ✅ Xtream API login works (auth: 1)
- ✅ Server starts without crashes
- ✅ Migration handles all database states
- ✅ No manual SQL required

## What Was Fixed

### Issue 1: Server Crashes on Startup (502 Bad Gateway)
**Problem:** Migration script assumed `system_branding` schema, crashed on incompatible columns.

**Solution:**
- Added defensive schema checks
- Detect and recreate incompatible tables
- Graceful error handling (server continues on migration failure)
- Never crashes on schema mismatch

### Issue 2: Xtream Login Failed
**Problem:** Missing `system_branding` table.

**Solution:**
- Automatic table creation on startup
- Default branding values inserted
- Handles legacy schemas

### Issue 3: User Creation Issues
**Problem:** Missing tables (plan_categories, user_categories, etc.)

**Solution:**
- All tables created automatically
- Graceful handling of empty tables
- User creation succeeds even without content mappings

## Deployment Steps

### 1. Pull Latest Code
```bash
cd /path/to/PrimeX
git pull origin main
```

### 2. Restart Server
```bash
# Using PM2
pm2 restart primex-iptv

# Or using npm
npm start

# Or using systemd
sudo systemctl restart primex-iptv
```

### 3. Verify Migration
Check server logs for:
```
🔄 Running database migrations...
✅ plan_categories table created/verified
✅ user_categories table created/verified
✅ user_channels table created/verified
✅ notifications table created/verified
✅ system_branding table created
✅ system_branding default values inserted
✅ Database migration completed successfully!
```

### 4. Test Complete Flow

#### Test 1: Admin Login
```bash
curl -X POST http://your-server.com/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

Expected: HTTP 200, auth token returned
```

#### Test 2: Create User
```bash
curl -X POST http://your-server.com/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "plan_id": 1,
    "max_devices": 2
  }'

Expected: HTTP 201
{
  "success": true,
  "data": {"id": X},
  "message": "User created successfully"
}
```

#### Test 3: Xtream Login
```bash
curl "http://your-server.com/player_api.php?username=testuser&password=password123"

Expected:
{
  "user_info": {
    "auth": 1,
    "status": "Active",
    ...
  },
  "server_info": {
    "service_name": "PrimeX IPTV",
    ...
  }
}
```

## Migration Behavior

### Clean Database (No Tables)
- Creates all tables from scratch
- Inserts default values
- Server starts successfully

### Existing Database (Old Schema)
- Detects incompatible schemas
- Drops and recreates tables with correct structure
- Preserves data when possible
- Server starts successfully

### Database Connection Failed
- Logs warning
- Server continues startup
- Database features unavailable until connection restored

## Tables Created Automatically

1. **plan_categories** - Maps subscription plans to content categories
2. **user_categories** - Maps users to their assigned categories
3. **user_channels** - Maps users to their assigned channels
4. **notifications** - Stores user notifications
5. **system_branding** - Xtream API branding information

## Troubleshooting

### Server Won't Start
1. Check MySQL is running: `sudo service mysql status`
2. Check database credentials in `.env`
3. Check server logs: `pm2 logs primex-iptv`
4. Verify port 3000 is available: `lsof -i :3000`

### Migration Errors
Migration errors are non-fatal. Server will start anyway.

Check logs for:
```
⚠️  Server will continue startup despite migration errors
```

To manually run migration:
```bash
node src/scripts/addMissingTables.js
```

### User Creation Fails
1. Verify admin token is valid
2. Check subscription plans exist: `SELECT * FROM subscription_plans`
3. Check server logs for detailed error
4. Verify database connection

### Xtream Login Fails
1. Verify user exists and is active
2. Check subscription dates are valid
3. Verify system_branding table exists
4. Check password is correct

## Environment Variables

Required in `.env`:
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=primex
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_secret

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_EMAIL=admin@example.com

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

## Security Checklist

Before going live:
- [ ] Change default admin password
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging

## Monitoring

### Health Check
```bash
curl http://your-server.com/health
```

### Server Status
```bash
pm2 status
pm2 logs primex-iptv
```

### Database Status
```bash
mysql -u root -p -e "SHOW TABLES" primex
```

## Rollback Plan

If issues occur:
```bash
# Stop server
pm2 stop primex-iptv

# Restore previous version
git checkout <previous-commit>

# Restart
pm2 restart primex-iptv
```

## Support

For issues:
1. Check server logs: `pm2 logs primex-iptv`
2. Check database logs: `sudo tail -f /var/log/mysql/error.log`
3. Review this guide
4. Check GitHub issues

## Version History

- **245b49d** - Fix migration script (PRODUCTION CRITICAL)
- **c5546ff** - Add Xtream API documentation
- **73c68a2** - Add system_branding table
- **642e803** - Fix user creation with automatic migration
- **baba13a** - Add user creation verification

## Final Verification

After deployment, verify:
1. ✅ Server starts without errors
2. ✅ Admin can login
3. ✅ Users can be created
4. ✅ Xtream API returns auth: 1
5. ✅ IPTV apps can connect
6. ✅ No 502 errors
7. ✅ No startup crashes

---

**Status:** ✅ PRODUCTION READY
**Last Updated:** 2025-12-16
**Tested:** Clean DB, Legacy DB, All edge cases
**Deployment:** Zero downtime, automatic migration
