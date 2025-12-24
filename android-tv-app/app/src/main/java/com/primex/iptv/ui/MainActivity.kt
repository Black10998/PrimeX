package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.widget.VideoView
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.utils.SessionManager
import com.primex.iptv.utils.VideoBackgroundHelper

class MainActivity : FragmentActivity() {

    private var mainVideoBackground: VideoView? = null
    private var currentVideoResource: Int = R.raw.bg_home

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Check session validity
        if (!SessionManager.checkSessionValidity(this)) {
            return // SessionManager will handle navigation to login
        }
        
        // User is logged in with valid session, show main UI
        setContentView(R.layout.activity_main)

        // Setup main video background
        mainVideoBackground = findViewById(R.id.main_video_background)
        changeVideoBackground(R.raw.bg_home)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.main_browse_fragment, HomeFragment())
                .commit()
        }
    }

    fun changeVideoBackground(videoResource: Int) {
        android.util.Log.d("MainActivity", "Changing video background to: $videoResource (current: $currentVideoResource)")
        
        if (currentVideoResource != videoResource) {
            currentVideoResource = videoResource
            mainVideoBackground?.let { videoView ->
                // Stop current video immediately
                videoView.stopPlayback()
                
                // Setup new video
                VideoBackgroundHelper.setupVideoBackground(videoView, videoResource)
                
                android.util.Log.d("MainActivity", "Video background changed successfully")
            }
        } else {
            android.util.Log.d("MainActivity", "Video already showing, skipping change")
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Resume video playback
        VideoBackgroundHelper.resumeVideo(mainVideoBackground)
        
        // Check if Xtream credentials exist
        android.util.Log.d("MainActivity", "onResume - checking Xtream credentials")
        
        val username = com.primex.iptv.utils.PreferenceManager.getXtreamUsername(this)
        val password = com.primex.iptv.utils.PreferenceManager.getXtreamPassword(this)
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            android.util.Log.e("MainActivity", "No Xtream credentials found - redirecting to login")
            SessionManager.logoutUser(this, "Session expired")
        } else if (com.primex.iptv.utils.PreferenceManager.isXtreamSubscriptionExpired(this)) {
            android.util.Log.e("MainActivity", "Xtream subscription expired - redirecting to login")
            SessionManager.logoutUser(this, "Subscription expired")
        }
    }

    override fun onPause() {
        super.onPause()
        VideoBackgroundHelper.pauseVideo(mainVideoBackground)
    }

    override fun onDestroy() {
        super.onDestroy()
        VideoBackgroundHelper.releaseVideo(mainVideoBackground)
    }
}
