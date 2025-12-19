# Two-Factor Authentication (2FA) for Admin Dashboard

## Overview

Two-Factor Authentication (2FA) has been implemented for the admin dashboard using TOTP (Time-based One-Time Password). This adds an extra layer of security to admin accounts.

**Features:**
- ✅ TOTP-based 2FA (Google Authenticator, Authy compatible)
- ✅ QR code setup for easy configuration
- ✅ Manual secret key entry option
- ✅ 10 backup recovery codes
- ✅ Recovery code regeneration
- ✅ Enable/Disable 2FA from Security Settings
- ✅ Force logout on 2FA enable/disable
- ✅ Admin-only (IPTV users not affected)

## Deployment Instructions

### Step 1: Install Dependencies
```bash
cd /var/www/PrimeX
npm install speakeasy qrcode --save
```

### Step 2: Pull Latest Code
```bash
git pull origin main
```

### Step 3: Apply Database Migration
```bash
sudo mysql primex < database/migrations/add_2fa_to_admin.sql
```

### Step 4: Restart Application
```bash
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 20
```

### Step 5: Clear Browser Cache
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

## Usage Guide

### Enabling 2FA

1. **Login to Admin Dashboard**
   - Navigate to https://prime-x.live
   - Login with username and password

2. **Go to Security Settings**
   - Click "Settings" in sidebar
   - Scroll to "Two-Factor Authentication" section

3. **Enable 2FA**
   - Click "Enable 2FA" button
   - Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
   - Or manually enter the secret key
   - Enter 6-digit code from app
   - Click "Verify & Enable"

4. **Save Backup Codes**
   - **IMPORTANT:** Save the 10 backup codes in a safe place
   - These codes can be used if you lose access to your authenticator app
   - Each code can only be used once

5. **Logout and Test**
   - You'll be automatically logged out
   - Login again with username + password
   - Enter 6-digit code from authenticator app
   - Access granted!

### Login with 2FA

**Normal Flow:**
1. Enter username and password
2. Click "Login"
3. Enter 6-digit code from authenticator app
4. Click "Verify & Login"

**Using Recovery Code:**
1. Enter username and password
2. Click "Login"
3. Click "Use recovery code instead"
4. Enter one of your backup codes (format: XXXX-XXXX)
5. Click "Verify & Login"

### Disabling 2FA

1. Go to Settings → Two-Factor Authentication
2. Click "Disable 2FA"
3. Enter your password
4. Confirm disable
5. 2FA is now disabled

### Regenerating Backup Codes

1. Go to Settings → Two-Factor Authentication
2. Click "Regenerate Backup Codes"
3. Enter your password
4. Save the new 10 backup codes
5. **Old codes are now invalid**

## Technical Implementation

### Backend

**New Dependencies:**
- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation

**New Files:**
- `src/services/totp.service.js` - TOTP service
- `src/controllers/twoFactorController.js` - 2FA controller
- `database/migrations/add_2fa_to_admin.sql` - Database migration

**Modified Files:**
- `src/controllers/auth.controller.js` - Enhanced admin login
- `src/services/auth.service.js` - 2FA verification in login
- `src/routes/index.js` - Added 2FA routes

**New API Endpoints:**
- `GET /api/v1/admin/2fa/status` - Get 2FA status
- `POST /api/v1/admin/2fa/generate` - Generate 2FA setup (QR code + secret)
- `POST /api/v1/admin/2fa/enable` - Enable 2FA (verify token)
- `POST /api/v1/admin/2fa/disable` - Disable 2FA (requires password)
- `POST /api/v1/admin/2fa/regenerate-backup-codes` - Regenerate backup codes

**Login Flow:**
1. POST `/api/v1/auth/admin/login` with username + password
2. If 2FA enabled: Response includes `requires_2fa: true`
3. POST `/api/v1/auth/admin/login` with username + password + `totp_token` or `recovery_code`
4. If valid: Return JWT token

### Frontend

**Modified Files:**
- `public/admin/dashboard-v2.js` - Added 2FA UI and login flow

**New Functions:**
- `load2FAStatus()` - Load and display 2FA status
- `setup2FA()` - Show QR code setup modal
- `verify2FASetup()` - Verify and enable 2FA
- `disable2FA()` - Disable 2FA
- `regenerateBackupCodes()` - Regenerate backup codes
- `show2FAPrompt()` - Show 2FA code input during login
- `show2FARecoveryPrompt()` - Show recovery code input
- `verify2FALogin()` - Verify 2FA code and complete login
- `verify2FARecovery()` - Verify recovery code and complete login

### Database

**New Columns in `admin_users` table:**
- `two_factor_enabled` - BOOLEAN (default: FALSE)
- `two_factor_secret` - VARCHAR(255) - TOTP secret (base32)
- `two_factor_backup_codes` - TEXT - JSON array of hashed backup codes
- `two_factor_enabled_at` - TIMESTAMP - When 2FA was enabled

### Security Features

**TOTP Configuration:**
- Algorithm: SHA-1 (standard for TOTP)
- Period: 30 seconds
- Digits: 6
- Window: 2 (allows ±60 seconds tolerance)

**Backup Codes:**
- 10 codes generated
- Format: XXXX-XXXX (8 characters)
- Hashed with SHA-256 before storage
- Single-use only
- Can be regenerated (invalidates old codes)

**Password Protection:**
- Disabling 2FA requires password verification
- Regenerating backup codes requires password verification
- Prevents unauthorized 2FA changes

## Troubleshooting

### Issue: "Invalid 2FA code" during setup

**Causes:**
- Time sync issue between server and authenticator app
- Incorrect code entry
- Code expired (30-second window)

**Solutions:**
- Ensure server time is correct: `date`
- Sync authenticator app time
- Try entering a fresh code

### Issue: Can't login with 2FA code

**Solutions:**
1. Use a recovery code instead
2. Check server time is synced
3. Ensure authenticator app is using correct account

### Issue: Lost authenticator device and no backup codes

**Solution:**
- Database admin must manually disable 2FA:
```sql
UPDATE admin_users 
SET two_factor_enabled = FALSE, 
    two_factor_secret = NULL, 
    two_factor_backup_codes = NULL 
WHERE username = 'admin';
```

### Issue: 2FA not showing in Settings

**Solutions:**
1. Clear browser cache completely
2. Check migration was applied:
```bash
sudo mysql primex -e "SHOW COLUMNS FROM admin_users;" | grep two_factor
```
3. Restart PM2:
```bash
pm2 restart primex-iptv
```

## Testing Checklist

### Setup Flow
- [ ] Navigate to Settings → 2FA section
- [ ] Click "Enable 2FA"
- [ ] QR code displays correctly
- [ ] Manual secret key is shown
- [ ] Scan QR code with authenticator app
- [ ] Enter 6-digit code
- [ ] 10 backup codes are displayed
- [ ] Save backup codes
- [ ] Automatically logged out

### Login Flow
- [ ] Login with username + password
- [ ] 2FA prompt appears
- [ ] Enter 6-digit code from app
- [ ] Successfully logged in
- [ ] Dashboard loads correctly

### Recovery Code Flow
- [ ] Login with username + password
- [ ] Click "Use recovery code instead"
- [ ] Enter backup code (XXXX-XXXX format)
- [ ] Successfully logged in
- [ ] Backup code count decreases by 1

### Disable Flow
- [ ] Go to Settings → 2FA
- [ ] Click "Disable 2FA"
- [ ] Enter password
- [ ] 2FA disabled successfully
- [ ] Login no longer requires 2FA code

### Regenerate Codes Flow
- [ ] Go to Settings → 2FA
- [ ] Click "Regenerate Backup Codes"
- [ ] Enter password
- [ ] New 10 codes displayed
- [ ] Old codes no longer work

## Security Best Practices

1. **Save Backup Codes Securely**
   - Store in password manager
   - Print and keep in safe location
   - Never share with anyone

2. **Use Strong Passwords**
   - 2FA is additional security, not a replacement
   - Still use strong, unique passwords

3. **Regular Backup Code Regeneration**
   - Regenerate codes if you suspect compromise
   - Regenerate after using several codes

4. **Monitor Activity Logs**
   - Check for unauthorized 2FA enable/disable events
   - Review login attempts

5. **Time Synchronization**
   - Ensure server time is accurate
   - Use NTP for time sync

## Files Changed

### Backend
- `package.json` - Added speakeasy and qrcode dependencies
- `src/services/totp.service.js` - NEW
- `src/controllers/twoFactorController.js` - NEW
- `src/controllers/auth.controller.js` - Modified
- `src/services/auth.service.js` - Modified
- `src/routes/index.js` - Modified
- `database/migrations/add_2fa_to_admin.sql` - NEW

### Frontend
- `public/admin/dashboard-v2.js` - Modified

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/

For issues or questions about 2FA, contact the developer.
