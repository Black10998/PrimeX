# Admin Device & Session Management

## Overview

Admin session tracking and management has been implemented to provide visibility and control over admin account logins across multiple devices.

**Features:**
- ✅ Track all admin login sessions
- ✅ Display active devices with details (IP, browser, OS, device type)
- ✅ Show last activity timestamp
- ✅ Kick specific devices (logout)
- ✅ Logout all other devices (keep current)
- ✅ Automatic session cleanup on password change
- ✅ Automatic session cleanup on 2FA enable/disable
- ✅ Admin-only (IPTV users not affected)

## Deployment Instructions

### Step 1: Pull Latest Code
```bash
cd /var/www/PrimeX
git pull origin main
```

### Step 2: Apply Database Migration
```bash
sudo mysql primex < database/migrations/add_admin_sessions.sql
```

### Step 3: Restart Application
```bash
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 20
```

### Step 4: Clear Browser Cache
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

## Usage Guide

### Viewing Active Sessions

1. **Login to Admin Dashboard**
2. **Go to Settings**
3. **Scroll to "Active Sessions" section**

You'll see:
- Number of active sessions
- Device information (Desktop/Mobile/Tablet)
- Browser and OS
- IP address
- Last activity timestamp
- Created timestamp

### Kicking a Specific Device

1. Find the session you want to logout
2. Click the logout button (🚪) next to that session
3. Confirm the action
4. That device will be logged out immediately

### Logout All Other Devices

1. Click "Logout All Others" button
2. Confirm the action
3. All devices except your current one will be logged out
4. You remain logged in

### Automatic Session Cleanup

Sessions are automatically cleared when:
- **Password is changed** - All sessions logged out (including current)
- **2FA is enabled** - All sessions logged out (must login with 2FA)
- **2FA is disabled** - All sessions logged out (security measure)

## Technical Implementation

### Backend

**New Files:**
- `src/services/adminSession.service.js` - Session tracking service
- `src/controllers/adminSessionController.js` - Session management endpoints
- `database/migrations/add_admin_sessions.sql` - Database migration

**Modified Files:**
- `src/controllers/auth.controller.js` - Pass user agent to login
- `src/services/auth.service.js` - Create session on login
- `src/controllers/twoFactorController.js` - Logout sessions on 2FA/password changes
- `src/routes/index.js` - Added session management routes

**New Database Table: `admin_sessions`**
```sql
CREATE TABLE admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),
    last_activity TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

**API Endpoints:**
- `GET /api/v1/admin/sessions/my` - Get current admin's sessions
- `DELETE /api/v1/admin/sessions/:sessionId` - Kick specific session
- `POST /api/v1/admin/sessions/logout-all-others` - Logout all except current
- `POST /api/v1/admin/sessions/logout-all` - Force logout all (including current)
- `POST /api/v1/admin/security/change-password` - Change password (logs out all)

### Frontend

**Modified Files:**
- `public/admin/dashboard-v2.js` - Added session management UI

**New Functions:**
- `loadAdminSessions()` - Load and display active sessions
- `kickAdminSession(sessionId)` - Kick specific device
- `logoutAllOtherSessions()` - Logout all other devices

**UI Location:**
- Settings → Active Sessions section

### Session Tracking

**On Login:**
1. Admin enters credentials (+ 2FA if enabled)
2. JWT token is generated
3. Session is created in `admin_sessions` table
4. Token hash, IP, user agent, device info stored
5. Session expires in 24 hours

**User Agent Parsing:**
- Browser detection (Chrome, Firefox, Safari, Edge, Opera)
- OS detection (Windows, macOS, Linux, Android, iOS)
- Device type (Desktop, Mobile, Tablet)

**Session Lifecycle:**
- Created on successful login
- Updated on activity (last_activity timestamp)
- Expires after 24 hours
- Deleted on logout
- Deleted on password change
- Deleted on 2FA enable/disable

### Security Features

**Token Storage:**
- JWT tokens are hashed (SHA-256) before storage
- Only token hash is stored, not plain token
- Prevents token theft from database

**Automatic Cleanup:**
- Expired sessions are cleaned up automatically
- Sessions deleted on security-sensitive actions
- Prevents unauthorized access after security changes

**Session Isolation:**
- Admin sessions completely separate from user sessions
- No cross-contamination
- Different tables, different logic

## Use Cases

### 1. Detect Unauthorized Access
- Check active sessions regularly
- Look for unfamiliar IP addresses or locations
- Kick suspicious sessions immediately

### 2. Manage Multiple Devices
- Login from office computer, home computer, mobile
- See all active devices
- Logout devices you're no longer using

### 3. Security Incident Response
- Suspect account compromise?
- Logout all devices immediately
- Change password (auto-logs out all)
- Enable 2FA (auto-logs out all)

### 4. Device Cleanup
- Forgot to logout from public computer?
- Kick that specific session remotely
- Or logout all other devices

## Troubleshooting

### Issue: Sessions not showing

**Solutions:**
1. Check migration was applied:
```bash
sudo mysql primex -e "SHOW TABLES LIKE 'admin_sessions';"
```

2. Check if sessions are being created:
```bash
sudo mysql primex -e "SELECT COUNT(*) FROM admin_sessions;"
```

3. Restart PM2:
```bash
pm2 restart primex-iptv
```

### Issue: Can't kick session

**Solutions:**
1. Refresh the sessions list
2. Check if session still exists (might have expired)
3. Check PM2 logs for errors:
```bash
pm2 logs primex-iptv --lines 50
```

### Issue: Sessions not expiring

**Solution:**
- Sessions expire after 24 hours automatically
- Manual cleanup:
```sql
DELETE FROM admin_sessions WHERE expires_at < NOW();
```

### Issue: Too many sessions

**Solution:**
- Use "Logout All Others" button
- Or manually clean up:
```sql
DELETE FROM admin_sessions WHERE admin_id = YOUR_ADMIN_ID;
```

## Testing Checklist

### Session Creation
- [ ] Login to admin dashboard
- [ ] Go to Settings → Active Sessions
- [ ] See your current session listed
- [ ] Verify IP address is correct
- [ ] Verify browser and OS are correct

### Multiple Sessions
- [ ] Login from different browser
- [ ] Check Settings → Active Sessions
- [ ] See both sessions listed
- [ ] Each session shows different browser

### Kick Session
- [ ] Click logout button on a session
- [ ] Confirm action
- [ ] Session disappears from list
- [ ] That browser is logged out

### Logout All Others
- [ ] Have multiple sessions active
- [ ] Click "Logout All Others"
- [ ] Confirm action
- [ ] Only current session remains
- [ ] Other browsers are logged out

### Password Change
- [ ] Change admin password
- [ ] All sessions are logged out
- [ ] Must login again with new password

### 2FA Enable
- [ ] Enable 2FA
- [ ] All sessions are logged out
- [ ] Must login again with 2FA code

### 2FA Disable
- [ ] Disable 2FA
- [ ] All sessions are logged out
- [ ] Must login again without 2FA

## Security Best Practices

1. **Regular Session Review**
   - Check active sessions weekly
   - Look for unfamiliar devices or IPs
   - Kick suspicious sessions immediately

2. **Logout When Done**
   - Always logout when leaving a device
   - Use "Logout All Others" if unsure

3. **Monitor Activity**
   - Check last activity timestamps
   - Inactive sessions might indicate compromise

4. **Use 2FA**
   - Enable 2FA for additional security
   - Even if session is stolen, 2FA protects account

5. **Change Password Regularly**
   - Change password every 90 days
   - Automatically logs out all sessions

## Files Changed

### Backend
- `src/services/adminSession.service.js` - NEW
- `src/controllers/adminSessionController.js` - NEW
- `src/controllers/auth.controller.js` - Modified
- `src/services/auth.service.js` - Modified
- `src/controllers/twoFactorController.js` - Modified
- `src/routes/index.js` - Modified
- `database/migrations/add_admin_sessions.sql` - NEW

### Frontend
- `public/admin/dashboard-v2.js` - Modified

## Database Schema

```sql
-- Admin Sessions Table
CREATE TABLE admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_admin_session (admin_id, token_hash),
    INDEX idx_expires (expires_at),
    INDEX idx_last_activity (last_activity)
);
```

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/

For issues or questions about admin session management, contact the developer.
