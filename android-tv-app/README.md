# PrimeX IPTV - Android TV Application

A native Android TV IPTV application that integrates with the PrimeX backend for device activation and content streaming.

## Features

- **Device Key Activation**: 8-digit activation code system with MAC address binding
- **Live TV**: Browse and watch live channels with categories
- **Movies (VOD)**: On-demand movie library with poster artwork
- **Series**: TV series with episode management
- **ExoPlayer Integration**: HLS/DASH streaming support
- **TV-Optimized UI**: Leanback library for remote control navigation
- **Real-time Status Polling**: Automatic activation detection

## Prerequisites

Before building the app, ensure you have:

1. **Android Studio** (Latest version recommended)
   - Download from: https://developer.android.com/studio
   - Minimum version: Android Studio Hedgehog (2023.1.1) or newer

2. **Java Development Kit (JDK)**
   - JDK 17 or higher
   - Usually bundled with Android Studio

3. **Android SDK**
   - API Level 21 (Android 5.0) minimum
   - API Level 34 (Android 14) target
   - Install via Android Studio SDK Manager

4. **PrimeX Server**
   - Running instance with device activation endpoints
   - Server URL for API configuration

## Project Structure

```
android-tv-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/primex/iptv/
│   │   │   ├── api/              # API service layer
│   │   │   │   ├── ApiClient.kt
│   │   │   │   └── PrimeXApiService.kt
│   │   │   ├── models/           # Data models
│   │   │   │   └── ApiModels.kt
│   │   │   ├── player/           # Video player
│   │   │   │   └── PlayerActivity.kt
│   │   │   ├── ui/               # UI components
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── MainFragment.kt
│   │   │   │   ├── ActivationActivity.kt
│   │   │   │   ├── DetailsActivity.kt
│   │   │   │   ├── BrowseErrorActivity.kt
│   │   │   │   ├── ChannelCardPresenter.kt
│   │   │   │   ├── MovieCardPresenter.kt
│   │   │   │   ├── SeriesCardPresenter.kt
│   │   │   │   └── SettingsCardPresenter.kt
│   │   │   └── utils/            # Utilities
│   │   │       ├── DeviceUtils.kt
│   │   │       └── PreferenceManager.kt
│   │   ├── res/                  # Resources
│   │   │   ├── layout/           # XML layouts
│   │   │   ├── values/           # Strings, colors, themes
│   │   │   └── drawable/         # Icons and images
│   │   └── AndroidManifest.xml
│   └── build.gradle              # App-level build config
├── build.gradle                  # Project-level build config
├── settings.gradle               # Project settings
└── gradle.properties             # Gradle properties
```

## Configuration

### 1. Set Your Server URL

Edit `app/build.gradle` and update the API base URL:

```gradle
defaultConfig {
    // Replace with your actual server URL
    buildConfigField "String", "API_BASE_URL", "\"https://your-server.com/api/v1/\""
}
```

**Important**: The URL must end with `/api/v1/` and include the trailing slash.

### 2. Server Requirements

Your PrimeX server must have these endpoints active:

- `POST /api/v1/device/register` - Device registration
- `GET /api/v1/device/status` - Status check with content
- Admin endpoints for device activation (web portal)

Verify your backend routes are mounted correctly (see backend documentation).

## Building the Application

### Method 1: Using Android Studio (Recommended)

1. **Open Project**
   ```bash
   # Open Android Studio
   # Select "Open an Existing Project"
   # Navigate to: /workspaces/PrimeX/android-tv-app
   ```

2. **Sync Gradle**
   - Android Studio will automatically sync Gradle
   - Wait for dependencies to download (first time takes 5-10 minutes)
   - Check "Build" tab for any errors

3. **Configure Build Variant**
   - Go to: Build > Select Build Variant
   - Choose "debug" for testing or "release" for production

4. **Build APK**
   - Go to: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Wait for build to complete
   - APK location will be shown in notification

   **APK Output Location:**
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 2: Using Command Line

```bash
cd /workspaces/PrimeX/android-tv-app

# For Debug APK
./gradlew assembleDebug

# For Release APK (unsigned)
./gradlew assembleRelease

# Clean build
./gradlew clean assembleDebug
```

**Output Locations:**
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release-unsigned.apk`

## Installing on Android TV

### Option 1: ADB Installation (Recommended)

1. **Enable Developer Options on Android TV**
   - Go to Settings > Device Preferences > About
   - Click "Build" 7 times until "Developer mode enabled" appears

2. **Enable ADB Debugging**
   - Go to Settings > Device Preferences > Developer Options
   - Enable "USB debugging"
   - Enable "Network debugging" (for wireless ADB)

3. **Connect via ADB**
   
   **USB Connection:**
   ```bash
   adb devices
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

   **Wireless Connection:**
   ```bash
   # Get TV IP address from Settings > Network
   adb connect <TV_IP_ADDRESS>:5555
   adb devices
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Launch App**
   ```bash
   adb shell am start -n com.primex.iptv/.ui.MainActivity
   ```

### Option 2: File Transfer + File Manager

1. **Transfer APK to TV**
   - Copy APK to USB drive
   - Or use file sharing app (Send Files to TV, etc.)

2. **Install via File Manager**
   - Install a file manager on TV (X-plore, FX File Explorer)
   - Navigate to APK location
   - Click APK to install
   - Allow "Install from Unknown Sources" if prompted

### Option 3: Downloader App

1. **Install Downloader App** on Android TV from Play Store

2. **Host APK on Web Server**
   ```bash
   # Simple Python HTTP server
   cd app/build/outputs/apk/debug
   python3 -m http.server 8000
   ```

3. **Download on TV**
   - Open Downloader app
   - Enter: `http://<YOUR_IP>:8000/app-debug.apk`
   - Install when download completes

## First Launch & Activation

### User Flow

1. **Launch App**
   - Find "PrimeX IPTV" in Android TV launcher
   - Click to open

2. **Activation Screen**
   - App displays 8-digit activation code
   - Example: `12345678`
   - Code is unique to this device

3. **Activate Device**
   - Open PrimeX admin panel in web browser
   - Go to Device Activation section
   - Find device by activation code or MAC address
   - Select subscription plan
   - Click "Activate"

4. **Automatic Detection**
   - App polls server every 5 seconds
   - When activated, automatically navigates to main screen
   - Content loads immediately

5. **Browse Content**
   - Use TV remote D-pad to navigate
   - Browse Live TV, Movies, Series
   - Click to play content

## Testing Checklist

### Pre-Deployment Testing

- [ ] Server URL configured correctly in build.gradle
- [ ] Backend device activation endpoints working
- [ ] Admin panel can activate devices
- [ ] APK builds without errors
- [ ] APK installs on Android TV device

### Activation Flow Testing

- [ ] App launches and shows activation screen
- [ ] 8-digit code displays correctly
- [ ] MAC address retrieved successfully
- [ ] Device appears in admin panel pending list
- [ ] Activation in admin panel succeeds
- [ ] App detects activation within 5 seconds
- [ ] App navigates to main screen automatically

### Content Testing

- [ ] Live TV channels load and display
- [ ] Movies load with posters
- [ ] Series load with metadata
- [ ] Channel logos display (or fallback)
- [ ] Movie/series posters display (or fallback)

### Playback Testing

- [ ] Live channel plays successfully
- [ ] Movie plays successfully
- [ ] Series episode plays successfully
- [ ] Player controls work with remote
- [ ] Back button exits player
- [ ] Buffering indicator shows during loading
- [ ] Error messages display on playback failure

### Navigation Testing

- [ ] D-pad navigation works smoothly
- [ ] Focus indicators visible
- [ ] All rows accessible
- [ ] Settings items clickable
- [ ] Back button navigation works

## Troubleshooting

### Build Issues

**Problem**: Gradle sync fails
```
Solution:
1. Check internet connection
2. File > Invalidate Caches / Restart
3. Delete .gradle folder and sync again
```

**Problem**: SDK not found
```
Solution:
1. Open SDK Manager (Tools > SDK Manager)
2. Install Android SDK Platform 34
3. Install Android SDK Build-Tools 34.0.0
```

**Problem**: JDK version mismatch
```
Solution:
1. File > Project Structure > SDK Location
2. Set JDK location to JDK 17+
3. Or download JDK from Android Studio
```

### Installation Issues

**Problem**: ADB device not found
```bash
# Check ADB is installed
adb version

# Restart ADB server
adb kill-server
adb start-server
adb devices
```

**Problem**: Installation blocked
```
Solution:
1. Enable "Unknown Sources" in TV settings
2. Settings > Security & Restrictions > Unknown Sources
3. Enable for the app you're using to install
```

**Problem**: App not appearing in launcher
```
Solution:
1. Check AndroidManifest.xml has LEANBACK_LAUNCHER intent
2. Reinstall app
3. Restart Android TV device
```

### Runtime Issues

**Problem**: Activation code not showing
```
Solution:
1. Check server URL in BuildConfig
2. Verify network connectivity
3. Check logcat for API errors:
   adb logcat | grep PrimeX
```

**Problem**: Device not activating
```
Solution:
1. Verify device appears in admin panel
2. Check device_key matches displayed code
3. Verify MAC address is correct
4. Check backend logs for errors
```

**Problem**: Content not loading
```
Solution:
1. Verify device status is "active" in database
2. Check subscription hasn't expired
3. Verify channels/VOD exist in database
4. Check API response in logcat
```

**Problem**: Video won't play
```
Solution:
1. Verify stream URL is accessible
2. Check stream format (HLS/DASH supported)
3. Test stream URL in VLC player
4. Check ExoPlayer errors in logcat
```

### Network Issues

**Problem**: Connection timeout
```
Solution:
1. Verify server is accessible from TV network
2. Check firewall rules
3. Test with curl from same network:
   curl https://your-server.com/api/v1/device/status?device_key=12345678&mac_address=AA:BB:CC:DD:EE:FF
```

**Problem**: SSL/HTTPS errors
```
Solution:
1. Ensure server has valid SSL certificate
2. For testing, enable cleartext traffic (already enabled in manifest)
3. Check server SSL configuration
```

## Debugging

### Enable Detailed Logging

```bash
# View all app logs
adb logcat | grep -i primex

# View only errors
adb logcat *:E | grep -i primex

# View network requests
adb logcat | grep -i okhttp

# View ExoPlayer logs
adb logcat | grep -i exoplayer
```

### Common Log Patterns

**Successful activation:**
```
D/PrimeX: Device registered: device_key=12345678
D/PrimeX: Status check: status=active
D/PrimeX: Navigating to main screen
```

**Network error:**
```
E/PrimeX: Registration error: Unable to resolve host
E/PrimeX: java.net.UnknownHostException
```

**Playback error:**
```
E/ExoPlayer: Playback error: ERROR_CODE_IO_BAD_HTTP_STATUS
```

## Production Deployment

### Signing the APK

For production release, sign the APK:

1. **Generate Keystore**
   ```bash
   keytool -genkey -v -keystore primex-release.keystore \
     -alias primex -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing in build.gradle**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file("primex-release.keystore")
               storePassword "your_password"
               keyAlias "primex"
               keyPassword "your_password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build Signed APK**
   ```bash
   ./gradlew assembleRelease
   ```

### Distribution Options

1. **Direct APK Distribution**
   - Host APK on your website
   - Provide download link to customers
   - Include installation instructions

2. **Google Play Store**
   - Create developer account ($25 one-time fee)
   - Prepare store listing (screenshots, description)
   - Upload signed APK or App Bundle
   - Submit for review

3. **Private Distribution**
   - Use Google Play's private channel
   - Distribute to specific users/organizations
   - Manage access via Google accounts

## White-Labeling

To customize the app for your brand:

1. **App Name**: Edit `res/values/strings.xml`
   ```xml
   <string name="app_name">Your Brand IPTV</string>
   ```

2. **Package Name**: Refactor package in Android Studio
   - Right-click package > Refactor > Rename
   - Update in `build.gradle` and `AndroidManifest.xml`

3. **Colors**: Edit `res/values/colors.xml`
   ```xml
   <color name="primary_color">#YourColor</color>
   <color name="accent_color">#YourAccent</color>
   ```

4. **Icons**: Replace in `res/drawable/`
   - `app_icon.xml` - App icon
   - `app_banner.xml` - TV banner (320x180)

5. **Server URL**: Update in `app/build.gradle`

## Support & Maintenance

### Updating the App

1. Increment version in `build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.1.0"
   ```

2. Build new APK

3. Distribute update to users

### Monitoring

- Check backend logs for API errors
- Monitor device activation success rate
- Track playback errors in analytics
- Collect user feedback

## API Integration Reference

### Device Registration
```
POST /api/v1/device/register
Body: { "mac_address": "AA:BB:CC:DD:EE:FF" }
Response: { "device_key": "12345678", "status": "pending" }
```

### Device Status Check
```
GET /api/v1/device/status?device_key=12345678&mac_address=AA:BB:CC:DD:EE:FF
Response: {
  "status": "active",
  "subscription": { "plan_name": "Premium", "expires_at": "2024-12-31" },
  "channels": [...],
  "vod": { "movies": [...], "series": [...] }
}
```

## License

Proprietary - PrimeX IPTV Platform

## Contact

For technical support or questions:
- Backend Issues: Check PrimeX server documentation
- App Issues: Review this README and troubleshooting section
- Build Issues: Verify Android Studio and SDK setup
