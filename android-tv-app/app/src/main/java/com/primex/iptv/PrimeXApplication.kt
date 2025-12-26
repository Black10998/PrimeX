package com.primex.iptv

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import com.primex.iptv.api.ApiClient
import com.primex.iptv.security.ProductionSecurityManager
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
        
        // PRODUCTION SECURITY: Initialize graceful security system
        // Violations enter Security Lock Mode (no crashes)
        ProductionSecurityManager.initialize(this)
        android.util.Log.d("PrimeXApplication", "✓ Production security initialized")
        
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
