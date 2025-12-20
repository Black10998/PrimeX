# Database Repair Script

## Purpose

This script safely repairs and verifies your PrimeX IPTV database configuration without requiring manual intervention.

## What It Does

1. ✅ Verifies MySQL service is running
2. ✅ Checks if `primex` database exists (creates if missing)
3. ✅ Verifies/recreates `primex_user` with correct password and privileges
4. ✅ Tests database connection with credentials from `.env`
5. ✅ Verifies all required tables exist
6. ✅ Validates `.env` configuration

## How to Use

### Single Command

```bash
cd /path/to/PrimeX
./scripts/repair-database.sh
```

### What You'll Need

- MySQL root password (script will prompt if needed)
- Your `.env` file should exist (script can create from template)

### Expected Output

```
╔════════════════════════════════════════════════════════╗
║         PrimeX IPTV - Database Repair Script          ║
╚════════════════════════════════════════════════════════╝

[1/7] Checking MySQL service...
✅ MySQL service is running

[2/7] Loading environment configuration...
✅ Environment configuration loaded

[3/7] Verifying database exists...
✅ Database 'primex' exists

[4/7] Verifying database user...
✅ User 'primex_user' updated

[5/7] Testing database connection...
✅ Database connection successful

[6/7] Verifying database tables...
✅ All required tables exist

[7/7] Verifying .env configuration...
✅ .env configuration is valid

╔════════════════════════════════════════════════════════╗
║                  Repair Complete                       ║
╚════════════════════════════════════════════════════════╝

✅ Database configuration is correct
✅ User 'primex_user' has proper privileges
✅ Database connection verified

Next steps:
  1. Restart PM2: pm2 restart primex-iptv
  2. Check logs: pm2 logs primex-iptv --lines 50
  3. Test admin login at your admin panel URL

The system should now work correctly!
```

## What It Fixes

- ❌ "Access denied for user 'primex_user'" → ✅ Correct password and privileges
- ❌ Database connection failures → ✅ Verified working connection
- ❌ Missing database or user → ✅ Created with correct configuration
- ❌ Wrong privileges → ✅ Full privileges on primex database
- ❌ Mismatched .env configuration → ✅ Validated and reported

## Safety Features

- ✅ Non-destructive (doesn't delete data)
- ✅ Exits on any error
- ✅ Validates before making changes
- ✅ Clear error messages
- ✅ Colored output for easy reading

## Troubleshooting

### Script says "MySQL service is not running"
```bash
sudo systemctl start mysql
# or
sudo systemctl start mariadb
```

### Script can't connect as root
- You'll be prompted for MySQL root password
- If you don't know it, check your MySQL installation docs

### ".env file not found"
- Script will create from `.env.production` template
- You'll need to edit and set your passwords

### "Configuration issues" at the end
- Edit `.env` file and set the values marked with ✗
- Run the script again

## After Running

1. **Restart PM2**:
   ```bash
   pm2 restart primex-iptv
   ```

2. **Check Logs**:
   ```bash
   pm2 logs primex-iptv --lines 50
   ```

   Should see:
   - ✅ Database connection successful
   - ✅ Bootstrap completed
   - ✅ Server started successfully

3. **Test Admin Login**:
   - Visit your admin panel
   - Login with credentials from `.env`
   - Should work without errors

## Support

If issues persist after running this script:

1. Check the script output for specific errors
2. Verify MySQL is running: `systemctl status mysql`
3. Test manual connection: `mysql -u primex_user -p primex`
4. Check PM2 logs: `pm2 logs primex-iptv`
5. Contact: info@paxdes.com

---

**Developer**: PAX  
**Version**: 1.0  
**Last Updated**: 2025-12-20
