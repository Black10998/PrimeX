package com.primex.iptv.utils

import android.content.Context
import android.content.SharedPreferences

object PreferenceManager {

    private const val PREF_NAME = "primex_prefs"
    private const val KEY_DEVICE_KEY = "device_key"
    private const val KEY_MAC_ADDRESS = "mac_address"
    private const val KEY_IS_ACTIVATED = "is_activated"
    private const val KEY_SUBSCRIPTION_PLAN = "subscription_plan"
    private const val KEY_SUBSCRIPTION_EXPIRES = "subscription_expires"

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

    fun clearAll(context: Context) {
        getPreferences(context).edit().clear().apply()
    }
}
