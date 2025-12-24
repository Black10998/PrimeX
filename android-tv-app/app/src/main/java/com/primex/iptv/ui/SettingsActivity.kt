package com.primex.iptv.ui

import android.os.Bundle
import android.widget.VideoView
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.utils.VideoBackgroundHelper

class SettingsActivity : FragmentActivity() {

    private var videoBackground: VideoView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        
        // Setup video background
        videoBackground = findViewById(R.id.video_background)
        videoBackground?.let {
            VideoBackgroundHelper.setupVideoBackground(it, R.raw.bg_settings)
        }
        
        if (savedInstanceState == null) {
            val fragment = SettingsFragment()
            supportFragmentManager.beginTransaction()
                .replace(R.id.settings_fragment, fragment)
                .commit()
        }
    }

    override fun onPause() {
        super.onPause()
        VideoBackgroundHelper.pauseVideo(videoBackground)
    }

    override fun onResume() {
        super.onResume()
        VideoBackgroundHelper.resumeVideo(videoBackground)
    }

    override fun onDestroy() {
        super.onDestroy()
        VideoBackgroundHelper.releaseVideo(videoBackground)
    }
}
