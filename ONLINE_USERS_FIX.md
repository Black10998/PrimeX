# Online Users Tracking Fix

## Problem
Online Users page always showed **"No users currently online"** even though:
- ✅ Users could login successfully
- ✅ Multiple devices were streaming
- ✅ Sessions were active
- ✅ No errors on login or streaming

**Dashboard always showed: 0 online users**

## Root Cause

### Xtream Authentication Not Tracking Devices
```javascript
// OLD - Only validated credentials
async authenticate(req, res, next) {
    // ... validate username/password
    // ... check subscription
    req.xtreamUser = user;
    next();  // ❌ No device tracking
}
```

**Problem:**
- Authentication succeeded but didn't record device activity
- No `user_devices` records created
- `last_seen` timestamp never updated
- Online users query found 0 active devices

### Online Users Query
```sql
SELECT u.id, u.username, COUNT(DISTINCT ud.id) as active_devices
FROM users u
LEFT JOIN user_devices ud ON u.id = ud.user_id 
    AND ud.last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    AND ud.status = 'active'
WHERE u.status = 'active'
GROUP BY u.id
HAVING active_devices > 0
```

**Result:** Always returned 0 users because `user_devices` was empty.

## Solution

### 1. Added Device Tracking to Xtream Authentication
```javascript
// NEW - Track device activity
async authenticate(req, res, next) {
    // ... validate username/password
    // ... check subscription
    
    // Track device activity
    try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        // Generate unique device ID
        const deviceId = crypto.createHash('md5')
            .update(`${clientIp}-${userAgent}`)
            .digest('hex');
        
        // Insert or update device activity
        await pool.query(`
            INSERT INTO user_devices 
            (user_id, device_id, device_name, device_type, last_seen, status)
            VALUES (?, ?, ?, ?, NOW(), 'active')
            ON DUPLICATE KEY UPDATE 
                last_seen = NOW(), 
                status = 'active'
        `, [user.id, deviceId, userAgent.substring(0, 100), 'xtream']);
        
    } catch (trackError) {
        // Don't fail auth if tracking fails
        logger.error('Device tracking error:', { error: trackError.message });
    }
    
    req.xtreamUser = user;
    next();
}
```

### 2. Added Unique Constraint
```sql
-- Prevents duplicate device records
ALTER TABLE user_devices 
ADD UNIQUE KEY unique_user_device (user_id, device_id);
```

**Benefits:**
- Allows `ON DUPLICATE KEY UPDATE` to work
- Same device updates existing record
- Different devices create new records
- No duplicate entries

### 3. Device ID Generation
```javascript
// Combines IP + User-Agent for unique ID
const deviceId = crypto.createHash('md5')
    .update(`${clientIp}-${userAgent}`)
    .digest('hex');
```

**Examples:**
- IP: `192.168.1.100`, UA: `VLC/3.0.0` → `a1b2c3d4...`
- IP: `192.168.1.101`, UA: `VLC/3.0.0` → `e5f6g7h8...`
- Same device always gets same ID
- Different devices get different IDs

## How It Works

### User Login Flow:
1. **User opens IPTV app**
   - App calls: `/player_api.php?username=X&password=Y`

2. **Xtream authentication**
   - Validates credentials
   - Checks subscription status
   - **Tracks device activity** ✅

3. **Device tracking**
   - Generates device_id from IP + User-Agent
   - Inserts/updates user_devices record
   - Sets last_seen = NOW()
   - Sets status = 'active'

4. **Online users query**
   - Finds devices with last_seen < 5 minutes
   - Groups by user_id
   - Counts active devices
   - Returns online users

### Activity Tracking:
- **Every Xtream API call** updates last_seen
- Devices inactive for 5+ minutes are excluded
- Real-time tracking of active users
- Multiple devices per user supported

## Database Changes

### user_devices Table:
```sql
CREATE TABLE user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id VARCHAR(255),
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_device (user_id, device_id)  -- ✅ Added
);
```

### Before Fix:
```sql
SELECT COUNT(*) FROM user_devices;
-- Result: 0
```

### After Fix:
```sql
SELECT COUNT(*) FROM user_devices;
-- Result: 5 (or more, depending on active users)
```

## Files Changed

### src/controllers/xtreamController.js
**Changes:**
- Added `crypto` module import
- Added device tracking after authentication
- Generate device_id from IP + User-Agent
- Insert/update user_devices on each request
- Update last_seen timestamp
- Non-blocking error handling

**Lines:** +22 insertions

### database/schema.sql
**Changes:**
- Added UNIQUE KEY unique_user_device (user_id, device_id)
- Removed duplicate INDEX idx_user_device

**Lines:** +1 insertion, -1 deletion

## Testing

### Test 1: Device Tracking
```bash
# User logs in
curl "http://server.com/player_api.php?username=test&password=pass"

# Check database
SELECT * FROM user_devices WHERE user_id = 1;

Result:
✅ Device record created
✅ last_seen = NOW()
✅ status = 'active'
```

### Test 2: Online Users Query
```sql
SELECT u.username, COUNT(ud.id) as devices
FROM users u
LEFT JOIN user_devices ud ON u.id = ud.user_id 
    AND ud.last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
WHERE u.status = 'active'
GROUP BY u.id
HAVING devices > 0;

Result:
✅ Returns active users
✅ Shows device count
✅ Updates in real-time
```

### Test 3: Online Users Endpoint
```bash
GET /api/v1/admin/users/online/list

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 11,
        "username": "testuser",
        "active_devices": 1,
        "last_activity": "2025-12-17T00:20:00.000Z"
      }
    ],
    "count": 1
  }
}

✅ Shows online users
✅ Displays device count
✅ Shows last activity
```

## Deployment

### Pull Latest Code:
```bash
cd /path/to/PrimeX
git pull origin main
```

### Restart Server:
```bash
pm2 restart primex-iptv
# or
npm start
```

### Verify Database:
```bash
# Check if unique constraint exists
mysql -u root -p primex -e "SHOW INDEX FROM user_devices WHERE Key_name = 'unique_user_device';"

# If not exists, add it manually:
mysql -u root -p primex -e "ALTER TABLE user_devices ADD UNIQUE KEY unique_user_device (user_id, device_id);"
```

### Test:
1. Login via IPTV app
2. Wait 10 seconds
3. Check Admin Panel → Online Users
4. Should show logged-in user ✅

## What Now Works

### Online Users Dashboard:
- ✅ Shows logged-in users in real-time
- ✅ Displays active device count per user
- ✅ Shows last activity timestamp
- ✅ Updates automatically (5-minute window)
- ✅ Multiple devices per user supported

### Device Tracking:
- ✅ Records device on Xtream login
- ✅ Updates last_seen on each API call
- ✅ Generates unique device_id
- ✅ Tracks device type (xtream)
- ✅ Non-blocking (doesn't affect auth)

### Admin Panel:
- ✅ Online Users page shows active users
- ✅ Real-time activity monitoring
- ✅ Device count per user
- ✅ Last activity timestamp

## Activity Window

**5-Minute Window:**
- Devices with `last_seen` within last 5 minutes = **Online**
- Devices with `last_seen` > 5 minutes ago = **Offline**

**Why 5 minutes?**
- IPTV apps typically make API calls every 1-3 minutes
- 5 minutes allows for network delays
- Balances real-time accuracy with database load

## Error Handling

### Non-Blocking Tracking:
```javascript
try {
    // Track device activity
} catch (trackError) {
    // Log error but don't fail authentication
    logger.error('Device tracking error:', { error: trackError.message });
}
```

**Benefits:**
- Authentication always succeeds
- Tracking failures don't affect users
- Errors logged for debugging
- Graceful degradation

## Performance

### Efficient Updates:
```sql
INSERT INTO user_devices (...)
VALUES (...)
ON DUPLICATE KEY UPDATE 
    last_seen = NOW(), 
    status = 'active'
```

**Benefits:**
- Single query per request
- No SELECT before INSERT
- Automatic deduplication
- Minimal database load

### Indexed Queries:
- UNIQUE KEY on (user_id, device_id)
- Fast lookups and updates
- Efficient JOIN operations
- Optimized for real-time queries

## Troubleshooting

### Online Users Still Shows 0:
1. Check user_devices table:
   ```sql
   SELECT COUNT(*) FROM user_devices;
   ```
2. Check recent activity:
   ```sql
   SELECT * FROM user_devices 
   WHERE last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE);
   ```
3. Check unique constraint:
   ```sql
   SHOW INDEX FROM user_devices;
   ```

### Devices Not Being Tracked:
1. Check server logs for tracking errors
2. Verify crypto module is available
3. Check database permissions
4. Verify user_devices table exists

### Duplicate Device Records:
1. Add unique constraint if missing:
   ```sql
   ALTER TABLE user_devices 
   ADD UNIQUE KEY unique_user_device (user_id, device_id);
   ```

---

**Status:** ✅ FIXED AND PUSHED TO GITHUB
**Last Updated:** 2025-12-17
**Commit:** d981ba6
**Type:** Backend tracking fix
**Requires:** Server restart + database constraint
