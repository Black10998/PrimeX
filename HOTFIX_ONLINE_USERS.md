# Hotfix - Online Users Page

## Issue Fixed
**TypeError: filtered.map is not a function**

The Online Users page was failing because:
1. Frontend expected array but didn't validate response structure
2. Backend SQL query had MySQL 8.0 GROUP BY compatibility issue
3. Missing `server_id` column in users table

## Changes Made

### Frontend (`public/admin/dashboard-v2.js`)
- Added robust array extraction from API response
- Handles multiple response structure variations:
  - `response.data.users` (correct structure)
  - `response.data` (if array)
  - `response.users` (alternative)
  - `response` (if direct array)
- Validates array type before calling `.map()`
- Added error logging and better error messages

### Backend (`src/controllers/userController.js`)
- Fixed MySQL GROUP BY clause for MySQL 8.0 compatibility
- Simplified query to `GROUP BY u.id` only
- Removed unnecessary `COALESCE` from server_name

### Database
- Ensured `server_id` column exists in users table
- Added index on `server_id` for performance

## Deploy to VPS

### Step 1: Pull Latest Code
```bash
cd /var/www/PrimeX
git pull origin main
```

### Step 2: Add Missing Column (if needed)
```bash
sudo mysql primex -e "ALTER TABLE users ADD COLUMN IF NOT EXISTS server_id INT AFTER plan_id;"
sudo mysql primex -e "ALTER TABLE users ADD INDEX IF NOT EXISTS idx_server_id (server_id);"
```

**Note:** MySQL doesn't support `IF NOT EXISTS` in ALTER TABLE, so you may see an error if column exists - this is normal.

Alternative (ignore errors):
```bash
sudo mysql primex -e "ALTER TABLE users ADD COLUMN server_id INT AFTER plan_id;" 2>/dev/null || true
sudo mysql primex -e "ALTER TABLE users ADD INDEX idx_server_id (server_id);" 2>/dev/null || true
```

### Step 3: Restart Application
```bash
pm2 restart primex-iptv
pm2 logs primex-iptv --lines 20
```

### Step 4: Clear Browser Cache
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

## Verify Fix

### 1. Check Column Exists
```bash
sudo mysql primex -e "SHOW COLUMNS FROM users;" | grep server_id
# Should show: server_id int YES MUL NULL
```

### 2. Test API Endpoint
```bash
# Get admin token
TOKEN=$(curl -s -X POST https://prime-x.live/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}' | jq -r '.data.token')

# Test online users endpoint
curl -s https://prime-x.live/api/v1/admin/users/online/list \
  -H "Authorization: Bearer $TOKEN" | jq .

# Should return:
# {
#   "success": true,
#   "data": {
#     "users": [],
#     "count": 0
#   }
# }
```

### 3. Test in Browser
1. Login to admin dashboard
2. Click "Online Users" in sidebar
3. Should show "No users currently online" (if no active users)
4. No JavaScript errors in console

## What Was Wrong

### Original Error
```javascript
TypeError: filtered.map is not a function
```

### Root Causes

**1. Frontend Issue:**
```javascript
// OLD (assumed response structure)
const users = response.data.users || [];
users.map(...)  // Failed if users was not an array
```

**2. Backend Issue:**
```sql
-- OLD (MySQL 8.0 strict mode error)
GROUP BY u.id, u.username, u.email, u.status, sp.name_en, ss.name
-- Error: All non-aggregated columns must be in GROUP BY
```

**3. Database Issue:**
```sql
-- Missing column
LEFT JOIN streaming_servers ss ON u.server_id = ss.id
-- Error: Unknown column 'u.server_id'
```

## Fixed Code

### Frontend
```javascript
// NEW (robust array extraction)
let users = [];
if (response.data && response.data.users) {
    users = response.data.users;
} else if (response.data && Array.isArray(response.data)) {
    users = response.data;
} else if (response.users) {
    users = response.users;
} else if (Array.isArray(response)) {
    users = response;
}

if (!Array.isArray(users) || users.length === 0) {
    // Show empty state
    return;
}

users.map(...)  // Safe to call now
```

### Backend
```sql
-- NEW (MySQL 8.0 compatible)
GROUP BY u.id
-- Only group by primary key, other columns are functionally dependent
```

## Commits

- `14e87f5` - Fix online users API response handling and SQL query

## Files Changed

- `public/admin/dashboard-v2.js` - Frontend array handling
- `src/controllers/userController.js` - Backend SQL query

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/
