package com.primex.iptv.ui

import android.os.Bundle
import android.widget.CheckBox
import com.primex.iptv.R

class NotificationsActivity : BaseActivity() {

    private lateinit var newContentCheckbox: CheckBox
    private lateinit var updatesCheckbox: CheckBox
    private lateinit var promotionsCheckbox: CheckBox
    private lateinit var accountCheckbox: CheckBox

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notifications)

        initViews()
        loadSettings()
        setupListeners()
    }

    private fun initViews() {
        newContentCheckbox = findViewById(R.id.new_content_checkbox)
        updatesCheckbox = findViewById(R.id.updates_checkbox)
        promotionsCheckbox = findViewById(R.id.promotions_checkbox)
        accountCheckbox = findViewById(R.id.account_checkbox)
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("app_settings", MODE_PRIVATE)
        
        newContentCheckbox.isChecked = prefs.getBoolean("notify_new_content", true)
        updatesCheckbox.isChecked = prefs.getBoolean("notify_updates", true)
        promotionsCheckbox.isChecked = prefs.getBoolean("notify_promotions", false)
        accountCheckbox.isChecked = prefs.getBoolean("notify_account", true)
    }

    private fun setupListeners() {
        val prefs = getSharedPreferences("app_settings", MODE_PRIVATE)
        
        newContentCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("notify_new_content", isChecked).apply()
        }

        updatesCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("notify_updates", isChecked).apply()
        }

        promotionsCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("notify_promotions", isChecked).apply()
        }

        accountCheckbox.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("notify_account", isChecked).apply()
        }
    }
}
