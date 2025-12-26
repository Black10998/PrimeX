# Security Enforcement Model - PrimeX IPTV

## Overview

The PAX IPTV app follows the **Netflix/Spotify/Amazon Prime enforcement model**:

- **Identity is non-negotiable** → Immediate termination
- **Environment is tolerant** → Warning/monitoring only

This provides maximum security while maintaining maximum compatibility.

## HARD ENFORCEMENT (Non-negotiable)

These checks **ALWAYS terminate the app immediately** if they fail:

### 1. Package Name Verification

**What**: Verifies package name is exactly `com.primex.iptv`

**Why**: Prevents repackaging with different package name

**Outcome if violated**:
```
✗ IDENTITY VIOLATION: Package name mismatch
→ App terminates immediately
→ No content can be loaded
```

### 2. Signature Verification

**What**: Verifies app signature matches hardcoded SHA-256 hash

**Why**: Prevents re-signing with different certificate

**Outcome if violated**:
```
✗ IDENTITY VIOLATION: Signature mismatch
→ App terminates immediately
→ No content can be loaded
```

### 3. Code Tampering Detection

**What**: Monitors DEX file and native library checksums

**Why**: Detects runtime code modification

**Outcome if violated**:
```
✗ IDENTITY VIOLATION: Code tampering detected
→ App terminates immediately (within 10 seconds)
→ No content can be loaded
```

### 4. Certificate Pinning

**What**: Pins SSL certificates for prime-x.live

**Why**: Prevents man-in-the-middle attacks

**Outcome if violated**:
```
✗ Certificate pinning violation
→ Connection fails immediately
→ No data can be transmitted
```

### 5. AppKey Integrity

**What**: AppKey encrypted in native code, bound to signature

**Why**: Prevents AppKey extraction and reuse

**Outcome if violated**:
```
✗ IDENTITY VIOLATION: AppKey integrity compromised
→ App terminates immediately
→ Cannot authenticate with backend
```

## FLEXIBLE ENFORCEMENT (Monitoring)

These checks **DO NOT terminate the app** - they log warnings and enable monitoring:

### 1. Root Detection

**What**: Detects rooted devices using multiple methods

**Why**: Monitoring for analytics and potential feature restrictions

**Outcome if detected**:
```
⚠️ ENVIRONMENT: Rooted device detected
→ Warning logged
→ App continues normally
→ Monitoring enabled for analytics
→ Backend can decide on feature restrictions
```

**Rationale**: Many legitimate users have rooted devices. Netflix, Spotify, and Amazon Prime all work on rooted devices with monitoring.

### 2. Emulator Detection

**What**: Detects Android emulators using multiple methods

**Why**: Monitoring for analytics and testing

**Outcome if detected**:
```
⚠️ ENVIRONMENT: Emulator detected
→ Warning logged
→ App continues normally
→ Monitoring enabled for analytics
→ Useful for development and testing
```

**Rationale**: Emulators are useful for development and testing. Blocking them would hinder development without significant security benefit.

### 3. Debugger Detection

**What**: Detects attached debuggers (Java and native)

**Why**: Monitoring for analytics

**Outcome if detected**:
```
⚠️ ENVIRONMENT: Debugger detected
→ Warning logged
→ App continues normally
→ Monitoring enabled for analytics
```

**Rationale**: Debuggers are essential for development. Blocking them would hinder debugging without preventing determined attackers.

### 4. Hooking Framework Detection

**What**: Detects Xposed, Frida, and other hooking frameworks

**Why**: Monitoring for analytics

**Outcome if detected**:
```
⚠️ ENVIRONMENT: Hooking framework detected
→ Warning logged
→ App continues normally
→ Monitoring enabled for analytics
→ Identity tampering still terminates app
```

**Rationale**: Hooking frameworks are used for many legitimate purposes (accessibility, customization). The important protection is identity integrity, which cannot be bypassed even with hooking frameworks.

### 5. Play Integrity API

**What**: Google's device attestation service

**Why**: Monitoring for analytics and backend decision-making

**Outcome if failed**:
```
⚠️ ENVIRONMENT: Play Integrity verification failed
→ Warning logged
→ App continues normally
→ Token sent to backend for analysis
→ Backend can decide on feature restrictions
```

**Rationale**: Play Integrity can fail for many legitimate reasons (custom ROMs, older devices, regional issues). Better to monitor and let backend decide.

## Why This Model?

### Security Benefits

1. **Identity is Locked**: App cannot be repackaged, re-signed, or used elsewhere
2. **Backend is Locked**: App can only connect to PrimeX servers
3. **Code is Protected**: Tampering is detected and terminated
4. **AppKey is Secure**: Cannot be extracted or reused

### Compatibility Benefits

1. **Works on Rooted Devices**: Many legitimate users have root
2. **Works on Emulators**: Essential for development and testing
3. **Works with Debuggers**: Essential for development
4. **Works on Custom ROMs**: Many legitimate users use custom ROMs
5. **Works Globally**: No regional restrictions from Play Integrity

### Business Benefits

1. **Maximum User Base**: Don't exclude legitimate users
2. **Better Analytics**: Monitor environment without blocking
3. **Flexible Restrictions**: Backend can decide on feature restrictions
4. **Development Friendly**: Doesn't hinder development and testing
5. **Industry Standard**: Same model as Netflix, Spotify, Amazon Prime

## Comparison with Other Apps

### Netflix

- ✅ Works on rooted devices (with monitoring)
- ✅ Works on emulators (with monitoring)
- ❌ Blocks screen recording (DRM)
- ✅ Monitors Play Integrity
- ❌ Terminates on identity tampering

### Spotify

- ✅ Works on rooted devices (with monitoring)
- ✅ Works on emulators (with monitoring)
- ✅ Works with debuggers (with monitoring)
- ✅ Monitors environment
- ❌ Terminates on identity tampering

### Amazon Prime Video

- ✅ Works on rooted devices (with monitoring)
- ✅ Works on emulators (with monitoring)
- ❌ Blocks screen recording (DRM)
- ✅ Monitors Play Integrity
- ❌ Terminates on identity tampering

### PrimeX IPTV (Our Model)

- ✅ Works on rooted devices (with monitoring)
- ✅ Works on emulators (with monitoring)
- ✅ Works with debuggers (with monitoring)
- ✅ Monitors environment
- ❌ Terminates on identity tampering
- ❌ Terminates on code tampering
- ❌ Blocks SSL interception (certificate pinning)

## Implementation Details

### SecurityManager.kt

```kotlin
// HARD ENFORCEMENT
verifyPackageName(context)      // Terminates if mismatch
verifySignature(context)         // Terminates if mismatch
verifyNativeLayer(context)       // Terminates if compromised

// FLEXIBLE ENFORCEMENT
detectEnvironment()              // Logs warnings only
checkRuntimeEnvironment(context) // Logs warnings only
verifyPlayIntegrity(context)     // Logs result only
```

### TamperDetector.kt

```kotlin
// HARD ENFORCEMENT
if (isDexModified(context)) {
    // Terminates app
}

if (isNativeLibraryModified()) {
    // Terminates app
}

if (isApkSignatureInvalid(context)) {
    // Terminates app
}

// FLEXIBLE ENFORCEMENT
if (isHookingFrameworkActive()) {
    // Logs warning only
}

if (isMemoryTampered()) {
    // Logs warning only
}
```

### native_security.cpp

```cpp
// HARD ENFORCEMENT
verifyPackageName()  // Terminates if mismatch
getPrimexDomain()    // Returns hardcoded domain
getAppKey()          // Returns encrypted key

// FLEXIBLE ENFORCEMENT
isDebuggerAttached() // Logs warning only
isEmulator()         // Logs warning only
```

## Monitoring and Analytics

All flexible enforcement checks log warnings that can be collected for analytics:

```kotlin
Log.w(TAG, "⚠️ ENVIRONMENT: Rooted device detected - monitoring enabled")
Log.w(TAG, "⚠️ ENVIRONMENT: Emulator detected - monitoring enabled")
Log.w(TAG, "⚠️ ENVIRONMENT: Debugger detected - monitoring enabled")
Log.w(TAG, "⚠️ ENVIRONMENT: Hooking framework detected - monitoring enabled")
Log.w(TAG, "⚠️ ENVIRONMENT: Play Integrity failed - monitoring enabled")
```

These can be sent to your backend for:
- Analytics and reporting
- Feature restriction decisions
- Security monitoring
- User behavior analysis

## Backend Integration

The backend can use environment information to:

1. **Restrict Features**: Disable certain features for risky environments
2. **Rate Limiting**: Apply stricter rate limits for risky environments
3. **Monitoring**: Track usage patterns in different environments
4. **A/B Testing**: Test different restrictions for different environments
5. **Gradual Rollout**: Gradually restrict features based on data

Example backend logic:

```python
if user.environment.is_rooted:
    # Allow usage but monitor closely
    analytics.track("rooted_device_usage", user.id)
    
    # Optional: Restrict certain features
    if user.account_type == "free":
        features.disable("offline_download")

if user.environment.play_integrity_failed:
    # Allow usage but apply stricter rate limits
    rate_limiter.set_limit(user.id, requests_per_hour=100)
```

## Summary

**HARD ENFORCEMENT (Identity)**:
- Package name → Terminates
- Signature → Terminates
- Code tampering → Terminates
- Certificate pinning → Connection fails
- AppKey integrity → Terminates

**FLEXIBLE ENFORCEMENT (Environment)**:
- Root → Logs warning
- Emulator → Logs warning
- Debugger → Logs warning
- Hooking frameworks → Logs warning
- Play Integrity → Logs result

**Result**: Maximum security on identity, maximum compatibility on environment.

This is the **industry-standard model** used by Netflix, Spotify, and Amazon Prime.

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-26  
**Model**: Netflix/Spotify/Amazon Prime
