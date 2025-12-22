package com.primex.iptv.utils

import android.content.Context
import android.content.SharedPreferences

object PreferenceManager {

    private const val PREF_NAME = "primex_prefs"
    private const val KEY_USERNAME = "username"
    private const val KEY_AUTH_TOKEN = "auth_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_IS_LOGGED_IN = "is_logged_in"
    private const val KEY_DEVICE_KEY = "device_key"
    private const val KEY_MAC_ADDRESS = "mac_address"
    private const val KEY_IS_ACTIVATED = "is_activated"
    private const val KEY_SUBSCRIPTION_PLAN = "subscription_plan"
    private const val KEY_SUBSCRIPTION_EXPIRES = "subscription_expires"
    private const val KEY_LANGUAGE = "app_language"

    private fun getPreferences(context: Context): SharedPreferences {
        // Use application context to ensure persistence across activities
        return context.applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }
    
    private fun saveWithCommit(context: Context, block: SharedPreferences.Editor.() -> Unit) {
        // Use commit() instead of apply() for immediate persistence on TV devices
        val editor = getPreferences(context).edit()
        editor.block()
        editor.commit() // Synchronous write - critical for TV devices
    }

    fun saveDeviceKey(context: Context, deviceKey: String) {
        getPreferences(context).edit().putString(KEY_DEVICE_KEY, deviceKey).apply()
    }

    fun getDeviceKey(context: Context): String? {
        return getPreferences(context).getString(KEY_DEVICE_KEY, null)
    }

    fun saveMacAddress(context: Context, macAddress: String) {
        getPreferences(context).edit().putString(KEY_MAC_ADDRESS, macAddress).apply()
    }

    fun getMacAddress(context: Context): String? {
        return getPreferences(context).getString(KEY_MAC_ADDRESS, null)
    }

    fun setActivated(context: Context, activated: Boolean) {
        getPreferences(context).edit().putBoolean(KEY_IS_ACTIVATED, activated).apply()
    }

    fun isActivated(context: Context): Boolean {
        return getPreferences(context).getBoolean(KEY_IS_ACTIVATED, false)
    }

    fun saveSubscriptionInfo(context: Context, planName: String, expiresAt: String) {
        getPreferences(context).edit()
            .putString(KEY_SUBSCRIPTION_PLAN, planName)
            .putString(KEY_SUBSCRIPTION_EXPIRES, expiresAt)
            .putBoolean(KEY_IS_ACTIVATED, true)
            .apply()
    }

    fun getSubscriptionPlan(context: Context): String? {
        return getPreferences(context).getString(KEY_SUBSCRIPTION_PLAN, null)
    }

    fun getSubscriptionExpires(context: Context): String? {
        return getPreferences(context).getString(KEY_SUBSCRIPTION_EXPIRES, null)
    }

    fun saveUserCredentials(context: Context, username: String, token: String?, userId: Int?, expiresAt: String? = null) {
        saveWithCommit(context) {
            putString(KEY_USERNAME, username)
            putString(KEY_AUTH_TOKEN, token)
            putInt(KEY_USER_ID, userId ?: 0)
            putBoolean(KEY_IS_LOGGED_IN, true)
            expiresAt?.let { putString(KEY_SUBSCRIPTION_EXPIRES, it) }
        }
        
        // Verify save was successful
        val savedToken = getAuthToken(context)
        if (savedToken != token) {
            android.util.Log.e("PreferenceManager", "Token save verification FAILED")
        } else {
            android.util.Log.d("PreferenceManager", "Token saved and verified successfully")
        }
    }

    fun isLoggedIn(context: Context): Boolean {
        return getPreferences(context).getBoolean(KEY_IS_LOGGED_IN, false)
    }

    fun getAuthToken(context: Context): String? {
        return getPreferences(context).getString(KEY_AUTH_TOKEN, null)
    }

    fun getUsername(context: Context): String? {
        return getPreferences(context).getString(KEY_USERNAME, null)
    }

    fun getUserId(context: Context): Int {
        return getPreferences(context).getInt(KEY_USER_ID, 0)
    }

    fun logout(context: Context) {
        getPreferences(context).edit()
            .putBoolean(KEY_IS_LOGGED_IN, false)
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USERNAME)
            .remove(KEY_USER_ID)
            .apply()
    }

    fun clearAll(context: Context) {
        getPreferences(context).edit().clear().apply()
    }

    fun saveLanguage(context: Context, languageCode: String) {
        getPreferences(context).edit().putString(KEY_LANGUAGE, languageCode).apply()
    }

    fun getLanguage(context: Context): String {
        return getPreferences(context).getString(KEY_LANGUAGE, "en") ?: "en"
    }

    fun isSubscriptionExpired(context: Context): Boolean {
        val expiresAt = getSubscriptionExpires(context)
        
        // If no expiry date, don't block the user
        if (expiresAt.isNullOrEmpty()) {
            android.util.Log.d("PreferenceManager", "No expiry date found - allowing access")
            return false
        }
        
        return try {
            // Try multiple date formats to handle different server responses
            val formats = listOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd"
            )
            
            var expiryDate: java.util.Date? = null
            for (formatStr in formats) {
                try {
                    val format = java.text.SimpleDateFormat(formatStr, java.util.Locale.US)
                    format.timeZone = java.util.TimeZone.getTimeZone("UTC")
                    expiryDate = format.parse(expiresAt)
                    if (expiryDate != null) break
                } catch (e: Exception) {
                    continue
                }
            }
            
            if (expiryDate == null) {
                android.util.Log.w("PreferenceManager", "Could not parse expiry date: $expiresAt - allowing access")
                return false
            }
            
            val now = java.util.Date()
            val isExpired = expiryDate.before(now)
            
            android.util.Log.d("PreferenceManager", "Subscription check - Expires: $expiryDate, Now: $now, Expired: $isExpired")
            
            isExpired
        } catch (e: Exception) {
            android.util.Log.e("PreferenceManager", "Error checking expiry: ${e.message}")
            // On error, don't block the user
            false
        }
    }

    fun clearAuthToken(context: Context) {
        getPreferences(context).edit()
            .remove(KEY_AUTH_TOKEN)
            .apply()
    }
}
