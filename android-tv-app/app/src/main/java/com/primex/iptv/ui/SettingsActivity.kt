package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import com.primex.iptv.BuildConfig
import com.primex.iptv.R
import com.primex.iptv.utils.LocaleHelper

class SettingsActivity : BaseActivity() {

    private lateinit var languageEnglish: View
    private lateinit var languageArabic: View
    private lateinit var checkEnglish: View
    private lateinit var checkArabic: View
    private lateinit var versionText: TextView
    private lateinit var buildText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        initViews()
        updateLanguageSelection()
        setupListeners()
    }

    private fun initViews() {
        languageEnglish = findViewById(R.id.languageEnglish)
        languageArabic = findViewById(R.id.languageArabic)
        checkEnglish = findViewById(R.id.checkEnglish)
        checkArabic = findViewById(R.id.checkArabic)
        versionText = findViewById(R.id.versionText)
        buildText = findViewById(R.id.buildText)

        versionText.text = BuildConfig.VERSION_NAME
        buildText.text = BuildConfig.VERSION_CODE.toString()
    }

    private fun setupListeners() {
        languageEnglish.setOnClickListener {
            changeLanguage("en")
        }

        languageArabic.setOnClickListener {
            changeLanguage("ar")
        }
    }

    private fun updateLanguageSelection() {
        val currentLang = LocaleHelper.getCurrentLanguage(this)
        
        checkEnglish.visibility = if (currentLang == "en") View.VISIBLE else View.GONE
        checkArabic.visibility = if (currentLang == "ar") View.VISIBLE else View.GONE
    }

    private fun changeLanguage(languageCode: String) {
        LocaleHelper.setLocale(this, languageCode)
        
        // Restart activity to apply language change
        val intent = Intent(this, SettingsActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        finish()
    }
}
