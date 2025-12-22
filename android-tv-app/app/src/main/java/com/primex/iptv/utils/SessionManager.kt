package com.primex.iptv.utils

import android.content.Context
import android.content.Intent
import com.primex.iptv.ui.LoginActivity

object SessionManager {

    fun checkSessionValidity(context: Context): Boolean {
        // Check if user is logged in
        if (!PreferenceManager.isLoggedIn(context)) {
            return false
        }

        // Check if auth token exists
        val token = PreferenceManager.getAuthToken(context)
        if (token.isNullOrEmpty()) {
            return false
        }

        // Check if subscription is expired
        if (PreferenceManager.isSubscriptionExpired(context)) {
            logoutUser(context, "Your subscription has expired")
            return false
        }

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
