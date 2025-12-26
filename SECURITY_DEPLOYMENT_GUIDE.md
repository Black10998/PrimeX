# Security Deployment Guide - PrimeX IPTV

## Quick Start

This guide walks you through deploying the maximum security implementation for production.

## Prerequisites

- Android Studio Arctic Fox or later
- Android NDK installed
- Release signing keystore
- Access to prime-x.live server
- Google Cloud Console access (for Play Integrity)

## Step 1: Generate Release Signing Key

If you don't have a release keystore:

```bash
keytool -genkey -v -keystore primex-release-key.keystore \
  -alias primex-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**IMPORTANT**: Store this keystore securely. If lost, you cannot update your app.

## Step 2: Get Signature Hash

Extract the SHA-256 signature hash:

```bash
keytool -list -v -keystore primex-release-key.keystore -alias primex-key
```

Look for the SHA256 fingerprint. Example:
```
SHA256: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0:U1:V2:W3:X4:Y5:Z6
```

Convert to Base64:

```bash
echo "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6" | xxd -r -p | base64
```

Copy the Base64 output.

## Step 3: Get Certificate Pins

Get the certificate pin for prime-x.live:

```bash
# Method 1: Using OpenSSL
openssl s_client -connect prime-x.live:443 -servername prime-x.live < /dev/null 2>/dev/null | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  base64
```

```bash
# Method 2: Using curl and OpenSSL
curl -s https://prime-x.live | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  base64
```

**IMPORTANT**: Get at least 2 pins (primary and backup certificate).

## Step 4: Configure Security Settings

### 4.1 Update SecurityManager.kt

**File**: `android-tv-app/app/src/main/java/com/primex/iptv/security/SecurityManager.kt`

Replace placeholders:

```kotlin
// Line ~25: Replace with your actual signature hash from Step 2
private const val EXPECTED_SIGNATURE_HASH = "YOUR_BASE64_SIGNATURE_HASH_HERE"

// Line ~30: Replace with your certificate pins from Step 3
private val CERTIFICATE_PINS = arrayOf(
    "YOUR_PRIMARY_CERTIFICATE_PIN_HERE",
    "YOUR_BACKUP_CERTIFICATE_PIN_HERE"
)
```

### 4.2 Update Play Integrity Configuration

Get your Google Cloud project number:

1. Go to https://console.cloud.google.com/
2. Select your project
3. Copy the project number (not project ID)

Update SecurityManager.kt:

```kotlin
// Line ~40: Replace with your project number
private const val CLOUD_PROJECT_NUMBER = "YOUR_PROJECT_NUMBER_HERE"
```

### 4.3 Configure AppKey Encryption

**Option A: Use XOR Encryption (Simple)**

1. Decide on your AppKey (e.g., "PRIMEX_SECRET_KEY_2024")
2. Run this Kotlin code to encrypt it:

```kotlin
val appKey = "PRIMEX_SECRET_KEY_2024"
val xorKey = "BLACK10998_PRIMEX_SECURE"

val encrypted = appKey.toByteArray().mapIndexed { i, byte ->
    byte.toInt() xor xorKey[i % xorKey.length].code
}

println("Encrypted bytes: ${encrypted.joinToString(", ") { "0x%02X".format(it) }}")
```

3. Update `native_security.cpp`:

```cpp
// Line ~15: Replace with your encrypted bytes
static const unsigned char ENCRYPTED_APP_KEY[] = {
    0x12, 0x34, 0x56, 0x78, // ... your encrypted bytes
};
```

**Option B: Use AES-256 Encryption (Recommended for Production)**

Implement proper AES-256 encryption in native code. Contact security team for implementation.

## Step 5: Enable Strict Enforcement

For production, enable strict security enforcement:

### 5.1 Enable Root Detection Enforcement

**File**: `SecurityManager.kt`

```kotlin
// Line ~150: Uncomment to enforce
private fun detectRootAndEmulator() {
    if (isRooted()) {
        Log.w(TAG, "⚠️ Rooted device detected")
        throw SecurityException("Rooted devices not supported for security reasons") // UNCOMMENT THIS
    }
    
    if (isEmulator()) {
        Log.w(TAG, "⚠️ Emulator detected")
        throw SecurityException("Emulators not supported for security reasons") // UNCOMMENT THIS
    }
    
    if (isXposedOrFridaDetected()) {
        Log.e(TAG, "✗ Hooking framework detected")
        throw SecurityException("Hooking frameworks not supported") // UNCOMMENT THIS
    }
}
```

### 5.2 Enable Tampering Detection Enforcement

**File**: `TamperDetector.kt`

```kotlin
// Line ~280: Uncomment to enforce
fun startMonitoring(context: Context, intervalMs: Long = 10000L) {
    Thread {
        while (true) {
            try {
                Thread.sleep(intervalMs)
                
                if (detectTampering(context)) {
                    Log.e(TAG, "TAMPERING DETECTED - TERMINATING APP")
                    System.exit(1) // UNCOMMENT THIS
                }
            } catch (e: InterruptedException) {
                break
            }
        }
    }.start()
}
```

### 5.3 Enable Play Integrity Enforcement

**File**: `SecurityManager.kt`

```kotlin
// Line ~350: Uncomment to enforce
.addOnFailureListener { exception ->
    Log.e(TAG, "✗ Play Integrity verification failed: ${exception.message}")
    terminateApp("Play Integrity verification failed") // UNCOMMENT THIS
}
```

### 5.4 Enable Native Security Enforcement

**File**: `SecurityManager.kt`

```kotlin
// Line ~140: Uncomment to enforce
private fun verifyNativeLayer(context: Context) {
    if (!NativeSecurity.isNativeLibraryLoaded()) {
        Log.w(TAG, "⚠️ Native security library not loaded")
        throw SecurityException("Native security layer required") // UNCOMMENT THIS
    }
}
```

## Step 6: Configure Build for Release

### 6.1 Update gradle.properties

Add signing configuration:

```properties
# Release signing
RELEASE_STORE_FILE=../primex-release-key.keystore
RELEASE_STORE_PASSWORD=your_keystore_password
RELEASE_KEY_ALIAS=primex-key
RELEASE_KEY_PASSWORD=your_key_password
```

### 6.2 Update app/build.gradle

Add signing config:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(RELEASE_STORE_FILE)
            storePassword RELEASE_STORE_PASSWORD
            keyAlias RELEASE_KEY_ALIAS
            keyPassword RELEASE_KEY_PASSWORD
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            debuggable false
        }
    }
}
```

## Step 7: Build Release APK

### 7.1 Clean Build

```bash
cd android-tv-app
./gradlew clean
```

### 7.2 Build Release APK

```bash
./gradlew assembleRelease
```

The APK will be at: `app/build/outputs/apk/release/app-release.apk`

### 7.3 Verify Signature

```bash
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

Should show: "jar verified."

## Step 8: Test Security Measures

### 8.1 Test Normal Installation

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

App should start normally and all security checks should pass.

### 8.2 Test Repackaging Detection

```bash
# Extract APK
unzip app-release.apk -d extracted/

# Modify AndroidManifest.xml (change package name)
# Repackage
cd extracted/
zip -r ../modified.apk *

# Try to install
adb install modified.apk
```

**Expected**: Installation fails or app terminates on startup.

### 8.3 Test Re-signing Detection

```bash
# Re-sign with debug key
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore ~/.android/debug.keystore \
  -storepass android \
  app-release.apk androiddebugkey

# Try to install
adb install app-release.apk
```

**Expected**: App terminates on startup with signature mismatch.

### 8.4 Test Certificate Pinning

```bash
# Set up Charles Proxy or Burp Suite
# Configure device to use proxy
# Try to intercept HTTPS traffic to prime-x.live
```

**Expected**: Connection fails with certificate pinning error.

### 8.5 Test Debugger Detection

```bash
# Try to attach debugger
adb shell am set-debug-app -w com.primex.iptv
```

**Expected**: App detects debugger and terminates.

## Step 9: Production Deployment

### 9.1 Pre-Deployment Checklist

- [ ] All security configurations updated
- [ ] Strict enforcement enabled
- [ ] Release APK built and signed
- [ ] All security tests passed
- [ ] No debug logging in release build
- [ ] Code obfuscation verified
- [ ] Certificate pinning tested
- [ ] Signature verification tested
- [ ] AppKey encryption tested
- [ ] Native security layer tested

### 9.2 Deploy to Google Play

1. Go to Google Play Console
2. Create new release
3. Upload `app-release.apk`
4. Fill in release notes
5. Submit for review

### 9.3 Deploy to Alternative Stores

For direct distribution:

1. Upload APK to your server
2. Provide download link
3. Users must enable "Install from Unknown Sources"
4. Distribute via your website

## Step 10: Post-Deployment Monitoring

### 10.1 Monitor Security Logs

Check logs for security violations:

```bash
adb logcat | grep -E "SecurityManager|TamperDetector|NativeSecurity"
```

### 10.2 Monitor Crash Reports

Set up crash reporting (Firebase Crashlytics, etc.) to monitor:
- Security exceptions
- Tampering detection
- Signature verification failures

### 10.3 Update Certificate Pins

When SSL certificate is renewed:

1. Get new certificate pin
2. Update `CERTIFICATE_PINS` array
3. Keep old pin for transition period
4. Release update
5. Remove old pin after transition

## Troubleshooting

### Issue: App crashes on startup

**Cause**: Signature hash mismatch

**Solution**:
1. Verify you're using the correct keystore
2. Re-extract signature hash
3. Update `EXPECTED_SIGNATURE_HASH`
4. Rebuild

### Issue: Certificate pinning fails

**Cause**: Incorrect certificate pin

**Solution**:
1. Re-extract certificate pin from live server
2. Verify domain is correct (prime-x.live)
3. Update `CERTIFICATE_PINS`
4. Rebuild

### Issue: Native library not loading

**Cause**: NDK not configured or build failed

**Solution**:
1. Verify NDK is installed in Android Studio
2. Check CMakeLists.txt path is correct
3. Clean and rebuild: `./gradlew clean assembleRelease`
4. Check build logs for native compilation errors

### Issue: Play Integrity fails

**Cause**: Project number incorrect or API not enabled

**Solution**:
1. Verify project number is correct (not project ID)
2. Enable Play Integrity API in Google Cloud Console
3. Wait 24 hours for API to activate
4. Rebuild and test

### Issue: AppKey decryption fails

**Cause**: Encryption/decryption mismatch

**Solution**:
1. Verify encrypted bytes are correct
2. Verify XOR key matches
3. Test encryption/decryption locally
4. Update native code with correct bytes

## Security Maintenance

### Regular Tasks

**Monthly**:
- Review security logs
- Check for new security vulnerabilities
- Update dependencies

**Quarterly**:
- Review and update certificate pins
- Test security measures
- Update security documentation

**Annually**:
- Rotate AppKey encryption
- Review and update security policies
- Conduct security audit

### Security Updates

When releasing security updates:

1. Increment version code
2. Update version name
3. Document security changes
4. Test thoroughly
5. Release as high-priority update
6. Monitor adoption rate

## Support

For security issues or questions:

- Email: security@primex.com
- Emergency: +1-XXX-XXX-XXXX
- Documentation: https://docs.primex.com/security

## Appendix: Security Configuration Summary

| Configuration | File | Line | Required |
|--------------|------|------|----------|
| Signature Hash | SecurityManager.kt | ~25 | ✅ Yes |
| Certificate Pins | SecurityManager.kt | ~30 | ✅ Yes |
| Cloud Project Number | SecurityManager.kt | ~40 | ⚠️ Optional |
| Encrypted AppKey | native_security.cpp | ~15 | ✅ Yes |
| XOR Key | native_security.cpp | ~25 | ✅ Yes |
| Signing Config | build.gradle | ~50 | ✅ Yes |
| ProGuard Rules | proguard-rules.pro | All | ✅ Yes |

## Appendix: Security Enforcement Checklist

| Enforcement | File | Line | Status |
|------------|------|------|--------|
| Root Detection | SecurityManager.kt | ~150 | ⚠️ Optional |
| Emulator Detection | SecurityManager.kt | ~155 | ⚠️ Optional |
| Hooking Detection | SecurityManager.kt | ~160 | ⚠️ Optional |
| Tampering Detection | TamperDetector.kt | ~280 | ⚠️ Optional |
| Play Integrity | SecurityManager.kt | ~350 | ⚠️ Optional |
| Native Security | SecurityManager.kt | ~140 | ⚠️ Optional |
| Debugger Detection | native_security.cpp | ~80 | ✅ Enabled |
| Signature Verification | SecurityManager.kt | ~100 | ✅ Enabled |
| Certificate Pinning | SecureOkHttpClient.kt | ~40 | ✅ Enabled |

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-26  
**Author**: PAX Security Team
