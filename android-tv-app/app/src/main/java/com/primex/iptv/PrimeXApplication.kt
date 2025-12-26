package com.primex.iptv

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import com.primex.iptv.api.ApiClient
import com.primex.iptv.config.ConfigManager
import com.primex.iptv.utils.LocaleHelper
import java.util.*

class PrimeXApplication : Application() {

    override fun attachBaseContext(base: Context) {
        // DO NOT access SharedPreferences here - causes crash on Android TV
        // Use default locale (English) at this stage
        val locale = Locale("en")
        Locale.setDefault(locale)
        
        val configuration = Configuration(base.resources.configuration)
        configuration.setLocale(locale)
        
        val context = base.createConfigurationContext(configuration)
        super.attachBaseContext(context)
    }

    override fun onCreate() {
        super.onCreate()
        
        // SECURITY: Verify app integrity on startup
        try {
            // This will throw SecurityException if app is tampered with
            ConfigManager.getFullBaseUrl(this)
            android.util.Log.d("PrimeXApplication", "App integrity verified - locked to PrimeX backend")
        } catch (e: SecurityException) {
            android.util.Log.e("PrimeXApplication", "SECURITY: App integrity check failed - terminating")
            // App will not function if integrity check fails
            System.exit(1)
            return
        }
        
        // Initialize ApiClient with application context
        ApiClient.initialize(this)
        android.util.Log.d("PrimeXApplication", "ApiClient initialized - PrimeX backend only")
        
        // Prefer IPv4 for Android TV network compatibility
        System.setProperty("java.net.preferIPv4Stack", "true")
        System.setProperty("java.net.preferIPv6Addresses", "false")
        
        android.util.Log.d("PrimeXApplication", "Network preferences set: IPv4 preferred")
        
        // Initialize SoundManager
        try {
            com.primex.iptv.utils.SoundManager.initialize(this)
            android.util.Log.d("PrimeXApplication", "SoundManager initialized")
        } catch (e: Exception) {
            android.util.Log.e("PrimeXApplication", "Error initializing SoundManager: ${e.message}", e)
        }
        
        // NOW it's safe to access SharedPreferences and apply saved locale
        try {
            LocaleHelper.applyLocale(this)
        } catch (e: Exception) {
            android.util.Log.e("PrimeXApplication", "Error applying locale: ${e.message}", e)
        }
    }
}
