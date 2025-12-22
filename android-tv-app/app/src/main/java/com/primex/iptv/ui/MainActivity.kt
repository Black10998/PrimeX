package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.utils.SessionManager

class MainActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Check session validity
        if (!SessionManager.checkSessionValidity(this)) {
            return // SessionManager will handle navigation to login
        }
        
        // User is logged in with valid session, show main UI
        setContentView(R.layout.activity_main)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.main_browse_fragment, MainFragment())
                .commit()
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Check session validity on resume
        if (!SessionManager.checkSessionValidity(this)) {
            return // SessionManager will handle navigation to login
        }
    }
}
