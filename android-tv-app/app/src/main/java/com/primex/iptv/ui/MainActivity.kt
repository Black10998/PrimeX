package com.primex.iptv.ui

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R

class MainActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Always show main UI - no blocking on device validation
        setContentView(R.layout.activity_main)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.main_browse_fragment, MainFragment())
                .commit()
        }
    }
}
