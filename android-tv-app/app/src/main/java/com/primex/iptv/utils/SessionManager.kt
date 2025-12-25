package com.primex.iptv.utils

import android.content.Context
import android.content.Intent
import com.primex.iptv.ui.LoginActivity

object SessionManager {

    private const val TAG = "SessionManager"

    fun checkSessionValidity(context: Context): Boolean {
        android.util.Log.d(TAG, "Checking session validity...")
        
        // Check if user is logged in
        val isLoggedIn = PreferenceManager.isLoggedIn(context)
        android.util.Log.d(TAG, "Is logged in: $isLoggedIn")
        if (!isLoggedIn) {
            return false
        }

        // Check if Xtream credentials exist
        val username = PreferenceManager.getXtreamUsername(context)
        val password = PreferenceManager.getXtreamPassword(context)
        android.util.Log.d(TAG, "Xtream credentials exist: ${!username.isNullOrEmpty() && !password.isNullOrEmpty()}")
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            android.util.Log.e(TAG, "Xtream credentials missing - session invalid")
            return false
        }

        // Check if Xtream subscription is expired
        val isExpired = PreferenceManager.isXtreamSubscriptionExpired(context)
        android.util.Log.d(TAG, "Xtream subscription expired: $isExpired")
        
        if (isExpired) {
            android.util.Log.w(TAG, "Xtream subscription expired - logging out user")
            logoutUser(context, "Your subscription has expired")
            return false
        }

        android.util.Log.d(TAG, "Session is valid")
        return true
    }

    fun logoutUser(context: Context, reason: String? = null) {
        android.util.Log.w(TAG, "Logging out user: $reason")
        
        // Clear all user data
        PreferenceManager.logout(context)

        // Navigate to login screen
        val intent = Intent(context, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            reason?.let { putExtra("logout_reason", it) }
        }
        context.startActivity(intent)
    }
    
    /**
     * Handle unauthorized/forbidden response (401/403)
     * CRITICAL SECURITY: Immediately logs out deactivated users
     * 
     * @param context Application context
     * @param httpCode HTTP response code
     * @return True if unauthorized and handled
     */
    fun handleUnauthorizedResponse(context: Context, httpCode: Int): Boolean {
        if (httpCode == 401 || httpCode == 403) {
            android.util.Log.e(TAG, "Unauthorized access detected (HTTP $httpCode) - account may be deactivated")
            logoutUser(context, "Your account has been deactivated. Please contact support.")
            return true
        }
        return false
    }

    fun validateAndRefreshSession(context: Context, onValid: () -> Unit, onInvalid: () -> Unit) {
        if (checkSessionValidity(context)) {
            onValid()
        } else {
            onInvalid()
        }
    }
}
