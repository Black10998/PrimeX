package com.primex.iptv.ui

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R

class SettingsActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        
        if (savedInstanceState == null) {
            val fragment = SettingsFragment()
            supportFragmentManager.beginTransaction()
                .replace(R.id.settings_fragment, fragment)
                .commit()
        }
    }
}
