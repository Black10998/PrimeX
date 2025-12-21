# Android TV App Integration Guide

## Overview

This document explains how the Android TV app integrates with your PrimeX backend and provides a complete testing workflow.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Android TV    │         │  PrimeX Backend  │         │   Database  │
│      App        │◄───────►│   (Node.js)      │◄───────►│  (SQLite)   │
└─────────────────┘         └──────────────────┘         └─────────────┘
        │                            │
        │                            │
        ├─ Device Registration       ├─ POST /api/v1/device/register
        ├─ Status Polling (5s)       ├─ GET /api/v1/device/status
        ├─ Content Loading           ├─ Returns channels + VOD
        └─ Video Playback            └─ Stream URLs from database
```

## Integration Points

### 1. Device Registration

**Android TV App:**
```kotlin
// ActivationActivity.kt
val macAddress = DeviceUtils.getMacAddress(context)
val request = DeviceRegistrationRequest(macAddress)
val response = ApiClient.apiService.registerDevice(request)
// Displays: device_key (8 digits)
```

**Backend Endpoint:**
```javascript
// POST /api/v1/device/register
// Controller: deviceActivation4KController.registerDevice()
// Database: INSERT INTO device_activations
// Response: { device_key: "12345678", status: "pending" }
```

**Database:**
```sql
-- Table: device_activations
device_key: "12345678"
mac_address: "AA:BB:CC:DD:EE:FF"
status: "pending"
created_at: NOW()
```

### 2. Admin Activation

**Admin Panel:**
```javascript
// public/admin/js/device-activation-4k.js
// User clicks "Activate" button
POST /api/v1/admin/device/activate
Body: {
  device_key: "12345678",
  subscription_plan_id: 1
}
```

**Backend Processing:**
```javascript
// deviceActivation4KController.activateDevice()
// 1. Validate device exists
// 2. Check subscription plan
// 3. Update device status to "active"
// 4. Set expiration date
// 5. Log activation history
```

**Database Update:**
```sql
UPDATE device_activations
SET status = 'active',
    subscription_plan_id = 1,
    activated_at = NOW(),
    expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE device_key = '12345678'
```

### 3. Status Polling

**Android TV App:**
```kotlin
// ActivationActivity.kt - Polls every 5 seconds
val response = ApiClient.apiService.checkDeviceStatus(deviceKey, macAddress)
when (response.status) {
    "active" -> navigateToMainScreen()
    "pending" -> continuePolling()
    "expired" -> showError()
}
```

**Backend Endpoint:**
```javascript
// GET /api/v1/device/status?device_key=X&mac_address=Y
// Controller: deviceActivation4KController.checkDeviceStatus()
// Returns:
{
  status: "active",
  subscription: { plan_name, expires_at },
  channels: [...],
  vod: { movies: [...], series: [...] }
}
```

### 4. Content Loading

**Android TV App:**
```kotlin
// MainFragment.kt
val statusResponse = ApiClient.apiService.checkDeviceStatus(deviceKey, macAddress)
channels.addAll(statusResponse.channels)
movies.addAll(statusResponse.vod.movies)
series.addAll(statusResponse.vod.series)
setupRows() // Display in Leanback UI
```

**Backend Data:**
```javascript
// Channels from: channels table
// Movies from: vod_content table (type='movie')
// Series from: vod_content table (type='series')
```

### 5. Video Playback

**Android TV App:**
```kotlin
// PlayerActivity.kt
val mediaItem = MediaItem.fromUri(streamUrl)
exoPlayer.setMediaItem(mediaItem)
exoPlayer.prepare()
exoPlayer.play()
```

**Stream URLs:**
- From database: `channels.stream_url` or `vod_content.stream_url`
- Formats supported: HLS (.m3u8), DASH (.mpd)
- Direct HTTP streams also supported

## Complete Testing Workflow

### Phase 1: Backend Verification

```bash
# 1. Start backend server
cd /workspaces/PrimeX
npm start

# 2. Verify device registration endpoint
curl -X POST http://localhost:3000/api/v1/device/register \
  -H "Content-Type: application/json" \
  -d '{"mac_address":"AA:BB:CC:DD:EE:FF"}'

# Expected response:
# {"device_key":"12345678","status":"pending","message":"Device registered"}

# 3. Verify status endpoint
curl "http://localhost:3000/api/v1/device/status?device_key=12345678&mac_address=AA:BB:CC:DD:EE:FF"

# Expected response (pending):
# {"status":"pending","device_key":"12345678"}

# 4. Check admin panel
# Open: http://localhost:3000/admin/device-activation-4k.html
# Verify device appears in pending list
```

### Phase 2: Database Verification

```bash
# Check device was registered
sqlite3 data/primex.db "SELECT * FROM device_activations WHERE device_key='12345678';"

# Check subscription plans exist
sqlite3 data/primex.db "SELECT * FROM subscription_plans;"

# Check channels exist
sqlite3 data/primex.db "SELECT COUNT(*) FROM channels WHERE is_active=1;"

# Check VOD content exists
sqlite3 data/primex.db "SELECT COUNT(*) FROM vod_content WHERE is_active=1;"
```

### Phase 3: Android TV App Build

```bash
# 1. Configure server URL
cd /workspaces/PrimeX/android-tv-app
nano app/build.gradle
# Edit line 14: buildConfigField "String", "API_BASE_URL", "\"http://YOUR_IP:3000/api/v1/\""

# 2. Build APK
./gradlew assembleDebug

# 3. Verify APK created
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

### Phase 4: Installation & Testing

```bash
# 1. Enable ADB on Android TV
# Settings > Device Preferences > About > Build (click 7 times)
# Settings > Device Preferences > Developer Options > USB Debugging (ON)

# 2. Connect via ADB
adb connect <TV_IP_ADDRESS>:5555
adb devices

# 3. Install APK
adb install app/build/outputs/apk/debug/app-debug.apk

# 4. Launch app
adb shell am start -n com.primex.iptv/.ui.MainActivity

# 5. Monitor logs
adb logcat | grep -i primex
```

### Phase 5: Activation Testing

**On Android TV:**
1. App launches → Shows activation screen
2. Displays 8-digit code (e.g., "12345678")
3. Shows "Waiting for activation..." message
4. Polls server every 5 seconds

**In Admin Panel:**
1. Open http://YOUR_SERVER:3000/admin/device-activation-4k.html
2. See device in "Pending Devices" list
3. Click "Activate" button
4. Select subscription plan
5. Confirm activation

**Back on Android TV:**
1. Within 5 seconds, app detects activation
2. Shows "Activation successful!" message
3. Automatically navigates to main screen
4. Content loads (channels, movies, series)

### Phase 6: Content Testing

**Live TV:**
1. Navigate to "Live TV" row
2. Select a channel
3. Video should start playing
4. Test playback controls (pause, play, seek)
5. Press back to return to main screen

**Movies:**
1. Navigate to "Movies" row
2. Select a movie
3. Video should start playing
4. Verify poster artwork displays

**Series:**
1. Navigate to "Series" row
2. Select a series
3. Details screen should open
4. Select an episode
5. Video should start playing

## Troubleshooting Integration Issues

### Issue: Device registration fails

**Check:**
```bash
# Backend logs
npm start # Look for errors

# Test endpoint directly
curl -X POST http://localhost:3000/api/v1/device/register \
  -H "Content-Type: application/json" \
  -d '{"mac_address":"TEST"}'

# Check route mounting
grep -r "deviceActivation4K" src/routes/
```

**Solution:**
- Verify route is mounted in `src/routes/index.js`
- Check controller exists: `src/controllers/deviceActivation4KController.js`
- Verify database table exists: `device_activations`

### Issue: Status polling returns pending forever

**Check:**
```bash
# Check device in database
sqlite3 data/primex.db "SELECT * FROM device_activations WHERE device_key='12345678';"

# Verify status is 'active'
# If still 'pending', activation didn't work
```

**Solution:**
- Activate device in admin panel
- Check admin panel console for errors
- Verify subscription plan exists
- Check backend logs during activation

### Issue: Content not loading

**Check:**
```bash
# Verify channels exist
sqlite3 data/primex.db "SELECT COUNT(*) FROM channels WHERE is_active=1;"

# Verify VOD exists
sqlite3 data/primex.db "SELECT COUNT(*) FROM vod_content WHERE is_active=1;"

# Test status endpoint
curl "http://localhost:3000/api/v1/device/status?device_key=12345678&mac_address=AA:BB:CC:DD:EE:FF"
```

**Solution:**
- Import channels via admin panel
- Import VOD content via admin panel
- Verify device status is "active"
- Check subscription hasn't expired

### Issue: Video won't play

**Check:**
```bash
# Test stream URL directly
curl -I "http://example.com/stream.m3u8"

# Should return 200 OK

# Test in VLC
vlc "http://example.com/stream.m3u8"
```

**Solution:**
- Verify stream URL is accessible
- Check stream format (HLS/DASH)
- Ensure no CORS issues
- Test stream on different network
- Check ExoPlayer logs: `adb logcat | grep ExoPlayer`

### Issue: App crashes on launch

**Check:**
```bash
# View crash logs
adb logcat | grep -i "androidruntime"

# Common issues:
# - Server URL not configured
# - Network permission missing
# - Invalid API response format
```

**Solution:**
- Configure server URL in build.gradle
- Verify AndroidManifest.xml has INTERNET permission
- Check API response format matches models
- Rebuild and reinstall APK

## API Response Examples

### Device Registration Response
```json
{
  "device_key": "12345678",
  "status": "pending",
  "message": "Device registered successfully"
}
```

### Device Status Response (Pending)
```json
{
  "status": "pending",
  "device_key": "12345678"
}
```

### Device Status Response (Active)
```json
{
  "status": "active",
  "device_key": "12345678",
  "subscription": {
    "plan_name": "Premium",
    "expires_at": "2024-12-31T23:59:59.000Z",
    "max_connections": 3,
    "features": {
      "live_tv": true,
      "vod": true,
      "series": true,
      "catchup": false
    }
  },
  "channels": [
    {
      "id": 1,
      "name": "Channel 1",
      "stream_url": "http://example.com/stream.m3u8",
      "logo_url": "http://example.com/logo.png",
      "category": "Entertainment",
      "is_active": true
    }
  ],
  "vod": {
    "movies": [
      {
        "id": 1,
        "title": "Movie Title",
        "stream_url": "http://example.com/movie.m3u8",
        "poster_url": "http://example.com/poster.jpg",
        "year": 2024,
        "rating": 8.5,
        "duration": 120
      }
    ],
    "series": [
      {
        "id": 1,
        "title": "Series Title",
        "poster_url": "http://example.com/poster.jpg",
        "seasons_count": 3
      }
    ]
  }
}
```

## Performance Considerations

### Polling Frequency
- Current: 5 seconds
- Adjust in `ActivationActivity.kt`: `POLLING_INTERVAL`
- Lower = faster detection, higher server load
- Higher = slower detection, lower server load

### Content Caching
- Device credentials cached locally
- Content refreshed on app resume
- Implement proper cache invalidation for production

### Network Optimization
- Use connection pooling (already configured in OkHttp)
- Implement retry logic for failed requests
- Consider pagination for large content lists

## Security Checklist

- [ ] Use HTTPS in production (configure in build.gradle)
- [ ] Validate MAC addresses on backend
- [ ] Implement rate limiting on registration endpoint
- [ ] Sign APK with release keystore
- [ ] Enable ProGuard for release builds
- [ ] Secure admin panel with authentication
- [ ] Use environment variables for sensitive config
- [ ] Implement device limit per subscription
- [ ] Add session management
- [ ] Log security events

## Production Deployment Checklist

### Backend
- [ ] Server running on production domain
- [ ] HTTPS configured with valid SSL certificate
- [ ] Database backed up regularly
- [ ] Monitoring and logging enabled
- [ ] Rate limiting configured
- [ ] Admin panel secured

### Android TV App
- [ ] Production server URL configured
- [ ] APK signed with release keystore
- [ ] ProGuard enabled
- [ ] Tested on multiple TV devices
- [ ] Error handling verified
- [ ] Performance optimized

### Testing
- [ ] End-to-end activation flow tested
- [ ] All content types play successfully
- [ ] Error scenarios handled gracefully
- [ ] Network interruption recovery tested
- [ ] Multiple device activations tested
- [ ] Subscription expiration tested

## Support & Monitoring

### Logs to Monitor

**Backend:**
```bash
# Device registrations
grep "Device registered" logs/app.log

# Activations
grep "Device activated" logs/app.log

# Errors
grep "ERROR" logs/app.log
```

**Android TV:**
```bash
# App logs
adb logcat | grep PrimeX

# Network requests
adb logcat | grep OkHttp

# Player errors
adb logcat | grep ExoPlayer
```

### Metrics to Track

- Device registration rate
- Activation success rate
- Average time to activation
- Content playback success rate
- Error frequency by type
- Active device count
- Subscription expiration rate

## Next Steps

1. ✅ Backend device activation implemented
2. ✅ Android TV app created
3. ⏳ Configure server URL in app
4. ⏳ Build and test APK
5. ⏳ Deploy to production
6. ⏳ Monitor and optimize

## Resources

- **Backend Code**: `/workspaces/PrimeX/src/`
- **Android App**: `/workspaces/PrimeX/android-tv-app/`
- **Admin Panel**: `/workspaces/PrimeX/public/admin/`
- **Documentation**: `README.md` files in each directory

---

**Integration Status**: ✅ Complete and Ready for Testing

For detailed app documentation, see: `android-tv-app/README.md`
For quick start guide, see: `android-tv-app/QUICK_START.md`
