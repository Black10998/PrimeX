package com.primex.iptv.security

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

/**
 * SecurityLockManager - Production-Grade Security Lock System
 * 
 * GRACEFUL FAILURE MODEL:
 * - Detects security violations (repackaging, re-signing, tampering)
 * - Enters "Security Lock Mode" instead of crashing
 * - Blocks service access but keeps app functional
 * - Shows professional security warning to user
 * - No false positives for legitimate users
 * - Google Play compliant
 * 
 * This is the Netflix/Spotify model: strong protection + stable UX
 */
object SecurityLockManager {
    
    private const val TAG = "SecurityLockManager"
    private const val PREFS_NAME = "security_lock_prefs"
    private const val KEY_SECURITY_LOCKED = "security_locked"
    private const val KEY_LOCK_REASON = "lock_reason"
    private const val KEY_LOCK_TIMESTAMP = "lock_timestamp"
    
    /**
     * Security lock reasons
     */
    enum class LockReason(val code: Int, val message: String) {
        NONE(0, "No security violation"),
        PACKAGE_MISMATCH(1, "Package verification failed"),
        SIGNATURE_MISMATCH(2, "Signature verification failed"),
        CODE_TAMPERING(3, "Code integrity violation detected"),
        BACKEND_MISMATCH(4, "Backend verification failed"),
        UNKNOWN(99, "Unknown security violation");
        
        companion object {
            fun fromCode(code: Int): LockReason {
                return values().find { it.code == code } ?: UNKNOWN
            }
        }
    }
    
    private var isLocked = false
    private var lockReason: LockReason = LockReason.NONE
    private var prefs: SharedPreferences? = null
    
    /**
     * Initialize security lock manager
     */
    fun initialize(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        // Load lock state from persistent storage
        isLocked = prefs?.getBoolean(KEY_SECURITY_LOCKED, false) ?: false
        val reasonCode = prefs?.getInt(KEY_LOCK_REASON, 0) ?: 0
        lockReason = LockReason.fromCode(reasonCode)
        
        if (isLocked) {
            Log.w(TAG, "App is in Security Lock Mode: ${lockReason.message}")
        } else {
            Log.d(TAG, "Security Lock Manager initialized - app is unlocked")
        }
    }
    
    /**
     * Check if app is in security lock mode
     */
    fun isSecurityLocked(): Boolean {
        return isLocked
    }
    
    /**
     * Get lock reason
     */
    fun getLockReason(): LockReason {
        return lockReason
    }
    
    /**
     * Get lock timestamp
     */
    fun getLockTimestamp(): Long {
        return prefs?.getLong(KEY_LOCK_TIMESTAMP, 0) ?: 0
    }
    
    /**
     * Enter security lock mode
     * GRACEFUL: Does not crash app, just blocks service
     */
    fun enterSecurityLockMode(reason: LockReason) {
        if (isLocked) {
            // Already locked
            return
        }
        
        Log.e(TAG, "ENTERING SECURITY LOCK MODE: ${reason.message}")
        
        isLocked = true
        lockReason = reason
        
        // Persist lock state
        prefs?.edit()?.apply {
            putBoolean(KEY_SECURITY_LOCKED, true)
            putInt(KEY_LOCK_REASON, reason.code)
            putLong(KEY_LOCK_TIMESTAMP, System.currentTimeMillis())
            apply()
        }
        
        Log.e(TAG, "Security Lock Mode activated - service access blocked")
    }
    
    /**
     * Exit security lock mode (for testing/debugging only)
     * In production, this should require backend verification
     */
    fun exitSecurityLockMode() {
        Log.w(TAG, "Exiting Security Lock Mode")
        
        isLocked = false
        lockReason = LockReason.NONE
        
        prefs?.edit()?.apply {
            putBoolean(KEY_SECURITY_LOCKED, false)
            putInt(KEY_LOCK_REASON, 0)
            putLong(KEY_LOCK_TIMESTAMP, 0)
            apply()
        }
    }
    
    /**
     * Check if service access is allowed
     * Returns false if in security lock mode
     */
    fun isServiceAccessAllowed(): Boolean {
        return !isLocked
    }
    
    /**
     * Get user-friendly lock message
     */
    fun getLockMessage(): String {
        return when (lockReason) {
            LockReason.PACKAGE_MISMATCH -> 
                "This app has been modified and cannot be verified. Please download the official version from Google Play."
            
            LockReason.SIGNATURE_MISMATCH -> 
                "This app's security certificate is invalid. Please download the official version from Google Play."
            
            LockReason.CODE_TAMPERING -> 
                "This app has been tampered with and cannot be used. Please download the official version from Google Play."
            
            LockReason.BACKEND_MISMATCH -> 
                "This app is not connected to the official service. Please download the official version from Google Play."
            
            LockReason.UNKNOWN -> 
                "A security issue was detected. Please download the official version from Google Play."
            
            LockReason.NONE -> 
                ""
        }
    }
    
    /**
     * Get technical details for support
     */
    fun getTechnicalDetails(): String {
        return """
            Security Lock Details:
            - Locked: $isLocked
            - Reason: ${lockReason.message}
            - Code: ${lockReason.code}
            - Timestamp: ${getLockTimestamp()}
        """.trimIndent()
    }
}
