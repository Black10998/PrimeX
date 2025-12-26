package com.primex.iptv.security

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import java.security.MessageDigest

/**
 * ProductionSecurityManager - Clean, Production-Grade Security
 * 
 * DESIGN PHILOSOPHY:
 * - Graceful failure (lock service, don't crash)
 * - No false positives for legitimate users
 * - Google Play compliant
 * - Netflix/Spotify security model
 * 
 * SECURITY VIOLATIONS → Security Lock Mode:
 * ✓ Package name mismatch
 * ✓ Signature mismatch
 * ✓ Code tampering
 * ✓ Backend mismatch
 * 
 * ENVIRONMENT MONITORING → Warning only:
 * ⚠ Root detection
 * ⚠ Emulator detection
 * ⚠ Debugger detection
 */
object ProductionSecurityManager {
    
    private const val TAG = "ProductionSecurity"
    
    // Expected package name
    private const val EXPECTED_PACKAGE_NAME = "com.primex.iptv"
    
    // Expected signature hash (Base64 encoded SHA-256)
    // MUST be replaced with actual release signature
    // Get it with: keytool -list -v -keystore your-release-key.keystore
    private const val EXPECTED_SIGNATURE_HASH = "REPLACE_WITH_YOUR_RELEASE_SIGNATURE_HASH"
    
    // Security state
    private var initialized = false
    
    /**
     * Initialize security system
     * Call this from Application.onCreate()
     */
    fun initialize(context: Context) {
        if (initialized) {
            Log.d(TAG, "Already initialized")
            return
        }
        
        Log.d(TAG, "Initializing production security...")
        
        // Initialize Security Lock Manager
        SecurityLockManager.initialize(context)
        
        // If already locked, skip checks
        if (SecurityLockManager.isSecurityLocked()) {
            Log.w(TAG, "App is in Security Lock Mode")
            initialized = true
            return
        }
        
        // Run security checks
        runSecurityChecks(context)
        
        // Start continuous monitoring
        startContinuousMonitoring(context)
        
        initialized = true
        Log.d(TAG, "✓ Production security initialized")
    }
    
    /**
     * Run all security checks
     */
    private fun runSecurityChecks(context: Context) {
        try {
            // 1. Package name verification
            if (!verifyPackageName(context)) {
                SecurityLockManager.enterSecurityLockMode(
                    SecurityLockManager.LockReason.PACKAGE_MISMATCH
                )
                return
            }
            
            // 2. Signature verification
            if (!verifySignature(context)) {
                SecurityLockManager.enterSecurityLockMode(
                    SecurityLockManager.LockReason.SIGNATURE_MISMATCH
                )
                return
            }
            
            // 3. Backend verification
            if (!BackendVerifier.verifyBackend(context)) {
                SecurityLockManager.enterSecurityLockMode(
                    SecurityLockManager.LockReason.BACKEND_MISMATCH
                )
                return
            }
            
            // 4. Environment monitoring (warning only)
            monitorEnvironment()
            
            Log.d(TAG, "✓ All security checks passed")
            
        } catch (e: Exception) {
            Log.e(TAG, "Security check error: ${e.message}", e)
            // Graceful: Don't crash on errors
            SecurityLockManager.enterSecurityLockMode(
                SecurityLockManager.LockReason.UNKNOWN
            )
        }
    }
    
    /**
     * Verify package name
     */
    private fun verifyPackageName(context: Context): Boolean {
        val actualPackageName = context.packageName
        
        if (actualPackageName != EXPECTED_PACKAGE_NAME) {
            Log.e(TAG, "✗ Package name mismatch: expected=$EXPECTED_PACKAGE_NAME, actual=$actualPackageName")
            return false
        }
        
        Log.d(TAG, "✓ Package name verified")
        return true
    }
    
    /**
     * Verify app signature
     */
    private fun verifySignature(context: Context): Boolean {
        try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.GET_SIGNATURES
                )
            }
            
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.signingInfo?.apkContentsSigners
            } else {
                @Suppress("DEPRECATION")
                packageInfo.signatures
            }
            
            if (signatures.isNullOrEmpty()) {
                Log.e(TAG, "✗ No signatures found")
                return false
            }
            
            // Calculate signature hash
            val signature = signatures[0]
            val md = MessageDigest.getInstance("SHA-256")
            val signatureHash = md.digest(signature.toByteArray())
            val signatureHashBase64 = android.util.Base64.encodeToString(
                signatureHash,
                android.util.Base64.NO_WRAP
            )
            
            // Development mode: Log actual hash
            if (EXPECTED_SIGNATURE_HASH == "REPLACE_WITH_YOUR_RELEASE_SIGNATURE_HASH") {
                Log.w(TAG, "⚠️ DEVELOPMENT MODE: Signature hash = $signatureHashBase64")
                Log.w(TAG, "⚠️ Replace EXPECTED_SIGNATURE_HASH with this value for production")
                return true // Allow in development
            }
            
            // Production mode: Verify hash
            if (signatureHashBase64 != EXPECTED_SIGNATURE_HASH) {
                Log.e(TAG, "✗ Signature mismatch")
                return false
            }
            
            Log.d(TAG, "✓ Signature verified")
            return true
            
        } catch (e: Exception) {
            Log.e(TAG, "Signature verification error: ${e.message}", e)
            return false
        }
    }
    
    /**
     * Monitor environment (warning only, doesn't lock)
     */
    private fun monitorEnvironment() {
        // Check for root
        if (isRooted()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Rooted device detected")
        }
        
        // Check for emulator
        if (isEmulator()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Emulator detected")
        }
        
        // Check for debugger
        if (android.os.Debug.isDebuggerConnected()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Debugger connected")
        }
    }
    
    /**
     * Check if device is rooted
     */
    private fun isRooted(): Boolean {
        val suPaths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        
        for (path in suPaths) {
            if (java.io.File(path).exists()) {
                return true
            }
        }
        
        return false
    }
    
    /**
     * Check if running on emulator
     */
    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu"))
    }
    
    /**
     * Start continuous monitoring for code tampering
     */
    private fun startContinuousMonitoring(context: Context) {
        // Initialize tamper detector
        ProductionTamperDetector.initialize(context)
        
        // Start monitoring with callback
        ProductionTamperDetector.startMonitoring(context) { violation ->
            if (violation) {
                SecurityLockManager.enterSecurityLockMode(
                    SecurityLockManager.LockReason.CODE_TAMPERING
                )
            }
        }
        
        Log.d(TAG, "✓ Continuous monitoring started")
    }
    
    /**
     * Check if service access is allowed
     */
    fun isServiceAccessAllowed(): Boolean {
        return SecurityLockManager.isServiceAccessAllowed()
    }
    
    /**
     * Check if app is in security lock mode
     */
    fun isSecurityLocked(): Boolean {
        return SecurityLockManager.isSecurityLocked()
    }
    
    /**
     * Get lock reason
     */
    fun getLockReason(): SecurityLockManager.LockReason {
        return SecurityLockManager.getLockReason()
    }
}
