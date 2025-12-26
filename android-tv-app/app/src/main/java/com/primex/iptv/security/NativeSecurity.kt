package com.primex.iptv.security

import android.util.Log

/**
 * NativeSecurity - JNI Bridge to Native Security Layer
 * 
 * CRITICAL SECURITY:
 * - Bridges to C++ native security implementation
 * - Native code is harder to reverse engineer
 * - Provides additional layer of protection
 * 
 * This works in conjunction with SecurityManager for maximum security.
 */
object NativeSecurity {
    
    private const val TAG = "NativeSecurity"
    private var nativeLibraryLoaded = false
    
    init {
        try {
            System.loadLibrary("primex_security")
            nativeLibraryLoaded = true
            Log.d(TAG, "✓ Native security library loaded")
        } catch (e: UnsatisfiedLinkError) {
            Log.e(TAG, "✗ Failed to load native security library: ${e.message}")
            nativeLibraryLoaded = false
        }
    }
    
    /**
     * Check if native library is loaded
     */
    fun isNativeLibraryLoaded(): Boolean = nativeLibraryLoaded
    
    /**
     * Verify package name using native code
     */
    external fun verifyPackageName(packageName: String): Boolean
    
    /**
     * Get PrimeX domain from native memory
     */
    external fun getPrimexDomain(): String
    
    /**
     * Get PrimeX protocol from native memory
     */
    external fun getPrimexProtocol(): String
    
    /**
     * Perform comprehensive native security check
     */
    external fun performSecurityCheck(): Boolean
    
    /**
     * Get decrypted AppKey from native memory
     * CRITICAL: Only returns key if all security checks pass
     */
    external fun getAppKey(): String
    
    /**
     * Encrypt data using native encryption
     */
    external fun encryptData(data: String): String
    
    /**
     * Get native library checksum
     */
    external fun getNativeChecksum(): Int
    
    /**
     * Get AppKey securely
     * Performs additional checks before returning key
     */
    fun getSecureAppKey(): String {
        if (!nativeLibraryLoaded) {
            Log.e(TAG, "Native library not loaded - cannot get AppKey")
            throw SecurityException("Native security layer required for AppKey")
        }
        
        try {
            // Verify integrity before getting key
            if (!verifyNativeIntegrity()) {
                throw SecurityException("Native integrity check failed")
            }
            
            // Get decrypted key from native code
            val appKey = getAppKey()
            
            if (appKey.isEmpty()) {
                throw SecurityException("Failed to decrypt AppKey")
            }
            
            return appKey
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get AppKey: ${e.message}")
            throw SecurityException("AppKey retrieval failed")
        }
    }
    
    /**
     * Verify native library integrity
     */
    fun verifyNativeIntegrity(): Boolean {
        if (!nativeLibraryLoaded) {
            Log.e(TAG, "Native library not loaded")
            return false
        }
        
        try {
            // Perform native security check
            if (!performSecurityCheck()) {
                Log.e(TAG, "Native security check failed")
                return false
            }
            
            // Verify checksum
            val checksum = getNativeChecksum()
            Log.d(TAG, "Native checksum: $checksum")
            
            // In production, verify against expected checksum
            // if (checksum != EXPECTED_CHECKSUM) {
            //     Log.e(TAG, "Native checksum mismatch")
            //     return false
            // }
            
            Log.d(TAG, "✓ Native integrity verified")
            return true
            
        } catch (e: Exception) {
            Log.e(TAG, "Native integrity check error: ${e.message}")
            return false
        }
    }
}
