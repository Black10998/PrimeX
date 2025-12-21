# Windows Setup Guide - Android TV App

## 🎯 Quick Setup for Windows 10/11

Follow these exact steps to get the Android TV app working on Windows.

---

## Step 1: Pull Latest Code (2 minutes)

### If you already have PrimeX folder:

1. Open **Command Prompt** or **PowerShell**
2. Navigate to your PrimeX folder:
   ```cmd
   cd C:\Users\YourName\Documents\PrimeX
   ```
   (Replace `YourName` with your actual username)

3. Pull latest changes:
   ```cmd
   git pull origin main
   ```

4. Verify the android-tv-app folder exists:
   ```cmd
   dir android-tv-app
   ```

### If you DON'T have PrimeX folder:

1. Open **Command Prompt** or **PowerShell**
2. Navigate to where you want the project:
   ```cmd
   cd C:\Users\YourName\Documents
   ```

3. Clone the repository:
   ```cmd
   git clone https://github.com/Black10998/PrimeX.git
   ```

4. Navigate into the project:
   ```cmd
   cd PrimeX
   ```

---

## Step 2: Install Android Studio (15 minutes)

### Download Android Studio:

1. Go to: https://developer.android.com/studio
2. Click **Download Android Studio**
3. Accept terms and download
4. Run the installer (`android-studio-xxxx-windows.exe`)

### Installation Options:

- ✅ Choose **Standard** installation
- ✅ Accept all default settings
- ✅ Let it download Android SDK (takes 5-10 minutes)
- ✅ Wait for "Installation Complete"

### Verify Installation:

1. Android Studio should open automatically
2. You should see the Welcome screen
3. Close it for now

---

## Step 3: Open Project in Android Studio (5 minutes)

1. Open **Android Studio**

2. On Welcome screen, click **Open**
   (If you don't see Welcome screen: **File** → **Open**)

3. Navigate to: `C:\Users\YourName\Documents\PrimeX\android-tv-app`

4. Click **OK**

5. **Wait for Gradle Sync** (5-10 minutes first time)
   - You'll see "Gradle sync in progress..." at the bottom
   - Progress bar will show downloads
   - Be patient - this is normal

### ✅ Success Check:

You should see:
- "Gradle sync finished" at the bottom
- Project structure in left panel
- No red errors in Build tab

### ❌ If Sync Fails:

**Error: "SDK location not found"**

1. Go to **File** → **Project Structure** → **SDK Location**
2. Note the path shown (e.g., `C:\Users\YourName\AppData\Local\Android\Sdk`)
3. In the `android-tv-app` folder, create a file named `local.properties`
4. Add this line (use your actual path with double backslashes):
   ```properties
   sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
   ```
5. Save the file
6. In Android Studio: **File** → **Sync Project with Gradle Files**

**Other Errors:**

See `GRADLE_SYNC_FIX.md` for detailed troubleshooting.

---

## Step 4: Configure Server URL (1 minute)

1. In Android Studio left panel, expand: **app** → **build.gradle**

2. Double-click to open `build.gradle` (the one under `app`)

3. Find line 14 (around line 14):
   ```gradle
   buildConfigField "String", "API_BASE_URL", "\"https://your-server.com/api/v1/\""
   ```

4. Replace `https://your-server.com` with your actual server URL

   **Examples:**
   ```gradle
   buildConfigField "String", "API_BASE_URL", "\"https://primex.example.com/api/v1/\""
   ```
   or if using IP:
   ```gradle
   buildConfigField "String", "API_BASE_URL", "\"http://192.168.1.100:3000/api/v1/\""
   ```

5. **Important**: Keep `/api/v1/` at the end with trailing slash

6. Save the file: **Ctrl + S**

7. Sync project: **File** → **Sync Project with Gradle Files**

---

## Step 5: Build APK (5 minutes)

1. In Android Studio menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

2. Wait for build to complete (3-5 minutes)

3. Look for notification at bottom right: **"APK(s) generated successfully"**

4. Click **locate** in the notification

5. You should see: `app-debug.apk` (around 15-25 MB)

### APK Location:

```
C:\Users\YourName\Documents\PrimeX\android-tv-app\app\build\outputs\apk\debug\app-debug.apk
```

### ✅ Success Check:

- APK file exists
- File size is 15-25 MB
- No errors in Build tab

---

## Step 6: Install on Android TV (5 minutes)

### Method 1: ADB (Recommended)

**Enable ADB on Android TV:**
1. On TV: Settings → Device Preferences → About
2. Click "Build" 7 times until "Developer mode enabled"
3. Go back to: Settings → Device Preferences → Developer Options
4. Enable "USB debugging"
5. Enable "Network debugging"
6. Note your TV's IP address (Settings → Network)

**Install APK:**

1. Open Command Prompt on Windows

2. Connect to TV:
   ```cmd
   adb connect 192.168.1.XXX:5555
   ```
   (Replace with your TV's IP address)

3. Verify connection:
   ```cmd
   adb devices
   ```
   Should show your TV listed

4. Install APK:
   ```cmd
   cd C:\Users\YourName\Documents\PrimeX\android-tv-app\app\build\outputs\apk\debug
   adb install app-debug.apk
   ```

5. Wait for "Success" message

### Method 2: USB Drive

1. Copy `app-debug.apk` to USB drive
2. Plug USB into Android TV
3. Install a file manager on TV (X-plore, FX File Explorer)
4. Open file manager, navigate to USB drive
5. Click on `app-debug.apk`
6. Click "Install"
7. Enable "Unknown Sources" if prompted

---

## Step 7: Test the App (5 minutes)

1. On Android TV, find "PrimeX IPTV" in the launcher

2. Launch the app

3. You should see:
   - Activation screen
   - 8-digit code displayed
   - "Waiting for activation..." message

4. Open your PrimeX admin panel in browser:
   ```
   http://your-server.com/admin/device-activation-4k.html
   ```

5. Find the device in "Pending Devices" list

6. Click "Activate" button

7. Select subscription plan

8. Click "Confirm"

9. Within 5 seconds, the TV app should:
   - Show "Activation successful!"
   - Navigate to main screen
   - Load channels and content

### ✅ Success Check:

- App launches without crash
- Activation code displays
- Device appears in admin panel
- Activation works
- Content loads after activation

---

## 🆘 Common Windows Issues

### Issue: "adb is not recognized"

**Solution:**

1. Find Android SDK location:
   - Usually: `C:\Users\YourName\AppData\Local\Android\Sdk`

2. Add to PATH:
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`
   - Click OK on all windows

3. Restart Command Prompt

4. Test: `adb version`

### Issue: "Cannot connect to TV via ADB"

**Solution:**

1. Verify TV and PC are on same network
2. Verify TV IP address is correct
3. Verify "Network debugging" is enabled on TV
4. Try: `adb kill-server` then `adb start-server`
5. Try connecting again

### Issue: "Installation blocked"

**Solution:**

1. On TV: Settings → Security & Restrictions
2. Enable "Unknown Sources"
3. Enable for "ADB" or your file manager
4. Try installing again

---

## 📋 Quick Reference

### Commands Summary:

```cmd
# Pull latest code
cd C:\Users\YourName\Documents\PrimeX
git pull origin main

# Connect to TV
adb connect 192.168.1.XXX:5555

# Install APK
adb install app-debug.apk

# Launch app
adb shell am start -n com.primex.iptv/.ui.MainActivity

# View logs
adb logcat | findstr PrimeX
```

### File Locations:

- **Project**: `C:\Users\YourName\Documents\PrimeX\android-tv-app\`
- **APK**: `...\app\build\outputs\apk\debug\app-debug.apk`
- **Server Config**: `...\app\build.gradle` (line 14)
- **Android SDK**: `C:\Users\YourName\AppData\Local\Android\Sdk`

---

## ✅ Checklist

Before asking for help, verify:

- [ ] Pulled latest code from GitHub
- [ ] Android Studio installed
- [ ] Project opens without errors
- [ ] Gradle sync completed successfully
- [ ] Server URL configured in build.gradle
- [ ] APK built successfully
- [ ] APK file exists and is 15-25 MB
- [ ] Android TV has developer mode enabled
- [ ] ADB debugging enabled on TV
- [ ] Can connect to TV via ADB
- [ ] APK installs without errors
- [ ] App launches on TV
- [ ] Backend server is running
- [ ] Admin panel is accessible

---

## 🎯 Expected Timeline

| Step | Time | Total |
|------|------|-------|
| Pull code | 2 min | 2 min |
| Install Android Studio | 15 min | 17 min |
| Open project & sync | 10 min | 27 min |
| Configure server URL | 1 min | 28 min |
| Build APK | 5 min | 33 min |
| Install on TV | 5 min | 38 min |
| Test activation | 5 min | 43 min |

**Total**: ~45 minutes from start to working app

---

## 📞 Need More Help?

- **Gradle Issues**: See `GRADLE_SYNC_FIX.md`
- **General Setup**: See `README.md`
- **Quick Start**: See `QUICK_START.md`
- **Deployment**: See `DEPLOYMENT_CHECKLIST.md`

---

**Last Updated**: December 21, 2024  
**Tested On**: Windows 10, Windows 11  
**Android Studio**: Latest stable version
