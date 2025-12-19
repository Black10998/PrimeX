# Fix API Base URL - Complete Solution

## Problem

API Base URL field in admin panel was not editable or persistent. Value always reset to `http://your-domain.com`.

## Solution Applied

### 1. Frontend Fixes

**File:** `public/admin/js/api-settings.js`

**Changes:**
- ✅ Field is now fully editable (no readonly attribute)
- ✅ Value loads from backend on page load
- ✅ After saving, settings reload to show saved value
- ✅ Added visual indicator showing current saved value
- ✅ Added loading state during save
- ✅ Fixed API call method

### 2. Backend Already Working

**Files:**
- `src/controllers/apiSettingsController.js` - Saves/loads from database
- `src/routes/index.js` - Routes configured
- Database table `system_settings` - Stores the value

### 3. Initialization Script

**File:** `init-api-settings.js`

Sets default API Base URL in database on first run.

---

## Deployment Steps

### Step 1: Pull Latest Code

```bash
cd /var/www/primex-iptv
git pull origin main
```

### Step 2: Initialize API Settings

```bash
node init-api-settings.js
```

**Expected output:**
```
🔧 Initializing API Settings...
✅ Connected to database
✅ API Base URL set to: https://prime-x.live
✅ Default API settings initialized
📊 Current API Settings:
   xtream_base_url: https://prime-x.live
   enable_xtream_api: true
   enable_m3u: true
🎉 API settings initialization complete!
```

### Step 3: Restart PM2

```bash
pm2 restart primex-iptv
```

### Step 4: Clear Browser Cache

**Important:** Clear browser cache or hard refresh
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`
- Or use incognito/private mode

---

## Testing

### 1. Open Admin Panel

Navigate to: `https://prime-x.live/admin/enterprise-panel.html`

### 2. Go to API Settings

Click **API / Xtream Settings** in sidebar

### 3. Verify Field is Editable

- Field should show: `https://prime-x.live`
- Field should be editable (not grayed out)
- Below field should show: "Current: https://prime-x.live"

### 4. Test Editing

1. Change value to: `https://test.example.com`
2. Click **Save Changes**
3. Wait for success message
4. Verify field still shows: `https://test.example.com`
5. Reload page
6. Verify value persists: `https://test.example.com`

### 5. Set Production Value

1. Change back to: `https://prime-x.live`
2. Click **Save Changes**
3. Verify success message
4. Reload page to confirm

---

## How It Works Now

### Load Flow:
```
1. Page loads
   ↓
2. APISettingsModule.loadSettings() called
   ↓
3. GET /api/v1/admin/settings/api
   ↓
4. Backend queries system_settings table
   ↓
5. Returns: { xtream_base_url: "https://prime-x.live" }
   ↓
6. Frontend stores in this.settings
   ↓
7. renderSettings() uses this.settings.xtream_base_url
   ↓
8. Input field displays correct value
```

### Save Flow:
```
1. User edits field
   ↓
2. User clicks "Save Changes"
   ↓
3. saveSettings() collects form data
   ↓
4. POST /api/v1/admin/settings/api
   ↓
5. Backend saves to system_settings table
   ↓
6. Success response
   ↓
7. Frontend reloads settings
   ↓
8. renderSettings() shows updated value
```

---

## Database Verification

### Check Current Value:

```sql
SELECT setting_key, setting_value 
FROM system_settings 
WHERE setting_key = 'xtream_base_url';
```

**Expected:**
```
+------------------+------------------------+
| setting_key      | setting_value          |
+------------------+------------------------+
| xtream_base_url  | https://prime-x.live   |
+------------------+------------------------+
```

### Manual Update (if needed):

```sql
UPDATE system_settings 
SET setting_value = 'https://prime-x.live' 
WHERE setting_key = 'xtream_base_url';
```

### Insert if Missing:

```sql
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES ('xtream_base_url', 'https://prime-x.live', 'string', 'Base URL for Xtream Codes API')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
```

---

## Troubleshooting

### Field Still Shows Old Value

**Cause:** Browser cache

**Fix:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache completely
3. Use incognito/private mode
4. Try different browser

### Value Doesn't Save

**Check backend logs:**
```bash
pm2 logs primex-iptv --lines 50
```

**Look for:**
- API settings save errors
- Database connection errors
- Permission errors

**Test API endpoint:**
```bash
# Get settings
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://prime-x.live/api/v1/admin/settings/api

# Save settings
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"xtream_base_url":"https://prime-x.live"}' \
  https://prime-x.live/api/v1/admin/settings/api
```

### Database Table Missing

**Run setup:**
```bash
node apply-schema-fix.js
```

Or manually create:
```sql
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## IPTV App Usage

Once API Base URL is set correctly, users can login on IPTV apps:

### IPTV Smarters Pro:
```
Server URL: https://prime-x.live
Username: [user's username]
Password: [user's password]
```

### TiviMate:
```
Playlist Type: Xtream Codes
Server: https://prime-x.live
Username: [user's username]
Password: [user's password]
```

### M3U URL:
```
https://prime-x.live/get.php?username=[username]&password=[password]
```

---

## Verification Checklist

After deployment:

- [ ] Run `node init-api-settings.js`
- [ ] Restart PM2
- [ ] Clear browser cache
- [ ] Open admin panel
- [ ] Go to API / Xtream Settings
- [ ] Verify field shows: `https://prime-x.live`
- [ ] Field is editable (not grayed out)
- [ ] Edit field to test value
- [ ] Click Save Changes
- [ ] Success message appears
- [ ] Field shows new value
- [ ] Reload page
- [ ] Value persists
- [ ] Set back to: `https://prime-x.live`
- [ ] Save and verify
- [ ] Test IPTV app login

---

## Summary

**What Was Fixed:**
1. ✅ Frontend now properly loads settings from backend
2. ✅ Field is fully editable (no readonly)
3. ✅ Save function reloads settings after saving
4. ✅ Visual indicator shows current saved value
5. ✅ Initialization script sets default value
6. ✅ Backend saves to database correctly

**Result:**
- API Base URL is now fully editable
- Value persists across page reloads
- IPTV apps can connect using correct URL
- System is production-ready

---

**Version:** 11.0.0  
**Status:** ✅ FIXED  
**Developer:** PAX
