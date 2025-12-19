# IPTV App Testing Guide

## Xtream Codes API Compatibility

PrimeX IPTV is fully compatible with all standard IPTV applications that support Xtream Codes API.

---

## Supported IPTV Apps

### Android/Android TV
- ✅ IPTV Smarters Pro
- ✅ TiviMate
- ✅ XCIPTV
- ✅ GSE Smart IPTV
- ✅ Perfect Player
- ✅ OTT Navigator
- ✅ Kodi (with Xtream plugin)

### iOS/Apple TV
- ✅ IPTV Smarters Pro
- ✅ GSE Smart IPTV
- ✅ iPlayTV

### Smart TV
- ✅ Smart IPTV
- ✅ SS IPTV
- ✅ IPTV Smarters (Samsung/LG)

### Windows/Mac
- ✅ VLC Media Player (M3U)
- ✅ Perfect Player
- ✅ IPTV Smarters

---

## Login Credentials Format

### For Xtream Codes API:
```
Server URL: https://prime-x.live
Username: [user's username]
Password: [user's password]
```

### For M3U Playlist:
```
M3U URL: https://prime-x.live/get.php?username=[username]&password=[password]
```

---

## Testing Steps

### 1. Create Test User in Admin Panel

1. Login to admin panel: `https://prime-x.live/admin/login.html`
2. Navigate to **User Management**
3. Click **Add User**
4. Fill in:
   - Username: `testuser`
   - Password: `testpass123`
   - Email: `test@example.com`
   - Subscription Plan: Select any active plan
5. Click **Create User**

### 2. Test with IPTV Smarters Pro (Recommended)

**Download:**
- Android: Google Play Store
- iOS: App Store
- Android TV: Google Play Store

**Setup:**
1. Open IPTV Smarters Pro
2. Select **Login with Xtream Codes API**
3. Enter:
   - Server URL: `https://prime-x.live`
   - Username: `testuser`
   - Password: `testpass123`
4. Click **Add User**

**Expected Result:**
- ✅ Login successful
- ✅ Categories load
- ✅ Channels display
- ✅ Streams play

### 3. Test with TiviMate

**Setup:**
1. Open TiviMate
2. Click **Add Playlist**
3. Select **Xtream Codes**
4. Enter:
   - Name: `PrimeX IPTV`
   - Server: `https://prime-x.live`
   - Username: `testuser`
   - Password: `testpass123`
5. Click **Next**

**Expected Result:**
- ✅ Playlist added
- ✅ EPG loads (if configured)
- ✅ Channels available

### 4. Test with M3U URL

**For VLC or any M3U player:**
```
https://prime-x.live/get.php?username=testuser&password=testpass123
```

**Expected Result:**
- ✅ M3U playlist downloads
- ✅ Contains all channels
- ✅ Streams are accessible

---

## API Endpoints

### Player API (Main Endpoint)
```
GET https://prime-x.live/player_api.php?username={user}&password={pass}
```

**Returns user info:**
```json
{
  "user_info": {
    "username": "testuser",
    "password": "testpass123",
    "auth": 1,
    "status": "Active",
    "exp_date": "1735689600",
    "is_trial": "0",
    "active_cons": "0",
    "created_at": "1704067200",
    "max_connections": "1"
  },
  "server_info": {
    "url": "https://prime-x.live",
    "port": "443",
    "https_port": "443",
    "server_protocol": "https",
    "timestamp_now": 1704153600
  }
}
```

### Get Live Categories
```
GET https://prime-x.live/player_api.php?username={user}&password={pass}&action=get_live_categories
```

### Get Live Streams
```
GET https://prime-x.live/player_api.php?username={user}&password={pass}&action=get_live_streams
```

### Stream URL Format
```
https://prime-x.live/live/{username}/{password}/{stream_id}.m3u8
```

### M3U Playlist
```
GET https://prime-x.live/get.php?username={user}&password={pass}
```

---

## Troubleshooting

### Login Fails (Auth: 0)

**Possible causes:**
1. Wrong username/password
2. User account inactive
3. Subscription expired

**Check in admin panel:**
- User status is "Active"
- Subscription end date is in the future
- Password is correct

### No Channels Display

**Possible causes:**
1. No channels added to system
2. No categories assigned to user
3. Channels not assigned to categories

**Fix:**
1. Add channels in **Channels** module
2. Assign channels to categories
3. Ensure user has access to categories

### Streams Don't Play

**Possible causes:**
1. Invalid stream URL
2. Stream source offline
3. Device limit reached

**Check:**
- Stream URL is valid and accessible
- Test stream URL directly in VLC
- Check device count in admin panel

### "Subscription Expired" Message

**Fix:**
1. Go to **User Management**
2. Find the user
3. Click **Extend Subscription**
4. Add more days

---

## Device Management

### Check Active Devices
1. Go to **Devices & Connections** in admin panel
2. View all connected devices
3. See last activity time

### Kick Device
1. Find device in list
2. Click **Kick** button
3. Device will be disconnected

### Device Limit
- Set in subscription plan
- Can be overridden per user
- Enforced automatically by system

---

## Subscription Status

### Active
- User can login
- Streams accessible
- Full functionality

### Expired
- Login returns "Subscription expired"
- No stream access
- Must extend subscription

### Suspended
- Login blocked
- Admin can reactivate

---

## Testing Checklist

### Basic Functionality
- [ ] User can login with Xtream API
- [ ] Categories load correctly
- [ ] Channels display in app
- [ ] Streams play without buffering
- [ ] EPG data loads (if configured)

### Subscription Management
- [ ] New user gets correct expiry date
- [ ] Expired users cannot login
- [ ] Extended subscriptions work
- [ ] Device limits enforced

### Multi-Device
- [ ] User can login on multiple devices (within limit)
- [ ] Exceeding device limit blocks new connections
- [ ] Kicked devices cannot reconnect immediately

### M3U Playlist
- [ ] M3U URL generates correctly
- [ ] Playlist contains all channels
- [ ] Streams work in VLC/other players

---

## Production Deployment

### Before Going Live:

1. **Set Correct API Base URL**
   - Admin Panel → API / Xtream Settings
   - Set to: `https://prime-x.live`
   - Save changes

2. **Add Real Channels**
   - Import M3U playlist
   - Or add channels manually
   - Assign to categories

3. **Create Subscription Plans**
   - Define pricing
   - Set durations
   - Set device limits

4. **Test with Real IPTV App**
   - Create test user
   - Login on actual device
   - Verify everything works

5. **Monitor Logs**
   - Check PM2 logs for errors
   - Monitor device connections
   - Track subscription expirations

---

## Support

**Common Issues:**
- Wrong credentials → Check username/password
- No channels → Add channels in admin panel
- Expired subscription → Extend in user management
- Device limit → Increase in plan or user settings

**For Technical Support:**
- Check PM2 logs: `pm2 logs primex-iptv`
- Check database: Verify user exists and is active
- Test API: Use curl to test endpoints

---

**System:** PrimeX IPTV v11.0  
**API:** Xtream Codes Compatible  
**Developer:** PAX
