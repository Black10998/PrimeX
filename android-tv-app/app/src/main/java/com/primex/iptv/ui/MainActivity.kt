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
        
        // Only check session validity if app was in background for a while
        // Don't check on every resume to avoid false logouts on TV devices
        android.util.Log.d("MainActivity", "onResume - checking session")
        
        // Check if token exists at minimum
        val token = com.primex.iptv.utils.PreferenceManager.getAuthToken(this)
        if (token.isNullOrEmpty()) {
            android.util.Log.e("MainActivity", "No token found - redirecting to login")
            SessionManager.logoutUser(this, "Session expired")
        }
    }
}
