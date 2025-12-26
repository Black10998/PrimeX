# Production Security - PrimeX IPTV Android TV App

## Overview

Clean, production-grade security implementation for PAX IPTV app.

**Design Philosophy:**
- Graceful failure (lock service, don't crash)
- No false positives for legitimate users
- Google Play compliant
- Netflix/Spotify security model

## Security Model

### Security Violations → Security Lock Mode

When these are detected, app enters "Security Lock Mode":
- ✗ Package name mismatch
- ✗ Signature mismatch  
- ✗ Code tampering
- ✗ Backend mismatch

**Result**: Service blocked, professional warning shown, user directed to Google Play

### Environment Monitoring → Warning Only

These are logged but don't block service:
- ⚠ Root detection
- ⚠ Emulator detection
- ⚠ Debugger detection

**Result**: App works normally, warnings logged for analytics

## Implementation

### Files

**Security Core:**
- `ProductionSecurityManager.kt` - Main security orchestration
- `SecurityLockManager.kt` - Lock mode management
- `ProductionTamperDetector.kt` - Code tampering detection
- `BackendVerifier.kt` - Backend verification
- `SecurityLockActivity.kt` - Professional warning screen

**Configuration:**
- `ConfigManager.kt` - Hardcoded to prime-x.live
- `PrimeXApplication.kt` - Security initialization

### Security Checks

**1. Package Name Verification**
```kotlin
Expected: com.primex.iptv
Violation: Enter Security Lock Mode
```

**2. Signature Verification**
```kotlin
Expected: SHA-256 hash (configured in ProductionSecurityManager)
Violation: Enter Security Lock Mode
```

**3. Code Tampering Detection**
```kotlin
Monitors: DEX file checksum
Interval: Every 10 seconds
Violation: Enter Security Lock Mode
```

**4. Backend Verification**
```kotlin
Expected: https://prime-x.live/
Violation: Enter Security Lock Mode
```

## Configuration

### Step 1: Get Release Signature Hash

After signing your release APK:

```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

Look for SHA256 fingerprint, convert to Base64.

### Step 2: Update ProductionSecurityManager

File: `ProductionSecurityManager.kt`

```kotlin
private const val EXPECTED_SIGNATURE_HASH = "YOUR_BASE64_SIGNATURE_HASH_HERE"
```

### Step 3: Build Release APK

```bash
cd android-tv-app
./gradlew assembleRelease
```

## Testing

### Test 1: Normal Operation

**Environment**: Standard Android TV device, official APK

**Expected**:
- ✓ All security checks pass
- ✓ Service access allowed
- ✓ App works normally

### Test 2: Repackaged APK

**Environment**: Modified package name

**Expected**:
- ✗ Package verification fails
- ✗ Security Lock Mode activated
- ✗ Service blocked
- ✓ Professional warning shown
- ✓ User directed to Google Play

### Test 3: Re-signed APK

**Environment**: Different signing certificate

**Expected**:
- ✗ Signature verification fails
- ✗ Security Lock Mode activated
- ✗ Service blocked
- ✓ Professional warning shown

### Test 4: Code Tampering

**Environment**: Modified DEX file

**Expected**:
- ✗ Tampering detected within 10 seconds
- ✗ Security Lock Mode activated
- ✗ Service blocked

### Test 5: Rooted Device

**Environment**: Rooted Android TV device

**Expected**:
- ⚠ Root detected (logged)
- ✓ App works normally
- ✓ Service access allowed

### Test 6: Emulator

**Environment**: Android emulator

**Expected**:
- ⚠ Emulator detected (logged)
- ✓ App works normally
- ✓ Service access allowed

## Security Lock Mode

### What Happens

1. Security violation detected
2. App enters Security Lock Mode
3. Service access blocked
4. Professional warning screen shown
5. User directed to download official app from Google Play

### User Experience

**Screen Shows:**
- Security icon
- Clear message: "Security Verification Failed"
- User-friendly explanation
- "Download Official App" button → Opens Google Play
- "Exit" button → Closes app

**User Can:**
- Download official app from Google Play
- Exit the app
- View technical details (long press on title)

**User Cannot:**
- Access service
- Bypass security lock
- Continue using tampered app

### Lock Persistence

Security Lock Mode persists across app restarts:
- Stored in SharedPreferences
- Survives app restart
- Survives device restart
- Only cleared by reinstalling official app

## Google Play Compliance

### ✓ Compliant

- No crashes or force closes
- Graceful error handling
- Professional user messaging
- Clear path to resolution (Google Play)
- No device breaking
- No false positives

### ✓ APK Requirements

- Signature v2/v3 compliant
- No debug artifacts in release
- ProGuard/R8 obfuscation enabled
- No forbidden APIs used

### ✓ User Experience

- Works on all supported Android TV devices
- Works on rooted devices (with monitoring)
- Works on emulators (for development)
- No false positives from network issues

## Production Deployment

### Checklist

- [ ] Configure EXPECTED_SIGNATURE_HASH
- [ ] Build release APK with release keystore
- [ ] Test on real Android TV device
- [ ] Test repackaging detection
- [ ] Test re-signing detection
- [ ] Test on rooted device (should work)
- [ ] Test on emulator (should work)
- [ ] Verify ProGuard obfuscation
- [ ] Upload to Google Play

### Release Build

```bash
cd android-tv-app
./gradlew clean
./gradlew assembleRelease
```

APK location: `app/build/outputs/apk/release/app-release.apk`

### Verification

```bash
# Verify signature
jarsigner -verify -verbose -certs app-release.apk

# Should show: "jar verified."
```

## Monitoring

### Security Events

All security events are logged:

```kotlin
// Security violations
Log.e("ProductionSecurity", "✗ Package name mismatch")
Log.e("ProductionSecurity", "✗ Signature mismatch")
Log.e("ProductionTamper", "✗ Code tampering detected")

// Environment monitoring
Log.w("ProductionSecurity", "⚠ ENVIRONMENT: Rooted device detected")
Log.w("ProductionSecurity", "⚠ ENVIRONMENT: Emulator detected")
```

### Analytics Integration

Collect security events for analytics:

```kotlin
// In your analytics system
if (ProductionSecurityManager.isSecurityLocked()) {
    analytics.track("security_lock_activated", mapOf(
        "reason" to ProductionSecurityManager.getLockReason().message
    ))
}
```

## Support

### User Reports Security Lock

**Steps:**
1. Verify user downloaded from official source
2. Check if APK was modified
3. Direct user to download from Google Play
4. If legitimate issue, investigate logs

### False Positive

If legitimate user experiences Security Lock Mode:
1. Check logs for specific violation
2. Verify signature hash is correct
3. Ensure release APK is properly signed
4. Test on same device model

## Summary

**Security:**
- ✓ App locked to PrimeX backend
- ✓ Cannot be repackaged or re-signed
- ✓ Code tampering detected
- ✓ Graceful failure (no crashes)

**Compatibility:**
- ✓ Works on all Android TV devices
- ✓ Works on rooted devices
- ✓ Works on emulators
- ✓ Google Play compliant

**User Experience:**
- ✓ Professional error messaging
- ✓ Clear path to resolution
- ✓ No false positives
- ✓ No device breaking

---

**Implementation**: Clean, production-grade  
**Model**: Netflix/Spotify  
**Status**: Ready for Google Play
