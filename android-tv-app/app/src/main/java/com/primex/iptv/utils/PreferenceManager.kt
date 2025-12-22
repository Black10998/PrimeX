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
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
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
        getPreferences(context).edit()
            .putString(KEY_USERNAME, username)
            .putString(KEY_AUTH_TOKEN, token)
            .putInt(KEY_USER_ID, userId ?: 0)
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply {
                expiresAt?.let { putString(KEY_SUBSCRIPTION_EXPIRES, it) }
            }
            .apply()
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
        val expiresAt = getSubscriptionExpires(context) ?: return false
        
        return try {
            val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            format.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val expiryDate = format.parse(expiresAt)
            val now = java.util.Date()
            expiryDate?.before(now) ?: false
        } catch (e: Exception) {
            false
        }
    }

    fun clearAuthToken(context: Context) {
        getPreferences(context).edit()
            .remove(KEY_AUTH_TOKEN)
            .apply()
    }
}
