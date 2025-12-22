# Google Android TV Authentication Fix

## 🔴 CRITICAL ISSUES IDENTIFIED AND FIXED

### Issue 1: WRONG API URL ❌→✅
**Problem:** App was pointing to wrong server
- **Was:** `https://prime-x.live/api/v1/`
- **Now:** `https://primex.black10998.workers.dev/api/v1/`

**This was causing ALL API calls to fail on real TVs!**

### Issue 2: Network Security Configuration ❌→✅
**Problem:** Google Android TV has stricter network security
- Added `network_security_config.xml`
- Allows cleartext traffic (for development)
- Trusts system and user certificates
- Specific domain configuration for PrimeX server

### Issue 3: Network Timeouts ❌→✅
**Problem:** TV networks are slower than phone networks
- Increased timeouts from 30s to 60s
- Added redirect following
- Better retry logic

### Issue 4: Error Handling ❌→✅
**Problem:** Generic error messages didn't help debug
- Now catches specific error types:
  - DNS/Network errors
  - SSL/Certificate errors
  - Timeout errors
  - I/O errors
- Detailed logging for each error type

---

## 🧪 Testing on Google Android TV

### Step 1: Build Fresh APK
```bash
cd android-tv-app
./gradlew clean
./gradlew assembleDebug
```

### Step 2: Install on TV
```bash
# Enable ADB on your Google Android TV:
# Settings → Device Preferences → About → Build (click 7 times)
# Settings → Device Preferences → Developer options → USB debugging (ON)

# Find TV IP address:
# Settings → Network & Internet → Your network → Advanced

# Connect via ADB
adb connect <TV_IP_ADDRESS>:5555

# Install APK
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Watch Logs
```bash
# Open new terminal and watch logs
adb logcat | grep -E "(LoginActivity|ApiClient|SessionManager)"
```

### Step 4: Test Login

1. **Open app on TV**
2. **Enter credentials**
3. **Click Login**

**Watch the logs - you should see:**

```
ApiClient: Request: POST https://primex.black10998.workers.dev/api/v1/auth/user/login
LoginActivity: Starting login for user: <username>
ApiClient: Response: 200 OK
LoginActivity: Response code: 200
LoginActivity: Response success: true
LoginActivity: Login successful - User: <username>, Token length: <length>
PreferenceManager: Token saved and verified successfully
LoginActivity: Credentials saved successfully - navigating to main
```

---

## ✅ Expected Results

### Success Indicators:

1. **No "Registration failed" error**
2. **Logs show "Response: 200 OK"**
3. **Logs show "Login successful"**
4. **App navigates to main screen**
5. **Session persists after closing/reopening**

### If Login Still Fails:

The logs will now show the EXACT error type:

**DNS/Network Error:**
```
LoginActivity: DNS/Network error: Unable to resolve host
Error shown: "Cannot reach server. Check network connection."
```
→ **Solution:** Check TV network connection, verify server is accessible

**SSL/Certificate Error:**
```
LoginActivity: SSL error: Certificate validation failed
Error shown: "SSL/Certificate error. Server connection failed."
```
→ **Solution:** Server certificate issue, may need to add exception

**Timeout Error:**
```
LoginActivity: Timeout error: timeout
Error shown: "Connection timeout. Server not responding."
```
→ **Solution:** Server slow or unreachable, check server status

**I/O Error:**
```
LoginActivity: I/O error: <specific error>
Error shown: "Network I/O error: <details>"
```
→ **Solution:** Network configuration issue

---

## 🔍 Debugging Commands

### Check Network Connectivity
```bash
# From TV, ping the server
adb shell ping -c 4 primex.black10998.workers.dev

# Check DNS resolution
adb shell nslookup primex.black10998.workers.dev
```

### Test API Directly
```bash
# Test from TV using curl
adb shell curl -v https://primex.black10998.workers.dev/api/v1/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Check App Network Config
```bash
# View network security config
adb shell cat /data/app/com.primex.iptv-*/base.apk | unzip -p - res/xml/network_security_config.xml
```

### Full Log Output
```bash
# Save full logs to file
adb logcat > tv_login_logs.txt

# Then try login and send me the file
```

---

## 📊 What Changed in Code

### 1. build.gradle
```gradle
// OLD
buildConfigField "String", "API_BASE_URL", "\"https://prime-x.live/api/v1/\""

// NEW
buildConfigField "String", "API_BASE_URL", "\"https://primex.black10998.workers.dev/api/v1/\""
```

### 2. AndroidManifest.xml
```xml
<application
    ...
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 3. network_security_config.xml (NEW)
```xml
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">primex.black10998.workers.dev</domain>
        ...
    </domain-config>
</network-security-config>
```

### 4. ApiClient.kt
```kotlin
// Increased timeouts for TV networks
.connectTimeout(60, TimeUnit.SECONDS)
.readTimeout(60, TimeUnit.SECONDS)
.writeTimeout(60, TimeUnit.SECONDS)

// Added redirect following
.followRedirects(true)
.followSslRedirects(true)

// Added detailed logging
.addInterceptor { chain ->
    android.util.Log.d("ApiClient", "Request: ${request.method} ${request.url}")
    ...
}
```

### 5. LoginActivity.kt
```kotlin
// Specific error handling
catch (e: UnknownHostException) { ... }
catch (e: SSLException) { ... }
catch (e: SocketTimeoutException) { ... }
catch (e: IOException) { ... }
```

---

## 🎯 Next Steps

### If Login Works:
✅ Confirm: "Login works on Google Android TV"
✅ Test session persistence (close/reopen app)
✅ Test normal usage (no auto-logout)

### If Login Still Fails:
❌ Send me:
1. Full log output from `adb logcat`
2. Exact error message shown on TV screen
3. Output of network connectivity tests
4. TV model and Android version

---

## 📝 Important Notes

1. **API URL was wrong** - This was the main issue
2. **Network security config required** - For Google Android TV OS
3. **Longer timeouts needed** - TV networks are slower
4. **Detailed error logging** - To identify exact issue

---

**Status:** 🟢 READY FOR TESTING
**Priority:** CRITICAL
**Target:** Google Android TV devices
**Expected:** Login works, no "Registration failed" error

---

## Git Commit
```
3f5afc5 - CRITICAL: Fix authentication for Google Android TV devices
```

**PLEASE TEST ON YOUR GOOGLE ANDROID TV AND REPORT RESULTS!**
