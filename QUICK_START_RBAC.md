# Quick Start: RBAC & Header Icons

## 🚀 What's New

### 1. Header Icons - Unified Design ✨
All header icons (Search, Notifications, Settings, Profile) now have:
- **Same size:** 40x40px
- **Same style:** 8px border-radius
- **Same spacing:** 8px between items
- **Same hover effect:** Smooth lift animation

### 2. Codes Seller Role 🎫
New limited role perfect for resellers:
- ✅ Can generate subscription codes
- ✅ Can view and export codes
- ❌ Cannot access users, channels, settings, etc.

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

```bash
# Option 1: Using MySQL command
mysql -u primex_user -p primex_db < migrations/add_codes_seller_role.sql

# Option 2: Manual SQL
mysql -u primex_user -p primex_db
```

```sql
ALTER TABLE admin_users 
MODIFY COLUMN role ENUM('super_admin', 'admin', 'moderator', 'codes_seller') 
DEFAULT 'super_admin';
```

### Step 2: Restart Server

```bash
pm2 restart primex-iptv
# or
npm run start
```

### Step 3: Test RBAC

```bash
./test-rbac.sh
```

Expected: **17/18 tests pass** (database test passes after migration)

---

## 🎯 Creating a Codes Seller

### Via Admin Panel (Recommended)

1. Login as **Super Admin**
2. Scroll to bottom of sidebar
3. Click **Admin Management**
4. Click **Create Admin** button
5. Fill form:
   ```
   Username: seller1
   Email: seller1@example.com
   Password: (min 8 chars)
   Role: Codes Seller
   Status: Active
   ```
6. Click **Create Admin**

### Via SQL (Alternative)

```sql
-- First, hash your password using bcrypt
-- Then insert:
INSERT INTO admin_users (username, email, password, role, status)
VALUES (
    'seller1',
    'seller1@example.com',
    '$2b$10$YOUR_HASHED_PASSWORD_HERE',
    'codes_seller',
    'active'
);
```

---

## ✅ Testing Access

### Test Codes Seller

1. **Login** with codes seller account
2. **Verify sidebar** shows only:
   - Dashboard
   - Subscription Codes
3. **Try accessing** `/admin/users` directly
   - Should show: "Access Denied"
4. **Test codes module:**
   - Generate codes ✅
   - View codes ✅
   - Export codes ✅

### Test Header Icons

1. **Login** to admin panel
2. **Check top-right** header:
   - All icons same size ✅
   - Same spacing ✅
   - Smooth hover effect ✅
   - Consistent styling ✅

---

## 🔐 Role Comparison

| Feature | Super Admin | Admin | Moderator | Codes Seller |
|---------|-------------|-------|-----------|--------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ (view only) |
| Users | ✅ | ✅ | ✅ | ❌ |
| Subscriptions | ✅ | ✅ | ✅ | ❌ |
| Codes | ✅ | ✅ | ❌ | ✅ |
| Channels | ✅ | ✅ | ✅ | ❌ |
| Categories | ✅ | ✅ | ✅ | ❌ |
| Servers | ✅ | ✅ | ❌ | ❌ |
| Plans | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Security | ✅ | ❌ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ❌ |
| API Settings | ✅ | ❌ | ❌ | ❌ |
| Activity Logs | ✅ | ✅ | ❌ | ❌ |
| Admin Management | ✅ | ❌ | ❌ | ❌ |

---

## 🐛 Troubleshooting

### Issue: "Access Denied" for valid user

**Check role:**
```sql
SELECT username, role, status FROM admin_users WHERE username = 'your_username';
```

**Fix if needed:**
```sql
UPDATE admin_users SET status = 'active' WHERE username = 'your_username';
```

### Issue: Admin Management not visible

**Only Super Admin can see it.**

Check your role:
```sql
SELECT role FROM admin_users WHERE username = 'your_username';
```

### Issue: Header icons look different

1. Clear browser cache (Ctrl+Shift+R)
2. Check CSS loaded correctly
3. Verify `enterprise-panel.css` updated

---

## 📝 Summary

✅ **Header Icons:** Standardized and polished  
✅ **RBAC System:** Fully implemented  
✅ **Codes Seller Role:** Ready for resellers  
✅ **Admin Management:** Create/edit/delete admins  
✅ **Security:** Backend + frontend validation  
✅ **Documentation:** Complete guides available  

---

## 📚 Full Documentation

- **RBAC_IMPLEMENTATION.md** - Complete RBAC guide
- **NOTIFICATIONS_RESOLVED.md** - Notifications fix details
- **test-rbac.sh** - Automated testing script

---

**Version:** 11.0.0  
**Date:** December 19, 2024  
**Status:** ✅ Production Ready
