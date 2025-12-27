package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.VideoView
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.models.Channel
import com.primex.iptv.utils.SessionManager
import com.primex.iptv.utils.VideoBackgroundHelper

class MainActivity : FragmentActivity() {

    private var mainVideoBackground: VideoView? = null
    private var currentVideoResource: Int = R.raw.bg_home
    
    // Channel Sidebar
    private lateinit var sidebarContainer: FrameLayout
    private var channelSidebar: ChannelSidebarFragment? = null
    private var isSidebarVisible = false

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
        
        // Setup sidebar container
        sidebarContainer = findViewById(R.id.channel_sidebar_container)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.main_browse_fragment, HomeFragment())
                .commit()
        }
    }
    
    /**
     * Toggle channel sidebar visibility
     */
    fun toggleChannelSidebar() {
        android.util.Log.d("MainActivity", "toggleChannelSidebar called - current state: $isSidebarVisible")
        if (isSidebarVisible) {
            hideSidebar()
        } else {
            showSidebar()
        }
    }
    
    /**
     * Show channel sidebar with slide-in animation
     */
    private fun showSidebar() {
        android.util.Log.d("MainActivity", "showSidebar called")
        
        if (channelSidebar == null) {
            android.util.Log.d("MainActivity", "Creating new sidebar fragment")
            channelSidebar = ChannelSidebarFragment.newInstance()
            supportFragmentManager.beginTransaction()
                .replace(R.id.channel_sidebar_container, channelSidebar!!)
                .commit()
        }
        
        android.util.Log.d("MainActivity", "Animating sidebar in")
        sidebarContainer.visibility = View.VISIBLE
        sidebarContainer.animate()
            .translationX(0f)
            .setDuration(300)
            .withEndAction {
                isSidebarVisible = true
                android.util.Log.d("MainActivity", "Sidebar now visible")
                channelSidebar?.requestSearchFocus()
            }
            .start()
    }
    
    /**
     * Hide channel sidebar with slide-out animation
     */
    private fun hideSidebar() {
        sidebarContainer.animate()
            .translationX(-320f * resources.displayMetrics.density)
            .setDuration(300)
            .withEndAction {
                sidebarContainer.visibility = View.GONE
                isSidebarVisible = false
            }
            .start()
    }
    
    /**
     * Set channels for sidebar
     */
    fun setSidebarChannels(channels: List<Channel>) {
        channelSidebar?.setChannels(channels)
    }
    
    /**
     * Set channel selection listener
     */
    fun setOnChannelSelectedListener(listener: (Channel) -> Unit) {
        channelSidebar?.setOnChannelSelectedListener(listener)
    }
    
    // Removed MENU button trigger - channel browser is now UI-driven

    fun changeVideoBackground(videoResource: Int) {
        android.util.Log.d("MainActivity", "Request to change video to: $videoResource (current: $currentVideoResource)")
        
        mainVideoBackground?.let { videoView ->
            // Always stop current video first
            try {
                videoView.stopPlayback()
                videoView.suspend()
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Error stopping video", e)
            }
            
            // Update current resource
            currentVideoResource = videoResource
            
            // Setup new video
            VideoBackgroundHelper.setupVideoBackground(videoView, videoResource)
            
            android.util.Log.d("MainActivity", "Video changed to: $videoResource")
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
