# PrimeX IPTV - Setup Guide

## Quick Start

### 1. Install MySQL

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# Start MySQL
sudo service mysql start
```

### 2. Create Database and User

```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS primex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'primex_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON primex.* TO 'primex_user'@'localhost'; FLUSH PRIVILEGES;"
```

### 3. Configure Environment

Copy `.env` file and update database credentials:

```bash
cp .env.example .env
nano .env
```

Update these values:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=primex
DB_USER=primex_user
DB_PASSWORD=your_secure_password
```

**Important:** Use `127.0.0.1` instead of `localhost` to avoid socket permission issues.

### 4. Initialize Database

```bash
# Apply main schema
sudo mysql primex < database/schema.sql

# Apply migrations
npm run migrate
```

### 5. Start Server

```bash
npm start
```

Server will be available at: `http://localhost:3000`

## Testing User Creation

### 1. Get Admin Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "ChangeThisImmediately123!"
  }'
```

### 2. Create Test User

```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "email": "test@example.com",
    "plan_id": 1,
    "duration_days": 30
  }'
```

### 3. Verify User

```bash
curl -X GET http://localhost:3000/api/v1/admin/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Setting Up Content

### 1. Assign Categories to Plans

```sql
-- Assign all active categories to plan 1
INSERT INTO plan_categories (plan_id, category_id)
SELECT 1, id FROM categories WHERE status = 'active';
```

### 2. Assign Channels to Plans

```sql
-- Assign all active channels to plan 1
INSERT INTO plan_channels (plan_id, channel_id)
SELECT 1, id FROM channels WHERE status = 'active';
```

### 3. Create New User

When you create a user with this plan, they will automatically get all assigned categories and channels.

## Troubleshooting

### Database Connection Failed

**Error:** `Access denied for user 'primex_user'@'localhost'`

**Solution:**
1. Use `127.0.0.1` instead of `localhost` in `.env`
2. Verify user permissions:
   ```bash
   sudo mysql -e "SHOW GRANTS FOR 'primex_user'@'localhost';"
   ```

### User Creation Returns 500

**Check:**
1. Database is running: `sudo service mysql status`
2. Database connection works: Check server logs
3. Plan exists: `SELECT * FROM subscription_plans WHERE id = 1;`

### No Categories/Channels Visible

**Check:**
1. Plan has categories assigned:
   ```sql
   SELECT * FROM plan_categories WHERE plan_id = 1;
   ```
2. Plan has channels assigned:
   ```sql
   SELECT * FROM plan_channels WHERE plan_id = 1;
   ```
3. User has content assigned:
   ```sql
   SELECT * FROM user_categories WHERE user_id = 1;
   SELECT * FROM user_channels WHERE user_id = 1;
   ```

## Production Deployment

### 1. Secure Database

```bash
# Change default password
sudo mysql -e "ALTER USER 'primex_user'@'localhost' IDENTIFIED BY 'strong_random_password';"
```

### 2. Update .env

```
NODE_ENV=production
DB_PASSWORD=strong_random_password
JWT_SECRET=generate_64_character_secret
JWT_REFRESH_SECRET=generate_another_64_character_secret
ADMIN_PASSWORD=strong_admin_password
```

### 3. Set Up Cron Jobs

```bash
# Edit crontab
crontab -e

# Add subscription check (runs daily at midnight)
0 0 * * * cd /path/to/PrimeX && npm run check-subscriptions
```

### 4. Use Process Manager

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start src/server.js --name primex-iptv

# Save configuration
pm2 save

# Set up auto-start
pm2 startup
```

## API Endpoints

### Admin Endpoints

- `POST /api/v1/auth/admin/login` - Admin login
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/users/:id` - Get user details
- `POST /api/v1/admin/users` - Create user
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user

### Xtream API Endpoints

- `GET /player_api.php?username=X&password=Y` - Get user info
- `GET /player_api.php?username=X&password=Y&action=get_live_categories` - Get categories
- `GET /player_api.php?username=X&password=Y&action=get_live_streams` - Get channels

### Notification Endpoints

- `GET /api/v1/notifications` - Get user notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read

## Support

For issues or questions:
- Email: info@paxdes.com
- Developer: PAX
