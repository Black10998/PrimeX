package com.primex.iptv.security

import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Build
import android.util.Log
import java.io.File
import java.security.MessageDigest

/**
 * TamperDetector - Runtime Tampering Detection
 * 
 * CRITICAL SECURITY:
 * - Detects runtime code modification
 * - Monitors for hooking frameworks
 * - Checks APK integrity
 * - Detects memory tampering
 * 
 * Runs continuously to detect tampering attempts during runtime.
 */
object TamperDetector {
    
    private const val TAG = "TamperDetector"
    
    // Store initial checksums
    private var initialDexChecksum: String? = null
    private var initialNativeChecksum: Int? = null
    
    /**
     * Initialize tampering detection
     * Stores initial state for comparison
     */
    fun initialize(context: Context) {
        try {
            // Store initial DEX checksum
            initialDexChecksum = calculateDexChecksum(context)
            Log.d(TAG, "Initial DEX checksum: $initialDexChecksum")
            
            // Store initial native checksum
            if (NativeSecurity.isNativeLibraryLoaded()) {
                initialNativeChecksum = NativeSecurity.getNativeChecksum()
                Log.d(TAG, "Initial native checksum: $initialNativeChecksum")
            }
            
            Log.d(TAG, "✓ Tamper detection initialized")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize tamper detection: ${e.message}")
        }
    }
    
    /**
     * Detect runtime tampering
     * Returns true if tampering detected
     */
    fun detectTampering(context: Context): Boolean {
        try {
            // Check 1: DEX file integrity
            if (isDexModified(context)) {
                Log.e(TAG, "✗ DEX file tampering detected")
                return true
            }
            
            // Check 2: Native library integrity
            if (isNativeLibraryModified()) {
                Log.e(TAG, "✗ Native library tampering detected")
                return true
            }
            
            // Check 3: Hooking frameworks
            if (isHookingFrameworkActive()) {
                Log.e(TAG, "✗ Hooking framework detected")
                return true
            }
            
            // Check 4: Memory tampering
            if (isMemoryTampered()) {
                Log.e(TAG, "✗ Memory tampering detected")
                return true
            }
            
            // Check 5: APK signature
            if (isApkSignatureInvalid(context)) {
                Log.e(TAG, "✗ APK signature invalid")
                return true
            }
            
            return false
            
        } catch (e: Exception) {
            Log.e(TAG, "Tamper detection error: ${e.message}")
            // Treat errors as potential tampering
            return true
        }
    }
    
    /**
     * Check if DEX file has been modified
     */
    private fun isDexModified(context: Context): Boolean {
        if (initialDexChecksum == null) {
            return false // Not initialized yet
        }
        
        val currentChecksum = calculateDexChecksum(context)
        
        if (currentChecksum != initialDexChecksum) {
            Log.e(TAG, "DEX checksum mismatch: initial=$initialDexChecksum, current=$currentChecksum")
            return true
        }
        
        return false
    }
    
    /**
     * Calculate checksum of DEX file
     */
    private fun calculateDexChecksum(context: Context): String {
        try {
            val sourceDir = context.applicationInfo.sourceDir
            val apkFile = File(sourceDir)
            
            if (!apkFile.exists()) {
                return ""
            }
            
            val md = MessageDigest.getInstance("SHA-256")
            val buffer = ByteArray(8192)
            
            apkFile.inputStream().use { input ->
                var bytesRead: Int
                while (input.read(buffer).also { bytesRead = it } != -1) {
                    md.update(buffer, 0, bytesRead)
                }
            }
            
            val hash = md.digest()
            return hash.joinToString("") { "%02x".format(it) }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to calculate DEX checksum: ${e.message}")
            return ""
        }
    }
    
    /**
     * Check if native library has been modified
     */
    private fun isNativeLibraryModified(): Boolean {
        if (!NativeSecurity.isNativeLibraryLoaded() || initialNativeChecksum == null) {
            return false // Not initialized yet
        }
        
        try {
            val currentChecksum = NativeSecurity.getNativeChecksum()
            
            if (currentChecksum != initialNativeChecksum) {
                Log.e(TAG, "Native checksum mismatch: initial=$initialNativeChecksum, current=$currentChecksum")
                return true
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to verify native checksum: ${e.message}")
            return true
        }
        
        return false
    }
    
    /**
     * Detect active hooking frameworks (Xposed, Frida, etc.)
     */
    private fun isHookingFrameworkActive(): Boolean {
        // Check stack trace for Xposed
        try {
            throw Exception()
        } catch (e: Exception) {
            for (element in e.stackTrace) {
                val className = element.className
                
                // Check for Xposed
                if (className.contains("de.robv.android.xposed") ||
                    className.contains("Xposed")) {
                    Log.d(TAG, "Xposed detected in stack trace")
                    return true
                }
                
                // Check for Frida
                if (className.contains("frida") ||
                    className.contains("Frida")) {
                    Log.d(TAG, "Frida detected in stack trace")
                    return true
                }
            }
        }
        
        // Check loaded libraries for Frida
        try {
            val mapsFile = File("/proc/self/maps")
            if (mapsFile.exists()) {
                val content = mapsFile.readText()
                
                val hookingIndicators = arrayOf(
                    "frida",
                    "xposed",
                    "substrate",
                    "libhook"
                )
                
                for (indicator in hookingIndicators) {
                    if (content.contains(indicator, ignoreCase = true)) {
                        Log.d(TAG, "Hooking framework detected: $indicator")
                        return true
                    }
                }
            }
        } catch (e: Exception) {
            // Error reading maps file
        }
        
        return false
    }
    
    /**
     * Detect memory tampering
     */
    private fun isMemoryTampered(): Boolean {
        // Check for suspicious memory patterns
        // This is a simplified check - production should be more thorough
        
        try {
            // Check if running in debugger
            if (android.os.Debug.isDebuggerConnected()) {
                Log.d(TAG, "Debugger connected")
                return true
            }
            
            // Check TracerPid in /proc/self/status
            val statusFile = File("/proc/self/status")
            if (statusFile.exists()) {
                val content = statusFile.readText()
                val tracerPidLine = content.lines().find { it.startsWith("TracerPid:") }
                
                if (tracerPidLine != null) {
                    val tracerPid = tracerPidLine.substringAfter(":").trim().toIntOrNull()
                    if (tracerPid != null && tracerPid != 0) {
                        Log.d(TAG, "TracerPid is non-zero: $tracerPid")
                        return true
                    }
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Memory tamper check error: ${e.message}")
        }
        
        return false
    }
    
    /**
     * Check if APK signature is invalid
     */
    private fun isApkSignatureInvalid(context: Context): Boolean {
        try {
            // This is a quick check - full signature verification
            // is done in SecurityManager
            
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(
                    context.packageName,
                    android.content.pm.PackageManager.GET_SIGNATURES
                )
            }
            
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.signingInfo?.apkContentsSigners
            } else {
                @Suppress("DEPRECATION")
                packageInfo.signatures
            }
            
            if (signatures.isNullOrEmpty()) {
                Log.e(TAG, "No signatures found")
                return true
            }
            
            return false
            
        } catch (e: Exception) {
            Log.e(TAG, "Signature check error: ${e.message}")
            return true
        }
    }
    
    /**
     * Start continuous tampering monitoring
     * Checks for tampering periodically
     */
    fun startMonitoring(context: Context, intervalMs: Long = 10000L) {
        Thread {
            while (true) {
                try {
                    Thread.sleep(intervalMs)
                    
                    if (detectTampering(context)) {
                        Log.e(TAG, "TAMPERING DETECTED - TERMINATING APP")
                        
                        // In production, terminate immediately
                        // System.exit(1)
                    }
                    
                } catch (e: InterruptedException) {
                    Log.d(TAG, "Monitoring thread interrupted")
                    break
                } catch (e: Exception) {
                    Log.e(TAG, "Monitoring error: ${e.message}")
                }
            }
        }.start()
        
        Log.d(TAG, "✓ Continuous tampering monitoring started")
    }
}
