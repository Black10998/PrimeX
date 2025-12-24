package com.primex.iptv.ui

import android.os.Bundle
import android.widget.CheckBox
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.SeekBar
import android.widget.TextView
import com.primex.iptv.R

class StrokeSettingsActivity : BaseActivity() {

    private lateinit var subtitleStrokeCheckbox: CheckBox
    private lateinit var strokeWidthSeekBar: SeekBar
    private lateinit var strokeWidthText: TextView
    private lateinit var strokeColorGroup: RadioGroup
    private lateinit var blackRadio: RadioButton
    private lateinit var whiteRadio: RadioButton
    private lateinit var goldRadio: RadioButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_stroke_settings)

        initViews()
        loadSettings()
        setupListeners()
    }

    private fun initViews() {
        subtitleStrokeCheckbox = findViewById(R.id.subtitle_stroke_checkbox)
        strokeWidthSeekBar = findViewById(R.id.stroke_width_seekbar)
        strokeWidthText = findViewById(R.id.stroke_width_text)
        strokeColorGroup = findViewById(R.id.stroke_color_group)
        blackRadio = findViewById(R.id.radio_black)
        whiteRadio = findViewById(R.id.radio_white)
        goldRadio = findViewById(R.id.radio_gold)
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("app_settings", MODE_PRIVATE)
        
        subtitleStrokeCheckbox.isChecked = prefs.getBoolean("subtitle_stroke_enabled", true)
        
        val strokeWidth = prefs.getInt("stroke_width", 2)
        strokeWidthSeekBar.progress = strokeWidth
        updateStrokeWidthText(strokeWidth)
        
        val strokeColor = prefs.getString("stroke_color", "black")
        when (strokeColor) {
            "black" -> blackRadio.isChecked = true
            "white" -> whiteRadio.isChecked = true
            "gold" -> goldRadio.isChecked = true
        }
    }

    private fun setupListeners() {
        val prefs = getSharedPreferences("app_settings", MODE_PRIVATE)
        
        subtitleStrokeCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("subtitle_stroke_enabled", isChecked).apply()
        }

        strokeWidthSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                updateStrokeWidthText(progress)
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) {}

            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                seekBar?.let {
                    prefs.edit().putInt("stroke_width", it.progress).apply()
                }
            }
        })

        strokeColorGroup.setOnCheckedChangeListener { _, checkedId ->
            val color = when (checkedId) {
                R.id.radio_black -> "black"
                R.id.radio_white -> "white"
                R.id.radio_gold -> "gold"
                else -> "black"
            }
            prefs.edit().putString("stroke_color", color).apply()
        }
    }

    private fun updateStrokeWidthText(value: Int) {
        strokeWidthText.text = "${value}px"
    }
}
