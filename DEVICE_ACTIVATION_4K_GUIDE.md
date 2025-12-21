# 4K Player-Style Device Activation Guide

## Overview

This implements industry-standard device activation flow matching 4K Player, IPTV Smarters, and similar apps.

## How It Works

### Flow Diagram

```
TV App                  Backend                 Admin Panel
  |                       |                         |
  |-- Register Device --->|                         |
  |   (MAC + Device Key)  |                         |
  |                       |-- Store (pending) ----->|
  |<-- Device Key --------|                         |
  |                       |                         |
  | Display Key on TV     |                         |
  |                       |                         |
  |                       |<-- Activate Device -----|
  |                       |   (Key + Plan)          |
  |                       |-- Update (active) ----->|
  |                       |                         |
  |-- Poll Status ------->|                         |
  |<-- Active + Content --|                         |
  |                       |                         |
  | Auto-load Channels    |                         |
```

### Step-by-Step

**1. TV App First Launch:**
- Generates 8-digit Device Key (e.g., `61324637`)
- Reads MAC Address
- Calls: `POST /api/v1/device/register`
- Displays Device Key + MAC on TV screen
- Status: `pending`

**2. Admin Panel Activation:**
- Admin opens "Device Activation"
- Sees pending devices with Device Keys
- Enters Device Key
- Selects Subscription Plan
- Clicks "Activate"
- Status changes to: `active`

**3. TV App Auto-Activation:**
- TV app polls: `GET /api/v1/device/status`
- Detects status change to `active`
- Receives content access info
- Auto-loads channels and VOD
- Starts playback immediately

## API Endpoints

### TV App Endpoints (Public)

#### 1. Register Device
```http
POST /api/v1/device/register
Content-Type: application/json

{
  "mac_address": "00:1A:2B:3C:4D:5E",
  "device_info": {
    "model": "Samsung Smart TV",
    "os": "Tizen 6.0",
    "app_version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "device_key": "61324637",
    "status": "pending",
    "message": "Device registered successfully"
  }
}
```

#### 2. Check Activation Status
```http
GET /api/v1/device/status?device_key=61324637&mac_address=00:1A:2B:3C:4D:5E
```

**Response (Pending):**
```json
{
  "success": true,
  "data": {
    "device_key": "61324637",
    "status": "pending",
    "expires_at": null,
    "plan_name": null
  }
}
```

**Response (Active):**
```json
{
  "success": true,
  "data": {
    "device_key": "61324637",
    "status": "active",
    "expires_at": "2025-01-20T00:00:00.000Z",
    "plan_name": "Premium Monthly",
    "content_access": {
      "channels": "all",
      "vod": "all",
      "max_connections": 1
    }
  }
}
```

### Admin Panel Endpoints (Protected)

#### 3. Activate Device
```http
POST /api/v1/admin/device/activate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "device_key": "61324637",
  "subscription_plan_id": 1,
  "duration_days": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "device_key": "61324637",
    "mac_address": "00:1A:2B:3C:4D:5E",
    "status": "active",
    "plan_name": "Premium Monthly",
    "expires_at": "2025-01-20T00:00:00.000Z",
    "message": "Device activated successfully"
  }
}
```

#### 4. Get Pending Devices
```http
GET /api/v1/admin/device/pending
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_key": "61324637",
      "mac_address": "00:1A:2B:3C:4D:5E",
      "status": "pending",
      "created_at": "2025-12-20T10:30:00.000Z",
      "last_check_at": "2025-12-20T10:35:00.000Z",
      "check_count": 5,
      "last_ip": "192.168.1.100"
    }
  ]
}
```

#### 5. Get All Devices
```http
GET /api/v1/admin/device/all?status=active&page=1&limit=50
Authorization: Bearer {admin_token}
```

## Database Schema

### device_activations Table
```sql
- id (INT, PK)
- device_key (VARCHAR(20), UNIQUE) - 8-digit code
- mac_address (VARCHAR(17)) - Device MAC
- device_info (JSON) - Device details
- status (ENUM: pending, active, expired, suspended)
- subscription_plan_id (INT, FK)
- activated_by (INT) - Admin user ID
- activated_at (DATETIME)
- expires_at (DATETIME)
- max_connections (INT)
- allowed_channels (JSON)
- allowed_vod (JSON)
- last_check_at (DATETIME)
- last_ip (VARCHAR(45))
- check_count (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### device_activation_history Table
```sql
- id (INT, PK)
- device_activation_id (INT, FK)
- action (ENUM: registered, activated, renewed, suspended, expired)
- performed_by (INT) - Admin user ID
- details (JSON)
- ip_address (VARCHAR(45))
- created_at (TIMESTAMP)
```

## TV App Implementation

### Registration (First Launch)

```javascript
async function registerDevice() {
  const macAddress = await getDeviceMacAddress();
  const deviceInfo = {
    model: getDeviceModel(),
    os: getDeviceOS(),
    app_version: "1.0.0"
  };

  const response = await fetch('https://your-server.com/api/v1/device/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mac_address: macAddress,
      device_info: deviceInfo
    })
  });

  const result = await response.json();
  
  if (result.success) {
    const deviceKey = result.data.device_key;
    
    // Display on TV screen
    showActivationScreen(deviceKey, macAddress);
    
    // Start polling for activation
    startPolling(deviceKey, macAddress);
  }
}
```

### Status Polling

```javascript
async function checkActivationStatus(deviceKey, macAddress) {
  const response = await fetch(
    `https://your-server.com/api/v1/device/status?device_key=${deviceKey}&mac_address=${macAddress}`
  );

  const result = await response.json();
  
  if (result.success && result.data.status === 'active') {
    // Device activated!
    const contentAccess = result.data.content_access;
    
    // Load channels and VOD
    await loadContent(contentAccess);
    
    // Navigate to main screen
    navigateToHome();
    
    return true;
  }
  
  return false;
}

function startPolling(deviceKey, macAddress) {
  const pollInterval = setInterval(async () => {
    const activated = await checkActivationStatus(deviceKey, macAddress);
    
    if (activated) {
      clearInterval(pollInterval);
    }
  }, 5000); // Poll every 5 seconds
}
```

## Admin Panel Usage

### Activating a Device

1. **Open Device Activation:**
   - Click "Device Activation" in sidebar
   - See list of pending devices

2. **View Pending Device:**
   - Device Key displayed prominently
   - MAC Address shown
   - Last check time
   - Number of status checks

3. **Activate:**
   - Click "Activate Now" on device card
   - OR click "Activate Device" button and enter key
   - Select Subscription Plan
   - Duration auto-fills from plan
   - Click "Activate Device"

4. **Confirmation:**
   - Success notification
   - Device removed from pending list
   - TV app auto-loads content

### Auto-Refresh

- Pending devices list auto-refreshes every 30 seconds
- Shows real-time status of devices checking in
- No manual refresh needed

## Deployment

### Step 1: Pull Changes
```bash
git pull origin main
```

### Step 2: Restart PM2
```bash
pm2 restart primex-iptv
```

### Step 3: Verify Tables Created
Check PM2 logs:
```bash
pm2 logs primex-iptv --lines 50
```

Should see:
```
📱 Initializing 4K Player-style device activation tables...
✅ Device activation tables created successfully
   - device_activations (4K Player style)
   - device_activation_history
```

### Step 4: Test in Admin Panel
1. Login to admin panel
2. Click "Device Activation"
3. Should see empty pending devices list
4. Click "Activate Device" to test modal

## Testing

### Test Device Registration
```bash
curl -X POST http://localhost:3000/api/v1/device/register \
  -H "Content-Type: application/json" \
  -d '{
    "mac_address": "00:1A:2B:3C:4D:5E",
    "device_info": {
      "model": "Test Device",
      "os": "Test OS"
    }
  }'
```

### Test Status Check
```bash
curl "http://localhost:3000/api/v1/device/status?device_key=12345678&mac_address=00:1A:2B:3C:4D:5E"
```

### Test Activation (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/admin/device/activate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_key": "12345678",
    "subscription_plan_id": 1,
    "duration_days": 30
  }'
```

## Troubleshooting

### Device Not Appearing in Pending List
- Check device registration was successful
- Verify device_activations table exists
- Check PM2 logs for errors

### Activation Fails
- Verify device_key is exactly 8 digits
- Check subscription plan exists
- Ensure admin is authenticated

### TV App Not Detecting Activation
- Verify polling is working
- Check device_key and mac_address match
- Ensure status endpoint is accessible

## Security Considerations

- Device registration is public (no auth required)
- Status check requires device_key + mac_address
- Activation requires admin authentication
- All actions logged in history table
- IP addresses tracked for audit

## Future Enhancements

Potential additions:
- Device renewal/extension
- Multi-device support per account
- Device suspension/unsuspension
- Geolocation restrictions
- Device fingerprinting
- Push notifications instead of polling

---

**Version:** 1.0  
**Date:** 2025-12-21  
**Developer:** PAX
