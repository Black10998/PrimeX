# Authentication Fix - Testing Guide

## What Was Fixed

### Critical Issues Resolved:

1. **SharedPreferences Not Persisting on TV Devices**
   - Now uses `applicationContext` instead of activity context
   - Uses `commit()` instead of `apply()` for immediate synchronous write
   - Adds verification after every save operation

2. **False Positive Subscription Expiry**
   - Handles multiple date formats from server
   - Doesn't block users if no expiry date exists
   - More lenient expiry checking
   - Extensive logging for debugging

3. **Aggressive Session Checking**
   - Reduced session validation in `MainActivity.onResume()`
   - Only checks token existence, not full validation
   - Prevents false logouts on TV devices

4. **Login Flow Improvements**
   - Detailed logging at every step
   - Verifies credentials saved before navigation
   - 500ms delay to ensure preferences fully written
   - Better error messages

## How to Test on Real Android TV

### Step 1: Install the APK
```bash
# Build the APK
cd android-tv-app
./gradlew assembleDebug

# Install on TV (via ADB)
adb connect <TV_IP_ADDRESS>
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 2: Enable ADB Logging
```bash
# Connect to TV
adb connect <TV_IP_ADDRESS>

# Watch logs in real-time
adb logcat | grep -E "(LoginActivity|SessionManager|PreferenceManager|MainActivity)"
```

### Step 3: Test Login Flow

1. **Open the app on TV**
2. **Enter credentials and login**
3. **Watch the logs** - You should see:
   ```
   LoginActivity: Starting login for user: <username>
   LoginActivity: Response code: 200
   LoginActivity: Response success: true
   LoginActivity: Login successful - User: <username>, Token length: <length>
   PreferenceManager: Token saved and verified successfully
   LoginActivity: Credentials saved successfully - navigating to main
   ```

4. **If login fails**, logs will show:
   ```
   LoginActivity: Login failed: <error message>
   ```
   OR
   ```
   PreferenceManager: Token save verification FAILED
   LoginActivity: Failed to save login credentials
   ```

### Step 4: Test Session Persistence

1. **Login successfully**
2. **Close the app** (press Home button)
3. **Wait 30 seconds**
4. **Reopen the app**
5. **Expected:** Should stay logged in, NOT show login screen

**Watch logs:**
```
MainActivity: onResume - checking session
SessionManager: Checking session validity...
SessionManager: Is logged in: true
SessionManager: Token exists: true
SessionManager: Session is valid
```

### Step 5: Test Subscription Expiry

1. **Login with account that has expiry date**
2. **Watch logs:**
   ```
   PreferenceManager: Subscription check - Expires: <date>, Now: <date>, Expired: false
   ```

3. **If subscription is expired:**
   ```
   SessionManager: Subscription expired - logging out user
   ```

## Expected Behavior

### ✅ Success Indicators:

1. **Login works on real TV**
   - No "Registration failed / Error" message
   - Successfully navigates to main screen
   - Logs show "Token saved and verified successfully"

2. **Session persists**
   - App doesn't logout automatically
   - Stays logged in after closing/reopening
   - Token remains saved in SharedPreferences

3. **No false logouts**
   - App doesn't exit unexpectedly
   - Session remains valid during use
   - Only logs out if subscription actually expired

### ❌ Failure Indicators:

1. **Login fails**
   - Shows "Registration failed / Error"
   - Logs show "Token save verification FAILED"
   - Doesn't navigate to main screen

2. **Session doesn't persist**
   - Shows login screen after reopening app
   - Logs show "No token found"
   - Token not saved in SharedPreferences

3. **False logouts**
   - App exits unexpectedly
   - Logs show "Subscription expired" when it's not
   - Session validation fails incorrectly

## Debugging Commands

### Check if token is saved:
```bash
adb shell "run-as com.primex.iptv cat /data/data/com.primex.iptv/shared_prefs/primex_prefs.xml"
```

### Clear app data (for fresh test):
```bash
adb shell pm clear com.primex.iptv
```

### Check app logs:
```bash
# All app logs
adb logcat | grep "com.primex.iptv"

# Authentication logs only
adb logcat | grep -E "(LoginActivity|SessionManager|PreferenceManager)"

# Error logs only
adb logcat *:E | grep "com.primex.iptv"
```

## What Changed in Code

### PreferenceManager.kt
- Uses `applicationContext` for preferences
- `saveWithCommit()` method for synchronous writes
- Verification after every save
- Multiple date format support for expiry
- Extensive logging

### SessionManager.kt
- Detailed logging at every check
- More lenient validation
- Better error messages

### LoginActivity.kt
- Logs every step of login process
- Verifies save before navigation
- 500ms delay for preference write
- Better error handling

### MainActivity.kt
- Reduced aggressive session checking
- Only checks token existence on resume
- Prevents false logouts

## Next Steps After Testing

### If Login Still Fails:

1. **Check logs** - Send me the full log output
2. **Check network** - Verify TV can reach server
3. **Check server response** - Verify API returns correct data
4. **Check date format** - Verify expiry date format from server

### If Session Doesn't Persist:

1. **Check SharedPreferences** - Use debugging command above
2. **Check TV storage** - Verify app has storage permissions
3. **Check logs** - Look for "Token save verification FAILED"

### If False Logouts Continue:

1. **Check expiry date** - Verify format and value
2. **Check logs** - Look for "Subscription expired" messages
3. **Disable expiry check temporarily** - For testing

## Contact

If issues persist after testing, please provide:

1. **Full log output** from login to logout
2. **TV brand and model**
3. **Android version**
4. **Exact error message** shown on screen
5. **SharedPreferences content** (from debugging command)

This will help me identify any remaining device-specific issues.

---

**Status:** 🟢 READY FOR TESTING
**Priority:** CRITICAL
**Expected Result:** Login works on real TV, session persists, no false logouts
