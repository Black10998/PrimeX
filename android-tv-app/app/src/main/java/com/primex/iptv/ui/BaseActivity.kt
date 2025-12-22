package com.primex.iptv.ui

import android.app.Activity
import android.content.Context
import android.os.Bundle
import com.primex.iptv.utils.LocaleHelper

abstract class BaseActivity : Activity() {

    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(LocaleHelper.onAttach(newBase))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Apply locale on create as well
        LocaleHelper.onAttach(this)
    }
}
