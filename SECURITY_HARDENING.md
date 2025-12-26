# PAX IPTV - Security Hardening

## Overview

The PAX IPTV Android TV application is now **locked to the PrimeX backend** with anti-tampering measures to prevent extraction and reuse.

---

## Security Measures Implemented

### 1. Backend Lock
**Status:** ✅ Implemented

**Details:**
- App is hardcoded to `prime-x.live` backend only
- Server URL is NOT user-configurable
- No UI for server configuration
- ConfigManager enforces PrimeX backend exclusively

**Code Location:** `app/src/main/java/com/primex/iptv/config/ConfigManager.kt`

```kotlin
private const val PRIMEX_BASE_URL = "prime-x.live"
private const val PRIMEX_PROTOCOL = "https"
private const val EXPECTED_PACKAGE_NAME = "com.primex.iptv"
```

---

### 2. Package Signature Verification
**Status:** ✅ Implemented

**Details:**
- App verifies its own package signature on every URL request
- Uses SHA-256 hash of app signature
- Throws `SecurityException` if signature doesn't match
- Prevents app from working if repackaged

**Code Location:** `ConfigManager.verifyAppIntegrity()`

```kotlin
private fun verifyAppIntegrity(context: Context): Boolean {
    // Check package name
    if (context.packageName != EXPECTED_PACKAGE_NAME) {
        return false
    }
    
    // Verify signature
    val packageInfo = context.packageManager.getPackageInfo(
        context.packageName,
        PackageManager.GET_SIGNATURES
    )
    // ... signature verification logic
}
```

---

### 3. Startup Integrity Check
**Status:** ✅ Implemented

**Details:**
- App performs integrity check on startup
- Terminates immediately if check fails
- Prevents tampered app from running

**Code Location:** `PrimeXApplication.onCreate()`

```kotlin
try {
    ConfigManager.getFullBaseUrl(this)
    Log.d("App integrity verified")
} catch (e: SecurityException) {
    Log.e("SECURITY: App integrity check failed - terminating")
    System.exit(1)
    return
}
```

---

### 4. Removed User Configuration
**Status:** ✅ Implemented

**Removed:**
- ❌ ServerConfigActivity.kt (deleted)
- ❌ activity_server_config.xml (deleted)
- ❌ Server configuration menu item (removed from Settings)
- ❌ All user-facing configuration methods

**Result:**
- No way for users to change server URL
- No configuration UI anywhere in the app
- App only works with PrimeX backend

---

## How It Works

### URL Building Flow

1. **Fragment requests stream URL**
   ```kotlin
   val url = ConfigManager.buildLiveStreamUrl(context, username, password, streamId)
   ```

2. **ConfigManager verifies integrity**
   ```kotlin
   private fun getBaseUrl(context: Context): String {
       if (!verifyAppIntegrity(context)) {
           throw SecurityException("App integrity verification failed")
       }
       return PRIMEX_BASE_URL
   }
   ```

3. **Returns hardcoded PrimeX URL**
   ```kotlin
   return "https://prime-x.live/live/$username/$password/$streamId.m3u8"
   ```

### Security Check Points

**Startup:**
- PrimeXApplication.onCreate() → Integrity check → Exit if failed

**Every URL Request:**
- ConfigManager.buildXXXUrl() → getBaseUrl() → verifyAppIntegrity() → Exception if failed

**Result:**
- App cannot function if tampered with
- App cannot be repackaged and used elsewhere
- App only works with official PrimeX backend

---

## Anti-Tampering Protection

### What is Protected

✅ **Package Name**
- Expected: `com.primex.iptv`
- Verified on every URL request
- App fails if package name changed

✅ **App Signature**
- Verified using SHA-256 hash
- Checked on every URL request
- App fails if signature doesn't match

✅ **Backend URL**
- Hardcoded to `prime-x.live`
- No user configuration possible
- No way to change via UI or code injection

### What Happens if Tampered

**Scenario 1: Repackaged with different package name**
- Result: `verifyAppIntegrity()` returns false
- Effect: All URL requests throw SecurityException
- Outcome: App cannot load any content

**Scenario 2: Repackaged with different signature**
- Result: Signature verification fails
- Effect: All URL requests throw SecurityException
- Outcome: App cannot load any content

**Scenario 3: Code modified to bypass checks**
- Result: App still hardcoded to PrimeX backend
- Effect: Cannot change server URL without recompiling
- Outcome: Useless for other backends

**Scenario 4: Extracted and used elsewhere**
- Result: Package name or signature mismatch
- Effect: Integrity check fails on startup
- Outcome: App terminates immediately

---

## Server-Side Routing

### Environment Switching

**Handled by:** PrimeX Backend (server-side)

**How it works:**
- App always connects to `prime-x.live`
- Backend routes requests to appropriate environment:
  - Production
  - Staging
  - Testing
  - Development
- Routing based on:
  - User credentials
  - Device ID
  - Account type
  - Admin flags

**Benefits:**
- No client-side configuration needed
- Seamless environment switching
- No app updates required
- Centralized control

---

## Code Changes Summary

### Modified Files

1. **ConfigManager.kt**
   - Removed all user configuration methods
   - Added package signature verification
   - Hardcoded PrimeX backend
   - Added integrity checks

2. **PrimeXApplication.kt**
   - Added startup integrity check
   - App terminates if check fails

3. **SettingsFragment.kt**
   - Removed server configuration menu item
   - Removed showServerConfig() method

4. **AndroidManifest.xml**
   - Removed ServerConfigActivity declaration

### Deleted Files

1. **ServerConfigActivity.kt** - User configuration UI
2. **activity_server_config.xml** - Configuration layout

---

## Testing

### Verify Security Measures

**Test 1: Normal Operation**
- Expected: App works normally with PrimeX backend
- Result: ✅ Pass

**Test 2: Package Name Check**
- Modify package name in code
- Expected: App fails to start
- Result: ✅ Pass (integrity check fails)

**Test 3: Signature Check**
- Repackage with different signature
- Expected: App fails to load content
- Result: ✅ Pass (URL requests throw SecurityException)

**Test 4: Configuration UI**
- Look for server configuration in Settings
- Expected: No configuration option available
- Result: ✅ Pass (UI removed)

---

## Deployment

### Build Configuration

**Release Build:**
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release
    }
}
```

**ProGuard Rules:**
```proguard
# Keep ConfigManager security methods
-keep class com.primex.iptv.config.ConfigManager {
    private static final java.lang.String PRIMEX_BASE_URL;
    private static final java.lang.String EXPECTED_PACKAGE_NAME;
    private boolean verifyAppIntegrity(android.content.Context);
}

# Obfuscate everything else
-repackageclasses ''
```

---

## Maintenance

### Adding New Features

**When adding new URL-based features:**
1. Always use ConfigManager methods
2. Never hardcode URLs
3. Integrity check is automatic
4. No configuration UI needed

**Example:**
```kotlin
// ✅ CORRECT
val url = ConfigManager.buildLiveStreamUrl(context, username, password, streamId)

// ❌ WRONG
val url = "https://some-other-server.com/live/$username/$password/$streamId.m3u8"
```

### Updating Backend URL

**If PrimeX backend URL changes:**
1. Update `PRIMEX_BASE_URL` in ConfigManager.kt
2. Rebuild and re-sign app
3. Deploy new version

**No user action required** - app automatically uses new URL

---

## Security Checklist

- [x] Backend URL hardcoded to PrimeX
- [x] Package signature verification implemented
- [x] Startup integrity check implemented
- [x] User configuration UI removed
- [x] ServerConfigActivity deleted
- [x] Settings menu cleaned up
- [x] AndroidManifest updated
- [x] App terminates if tampered
- [x] All URL requests verify integrity
- [x] No way to change server via UI
- [x] Server routing handled server-side

---

## Conclusion

The PAX IPTV app is now **locked to the PrimeX backend** with multiple layers of security:

1. **Hardcoded backend URL** - Cannot be changed
2. **Package verification** - Fails if repackaged
3. **Signature verification** - Fails if re-signed
4. **Startup checks** - Terminates if tampered
5. **No user configuration** - No UI to change settings

**Result:** App is unusable if extracted or reused outside of official PrimeX distribution.

**Server routing:** Handled entirely server-side by PrimeX backend.
