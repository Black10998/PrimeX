# PrimeX IPTV - RBAC Implementation Guide

## Overview

Role-Based Access Control (RBAC) has been implemented to support multiple admin roles with different permission levels.

---

## Roles and Permissions

### 1. Super Admin
**Full system access** - Can do everything

- ✅ Dashboard
- ✅ Users Management
- ✅ Subscriptions
- ✅ Subscription Codes
- ✅ Channels
- ✅ Categories
- ✅ Servers
- ✅ Plans
- ✅ Settings
- ✅ Security (2FA, Password)
- ✅ Notifications
- ✅ API Settings
- ✅ Activity Logs
- ✅ Admin Management (Create/Edit/Delete admins)

### 2. Admin
**Most modules** - Cannot access critical settings

- ✅ Dashboard
- ✅ Users Management
- ✅ Subscriptions
- ✅ Subscription Codes
- ✅ Channels
- ✅ Categories
- ✅ Servers
- ✅ Plans
- ❌ Settings
- ❌ Security
- ✅ Notifications
- ❌ API Settings
- ✅ Activity Logs
- ❌ Admin Management

### 3. Moderator
**User and content management** - No system configuration

- ✅ Dashboard
- ✅ Users Management
- ✅ Subscriptions
- ❌ Subscription Codes
- ✅ Channels
- ✅ Categories
- ❌ Servers
- ❌ Plans
- ❌ Settings
- ❌ Security
- ✅ Notifications
- ❌ API Settings
- ❌ Activity Logs
- ❌ Admin Management

### 4. Codes Seller (NEW)
**Subscription codes ONLY** - Perfect for resellers

- ✅ Dashboard (view only)
- ❌ Users Management
- ❌ Subscriptions
- ✅ Subscription Codes (Generate, View, Export)
- ❌ Channels
- ❌ Categories
- ❌ Servers
- ❌ Plans
- ❌ Settings
- ❌ Security
- ❌ Notifications
- ❌ API Settings
- ❌ Activity Logs
- ❌ Admin Management

---

## Database Migration

### Step 1: Run SQL Migration

Execute the migration to add `codes_seller` role:

```bash
mysql -u primex_user -p primex_db < migrations/add_codes_seller_role.sql
```

Or manually:

```sql
USE primex_db;

ALTER TABLE admin_users 
MODIFY COLUMN role ENUM('super_admin', 'admin', 'moderator', 'codes_seller') 
DEFAULT 'super_admin';
```

### Step 2: Verify Migration

```sql
DESCRIBE admin_users;
```

Expected output should show:
```
role | enum('super_admin','admin','moderator','codes_seller') | YES | | super_admin |
```

---

## Creating a Codes Seller Account

### Option 1: Via Admin Panel (Recommended)

1. Login as **Super Admin**
2. Navigate to **Admin Management** (bottom of sidebar)
3. Click **Create Admin**
4. Fill in details:
   - Username: `seller1`
   - Email: `seller1@example.com`
   - Password: (minimum 8 characters)
   - Role: **Codes Seller**
   - Status: **Active**
5. Click **Create Admin**

### Option 2: Via SQL

```sql
INSERT INTO admin_users (username, email, password, role, status)
VALUES (
    'seller1',
    'seller1@example.com',
    '$2b$10$YourHashedPasswordHere',
    'codes_seller',
    'active'
);
```

**Note:** Password must be bcrypt hashed. Use the admin panel for easier creation.

---

## Testing RBAC

### Test 1: Header Icons Consistency

1. Login to admin panel
2. Check top-right header icons:
   - 🔍 Search box
   - 🔔 Notifications
   - ⚙️ Settings
   - 👤 Profile avatar

**Expected:**
- All icons same size (40x40px)
- Same border-radius (8px)
- Same spacing (8px margin-left)
- Same hover effect (translateY(-1px))
- Consistent colors and transitions

### Test 2: Codes Seller Access

1. Create a Codes Seller account
2. Login with that account
3. Verify sidebar shows ONLY:
   - Dashboard
   - Subscription Codes

4. Try accessing `/admin/users` directly
   - Should show "Access Denied" message

5. Test Codes module:
   - ✅ Can view codes
   - ✅ Can generate codes
   - ✅ Can export codes
   - ❌ Cannot access other modules

### Test 3: Admin Role Access

1. Login as Admin (not Super Admin)
2. Verify sidebar hides:
   - Settings
   - Security
   - API Settings
   - Admin Management

3. Try accessing `/admin/settings` directly
   - Should show "Access Denied" message

### Test 4: Super Admin Access

1. Login as Super Admin
2. Verify all modules visible
3. Verify "Admin Management" appears at bottom of sidebar
4. Test creating/editing/deleting admins

---

## API Endpoints

### Admin Management (Super Admin Only)

```
GET    /api/v1/admin/admins              - List all admins
GET    /api/v1/admin/admins/:id          - Get admin details
POST   /api/v1/admin/admins              - Create admin
PUT    /api/v1/admin/admins/:id          - Update admin
DELETE /api/v1/admin/admins/:id          - Delete admin
GET    /api/v1/admin/permissions         - Get current user permissions
```

### Protected Endpoints

All admin endpoints now check permissions:

```javascript
// Example: Codes endpoint
router.get('/admin/codes', 
    authenticateAdmin, 
    checkModuleAccess('codes'), 
    codeController.getAllCodes
);
```

**Codes Seller** can access:
- `/admin/codes` - View codes
- `/admin/codes/generate` - Generate codes
- `/admin/codes/export` - Export codes
- `/admin/codes/stats` - View statistics

**Codes Seller** CANNOT access:
- `/admin/users`
- `/admin/channels`
- `/admin/settings`
- etc.

---

## Frontend Permission Handling

### Core.js Updates

```javascript
// Load permissions on init
await Core.loadPermissions();

// Check permission before loading module
if (!Core.hasPermission('users')) {
    // Show access denied
}

// Hide/show navigation items
Core.applyPermissions();
```

### Navigation Visibility

Navigation items automatically hide based on permissions:

```javascript
// Codes Seller will only see:
- Dashboard
- Subscription Codes

// Admin will see everything except:
- Settings
- Security
- API Settings
- Admin Management
```

---

## Security Features

### 1. Backend Validation
- Every route checks authentication
- RBAC middleware validates permissions
- Super Admin required for admin management

### 2. Frontend Protection
- Navigation items hidden based on role
- Direct URL access blocked
- "Access Denied" message shown

### 3. JWT Token
- Includes role in payload
- Validated on every request
- Expires after 24 hours

---

## Troubleshooting

### Issue: "Access Denied" for valid user

**Solution:**
1. Check user role in database:
   ```sql
   SELECT username, role, status FROM admin_users WHERE username = 'your_username';
   ```

2. Verify role is active:
   ```sql
   UPDATE admin_users SET status = 'active' WHERE username = 'your_username';
   ```

3. Clear browser cache and re-login

### Issue: Admin Management not visible

**Solution:**
- Only Super Admin can see Admin Management
- Check your role:
  ```sql
  SELECT role FROM admin_users WHERE username = 'your_username';
  ```
- If not super_admin, you cannot access this module

### Issue: Codes Seller sees other modules

**Solution:**
1. Clear browser cache
2. Logout and login again
3. Check permissions API response:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/v1/admin/permissions
   ```

---

## Use Cases

### Use Case 1: Reseller Management

**Scenario:** You want to give resellers access to generate codes without system access.

**Solution:**
1. Create Codes Seller account for each reseller
2. They can only:
   - Generate subscription codes
   - View their generated codes
   - Export codes for distribution
3. They CANNOT:
   - See user data
   - Modify channels
   - Change settings

### Use Case 2: Content Manager

**Scenario:** You need someone to manage channels and categories only.

**Solution:**
1. Create Moderator account
2. They can:
   - Manage channels
   - Manage categories
   - View users
3. They CANNOT:
   - Generate codes
   - Change system settings
   - Access servers

### Use Case 3: Customer Support

**Scenario:** Support team needs to manage users and subscriptions.

**Solution:**
1. Create Admin account
2. They can:
   - Manage users
   - Extend subscriptions
   - View activity logs
3. They CANNOT:
   - Change system settings
   - Manage other admins
   - Access API settings

---

## Header Icons Improvements

### Changes Made

1. **Unified Size:** All icons 40x40px
2. **Consistent Border Radius:** 8px (matches design system)
3. **Proper Spacing:** 8px margin-left between items
4. **Hover Effects:**
   - Background color change
   - Border highlight
   - Subtle translateY(-1px)
5. **Icon Sizes:** All 18px font-size
6. **Tooltips:** Added title attributes

### CSS Updates

```css
.icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--bg-tertiary);
    border: 1px solid transparent;
    margin-left: 8px;
    transition: var(--transition);
}

.icon-btn:hover {
    background: var(--bg-hover);
    border-color: var(--border-color);
    transform: translateY(-1px);
}

.user-avatar-img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: var(--transition);
}

.user-avatar-img:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
}
```

---

## Summary

✅ **RBAC System Implemented**
- 4 roles with different permissions
- Backend validation on all routes
- Frontend UI adapts to permissions

✅ **Codes Seller Role Created**
- Perfect for resellers
- Access to codes module only
- Cannot see sensitive data

✅ **Admin Management UI**
- Create/Edit/Delete admins
- Role assignment
- Super Admin only

✅ **Header Icons Standardized**
- Consistent size and spacing
- Unified hover effects
- Professional appearance

✅ **Security Enhanced**
- JWT includes role
- Middleware validates permissions
- Frontend hides unauthorized modules

---

**Version:** 11.0.0  
**Date:** December 19, 2024  
**Developer:** PAX  
**Status:** Production Ready
