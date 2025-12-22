# Build Instructions for PrimeX Android TV App

## Prerequisites

### 1. Android SDK
Install Android SDK with the following components:
- Android SDK Platform 34 (Android 14)
- Android SDK Build-Tools 34.0.0
- Android SDK Platform-Tools
- Android SDK Command-line Tools

### 2. Environment Variables
Set the following environment variables:
```bash
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### 3. Java Development Kit
- JDK 17 or higher required
- Verify: `java -version`

## Building the APK

### Debug Build
```bash
cd android-tv-app
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build
```bash
cd android-tv-app
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release-unsigned.apk`

### Signed Release Build
1. Create keystore (first time only):
```bash
keytool -genkey -v -keystore primex-release.keystore \
  -alias primex -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `keystore.properties` in `android-tv-app/`:
```properties
storeFile=../primex-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=primex
keyPassword=YOUR_KEY_PASSWORD
```

3. Build signed APK:
```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

## Installing on Android TV

### Via ADB
```bash
# Connect to Android TV
adb connect <TV_IP_ADDRESS>:5555

# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Or for release
adb install app/build/outputs/apk/release/app-release.apk
```

### Via USB
1. Enable Developer Options on Android TV
2. Enable USB Debugging
3. Connect via USB cable
4. Run: `adb install app/build/outputs/apk/debug/app-debug.apk`

### Via File Manager
1. Copy APK to USB drive
2. Insert USB drive into Android TV
3. Use file manager app to install APK

## Troubleshooting

### SDK Location Not Found
Create `local.properties` in `android-tv-app/`:
```properties
sdk.dir=/path/to/android-sdk
```

### Build Fails with "Unsupported class file major version"
Update Gradle JVM to JDK 17:
```bash
# In Android Studio: File > Settings > Build, Execution, Deployment > Build Tools > Gradle
# Set Gradle JDK to version 17
```

### Out of Memory During Build
Add to `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### ADB Connection Issues
```bash
# Restart ADB server
adb kill-server
adb start-server

# Check connected devices
adb devices
```

## Verification Steps

After installing the APK:

1. **Launch App**
   - Open PrimeX app from Android TV home screen
   - Should show login screen

2. **Test Login**
   - Enter Xtream credentials
   - Username: Your Xtream username
   - Password: Your Xtream password
   - Should authenticate and navigate to main screen

3. **Test Content Loading**
   - Main screen should load channels, movies, and series
   - Check logs: `adb logcat | grep -i "MainFragment\|LoginActivity"`

4. **Test Stream Playback**
   - Select a channel or movie
   - Should play without DNS errors
   - Check logs: `adb logcat | grep -i "PlayerActivity\|ExoPlayer"`

5. **Test DNS Resolution**
   - Monitor logs during content loading
   - Should see successful DNS resolution
   - Check logs: `adb logcat | grep -i "DNS\|ApiClient"`

## Logs and Debugging

### View All Logs
```bash
adb logcat
```

### Filter by Tag
```bash
adb logcat | grep -i "PrimeX\|Xtream"
```

### Filter by Priority
```bash
adb logcat *:E  # Errors only
adb logcat *:W  # Warnings and above
```

### Save Logs to File
```bash
adb logcat > primex-logs.txt
```

### Clear Logs
```bash
adb logcat -c
```

## Performance Testing

### Monitor Network Traffic
```bash
adb shell dumpsys netstats
```

### Monitor Memory Usage
```bash
adb shell dumpsys meminfo com.primex.iptv
```

### Monitor CPU Usage
```bash
adb shell top | grep com.primex.iptv
```

## Known Issues

1. **Android SDK Required**
   - Cannot build in Gitpod environment without SDK
   - Build on local machine or CI/CD with Android SDK

2. **ActivationActivity**
   - Uses legacy PrimeX REST API
   - Will not work without PrimeX backend
   - Consider removing or implementing alternative

3. **First Launch**
   - May take longer due to DNS resolver initialization
   - Subsequent launches should be faster

## Support

For issues or questions:
- Check logs first: `adb logcat | grep -i "error\|exception"`
- Review XTREAM_MIGRATION_SUMMARY.md for migration details
- Verify Xtream credentials are correct
- Ensure Android TV has internet connectivity
