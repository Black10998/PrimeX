package com.primex.iptv.ui

import android.os.Bundle
import android.widget.CheckBox
import android.widget.SeekBar
import android.widget.TextView
import com.primex.iptv.R
import com.primex.iptv.utils.PreferenceManager

class ControlSettingsActivity : BaseActivity() {

    private lateinit var soundEnabledCheckbox: CheckBox
    private lateinit var vibrationCheckbox: CheckBox
    private lateinit var autoPlayCheckbox: CheckBox
    private lateinit var seekSensitivitySeekBar: SeekBar
    private lateinit var seekSensitivityText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_control_settings)

        initViews()
        loadSettings()
        setupListeners()
    }

    private fun initViews() {
        soundEnabledCheckbox = findViewById(R.id.sound_enabled_checkbox)
        vibrationCheckbox = findViewById(R.id.vibration_checkbox)
        autoPlayCheckbox = findViewById(R.id.autoplay_checkbox)
        seekSensitivitySeekBar = findViewById(R.id.seek_sensitivity_seekbar)
        seekSensitivityText = findViewById(R.id.seek_sensitivity_text)
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("app_settings", MODE_PRIVATE)
        
        soundEnabledCheckbox.isChecked = prefs.getBoolean("sound_enabled", true)
        vibrationCheckbox.isChecked = prefs.getBoolean("vibration_enabled", true)
        autoPlayCheckbox.isChecked = prefs.getBoolean("autoplay_enabled", false)
        
        val seekSensitivity = prefs.getInt("seek_sensitivity", 10)
        seekSensitivitySeekBar.progress = seekSensitivity
        updateSeekSensitivityText(seekSensitivity)
    }

    private fun setupListeners() {
        val prefs = getSharedPreferences("app_settings", MODE_PRIVATE)
        
        soundEnabledCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("sound_enabled", isChecked).apply()
            com.primex.iptv.utils.SoundManager.setEnabled(isChecked, this)
        }

        vibrationCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("vibration_enabled", isChecked).apply()
        }

        autoPlayCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("autoplay_enabled", isChecked).apply()
        }

        seekSensitivitySeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                updateSeekSensitivityText(progress)
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) {}

            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                seekBar?.let {
                    prefs.edit().putInt("seek_sensitivity", it.progress).apply()
                }
            }
        })
    }

    private fun updateSeekSensitivityText(value: Int) {
        seekSensitivityText.text = "${value}s"
    }
}
