package com.primex.iptv

import android.app.Application
import android.content.Context
import android.content.res.Configuration
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
        
        // Prefer IPv4 for Android TV network compatibility
        System.setProperty("java.net.preferIPv4Stack", "true")
        System.setProperty("java.net.preferIPv6Addresses", "false")
        
        android.util.Log.d("PrimeXApplication", "Network preferences set: IPv4 preferred")
        
        // NOW it's safe to access SharedPreferences and apply saved locale
        try {
            LocaleHelper.applyLocale(this)
        } catch (e: Exception) {
            android.util.Log.e("PrimeXApplication", "Error applying locale: ${e.message}", e)
        }
    }
}
