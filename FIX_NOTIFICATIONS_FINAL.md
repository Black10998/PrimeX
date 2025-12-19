# Fix Notifications - Final Solution

## Problem

`GET /api/v1/notifications` returns **500 Internal Server Error**

**Error from PM2 logs:**
```
Unknown column 'title' in 'field list'
```

**Root Cause:**
- Controller uses: `title` and `message` columns
- Database has: `title_en`, `title_ar`, `message_en`, `message_ar` columns
- Schema mismatch causes SQL error

---

## Solution

Run the migration script to add correct columns to the database.

### Step 1: Pull Latest Code

```bash
cd /var/www/primex-iptv
git pull origin main
```

### Step 2: Run Notifications Schema Fix

```bash
node fix-notifications-schema.js
```

**Expected output:**
```
🔧 Fixing notifications table schema...
✅ Connected to database

1️⃣ Checking current notifications table schema...
   Current columns: id, user_id, admin_id, type, title_en, title_ar, message_en, message_ar, ...

2️⃣ Adding title column...
   ✅ Added title column

3️⃣ Adding message column...
   ✅ Added message column

4️⃣ Migrating data from bilingual columns...
   ✅ Migrated data from title_en and message_en

5️⃣ Setting columns to NOT NULL...
   ✅ Columns set to NOT NULL

6️⃣ Verifying final schema...
   Final schema:
   - id: int NOT NULL
   - user_id: int NULL
   - admin_id: int NULL
   - type: enum NOT NULL
   - title: varchar NOT NULL
   - message: text NOT NULL
   - is_read: tinyint NOT NULL
   - read_at: datetime NULL
   - created_at: timestamp NOT NULL

🎉 Notifications table schema fixed successfully!
```

### Step 3: Restart PM2

```bash
pm2 restart primex-iptv
```

### Step 4: Test

1. Login to admin panel
2. Go to Notifications page
3. **Should load successfully** ✅
4. No 500 errors

---

## What the Script Does

1. **Checks current schema** - Lists all columns in notifications table
2. **Adds new columns** - Adds `title` and `message` if they don't exist
3. **Migrates data** - Copies data from `title_en` and `message_en` to new columns
4. **Sets NOT NULL** - Makes new columns required
5. **Verifies schema** - Shows final table structure

**Safe:**
- Does NOT drop old columns (title_en, etc.) - keeps them for safety
- Only adds new columns
- Migrates existing data
- Can be run multiple times safely

---

## Alternative: Manual SQL

If you prefer to run SQL manually:

```sql
-- Add new columns
ALTER TABLE notifications 
ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER type;

ALTER TABLE notifications 
ADD COLUMN message TEXT DEFAULT NULL AFTER title;

-- Migrate data from old columns
UPDATE notifications 
SET title = title_en, message = message_en 
WHERE title IS NULL OR message IS NULL;

-- Make columns NOT NULL
ALTER TABLE notifications 
MODIFY COLUMN title VARCHAR(255) NOT NULL;

ALTER TABLE notifications 
MODIFY COLUMN message TEXT NOT NULL;

-- Verify
DESCRIBE notifications;
```

---

## Verification

After running the fix:

```bash
# Check PM2 logs
pm2 logs primex-iptv --lines 20

# Should show no errors
```

**Test in browser:**
1. Open: `https://prime-x.live/admin/enterprise-panel.html`
2. Click: Notifications
3. Should load without errors
4. Console should be clean

---

## If Issues Persist

### Check Database Schema

```bash
mysql -u primex_user -p primex_db -e "DESCRIBE notifications;"
```

**Expected columns:**
- id
- user_id
- admin_id
- type
- **title** ← Must exist
- **message** ← Must exist
- is_read
- read_at
- created_at

### Check PM2 Logs

```bash
pm2 logs primex-iptv --lines 50 | grep -i error
```

### Test API Directly

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://prime-x.live/api/v1/notifications
```

**Expected:** 200 OK with JSON response
**Not:** 500 Internal Server Error

---

## Summary

**Problem:** Database schema doesn't match controller code
**Solution:** Add `title` and `message` columns to notifications table
**Script:** `fix-notifications-schema.js`
**Result:** Notifications page loads successfully

---

**Version:** 11.0.0  
**Status:** Ready to deploy  
**Developer:** PAX
