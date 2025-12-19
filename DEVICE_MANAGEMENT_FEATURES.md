# Device Management & Admin Features - Deployment Guide

## New Features Added

### 1️⃣ Enhanced Device Management per User

**Features:**
- Track all devices connected to each user account
- View device details:
  - Device ID / fingerprint
  - IP address
  - Last active time
  - Device type
  - User agent
- Device count vs max_devices limit enforcement

**Access:** Admin Dashboard → Users → View User → Devices Section

### 2️⃣ Force Logout / Kick Device

**Features:**
- **Kick Device**: Block a specific device (can be unblocked later)
- **Remove Device**: Permanently delete device (user must re-authenticate)
- **Force Logout All**: Logout user from all devices at once

**Access:** 
- Admin Dashboard → Users → View User → Device Actions
- Individual device kick/remove buttons
- "Force Logout All" button in user details

### 3️⃣ Online Users Dashboard

**Features:**
- Real-time view of currently active users
- Shows users with activity in last 5 minutes
- Displays:
  - Username and status
  - Email
  - Subscription plan
  - Assigned server
  - Number of active devices
  - Last activity timestamp
- Quick actions: View details, Force logout

**Access:** Admin Dashboard → Online Users (new menu item)

### 4️⃣ Admin Password Management

**Features:**
- Change user password directly from admin dashboard
- Option to logout all sessions after password change
- Secure password validation (minimum 6 characters)
- Activity logging for audit trail

**Access:** Admin Dashboard → Users → View User → Change Password

## Technical Implementation

### Database Changes

**New Table: `user_sessions`**
```sql
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE SET NULL
);
```

**Enhanced `user_devices` Table:**
- Added `ip_address` column (VARCHAR(45))
- Added `user_agent` column (TEXT)
- Added indexes for performance

**Enhanced `users` Table:**
- Added `server_id` column (INT)
- Links user to specific streaming server

### API Endpoints

**Device Management:**
- `GET /api/v1/admin/users/:id/devices` - Get user devices
- `DELETE /api/v1/admin/users/:id/devices/:deviceId` - Remove device
- `POST /api/v1/admin/users/:id/devices/:deviceId/kick` - Kick device (block)
- `POST /api/v1/admin/users/:id/force-logout` - Logout from all devices

**Online Users:**
- `GET /api/v1/admin/users/online/list` - Get currently online users

**Password Management:**
- `POST /api/v1/admin/users/:id/change-password` - Change user password
  - Body: `{ "new_password": "string", "logout_all_sessions": boolean }`

### Frontend Changes

**Files Modified:**
- `public/admin/dashboard-v2.js` - Added device management UI, online users page
- `public/admin/dashboard-v2.html` - Added "Online Users" menu item
- `public/admin/dashboard-v2.css` - Added modal-large and btn-sm styles

**New Functions:**
- `viewUser()` - Enhanced with device list and management buttons
- `kickDevice()` - Kick specific device
- `removeDevice()` - Remove device permanently
- `forceLogoutUser()` - Force logout from all devices
- `changeUserPassword()` - Change user password modal
- `loadOnlineUsersPage()` - Online users dashboard
- `loadOnlineUsersData()` - Fetch and display online users

## Deployment Instructions

### Step 1: Pull Latest Code

```bash
cd /var/www/PrimeX
git pull origin main
```

### Step 2: Apply Database Migration

```bash
sudo mysql primex < database/migrations/enhance_device_tracking.sql
```

**Note:** You may see errors about duplicate columns - this is normal if some columns already exist.

### Step 3: Restart Application

```bash
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 20
```

### Step 4: Clear Browser Cache

- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Or use Incognito/Private mode

### Step 5: Verify Deployment

1. **Login to Admin Dashboard**
   - Navigate to https://prime-x.live
   - Login with admin credentials

2. **Test Device Management**
   - Go to Users section
   - Click "View" on any user
   - Check if devices are displayed
   - Test kick/remove device buttons

3. **Test Online Users**
   - Click "Online Users" in sidebar
   - Should show currently active users
   - Test refresh button

4. **Test Password Management**
   - View any user
   - Click "Change Password"
   - Enter new password
   - Test with/without "logout all sessions" option

## Security Features

### Device Tracking
- Devices are automatically tracked on user login
- Max devices limit is enforced from subscription plan
- Inactive devices (no activity > 5 minutes) don't count as "online"

### Session Management
- Sessions are stored in database with expiration
- Token hash is stored (not plain token)
- Sessions are automatically cleaned up on logout
- Force logout removes all sessions and devices

### Password Management
- Passwords are hashed with bcrypt (10 rounds)
- Minimum 6 characters required
- Optional automatic logout after password change
- All password changes are logged for audit

### Activity Logging
All admin actions are logged:
- Device removed
- Device kicked
- Force logout
- Password changed by admin

## Use Cases

### 1. Account Sharing Detection
- Check "Online Users" for suspicious activity
- View user devices to see multiple simultaneous connections
- Kick or remove unauthorized devices

### 2. Security Breach Response
- Force logout user from all devices
- Change password immediately
- Remove all devices to force re-authentication

### 3. Subscription Limit Enforcement
- View device count vs max_devices limit
- Remove excess devices if user exceeds limit
- Block devices that shouldn't be connected

### 4. Customer Support
- View user's active devices to troubleshoot issues
- Check last activity timestamp
- See IP addresses for location verification

## Troubleshooting

### Issue: "Failed to fetch online users"

**Cause:** Database query error or missing table

**Solution:**
```bash
# Check if user_sessions table exists
sudo mysql primex -e "SHOW TABLES LIKE 'user_sessions';"

# If missing, run migration again
sudo mysql primex < database/migrations/enhance_device_tracking.sql
```

### Issue: Devices not showing in user details

**Cause:** No devices in database or query error

**Solution:**
```bash
# Check user_devices table
sudo mysql primex -e "SELECT * FROM user_devices LIMIT 5;"

# Check for ip_address and user_agent columns
sudo mysql primex -e "SHOW COLUMNS FROM user_devices;"
```

### Issue: "Force Logout" not working

**Cause:** user_sessions table missing or foreign key issues

**Solution:**
```bash
# Verify table structure
sudo mysql primex -e "DESCRIBE user_sessions;"

# Check for orphaned sessions
sudo mysql primex -e "SELECT COUNT(*) FROM user_sessions;"
```

## Files Changed

### Backend
- `src/controllers/userController.js` - Added device and password management methods
- `src/routes/index.js` - Added new API routes
- `database/migrations/enhance_device_tracking.sql` - Database schema updates

### Frontend
- `public/admin/dashboard-v2.js` - UI implementation
- `public/admin/dashboard-v2.html` - Menu structure
- `public/admin/dashboard-v2.css` - Styling

## Commits

```
[hash] - Add device management and admin features
- Enhanced device tracking with IP and user agent
- Added force logout and kick device functionality
- Implemented online users dashboard
- Added admin password management
- Created user_sessions table for session tracking
```

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/

For issues or questions about these features, contact the developer.
