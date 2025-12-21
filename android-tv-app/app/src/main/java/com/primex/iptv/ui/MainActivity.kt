package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.utils.PreferenceManager

class MainActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Check if device is activated
        if (!PreferenceManager.isActivated(this)) {
            // Not activated, go to activation screen
            val intent = Intent(this, ActivationActivity::class.java)
            startActivity(intent)
            finish()
            return
        }

        setContentView(R.layout.activity_main)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.main_browse_fragment, MainFragment())
                .commit()
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Verify activation status on resume
        if (!PreferenceManager.isActivated(this)) {
            val intent = Intent(this, ActivationActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
}
