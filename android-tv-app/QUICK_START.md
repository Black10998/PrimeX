# Quick Start Guide - PrimeX Android TV App

## 5-Minute Setup

### Step 1: Configure Server URL (2 minutes)

1. Open `app/build.gradle`
2. Find line 14:
   ```gradle
   buildConfigField "String", "API_BASE_URL", "\"https://your-server.com/api/v1/\""
   ```
3. Replace `https://your-server.com` with your actual PrimeX server URL
4. **Important**: Keep `/api/v1/` at the end with trailing slash

### Step 2: Build APK (2 minutes)

**Option A: Android Studio**
1. Open Android Studio
2. File > Open > Select `android-tv-app` folder
3. Wait for Gradle sync (first time: 5-10 min)
4. Build > Build Bundle(s) / APK(s) > Build APK(s)
5. Find APK at: `app/build/outputs/apk/debug/app-debug.apk`

**Option B: Command Line**
```bash
cd android-tv-app
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Install on Android TV (1 minute)

**Method 1: ADB (Fastest)**
```bash
# Enable USB debugging on TV first
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Method 2: USB Drive**
1. Copy APK to USB drive
2. Plug into Android TV
3. Use file manager to install

**Method 3: Wireless**
1. Install "Downloader" app on TV
2. Host APK on local server:
   ```bash
   cd app/build/outputs/apk/debug
   python3 -m http.server 8000
   ```
3. In Downloader: `http://YOUR_IP:8000/app-debug.apk`

## First Use

1. **Launch App** - Find "PrimeX IPTV" in TV launcher
2. **Get Activation Code** - App shows 8-digit code (e.g., `12345678`)
3. **Activate Device**:
   - Open PrimeX admin panel in browser
   - Go to Device Activation
   - Find device by code
   - Select plan and activate
4. **Watch Content** - App auto-detects activation and loads content

## Troubleshooting

### App won't install
- Enable "Unknown Sources" in TV Settings > Security

### Activation code not showing
- Check server URL in build.gradle
- Verify TV has internet connection
- Check backend is running

### Content not loading
- Verify device activated in admin panel
- Check subscription is active
- Ensure channels/VOD exist in database

### Video won't play
- Test stream URL in VLC
- Check stream format (HLS/DASH)
- Verify stream URL is accessible

## Need Help?

See full `README.md` for:
- Detailed build instructions
- Complete troubleshooting guide
- Production deployment
- White-labeling options
- API reference

## Testing Checklist

Before deploying to users:

- [ ] Server URL configured
- [ ] APK builds successfully
- [ ] App installs on TV
- [ ] Activation code displays
- [ ] Device activates in admin panel
- [ ] Content loads after activation
- [ ] Videos play successfully
- [ ] Remote navigation works

## Next Steps

1. **Test thoroughly** with real devices
2. **Customize branding** (colors, icons, name)
3. **Sign APK** for production
4. **Distribute** to users
5. **Monitor** activation success rate

---

**Quick Links:**
- Full Documentation: `README.md`
- Backend Setup: `../README.md`
- Admin Panel: `../public/admin/`
