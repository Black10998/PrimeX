# PrimeX IPTV System - API Documentation

**Developer:** PAX  
**Support:** info@paxdes.com  
**Version:** 1.0

## Base URL

```
http://your-server-ip:3000
```

## Authentication

All admin endpoints require Bearer token authentication:

```
Authorization: Bearer <token>
```

User endpoints require valid subscription and device binding.

---

## Authentication Endpoints

### User Login
```http
POST /api/v1/auth/login
```

**Body:**
```json
{
  "username": "user123",
  "password": "password",
  "device_id": "device-uuid",
  "mac_address": "00:11:22:33:44:55"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": 1,
      "username": "user123",
      "subscription_end": "2024-12-31T23:59:59.000Z",
      "max_devices": 2
    }
  }
}
```

### Login with Subscription Code
```http
POST /api/v1/auth/login-code
```

**Body:**
```json
{
  "code": "ABCD-EFGH-IJKL-MNOP",
  "device_id": "device-uuid",
  "mac_address": "00:11:22:33:44:55"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "credentials": {
      "username": "auto-generated-username",
      "password": "auto-generated-password"
    },
    "user": {
      "id": 1,
      "subscription_end": "2024-12-31T23:59:59.000Z"
    }
  },
  "message": "Account created successfully. Please save your credentials."
}
```

### Admin Login
```http
POST /api/v1/auth/admin-login
```

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

## Xtream API Compatibility

### Get User Info
```http
GET /player_api.php?username=user123&password=pass123
```

**Response:**
```json
{
  "user_info": {
    "username": "user123",
    "auth": 1,
    "status": "Active",
    "exp_date": 1735689599,
    "max_connections": "2",
    "active_cons": "1"
  },
  "server_info": {
    "url": "http://your-server.com",
    "port": "3000",
    "server_protocol": "http"
  }
}
```

### Get Live Categories
```http
GET /player_api.php?username=user123&password=pass123&action=get_live_categories
```

### Get Live Streams
```http
GET /player_api.php?username=user123&password=pass123&action=get_live_streams&category_id=1
```

### Get Stream URL
```http
GET /live/{username}/{password}/{stream_id}.m3u8
```

### Get M3U Playlist
```http
GET /get.php?username=user123&password=pass123
```

---

## Admin Endpoints

### Dashboard Statistics
```http
GET /api/v1/admin/dashboard/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total_users": 150,
      "active_subscriptions": 120,
      "expired_subscriptions": 30
    },
    "channels": {
      "total_channels": 500,
      "active_channels": 480
    },
    "servers": {
      "total_servers": 5,
      "active_servers": 4
    }
  }
}
```

### User Management

#### Get All Users
```http
GET /api/v1/admin/users?page=1&limit=20&status=active&search=username
Authorization: Bearer <admin-token>
```

#### Create User
```http
POST /api/v1/admin/users
Authorization: Bearer <admin-token>

Body:
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "plan_id": 1,
  "duration_days": 30,
  "max_devices": 2
}
```

#### Update User
```http
PUT /api/v1/admin/users/{id}
Authorization: Bearer <admin-token>

Body:
{
  "status": "active",
  "subscription_end": "2024-12-31",
  "max_devices": 3
}
```

#### Extend Subscription
```http
POST /api/v1/admin/users/{id}/extend
Authorization: Bearer <admin-token>

Body:
{
  "days": 30
}
```

### Subscription Code Management

#### Generate Codes
```http
POST /api/v1/admin/codes/generate
Authorization: Bearer <admin-token>

Body:
{
  "count": 50,
  "source_name": "Reseller A",
  "duration_days": 30,
  "max_uses": 1,
  "plan_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "codes": [
      "ABCD-EFGH-IJKL-MNOP",
      "QRST-UVWX-YZAB-CDEF"
    ],
    "count": 50
  }
}
```

#### Get All Codes
```http
GET /api/v1/admin/codes?page=1&limit=20&status=active&source_name=Reseller
Authorization: Bearer <admin-token>
```

#### Export Codes
```http
GET /api/v1/admin/codes/export?status=active
Authorization: Bearer <admin-token>
```

Returns CSV file.

### Channel Management

#### Create Channel
```http
POST /api/v1/admin/channels
Authorization: Bearer <admin-token>

Body:
{
  "name_en": "Channel Name",
  "name_ar": "اسم القناة",
  "category_id": 1,
  "logo": "https://example.com/logo.png",
  "stream_url": "https://stream.example.com/channel.m3u8",
  "backup_stream_url": "https://backup.example.com/channel.m3u8",
  "epg_id": "channel-epg-id",
  "sort_order": 1
}
```

#### Update Channel
```http
PUT /api/v1/admin/channels/{id}
Authorization: Bearer <admin-token>

Body:
{
  "stream_url": "https://new-stream.example.com/channel.m3u8",
  "status": "active"
}
```

#### Reorder Channels
```http
POST /api/v1/admin/channels/reorder
Authorization: Bearer <admin-token>

Body:
{
  "orders": [
    { "id": 1, "sort_order": 1 },
    { "id": 2, "sort_order": 2 }
  ]
}
```

### Category Management

#### Create Category
```http
POST /api/v1/admin/categories
Authorization: Bearer <admin-token>

Body:
{
  "name_en": "Sports",
  "name_ar": "رياضة",
  "slug": "sports",
  "parent_id": null,
  "sort_order": 1
}
```

### Server Management

#### Create Server
```http
POST /api/v1/admin/servers
Authorization: Bearer <admin-token>

Body:
{
  "name": "Primary Server US",
  "url": "https://stream-us.example.com",
  "type": "primary",
  "priority": 10,
  "max_connections": 1000,
  "location": "United States"
}
```

#### Update Server
```http
PUT /api/v1/admin/servers/{id}
Authorization: Bearer <admin-token>

Body:
{
  "status": "maintenance",
  "current_connections": 450
}
```

### Subscription Plans

#### Create Plan
```http
POST /api/v1/admin/plans
Authorization: Bearer <admin-token>

Body:
{
  "name_en": "Premium Plan",
  "name_ar": "خطة مميزة",
  "duration_days": 90,
  "price": 79.99,
  "max_devices": 3,
  "features": {
    "channels": "all",
    "vod": true,
    "epg": true,
    "4k": true
  }
}
```

#### Assign Channels to Plan
```http
POST /api/v1/admin/plans/{id}/channels
Authorization: Bearer <admin-token>

Body:
{
  "channel_ids": [1, 2, 3, 4, 5]
}
```

---

## User Endpoints

### Get Categories
```http
GET /api/v1/categories?status=active
Authorization: Bearer <user-token>
```

### Get Channels by Category
```http
GET /api/v1/categories/{slug}/channels
Authorization: Bearer <user-token>
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Forbidden (Subscription Required)
```json
{
  "success": false,
  "message": "You need an active subscription to access this service.",
  "subscription_info": {
    "title": "Subscription Required",
    "contact": "For subscription inquiries, please contact:",
    "email": "info@paxdes.com",
    "plans": {
      "weekly": "Weekly Plan - 7 days",
      "monthly": "Monthly Plan - 30 days",
      "yearly": "Yearly Plan - 365 days"
    },
    "payment_methods": "Payment Methods: Credit Card, Bank Transfer, PayPal"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Rate Limits

- **Login endpoints:** 5 requests per 15 minutes
- **API endpoints:** 100 requests per 15 minutes
- **Stream endpoints:** 30 requests per minute

---

## Language Support

Add `Accept-Language` header:
- `en` for English
- `ar` for Arabic

```http
Accept-Language: ar
```

All responses with bilingual fields will return data in the requested language.

---

## Device Binding

Include device identification headers:

```http
X-Device-ID: unique-device-identifier
X-MAC-Address: 00:11:22:33:44:55
```

System enforces max device limits per user subscription.

---

## Notes

1. All timestamps are in ISO 8601 format
2. Pagination uses `page` and `limit` query parameters
3. Default pagination: page=1, limit=20
4. All endpoints return JSON except M3U playlist and CSV exports
5. Stream URLs should be added manually through admin panel
6. No default content or streams are included in the system
