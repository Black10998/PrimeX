# PrimeX IPTV - Enhanced Subscription System

## Overview

This document describes the enhanced subscription system that provides automatic content assignment, subscription tracking, and notifications.

## Key Features

### 1. Automatic Content Assignment

When creating a new user:
- **Categories** from the selected plan are automatically assigned to the user
- **Channels** from the selected plan are automatically assigned to the user
- Content is visible immediately after account creation
- **No server dependency** - content visibility is based on user assignments, not server availability

### 2. Subscription Tracking

Each user has complete subscription information:
- **Subscription Start Date** - automatically set on user creation
- **Subscription End Date** - calculated based on plan duration
- **Remaining Days** - dynamically calculated
- **Subscription Status** - active, expiring_soon, or expired

### 3. Notification System

Users receive notifications for:
- **Account Activated** - sent immediately after account creation
- **Subscription Expiring Soon** - sent 3 days before expiration
- **Subscription Expired** - sent on expiration day

### 4. Branding & Support Information

System displays service information:
- Service name
- Developer name
- Support email and phone
- Support message

## Database Schema

### New Tables

#### `plan_categories`
Links subscription plans to categories.

```sql
CREATE TABLE plan_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_category (plan_id, category_id)
);
```

#### `user_categories`
Stores categories assigned to each user at creation time.

```sql
CREATE TABLE user_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, category_id)
);
```

#### `user_channels`
Stores channels assigned to each user at creation time.

```sql
CREATE TABLE user_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    channel_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_channel (user_id, channel_id)
);
```

#### `notifications`
Stores user notifications.

```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('account_activated', 'subscription_expiring', 'subscription_expired', 'plan_upgraded', 'device_limit_reached', 'general'),
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    message_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `system_branding`
Stores branding and support information.

```sql
CREATE TABLE system_branding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    value_en TEXT,
    value_ar TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Setup Instructions

### 1. Apply Database Migration

Run the migration to create new tables:

```bash
npm run migrate
```

Or manually:

```bash
mysql -u your_user -p your_database < database/migrations/add_user_content_assignment.sql
```

### 2. Assign Categories to Plans

Before creating users, assign categories to plans:

```sql
-- Example: Assign all categories to plan 1
INSERT INTO plan_categories (plan_id, category_id)
SELECT 1, id FROM categories WHERE status = 'active';
```

### 3. Assign Channels to Plans

Channels are already linked via the existing `plan_channels` table:

```sql
-- Example: Assign channels to plan 1
INSERT INTO plan_channels (plan_id, channel_id)
SELECT 1, id FROM channels WHERE status = 'active';
```

### 4. Set Up Cron Job for Subscription Checks

Add to crontab to run daily at midnight:

```bash
0 0 * * * cd /path/to/PrimeX && npm run check-subscriptions
```

## API Changes

### User Creation

**Endpoint:** `POST /api/v1/admin/users`

**Request:**
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "plan_id": 1,
  "duration_days": 30,
  "max_devices": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "categories_assigned": 5,
    "channels_assigned": 150
  },
  "message": "User created successfully with content assigned"
}
```

### User Info (Xtream API)

**Endpoint:** `GET /player_api.php?username=X&password=Y`

**Response includes:**
```json
{
  "user_info": {
    "username": "testuser",
    "status": "Active",
    "exp_date": 1735689600,
    "subscription_start": 1733097600,
    "subscription_end": 1735689600,
    "remaining_days": 30,
    "plan_name": "Premium Monthly",
    "plan_duration_days": 30,
    "max_connections": "2",
    "active_cons": "1"
  },
  "server_info": {
    "url": "https://your-server.com",
    "service_name": "PrimeX IPTV",
    "developer_name": "PAX",
    "support_email": "info@paxdes.com",
    "support_phone": "+1234567890",
    "support_message": "Contact us for assistance"
  }
}
```

### Get Categories (Xtream API)

**Endpoint:** `GET /player_api.php?username=X&password=Y&action=get_live_categories`

Returns only categories assigned to the user (from `user_categories` table).

### Get Channels (Xtream API)

**Endpoint:** `GET /player_api.php?username=X&password=Y&action=get_live_streams`

Returns only channels assigned to the user (from `user_channels` table).

### Notifications

**Get User Notifications:**
```
GET /api/v1/notifications
GET /api/v1/notifications?unread_only=true
```

**Get Unread Count:**
```
GET /api/v1/notifications/unread-count
```

**Mark as Read:**
```
PUT /api/v1/notifications/:id/read
PUT /api/v1/notifications/read-all
```

## Admin Dashboard Changes

### User List View

Now displays:
- Subscription start date
- Subscription end date
- Remaining days
- Subscription status (active/expiring_soon/expired)
- Plan name

### User Details View

Shows complete subscription information:
- Plan name
- Subscription start date
- Subscription end date
- Remaining days
- Subscription status
- Categories count
- Channels count
- Device information

## Workflow

### Creating a New User

1. Admin selects a plan with assigned categories and channels
2. Admin enters user details and duration
3. System automatically:
   - Calculates subscription start and end dates
   - Assigns all plan categories to user
   - Assigns all plan channels to user
   - Creates "Account Activated" notification
   - Logs the activity

### User Login

1. User logs in via IPTV app
2. System returns:
   - Full subscription details
   - Remaining days
   - Plan information
   - Branding/support info
3. User sees all assigned categories and channels immediately

### Content Visibility

- Categories and channels are visible based on `user_categories` and `user_channels` tables
- **No dependency on streaming servers**
- Servers are only used for stream URLs, not for content visibility
- When a server is added later, channels start working instantly

### Subscription Expiration

1. **3 days before expiration:**
   - Cron job creates "Subscription Expiring Soon" notification
   
2. **On expiration day:**
   - Cron job creates "Subscription Expired" notification
   - User status changed to "expired"
   - User can no longer access content

## Testing

### Test User Creation

```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "email": "test@example.com",
    "plan_id": 1,
    "duration_days": 30
  }'
```

### Test User Login

```bash
curl "http://localhost:3000/player_api.php?username=testuser&password=test123"
```

### Test Categories

```bash
curl "http://localhost:3000/player_api.php?username=testuser&password=test123&action=get_live_categories"
```

### Test Channels

```bash
curl "http://localhost:3000/player_api.php?username=testuser&password=test123&action=get_live_streams"
```

## Troubleshooting

### User sees no categories/channels

1. Check if plan has categories assigned:
   ```sql
   SELECT * FROM plan_categories WHERE plan_id = ?;
   ```

2. Check if plan has channels assigned:
   ```sql
   SELECT * FROM plan_channels WHERE plan_id = ?;
   ```

3. Check if user has categories assigned:
   ```sql
   SELECT * FROM user_categories WHERE user_id = ?;
   ```

4. Check if user has channels assigned:
   ```sql
   SELECT * FROM user_channels WHERE user_id = ?;
   ```

### Notifications not working

1. Ensure cron job is running:
   ```bash
   crontab -l
   ```

2. Check cron job logs:
   ```bash
   npm run check-subscriptions
   ```

3. Verify notifications table:
   ```sql
   SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC;
   ```

## Developer Notes

- All user creation is transactional - if any step fails, everything rolls back
- Categories and channels are assigned at creation time, not dynamically
- Subscription status is calculated on-the-fly based on dates
- Notifications are created by cron job, not on-demand
- Server availability does not affect content visibility

## Support

For issues or questions:
- Email: info@paxdes.com
- Developer: PAX
