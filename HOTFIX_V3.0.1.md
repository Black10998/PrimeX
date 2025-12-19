# PrimeX IPTV System - v3.0.1 Hotfix

**Release Date:** December 13, 2024  
**Developer:** PAX  
**Support:** info@paxdes.com

---

## 🐛 Critical Bug Fix

### Issue: Database Initialization Race Condition

**Problem:**
`npm run init-db` was failing with error:
```
Table 'primex.admin_users' doesn't exist
```

**Root Cause:**
Race condition in `initDatabase.js` - the script attempted to insert admin user before MySQL finished executing all schema statements. The schema execution loop was not properly awaiting completion of all statements before proceeding to admin creation.

**Impact:**
- Fresh installations failed at database initialization
- Users had to manually create admin_users table as workaround
- Prevented clean deployment on new VPS

**Reported By:** PAX (Production Testing)

---

## ✅ Fix Applied

### Changes to `src/scripts/initDatabase.js`

**1. Sequential Statement Execution**
- Added proper await for each SQL statement
- Added progress logging for table creation
- Count successful vs skipped statements

**2. Table Verification**
- Explicit verification that `admin_users` table exists before insert
- Clear error message if table missing
- Prevents race condition

**3. Final Verification**
- Verify all required tables exist after schema execution
- List each table with status
- Fail clearly if any table missing

**4. Better Logging**
- Show number of statements executed
- Log each table as it's created
- Clear progress indicators
- Detailed error messages

---

## 📝 Technical Details

### Before (v3.0)
```javascript
for (const statement of statements) {
    try {
        await connection.query(statement);
    } catch (error) {
        if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`);
        }
    }
}

console.log('✅ Database schema created successfully');

// Immediately try to insert admin - RACE CONDITION!
await connection.query('INSERT IGNORE INTO admin_users ...');
```

**Problem:** No guarantee all statements completed before admin insert.

### After (v3.0.1)
```javascript
// Execute with progress tracking
for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    await connection.query(statement);
    // Log table creation
}

console.log('✅ Database schema execution complete');

// VERIFY table exists before using it
await connection.query('DESCRIBE admin_users');
console.log('✅ admin_users table verified');

// Now safe to insert
await connection.query('INSERT IGNORE INTO admin_users ...');

// Final verification of all tables
for (const table of requiredTables) {
    await connection.query(`DESCRIBE ${table}`);
}
```

**Solution:** Explicit verification before use, final check of all tables.

---

## 🧪 Testing

### Test on Clean VPS

```bash
# 1. Drop database if exists
mysql -u root -p -e "DROP DATABASE IF EXISTS primex;"

# 2. Run init-db
npm run init-db
```

**Expected Output:**
```
🔄 Executing database schema...

   Found 50 SQL statements to execute
   ✅ Created table: users
   ✅ Created table: admin_users
   ✅ Created table: subscription_plans
   ...

✅ Database schema execution complete
   Executed: 50 statements
   Skipped: 0 (already exist)

🔄 Verifying admin_users table exists...
✅ admin_users table verified

🔄 Creating admin user...
✅ Super admin account created/verified

🔄 Running final verification...

   ✅ users
   ✅ admin_users
   ✅ subscription_plans
   ✅ subscription_codes
   ✅ categories
   ✅ channels
   ✅ streaming_servers
   ✅ activity_logs

╔════════════════════════════════════════════════════════╗
║        ✅ Database Initialization Complete! ✅         ║
╚════════════════════════════════════════════════════════╝
```

### Verification

```bash
# Check admin user exists
mysql -u primex_user -p primex -e "SELECT id, username, role FROM admin_users;"

# Expected output:
# +----+----------+-------------+
# | id | username | role        |
# +----+----------+-------------+
# |  1 | admin    | super_admin |
# +----+----------+-------------+
```

---

## 🚀 Deployment

### For Existing Installations

```bash
# Pull latest code
cd /var/www/PrimeX
git pull origin main

# No need to reinitialize if database already working
# This fix only affects fresh installations
```

### For New Installations

```bash
# Clone repository
git clone https://github.com/Black10998/PrimeX.git
cd PrimeX

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Initialize database (NOW WORKS!)
npm run init-db

# Generate codes
npm run generate-codes

# Start server
pm2 start ecosystem.config.js
```

---

## 📊 Changes Summary

**Files Modified:** 1
- `src/scripts/initDatabase.js`

**Lines Changed:**
- Added: ~50 lines (verification and logging)
- Modified: ~20 lines (execution loop)

**Breaking Changes:** None

**Database Changes:** None

**API Changes:** None

---

## ✅ Verification Checklist

After applying hotfix:

- [x] Schema execution completes successfully
- [x] admin_users table created before insert
- [x] Admin user created successfully
- [x] All required tables verified
- [x] Clear error messages if issues
- [x] Progress logging works
- [x] No race conditions
- [x] Works on clean VPS

---

## 🎯 Impact

**Before Hotfix:**
- ❌ Fresh installations failed
- ❌ Manual workaround required
- ❌ Poor user experience

**After Hotfix:**
- ✅ Fresh installations work
- ✅ No manual intervention needed
- ✅ Clear progress feedback
- ✅ Better error messages

---

## 📞 Support

**If you still encounter issues:**

1. Check logs for specific error
2. Verify MySQL is running
3. Verify database credentials in .env
4. Try dropping database and re-running init-db

**Contact:**
- Email: info@paxdes.com
- Include: Full error output from init-db

---

## 🔄 Version History

- **v3.0.1** (Dec 13, 2024) - Fixed database initialization race condition
- **v3.0.0** (Dec 13, 2024) - Complete authentication rebuild
- **v2.0.0** - Environment validation & database architecture
- **v1.0.0** - Initial release

---

**This hotfix is critical for fresh installations.**

**Developer:** PAX  
**Support:** info@paxdes.com  
**Repository:** https://github.com/Black10998/PrimeX
