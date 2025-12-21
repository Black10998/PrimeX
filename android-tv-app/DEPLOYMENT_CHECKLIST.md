# Android TV App Deployment Checklist

Use this checklist to deploy your PrimeX Android TV app from development to production.

## ☐ Phase 1: Pre-Build Configuration (5 minutes)

### Server Configuration
- [ ] Determine your production server URL
- [ ] Verify server is accessible (ping, curl test)
- [ ] Confirm HTTPS is configured (recommended)
- [ ] Test device activation endpoints manually

### App Configuration
- [ ] Open `app/build.gradle`
- [ ] Update `API_BASE_URL` on line 14
  ```gradle
  buildConfigField "String", "API_BASE_URL", "\"https://your-server.com/api/v1/\""
  ```
- [ ] Verify URL ends with `/api/v1/` (trailing slash required)
- [ ] Save file

### Branding (Optional)
- [ ] Update app name in `res/values/strings.xml`
- [ ] Customize colors in `res/values/colors.xml`
- [ ] Replace app icon in `res/drawable/app_icon.xml`
- [ ] Replace TV banner in `res/drawable/app_banner.xml`

## ☐ Phase 2: Build APK (10 minutes)

### Environment Setup
- [ ] Android Studio installed (or Gradle available)
- [ ] JDK 17+ installed
- [ ] Android SDK installed (API 21-34)

### Build Process

**Option A: Android Studio**
- [ ] Open Android Studio
- [ ] File > Open > Select `android-tv-app` folder
- [ ] Wait for Gradle sync (first time: 5-10 min)
- [ ] Build > Build Bundle(s) / APK(s) > Build APK(s)
- [ ] Wait for build completion
- [ ] Note APK location: `app/build/outputs/apk/debug/app-debug.apk`

**Option B: Command Line**
```bash
- [ ] cd android-tv-app
- [ ] ./gradlew assembleDebug
- [ ] Verify: ls -lh app/build/outputs/apk/debug/app-debug.apk
```

### Build Verification
- [ ] APK file exists
- [ ] APK size is reasonable (15-25 MB typical)
- [ ] No build errors in console
- [ ] Build variant is correct (debug or release)

## ☐ Phase 3: Backend Verification (5 minutes)

### Server Status
- [ ] Backend server is running
- [ ] Database is accessible
- [ ] Admin panel loads correctly

### Endpoint Testing
```bash
# Test device registration
- [ ] curl -X POST https://your-server.com/api/v1/device/register \
       -H "Content-Type: application/json" \
       -d '{"mac_address":"TEST:MAC:ADDR"}'
# Expected: {"device_key":"12345678","status":"pending"}

# Test status check
- [ ] curl "https://your-server.com/api/v1/device/status?device_key=12345678&mac_address=TEST:MAC:ADDR"
# Expected: {"status":"pending","device_key":"12345678"}
```

### Content Verification
- [ ] At least 1 active channel exists in database
- [ ] At least 1 active movie/series exists (optional)
- [ ] Stream URLs are accessible
- [ ] Subscription plans configured

### Admin Panel
- [ ] Admin panel accessible
- [ ] Device activation page loads
- [ ] Can view pending devices
- [ ] Can activate devices

## ☐ Phase 4: Android TV Setup (5 minutes)

### Enable Developer Mode
- [ ] Go to Settings > Device Preferences > About
- [ ] Click "Build" 7 times
- [ ] "Developer mode enabled" message appears

### Enable ADB
- [ ] Go to Settings > Device Preferences > Developer Options
- [ ] Enable "USB debugging"
- [ ] Enable "Network debugging" (for wireless)

### Enable Unknown Sources
- [ ] Go to Settings > Security & Restrictions
- [ ] Enable "Unknown Sources" for installation method
  - For ADB: Enable for "ADB"
  - For File Manager: Enable for your file manager app
  - For Downloader: Enable for "Downloader"

### Network Configuration
- [ ] TV connected to same network as computer (for ADB)
- [ ] Note TV IP address (Settings > Network)
- [ ] Verify TV can access internet
- [ ] Test connectivity: ping TV_IP_ADDRESS

## ☐ Phase 5: Installation (5 minutes)

### Choose Installation Method

**Method 1: ADB (Recommended)**
```bash
- [ ] adb connect <TV_IP_ADDRESS>:5555
- [ ] adb devices  # Verify device listed
- [ ] adb install app/build/outputs/apk/debug/app-debug.apk
- [ ] Installation successful message
```

**Method 2: USB Drive**
- [ ] Copy APK to USB drive
- [ ] Safely eject USB drive
- [ ] Plug USB into Android TV
- [ ] Open file manager on TV
- [ ] Navigate to USB drive
- [ ] Click APK file
- [ ] Click "Install"
- [ ] Wait for installation

**Method 3: Downloader App**
- [ ] Install "Downloader" from Play Store on TV
- [ ] Start local web server:
  ```bash
  cd app/build/outputs/apk/debug
  python3 -m http.server 8000
  ```
- [ ] Open Downloader on TV
- [ ] Enter: `http://<YOUR_IP>:8000/app-debug.apk`
- [ ] Wait for download
- [ ] Click "Install"

### Verify Installation
- [ ] App appears in TV launcher
- [ ] App icon displays correctly
- [ ] App name is correct

## ☐ Phase 6: First Launch Testing (10 minutes)

### Launch App
- [ ] Find "PrimeX IPTV" in TV launcher
- [ ] Click to open
- [ ] App launches without crash

### Activation Screen
- [ ] Activation screen displays
- [ ] 8-digit code is visible and readable
- [ ] Code is properly formatted (e.g., "12345678")
- [ ] Instructions text is clear
- [ ] "Waiting for activation..." message shows
- [ ] No error messages

### Monitor Logs (Optional)
```bash
- [ ] adb logcat | grep -i primex
# Look for:
# - "Device registered: device_key=12345678"
# - "Status check: status=pending"
# - No error messages
```

## ☐ Phase 7: Device Activation (5 minutes)

### Admin Panel Activation
- [ ] Open admin panel in browser
- [ ] Navigate to Device Activation page
- [ ] Device appears in "Pending Devices" list
- [ ] Device key matches TV screen
- [ ] MAC address is populated
- [ ] Click "Activate" button
- [ ] Select subscription plan
- [ ] Click "Confirm" or "Activate"
- [ ] Success message appears
- [ ] Device moves to "Active Devices" list

### TV Auto-Detection
- [ ] Within 5 seconds, TV detects activation
- [ ] "Activation successful!" message shows
- [ ] App automatically navigates to main screen
- [ ] No manual intervention required

## ☐ Phase 8: Content Loading (5 minutes)

### Main Screen
- [ ] Main screen loads
- [ ] App title displays at top
- [ ] Multiple content rows visible
- [ ] Focus indicator works with remote

### Live TV Section
- [ ] "Live TV" row appears
- [ ] Channel cards display
- [ ] Channel names visible
- [ ] Channel logos display (or fallback icon)
- [ ] Can navigate through channels with D-pad

### Movies Section (if VOD exists)
- [ ] "Movies" row appears
- [ ] Movie cards display
- [ ] Movie titles visible
- [ ] Posters display (or fallback)
- [ ] Metadata shows (year, rating, duration)

### Series Section (if VOD exists)
- [ ] "Series" row appears
- [ ] Series cards display
- [ ] Series titles visible
- [ ] Posters display (or fallback)
- [ ] Season count shows

### Settings Section
- [ ] "Settings" row appears
- [ ] Settings items visible
- [ ] Can navigate to settings

## ☐ Phase 9: Playback Testing (10 minutes)

### Live TV Playback
- [ ] Select a live channel
- [ ] Player screen opens
- [ ] Video starts playing within 5 seconds
- [ ] Audio is working
- [ ] Video quality is acceptable
- [ ] No buffering issues (or minimal)
- [ ] Player controls appear on remote press
- [ ] Can pause/play with remote
- [ ] Back button returns to main screen

### Movie Playback (if applicable)
- [ ] Select a movie
- [ ] Player screen opens
- [ ] Video starts playing
- [ ] Audio is working
- [ ] Can seek forward/backward
- [ ] Progress bar updates
- [ ] Back button works

### Series Playback (if applicable)
- [ ] Select a series
- [ ] Details screen opens
- [ ] Episodes list displays
- [ ] Select an episode
- [ ] Video plays correctly

### Error Handling
- [ ] Test with invalid stream URL (if possible)
- [ ] Error message displays
- [ ] App doesn't crash
- [ ] Can return to main screen

## ☐ Phase 10: Navigation Testing (5 minutes)

### Remote Control
- [ ] D-pad up/down navigates rows
- [ ] D-pad left/right navigates items
- [ ] Center button selects items
- [ ] Back button returns to previous screen
- [ ] Home button exits to TV launcher

### Focus Management
- [ ] Focus indicator is visible
- [ ] Focus moves smoothly
- [ ] No focus traps
- [ ] Can reach all items

### Background Updates
- [ ] Background artwork changes on selection
- [ ] Transitions are smooth
- [ ] No lag or stuttering

## ☐ Phase 11: Edge Cases (10 minutes)

### Network Interruption
- [ ] Disconnect WiFi during playback
- [ ] Error message appears
- [ ] Reconnect WiFi
- [ ] Can resume or retry

### App Resume
- [ ] Press Home button
- [ ] Open another app
- [ ] Return to PrimeX app
- [ ] App resumes correctly
- [ ] Content still loaded

### Subscription Expiration (if testable)
- [ ] Expire subscription in database
- [ ] Reopen app
- [ ] Appropriate message shows
- [ ] Can't access content

### Multiple Devices
- [ ] Install on second TV
- [ ] Different device key generated
- [ ] Both devices can activate
- [ ] Both devices work independently

## ☐ Phase 12: Performance Check (5 minutes)

### App Performance
- [ ] App launches quickly (< 3 seconds)
- [ ] Content loads quickly (< 5 seconds)
- [ ] Navigation is responsive
- [ ] No visible lag
- [ ] Memory usage is reasonable

### Video Performance
- [ ] Streams start quickly (< 5 seconds)
- [ ] Minimal buffering
- [ ] Smooth playback
- [ ] No audio/video sync issues
- [ ] Quality adapts to network (if adaptive)

## ☐ Phase 13: User Experience (5 minutes)

### Visual Quality
- [ ] Text is readable from couch distance
- [ ] Colors are appropriate
- [ ] Icons are clear
- [ ] Layout is balanced
- [ ] No visual glitches

### Usability
- [ ] Instructions are clear
- [ ] Navigation is intuitive
- [ ] Error messages are helpful
- [ ] Loading indicators are visible
- [ ] Overall experience is smooth

## ☐ Phase 14: Production Preparation (Optional)

### For Production Release

**APK Signing**
- [ ] Generate release keystore
- [ ] Configure signing in build.gradle
- [ ] Build signed release APK
- [ ] Test signed APK on device
- [ ] Store keystore securely

**Code Optimization**
- [ ] Enable ProGuard/R8
- [ ] Test obfuscated APK
- [ ] Verify no crashes from obfuscation

**Final Configuration**
- [ ] Production server URL set
- [ ] Debug logging disabled
- [ ] Analytics configured (if using)
- [ ] Crash reporting configured (if using)

**Distribution**
- [ ] Choose distribution method
- [ ] Prepare installation instructions
- [ ] Create support documentation
- [ ] Set up user feedback channel

## ☐ Phase 15: Documentation (5 minutes)

### User Documentation
- [ ] Installation guide created
- [ ] Activation instructions written
- [ ] Troubleshooting guide prepared
- [ ] FAQ document ready

### Internal Documentation
- [ ] Deployment process documented
- [ ] Configuration settings recorded
- [ ] Known issues listed
- [ ] Support contacts defined

## ☐ Phase 16: Monitoring Setup (Optional)

### Backend Monitoring
- [ ] Device registration tracking
- [ ] Activation success rate monitoring
- [ ] Error logging configured
- [ ] Performance metrics tracked

### App Monitoring
- [ ] Crash reporting enabled
- [ ] Usage analytics configured
- [ ] Error tracking set up
- [ ] User feedback collection

## ☐ Phase 17: Launch (5 minutes)

### Pre-Launch
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Support team briefed
- [ ] Rollback plan ready

### Launch
- [ ] Distribute APK to users
- [ ] Send installation instructions
- [ ] Monitor for issues
- [ ] Respond to user feedback

### Post-Launch
- [ ] Monitor activation rate
- [ ] Track error reports
- [ ] Collect user feedback
- [ ] Plan updates/improvements

## Summary Checklist

Quick verification that everything is ready:

- [ ] ✅ Server URL configured in app
- [ ] ✅ APK built successfully
- [ ] ✅ Backend endpoints working
- [ ] ✅ App installs on Android TV
- [ ] ✅ Activation flow works end-to-end
- [ ] ✅ Content loads correctly
- [ ] ✅ Videos play successfully
- [ ] ✅ Navigation works smoothly
- [ ] ✅ Error handling works
- [ ] ✅ Documentation complete

## Time Estimates

- **Minimum Time (experienced)**: 30-45 minutes
- **Average Time (first deployment)**: 1-2 hours
- **With testing and documentation**: 2-3 hours

## Common Issues Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| APK won't install | Enable Unknown Sources |
| Activation code not showing | Check server URL in build.gradle |
| Device not activating | Verify in admin panel, check backend logs |
| Content not loading | Check database has channels/VOD |
| Video won't play | Test stream URL in VLC |
| App crashes | Check logcat for errors |

## Support Resources

- **Full Documentation**: `README.md`
- **Quick Start**: `QUICK_START.md`
- **Integration Guide**: `../ANDROID_TV_INTEGRATION.md`
- **Backend Docs**: `../README.md`

## Success Criteria

Your deployment is successful when:

1. ✅ App installs without errors
2. ✅ Activation code displays on TV
3. ✅ Device activates in admin panel
4. ✅ App auto-detects activation
5. ✅ Content loads and displays
6. ✅ Videos play without errors
7. ✅ Navigation works smoothly
8. ✅ Users can use app without support

---

**Deployment Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

**Deployment Date**: _______________

**Deployed By**: _______________

**Notes**: _______________________________________________
