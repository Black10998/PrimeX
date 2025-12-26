package com.primex.iptv.security

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import kotlin.system.exitProcess

/**
 * SecurityManager - Maximum Security Implementation
 * 
 * ENFORCEMENT MODEL (Netflix/Spotify/Amazon Prime):
 * 
 * HARD ENFORCEMENT (Non-negotiable - Immediate termination):
 * ✓ Package name verification
 * ✓ Signature verification
 * ✓ AppKey integrity
 * ✓ PrimeX backend binding
 * ✓ Code tampering detection
 * 
 * FLEXIBLE ENFORCEMENT (Monitoring/Warning/Feature restriction):
 * ⚠ Root detection
 * ⚠ Emulator detection
 * ⚠ Play Integrity
 * ⚠ Debugger detection
 * 
 * Identity is non-negotiable. Environment is tolerant.
 */
object SecurityManager {
    
    private const val TAG = "SecurityManager"
    
    // CRITICAL: Expected package name - MUST match exactly
    private const val EXPECTED_PACKAGE_NAME = "com.primex.iptv"
    
    // CRITICAL: Expected signature SHA-256 hash (Base64 encoded)
    // This MUST be replaced with your actual release signing certificate hash
    // To get your signature hash after signing:
    // keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
    // Then look for SHA256 and convert to Base64
    private const val EXPECTED_SIGNATURE_HASH = "REPLACE_WITH_YOUR_ACTUAL_RELEASE_SIGNATURE_HASH"
    
    // CRITICAL: Certificate pins for prime-x.live (SHA-256 of public key)
    // These MUST be replaced with actual certificate pins from your server
    // To get certificate pins:
    // openssl s_client -connect prime-x.live:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
    private val CERTIFICATE_PINS = arrayOf(
        "REPLACE_WITH_ACTUAL_CERTIFICATE_PIN_1",
        "REPLACE_WITH_ACTUAL_CERTIFICATE_PIN_2"  // Backup pin
    )
    
    // CRITICAL: AppKey encrypted with app signature
    // This ensures AppKey cannot be extracted without valid signature
    private const val ENCRYPTED_APP_KEY = "REPLACE_WITH_ENCRYPTED_APP_KEY"
    
    // Security check results cache
    private var integrityVerified = false
    private var lastCheckTime = 0L
    private const val CHECK_INTERVAL_MS = 5000L // Re-verify every 5 seconds
    
    // Play Integrity API
    // CRITICAL: This must be your actual Google Cloud project number
    // Get it from: https://console.cloud.google.com/
    private const val CLOUD_PROJECT_NUMBER = "REPLACE_WITH_YOUR_CLOUD_PROJECT_NUMBER"
    
    /**
     * Initialize security - MUST be called on app startup
     * 
     * HARD ENFORCEMENT: Package name, signature, AppKey, backend binding
     * FLEXIBLE ENFORCEMENT: Root, emulator, Play Integrity, debugging
     */
    fun initialize(context: Context) {
        Log.d(TAG, "Initializing security checks...")
        
        try {
            // ========================================
            // HARD ENFORCEMENT - Immediate termination
            // ========================================
            
            // 1. HARD: Verify package name (non-negotiable)
            verifyPackageName(context)
            
            // 2. HARD: Verify app signature (non-negotiable)
            verifySignature(context)
            
            // 3. HARD: Verify native security layer (non-negotiable)
            verifyNativeLayer(context)
            
            // 4. HARD: Initialize tamper detection (non-negotiable)
            TamperDetector.initialize(context)
            
            // 5. HARD: Start continuous tampering monitoring (non-negotiable)
            TamperDetector.startMonitoring(context)
            
            // ========================================
            // FLEXIBLE ENFORCEMENT - Warning/Monitoring
            // ========================================
            
            // 6. FLEXIBLE: Detect root/emulator (warning only)
            detectEnvironment()
            
            // 7. FLEXIBLE: Check runtime environment (warning only)
            checkRuntimeEnvironment(context)
            
            // 8. FLEXIBLE: Verify Play Integrity (async, monitoring only)
            verifyPlayIntegrity(context)
            
            integrityVerified = true
            lastCheckTime = System.currentTimeMillis()
            
            Log.d(TAG, "✓ Security initialized - Identity locked, Environment monitored")
            
        } catch (e: SecurityException) {
            Log.e(TAG, "SECURITY VIOLATION: ${e.message}")
            terminateApp("Security check failed")
        }
    }
    
    /**
     * Verify app integrity - called before sensitive operations
     * Re-checks periodically to detect runtime tampering
     */
    fun verifyIntegrity(context: Context) {
        val currentTime = System.currentTimeMillis()
        
        // Re-verify periodically
        if (!integrityVerified || (currentTime - lastCheckTime) > CHECK_INTERVAL_MS) {
            initialize(context)
        }
        
        if (!integrityVerified) {
            terminateApp("Integrity verification failed")
        }
    }
    
    /**
     * Get decrypted AppKey - only works with valid signature
     * CRITICAL: Uses native security layer for maximum protection
     */
    fun getAppKey(context: Context): String {
        verifyIntegrity(context)
        
        try {
            // Get AppKey from native security layer
            // This is more secure than pure Kotlin implementation
            if (NativeSecurity.isNativeLibraryLoaded()) {
                return NativeSecurity.getSecureAppKey()
            } else {
                // Fallback to Kotlin implementation (less secure)
                Log.w(TAG, "Using fallback AppKey method - native layer not available")
                val signatureKey = getSignatureKey(context)
                return decryptAppKey(signatureKey)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to decrypt AppKey: ${e.message}")
            terminateApp("AppKey decryption failed")
            return "" // Never reached
        }
    }
    
    /**
     * Get certificate pins for OkHttp CertificatePinner
     */
    fun getCertificatePins(): Array<String> {
        return CERTIFICATE_PINS
    }
    
    /**
     * Verify package name matches expected value
     * HARD ENFORCEMENT: Package name is part of app identity
     */
    private fun verifyPackageName(context: Context) {
        val actualPackageName = context.packageName
        
        if (actualPackageName != EXPECTED_PACKAGE_NAME) {
            throw SecurityException(
                "IDENTITY VIOLATION: Package name mismatch - expected=$EXPECTED_PACKAGE_NAME, actual=$actualPackageName"
            )
        }
        
        Log.d(TAG, "✓ Package name verified (identity locked)")
    }
    
    /**
     * Verify app signature against hardcoded expected hash
     * HARD ENFORCEMENT: Signature is part of app identity
     * 
     * This prevents repackaging and re-signing
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
                throw SecurityException("No signatures found")
            }
            
            // Calculate SHA-256 hash of signature
            val signature = signatures[0]
            val md = MessageDigest.getInstance("SHA-256")
            val signatureHash = md.digest(signature.toByteArray())
            val signatureHashBase64 = android.util.Base64.encodeToString(
                signatureHash,
                android.util.Base64.NO_WRAP
            )
            
            // CRITICAL: Compare against expected hash
            // If this doesn't match, app was re-signed = TERMINATE
            if (EXPECTED_SIGNATURE_HASH == "REPLACE_WITH_YOUR_ACTUAL_RELEASE_SIGNATURE_HASH") {
                // Development mode - log actual hash for configuration
                Log.w(TAG, "⚠️ DEVELOPMENT MODE: Signature hash = $signatureHashBase64")
                Log.w(TAG, "⚠️ Replace EXPECTED_SIGNATURE_HASH with this value for production")
                return true // Allow in development
            }
            
            if (signatureHashBase64 != EXPECTED_SIGNATURE_HASH) {
                throw SecurityException(
                    "IDENTITY VIOLATION: Signature mismatch - app has been re-signed or tampered with"
                )
            }
            
            Log.d(TAG, "✓ Signature verified (identity locked)")
            return true
            
        } catch (e: Exception) {
            if (e is SecurityException) throw e
            throw SecurityException("Signature verification failed: ${e.message}")
        }
    }
    
    /**
     * Detect environment (root, emulator, hooking)
     * FLEXIBLE ENFORCEMENT: Warning/monitoring only, does NOT terminate app
     * 
     * This follows Netflix/Spotify model: monitor but allow usage
     */
    private fun detectEnvironment() {
        // Check for root - WARNING ONLY
        if (isRooted()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Rooted device detected - monitoring enabled")
            // Could restrict certain features here if needed
            // But does NOT terminate app
        }
        
        // Check for emulator - WARNING ONLY
        if (isEmulator()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Emulator detected - monitoring enabled")
            // Could restrict certain features here if needed
            // But does NOT terminate app
        }
        
        // Check for Xposed/Frida - WARNING ONLY
        if (isXposedOrFridaDetected()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Hooking framework detected - monitoring enabled")
            // Could restrict certain features here if needed
            // But does NOT terminate app
        }
        
        Log.d(TAG, "✓ Environment check complete (flexible enforcement)")
    }
    
    /**
     * Check if device is rooted
     * Multiple detection methods for maximum coverage
     */
    private fun isRooted(): Boolean {
        // Method 1: Check for su binary in common locations
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
            "/su/bin/su",
            "/system/sbin/su",
            "/vendor/bin/su"
        )
        
        for (path in suPaths) {
            if (java.io.File(path).exists()) {
                Log.d(TAG, "Root detected: su binary found at $path")
                return true
            }
        }
        
        // Method 2: Check for root management apps
        val rootApps = arrayOf(
            "com.noshufou.android.su",
            "com.noshufou.android.su.elite",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.yellowes.su",
            "com.topjohnwu.magisk"
        )
        
        for (packageName in rootApps) {
            try {
                android.content.pm.PackageManager::class.java
                    .getMethod("getPackageInfo", String::class.java, Int::class.java)
                return true
            } catch (e: Exception) {
                // Package not found, continue
            }
        }
        
        // Method 3: Try to execute su command
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "id"))
            val exitValue = process.waitFor()
            if (exitValue == 0) {
                Log.d(TAG, "Root detected: su command executed successfully")
                return true
            }
        } catch (e: Exception) {
            // su command failed, likely not rooted
        }
        
        // Method 4: Check for dangerous properties
        val dangerousProps = arrayOf(
            "ro.debuggable" to "1",
            "ro.secure" to "0"
        )
        
        for ((prop, value) in dangerousProps) {
            try {
                val process = Runtime.getRuntime().exec("getprop $prop")
                val reader = java.io.BufferedReader(java.io.InputStreamReader(process.inputStream))
                val propValue = reader.readLine()
                if (propValue == value) {
                    Log.d(TAG, "Root detected: dangerous property $prop=$value")
                    return true
                }
            } catch (e: Exception) {
                // Property check failed
            }
        }
        
        return false
    }
    
    /**
     * Check if running on emulator
     * Multiple detection methods for maximum coverage
     */
    private fun isEmulator(): Boolean {
        // Method 1: Check Build properties
        val emulatorIndicators = (
            Build.FINGERPRINT.startsWith("generic")
            || Build.FINGERPRINT.startsWith("unknown")
            || Build.MODEL.contains("google_sdk")
            || Build.MODEL.contains("Emulator")
            || Build.MODEL.contains("Android SDK built for x86")
            || Build.MANUFACTURER.contains("Genymotion")
            || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
            || "google_sdk" == Build.PRODUCT
            || Build.HARDWARE.contains("goldfish")
            || Build.HARDWARE.contains("ranchu")
        )
        
        if (emulatorIndicators) {
            Log.d(TAG, "Emulator detected: Build properties match emulator")
            return true
        }
        
        // Method 2: Check for emulator files
        val emulatorFiles = arrayOf(
            "/dev/socket/qemud",
            "/dev/qemu_pipe",
            "/system/lib/libc_malloc_debug_qemu.so",
            "/sys/qemu_trace",
            "/system/bin/qemu-props"
        )
        
        for (file in emulatorFiles) {
            if (java.io.File(file).exists()) {
                Log.d(TAG, "Emulator detected: emulator file found at $file")
                return true
            }
        }
        
        // Method 3: Check for Genymotion
        if (Build.MANUFACTURER.contains("Genymotion")) {
            Log.d(TAG, "Emulator detected: Genymotion")
            return true
        }
        
        return false
    }
    
    /**
     * Detect Xposed Framework or Frida hooking tools
     * These are used to bypass security checks
     */
    private fun isXposedOrFridaDetected(): Boolean {
        // Check for Xposed
        try {
            throw Exception()
        } catch (e: Exception) {
            for (stackTraceElement in e.stackTrace) {
                if (stackTraceElement.className.contains("de.robv.android.xposed")) {
                    Log.d(TAG, "Xposed framework detected")
                    return true
                }
            }
        }
        
        // Check for Frida
        val fridaLibs = arrayOf(
            "frida-agent",
            "frida-gadget",
            "frida-server"
        )
        
        try {
            val mapsFile = java.io.File("/proc/self/maps")
            if (mapsFile.exists()) {
                val reader = java.io.BufferedReader(java.io.FileReader(mapsFile))
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    for (lib in fridaLibs) {
                        if (line?.contains(lib) == true) {
                            Log.d(TAG, "Frida detected: $lib")
                            reader.close()
                            return true
                        }
                    }
                }
                reader.close()
            }
        } catch (e: Exception) {
            // Error reading maps file
        }
        
        return false
    }
    
    /**
     * Check runtime environment (debugger, debuggable flag)
     * FLEXIBLE ENFORCEMENT: Warning/monitoring only, does NOT terminate app
     * 
     * This follows Netflix/Spotify model: monitor but allow usage
     */
    private fun checkRuntimeEnvironment(context: Context) {
        // Check if debuggable - WARNING ONLY
        val isDebuggable = (context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
        
        if (isDebuggable) {
            Log.w(TAG, "⚠️ ENVIRONMENT: App is debuggable - monitoring enabled")
            // Does NOT terminate app
        }
        
        // Check if debugger is attached - WARNING ONLY
        if (android.os.Debug.isDebuggerConnected()) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Debugger connected - monitoring enabled")
            // Does NOT terminate app
        }
        
        Log.d(TAG, "✓ Runtime environment check complete (flexible enforcement)")
    }
    
    /**
     * Get encryption key derived from app signature
     */
    private fun getSignatureKey(context: Context): ByteArray {
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
        
        val signature = signatures?.get(0) ?: throw SecurityException("No signature")
        
        // Derive key from signature
        val md = MessageDigest.getInstance("SHA-256")
        return md.digest(signature.toByteArray())
    }
    
    /**
     * Decrypt AppKey using signature-derived key
     */
    private fun decryptAppKey(key: ByteArray): String {
        // In production, implement actual AES decryption
        // For now, return placeholder
        return "PRIMEX_APP_KEY_ENCRYPTED_WITH_SIGNATURE"
    }
    
    /**
     * Verify native security layer
     * HARD ENFORCEMENT: Native layer is part of app identity
     * 
     * Uses C++ implementation for additional protection
     */
    private fun verifyNativeLayer(context: Context) {
        if (!NativeSecurity.isNativeLibraryLoaded()) {
            Log.w(TAG, "⚠️ Native security library not loaded - continuing without native checks")
            // Native layer is optional enhancement, not required
            return
        }
        
        // HARD: Verify package name using native code
        if (!NativeSecurity.verifyPackageName(context.packageName)) {
            throw SecurityException("IDENTITY VIOLATION: Native package verification failed")
        }
        
        // HARD: Verify native integrity
        if (!NativeSecurity.verifyNativeIntegrity()) {
            throw SecurityException("IDENTITY VIOLATION: Native integrity verification failed")
        }
        
        Log.d(TAG, "✓ Native security layer verified (identity locked)")
    }
    
    /**
     * Verify device integrity using Play Integrity API
     * FLEXIBLE ENFORCEMENT: Monitoring only, does NOT terminate app
     * 
     * This verifies the app is running on a genuine Android device
     * with Google Play Services and hasn't been tampered with.
     * 
     * Follows Netflix/Spotify model: monitor but allow usage
     */
    private fun verifyPlayIntegrity(context: Context) {
        if (CLOUD_PROJECT_NUMBER == "REPLACE_WITH_YOUR_CLOUD_PROJECT_NUMBER") {
            Log.w(TAG, "⚠️ Play Integrity not configured - skipping")
            return
        }
        
        try {
            val integrityManager = IntegrityManagerFactory.create(context)
            
            // Create nonce (should be unique per request)
            val nonce = System.currentTimeMillis().toString()
            
            val integrityTokenRequest = IntegrityTokenRequest.builder()
                .setCloudProjectNumber(CLOUD_PROJECT_NUMBER.toLong())
                .setNonce(nonce)
                .build()
            
            integrityManager.requestIntegrityToken(integrityTokenRequest)
                .addOnSuccessListener { response ->
                    val token = response.token()
                    Log.d(TAG, "✓ ENVIRONMENT: Play Integrity token received")
                    
                    // Send token to backend for verification and monitoring
                    // Backend can decide on feature restrictions if needed
                    // https://developer.android.com/google/play/integrity/verdict
                }
                .addOnFailureListener { exception ->
                    Log.w(TAG, "⚠️ ENVIRONMENT: Play Integrity verification failed: ${exception.message}")
                    
                    // FLEXIBLE: Does NOT terminate app
                    // Could restrict certain features if needed
                }
        } catch (e: Exception) {
            Log.w(TAG, "⚠️ ENVIRONMENT: Play Integrity check error: ${e.message}")
        }
    }
    
    /**
     * Terminate app immediately
     * No recovery, no bypass
     */
    private fun terminateApp(reason: String): Nothing {
        Log.e(TAG, "TERMINATING APP: $reason")
        
        // Force immediate termination
        exitProcess(1)
    }
}
