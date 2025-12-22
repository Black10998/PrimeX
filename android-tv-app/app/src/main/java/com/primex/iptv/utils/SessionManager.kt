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

        // Check if auth token exists
        val token = PreferenceManager.getAuthToken(context)
        android.util.Log.d(TAG, "Token exists: ${!token.isNullOrEmpty()}")
        if (token.isNullOrEmpty()) {
            android.util.Log.e(TAG, "Token is null or empty - session invalid")
            return false
        }

        // Check if subscription is expired
        val isExpired = PreferenceManager.isSubscriptionExpired(context)
        android.util.Log.d(TAG, "Subscription expired: $isExpired")
        
        if (isExpired) {
            android.util.Log.w(TAG, "Subscription expired - logging out user")
            logoutUser(context, "Your subscription has expired")
            return false
        }

        android.util.Log.d(TAG, "Session is valid")
        return true
    }

    fun logoutUser(context: Context, reason: String? = null) {
        // Clear all user data
        PreferenceManager.logout(context)

        // Navigate to login screen
        val intent = Intent(context, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            reason?.let { putExtra("logout_reason", it) }
        }
        context.startActivity(intent)
    }

    fun validateAndRefreshSession(context: Context, onValid: () -> Unit, onInvalid: () -> Unit) {
        if (checkSessionValidity(context)) {
            onValid()
        } else {
            onInvalid()
        }
    }
}
