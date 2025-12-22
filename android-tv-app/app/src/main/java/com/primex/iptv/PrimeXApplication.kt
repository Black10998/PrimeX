package com.primex.iptv

import android.app.Application
import android.content.Context
import com.primex.iptv.utils.LocaleHelper

class PrimeXApplication : Application() {

    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(LocaleHelper.onAttach(base))
    }

    override fun onCreate() {
        super.onCreate()
        // Initialize locale on app start
        LocaleHelper.onAttach(this)
    }
}
