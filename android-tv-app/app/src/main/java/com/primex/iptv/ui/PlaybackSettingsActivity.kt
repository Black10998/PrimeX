package com.primex.iptv.ui

import android.os.Bundle
import android.view.View
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.Switch
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R

class PlaybackSettingsActivity : FragmentActivity() {

    private lateinit var qualityGroup: RadioGroup
    private lateinit var autoplaySwitch: Switch

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_playback_settings)
        
        setupViews()
        loadSettings()
    }

    private fun setupViews() {
        qualityGroup = findViewById(R.id.quality_group)
        autoplaySwitch = findViewById(R.id.autoplay_switch)
        
        qualityGroup.setOnCheckedChangeListener { _, checkedId ->
            saveQualitySetting(checkedId)
        }
        
        autoplaySwitch.setOnCheckedChangeListener { _, isChecked ->
            saveAutoplaySetting(isChecked)
        }
    }

    private fun loadSettings() {
        // Load saved settings from SharedPreferences
        val prefs = getSharedPreferences("playback_settings", MODE_PRIVATE)
        
        val quality = prefs.getString("quality", "auto")
        when (quality) {
            "auto" -> qualityGroup.check(R.id.quality_auto)
            "1080p" -> qualityGroup.check(R.id.quality_1080p)
            "720p" -> qualityGroup.check(R.id.quality_720p)
            "480p" -> qualityGroup.check(R.id.quality_480p)
        }
        
        autoplaySwitch.isChecked = prefs.getBoolean("autoplay", true)
    }

    private fun saveQualitySetting(checkedId: Int) {
        val quality = when (checkedId) {
            R.id.quality_1080p -> "1080p"
            R.id.quality_720p -> "720p"
            R.id.quality_480p -> "480p"
            else -> "auto"
        }
        
        getSharedPreferences("playback_settings", MODE_PRIVATE)
            .edit()
            .putString("quality", quality)
            .apply()
    }

    private fun saveAutoplaySetting(enabled: Boolean) {
        getSharedPreferences("playback_settings", MODE_PRIVATE)
            .edit()
            .putBoolean("autoplay", enabled)
            .apply()
    }
}
