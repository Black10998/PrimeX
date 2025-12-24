package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import com.primex.iptv.R
import com.primex.iptv.utils.LocaleHelper
import com.primex.iptv.utils.PreferenceManager

class LanguageSettingsActivity : BaseActivity() {

    private lateinit var languageGroup: RadioGroup
    private lateinit var arabicRadio: RadioButton
    private lateinit var englishRadio: RadioButton
    private lateinit var applyButton: View
    private lateinit var descriptionText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_language_settings)

        initViews()
        loadCurrentLanguage()
        setupListeners()
    }

    private fun initViews() {
        languageGroup = findViewById(R.id.language_group)
        arabicRadio = findViewById(R.id.radio_arabic)
        englishRadio = findViewById(R.id.radio_english)
        applyButton = findViewById(R.id.apply_button)
        descriptionText = findViewById(R.id.description_text)
    }

    private fun loadCurrentLanguage() {
        val currentLang = LocaleHelper.getCurrentLanguage(this)
        when (currentLang) {
            "ar" -> arabicRadio.isChecked = true
            "en" -> englishRadio.isChecked = true
            else -> arabicRadio.isChecked = true // Default to Arabic
        }
    }

    private fun setupListeners() {
        applyButton.setOnClickListener {
            val selectedLang = when (languageGroup.checkedRadioButtonId) {
                R.id.radio_arabic -> "ar"
                R.id.radio_english -> "en"
                else -> "ar"
            }

            // Save language preference
            LocaleHelper.setLocale(this, selectedLang)

            // Restart app to apply language change
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }
}
