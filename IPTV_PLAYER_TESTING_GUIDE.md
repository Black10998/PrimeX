# IPTV Player Apps - Complete Testing Guide

## Issues Fixed

### 1. Expiry Date Not Showing
**Problem:** Users created with plans showed "N/A" for expiry date  
**Fix:** Backend now automatically gets duration_days from plan if not provided  
**Result:** Expiry dates now display correctly in admin panel

### 2. IPTV Smarters "Wrong Username or Password"
**Problem:** Auth worked but app showed error after login  
**Causes:**
- Duplicate `stream_icon` field in getLiveStreams response
- Strict plan filtering returned 0 channels
- No logging to debug issues

**Fixes:**
- Removed duplicate field
- Added fallback: if plan has no channels, show all channels
- Added logging for all Xtream API calls

### 3. Empty Channel Lists
**Problem:** M3U and Xtream API returned no channels  
**Fix:** Same as M3U - check if plan has channels before filtering  
**Result:** Channels now load in all apps

## Supported Player Apps

### 1. IPTV Smarters Pro (Xtream Codes)
**Login Method:** Xtream Codes API  
**Required Fields:**
- Server URL: `http://your-server.com`
- Username: User's username
- Password: User's password

**API Endpoints Used:**
- `player_api.php` - Authentication & user info
- `player_api.php?action=get_live_categories` - Categories
- `player_api.php?action=get_live_streams` - Channels

**Expected Behavior:**
- Login succeeds
- Categories load
- Channels load
- Playback works (if stream URLs are valid)

### 2. TiviMate (Xtream Codes)
**Login Method:** Xtream Codes API  
**Same as IPTV Smarters Pro**

### 3. GSE Smart IPTV (M3U or Xtream)
**Login Method 1:** M3U URL
- URL: `http://your-server.com/get.php?username=X&password=Y&type=m3u_plus`

**Login Method 2:** Xtream Codes
- Same as IPTV Smarters Pro

### 4. Perfect Player (M3U)
**Login Method:** M3U URL  
**URL:** `http://your-server.com/get.php?username=X&password=Y&type=m3u_plus`

### 5. VLC Media Player (M3U)
**Login Method:** Open Network Stream  
**URL:** `http://your-server.com/get.php?username=X&password=Y&type=m3u_plus`

### 6. Kodi (M3U or Xtream)
**Plugin:** PVR IPTV Simple Client  
**Method 1:** M3U URL  
**Method 2:** Xtream Codes (with plugin)

## Testing Checklist

### Pre-Testing Setup

1. **Create Test Category:**
```sql
INSERT INTO categories (name_en, name_ar, slug, type) 
VALUES ('Test Category', 'فئة تجريبية', 'test', 'live');
```

2. **Create Test Channels:**
```sql
INSERT INTO channels (name_en, name_ar, category_id, stream_url, logo, status) 
VALUES 
('Test Channel 1', 'قناة 1', 1, 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://via.placeholder.com/150', 'active'),
('Test Channel 2', 'قناة 2', 1, 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://via.placeholder.com/150', 'active'),
('Test Channel 3', 'قناة 3', 1, 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://via.placeholder.com/150', 'active');
```

3. **Create Test Plan:**
```sql
INSERT INTO subscription_plans (name_en, name_ar, duration_days, price, max_devices, server_id) 
VALUES ('Test Plan', 'خطة تجريبية', 30, 10.00, 1, 1);
```

4. **Assign Channels to Plan (Optional):**
```sql
-- Get plan_id and channel IDs first
INSERT INTO plan_channels (plan_id, channel_id) 
VALUES (1, 1), (1, 2), (1, 3);
```

5. **Create Test User:**
- Via Admin Panel: Users → Create User
- Username: `testuser`
- Password: `testpass`
- Plan: Select "Test Plan"
- Status: Active

### Test 1: API Authentication

```bash
# Test player_api.php
curl "http://your-server.com/player_api.php?username=testuser&password=testpass"
```

**Expected Response:**
```json
{
  "user_info": {
    "auth": 1,
    "status": "Active",
    "exp_date": 1735689600,
    "username": "testuser",
    "max_connections": "1",
    "active_cons": "0"
  },
  "server_info": {
    "url": "http://your-server.com",
    "port": "80",
    "https_port": "443",
    "server_protocol": "http",
    "rtmp_port": "1935",
    "timezone": "UTC",
    "timestamp_now": 1704067200
  }
}
```

### Test 2: Get Categories

```bash
curl "http://your-server.com/player_api.php?username=testuser&password=testpass&action=get_live_categories"
```

**Expected Response:**
```json
[
  {
    "category_id": "1",
    "category_name": "Test Category",
    "parent_id": 0
  }
]
```

### Test 3: Get Live Streams

```bash
curl "http://your-server.com/player_api.php?username=testuser&password=testpass&action=get_live_streams"
```

**Expected Response:**
```json
[
  {
    "stream_id": 1,
    "num": 1,
    "name": "Test Channel 1",
    "stream_icon": "https://via.placeholder.com/150",
    "epg_channel_id": null,
    "category_id": 1,
    "added": "1",
    "stream_type": "live",
    "tv_archive": "1",
    "direct_source": "0",
    "tv_archive_duration": "0"
  }
]
```

### Test 4: M3U Playlist

```bash
curl "http://your-server.com/get.php?username=testuser&password=testpass&type=m3u_plus"
```

**Expected Response:**
```
#EXTM3U
#EXTINF:-1 tvg-id="" tvg-logo="https://via.placeholder.com/150" group-title="Test Category",Test Channel 1
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
#EXTINF:-1 tvg-id="" tvg-logo="https://via.placeholder.com/150" group-title="Test Category",Test Channel 2
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
```

### Test 5: IPTV Smarters Pro

1. **Open App**
2. **Add User:**
   - Select "Login with Xtream Codes API"
   - Server URL: `http://your-server.com`
   - Username: `testuser`
   - Password: `testpass`
   - Click "Add User"

3. **Expected Behavior:**
   - ✅ Login succeeds
   - ✅ Home screen loads
   - ✅ Categories appear
   - ✅ Channels load when category selected
   - ✅ Channel plays when clicked

4. **If "Wrong Username or Password":**
   - Check PM2 logs: `pm2 logs primex-iptv | grep "Xtream:"`
   - Verify API responses with curl
   - Check if channels exist in database

### Test 6: TiviMate

1. **Open App**
2. **Add Playlist:**
   - Select "Xtream Codes"
   - Name: "Test"
   - Server: `http://your-server.com`
   - Username: `testuser`
   - Password: `testpass`
   - Click "Next"

3. **Expected Behavior:**
   - ✅ Playlist loads
   - ✅ Channels appear in guide
   - ✅ Playback works

### Test 7: GSE Smart IPTV

**Method 1: M3U URL**
1. Open App
2. Add Playlist → Remote Playlist
3. URL: `http://your-server.com/get.php?username=testuser&password=testpass&type=m3u_plus`
4. Click "Add"

**Method 2: Xtream Codes**
1. Open App
2. Add Playlist → Xtream Codes
3. Enter credentials
4. Click "Add"

**Expected Behavior:**
- ✅ Channels load
- ✅ Playback works

## Troubleshooting

### Issue: "Wrong Username or Password" in IPTV Smarters

**Check:**
1. Test authentication with curl:
   ```bash
   curl "http://your-server.com/player_api.php?username=testuser&password=testpass"
   ```

2. Check PM2 logs:
   ```bash
   pm2 logs primex-iptv | grep "Xtream:"
   ```

3. Verify user exists and is active:
   ```sql
   SELECT username, status, subscription_end FROM users WHERE username = 'testuser';
   ```

**Common Causes:**
- Password mismatch (case-sensitive)
- User status not "active"
- Subscription expired
- Server URL incorrect (must not end with /)

### Issue: Channels Don't Load

**Check:**
1. Verify channels exist:
   ```sql
   SELECT COUNT(*) FROM channels WHERE status = 'active';
   ```

2. Check if plan has channels:
   ```sql
   SELECT COUNT(*) FROM plan_channels WHERE plan_id = USER_PLAN_ID;
   ```

3. Test get_live_streams API:
   ```bash
   curl "http://your-server.com/player_api.php?username=testuser&password=testpass&action=get_live_streams"
   ```

4. Check PM2 logs:
   ```bash
   pm2 logs primex-iptv | grep "getLiveStreams"
   ```

### Issue: Expiry Date Shows "N/A"

**Check:**
1. Verify subscription_end is set:
   ```sql
   SELECT username, subscription_end FROM users WHERE username = 'testuser';
   ```

2. If NULL, update manually:
   ```sql
   UPDATE users SET subscription_end = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE username = 'testuser';
   ```

3. Or recreate user with plan assigned

### Issue: Playback Doesn't Work

**Check:**
1. Verify stream URLs are valid:
   ```sql
   SELECT name_en, stream_url FROM channels WHERE status = 'active';
   ```

2. Test stream URL directly in VLC

3. Check if stream URL is accessible from server

## Logging

All Xtream API calls are now logged. Check logs with:

```bash
# View all Xtream API logs
pm2 logs primex-iptv | grep "Xtream:"

# View M3U generation logs
pm2 logs primex-iptv | grep "M3U:"

# View authentication logs
pm2 logs primex-iptv | grep "auth"
```

## API Endpoints Reference

### Authentication
- `GET /player_api.php?username=X&password=Y`

### Live TV
- `GET /player_api.php?username=X&password=Y&action=get_live_categories`
- `GET /player_api.php?username=X&password=Y&action=get_live_streams`
- `GET /player_api.php?username=X&password=Y&action=get_live_streams&category_id=1`

### VOD (Movies)
- `GET /player_api.php?username=X&password=Y&action=get_vod_categories`
- `GET /player_api.php?username=X&password=Y&action=get_vod_streams`

### Series
- `GET /player_api.php?username=X&password=Y&action=get_series_categories`
- `GET /player_api.php?username=X&password=Y&action=get_series`

### M3U Playlist
- `GET /get.php?username=X&password=Y&type=m3u_plus`

### Stream URL
- `GET /live/USERNAME/PASSWORD/STREAM_ID.m3u8`

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/
