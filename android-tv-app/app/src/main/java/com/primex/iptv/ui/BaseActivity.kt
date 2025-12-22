package com.primex.iptv.ui

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import com.primex.iptv.utils.LocaleHelper

abstract class BaseActivity : ComponentActivity() {

    override fun attachBaseContext(newBase: Context) {
        // DO NOT access SharedPreferences here - causes crash on Android TV
        // Locale will be applied in onCreate()
        super.attachBaseContext(newBase)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Apply saved locale - safe to access SharedPreferences here
        try {
            LocaleHelper.applyLocale(this)
        } catch (e: Exception) {
            android.util.Log.e("BaseActivity", "Error applying locale: ${e.message}", e)
        }
    }
}
