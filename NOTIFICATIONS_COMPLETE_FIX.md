# Notifications - Complete Fix

## Issues Fixed

### 1. Frontend Modal Submission ✅
- Added event handler attachment for create notification form
- Added submitCreate() helper method
- Fixed "Unexpected end of input" error

### 2. Database Schema ✅
- Controller now uses: `title`, `message`, `is_read`, `read_at`
- No references to old bilingual columns
- All queries match current schema

### 3. API Endpoints ✅
- GET /notifications - Uses correct columns
- POST /admin/notifications - Uses correct columns
- PUT /notifications/:id/read - Uses correct columns

---

## Required Database Schema

The notifications table MUST have these columns:

```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

---

## Deployment Steps

### Step 1: Verify Database Schema

```bash
mysql -u primex_user -p primex_db -e "DESCRIBE notifications;"
```

**Required columns:**
- ✅ id
- ✅ user_id
- ✅ admin_id
- ✅ type
- ✅ **title** (VARCHAR 255, NOT NULL)
- ✅ **message** (TEXT, NOT NULL)
- ✅ **is_read** (BOOLEAN/TINYINT)
- ✅ **read_at** (DATETIME, NULL)
- ✅ created_at

**If missing columns, run:**

```sql
-- Add title if missing
ALTER TABLE notifications ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER type;

-- Add message if missing
ALTER TABLE notifications ADD COLUMN message TEXT DEFAULT NULL AFTER title;

-- Add read_at if missing
ALTER TABLE notifications ADD COLUMN read_at DATETIME DEFAULT NULL AFTER is_read;

-- Migrate data if you have old columns
UPDATE notifications SET title = title_en, message = message_en WHERE title IS NULL;

-- Make columns NOT NULL
ALTER TABLE notifications MODIFY COLUMN title VARCHAR(255) NOT NULL;
ALTER TABLE notifications MODIFY COLUMN message TEXT NOT NULL;
```

### Step 2: Pull Latest Code

```bash
cd /var/www/primex-iptv
git pull origin main
```

### Step 3: Restart PM2

```bash
pm2 restart primex-iptv
```

### Step 4: Clear Browser Cache

Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

---

## Testing

### 1. Test GET Notifications

```bash
# Get admin token first (login via admin panel)
TOKEN="your_admin_token_here"

# Test notifications endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://prime-x.live/api/v1/notifications

# Expected: 200 OK with JSON response
# Not: 500 Internal Server Error
```

### 2. Test Create Notification

In admin panel:
1. Go to Notifications page
2. Click "Create Notification"
3. Fill form:
   - Type: Info
   - Title: Test Notification
   - Message: This is a test message
   - Target: All Users
4. Click "Create"
5. **Should succeed** ✅

### 3. Check PM2 Logs

```bash
pm2 logs primex-iptv --lines 50

# Should show NO errors like:
# ❌ Unknown column 'title' in 'field list'
# ❌ Unknown column 'read_at' in 'field list'
```

---

## Common Issues

### Issue: "Unknown column 'title'"

**Cause:** Database doesn't have title column

**Fix:**
```sql
ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NOT NULL AFTER type;
```

### Issue: "Unknown column 'read_at'"

**Cause:** Database doesn't have read_at column

**Fix:**
```sql
ALTER TABLE notifications ADD COLUMN read_at DATETIME DEFAULT NULL AFTER is_read;
```

### Issue: "Create button does nothing"

**Cause:** Browser cache has old JavaScript

**Fix:**
- Hard refresh: `Ctrl + Shift + R`
- Or clear browser cache completely

### Issue: Still getting 500 errors

**Check:**
1. PM2 logs for exact error: `pm2 logs primex-iptv`
2. Database schema: `DESCRIBE notifications;`
3. Verify all required columns exist
4. Check column names match exactly (case-sensitive)

---

## Verification Checklist

After deployment:

- [ ] Database has `title` column (VARCHAR 255, NOT NULL)
- [ ] Database has `message` column (TEXT, NOT NULL)
- [ ] Database has `read_at` column (DATETIME, NULL)
- [ ] PM2 restarted successfully
- [ ] Browser cache cleared
- [ ] GET /api/v1/notifications returns 200 OK
- [ ] Notifications page loads without errors
- [ ] Can create notification successfully
- [ ] Notification appears in list
- [ ] Can mark notification as read
- [ ] No console errors
- [ ] No PM2 log errors

---

## What Changed

### Frontend (notifications.js)
- Added event handler attachment for create form
- Added submitCreate() helper method
- Form now submits without syntax errors

### Backend (notificationController.js)
- All queries use: title, message, is_read, read_at
- No references to title_en, message_en, etc.
- createNotification supports both specific user and all users

### Database Schema
- Must have: title, message, read_at columns
- Old bilingual columns (title_en, etc.) can remain but are not used

---

## Summary

**Problem:** Database schema mismatch + frontend form submission error
**Solution:** Fixed frontend event handlers + ensured schema has correct columns
**Result:** Notifications fully functional

Once database schema is correct and code is deployed, notifications will work perfectly.

---

**Version:** 11.0.0  
**Status:** Complete  
**Developer:** PAX
