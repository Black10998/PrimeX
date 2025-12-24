package com.primex.iptv.utils

import android.content.Context
import android.content.res.Configuration
import android.os.Build
import java.util.*

object LocaleHelper {

    private const val TAG = "LocaleHelper"
    private const val DEFAULT_LANGUAGE = "ar" // Arabic is default

    fun setLocale(context: Context, languageCode: String): Context {
        PreferenceManager.saveLanguage(context, languageCode)
        return updateResources(context, languageCode)
    }

    /**
     * Apply saved locale - ONLY call from onCreate(), NOT from attachBaseContext()
     * Safe to access SharedPreferences here
     */
    fun applyLocale(context: Context) {
        try {
            val lang = PreferenceManager.getLanguage(context)
            android.util.Log.d(TAG, "Applying saved locale: $lang")
            updateResourcesInPlace(context, lang)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error applying locale, using default", e)
            updateResourcesInPlace(context, DEFAULT_LANGUAGE)
        }
    }

    /**
     * DEPRECATED - Do not use in attachBaseContext()
     * Use applyLocale() in onCreate() instead
     */
    @Deprecated("Do not use in attachBaseContext - causes crash on Android TV")
    fun onAttach(context: Context): Context {
        // Return context as-is, locale will be applied in onCreate()
        android.util.Log.w(TAG, "onAttach() called - this should not be used in attachBaseContext()")
        return context
    }
    
    private fun updateResourcesInPlace(context: Context, language: String) {
        val locale = Locale(language)
        Locale.setDefault(locale)

        val configuration = Configuration(context.resources.configuration)
        configuration.setLocale(locale)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLayoutDirection(locale)
        }

        @Suppress("DEPRECATION")
        context.resources.updateConfiguration(configuration, context.resources.displayMetrics)
    }

    private fun updateResources(context: Context, language: String): Context {
        val locale = Locale(language)
        Locale.setDefault(locale)

        val configuration = Configuration(context.resources.configuration)
        configuration.setLocale(locale)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLayoutDirection(locale)
        }

        return context.createConfigurationContext(configuration)
    }

    fun getCurrentLanguage(context: Context): String {
        return PreferenceManager.getLanguage(context)
    }

    fun isRTL(context: Context): Boolean {
        val lang = getCurrentLanguage(context)
        return lang == "ar"
    }
}
