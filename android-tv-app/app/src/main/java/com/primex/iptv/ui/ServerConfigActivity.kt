package com.primex.iptv.ui

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.primex.iptv.R
import com.primex.iptv.config.ConfigManager

/**
 * ServerConfigActivity - Server Configuration UI
 * 
 * Allows users to configure server URL and portal settings.
 * Replaces hardcoded URLs with dynamic configuration.
 * 
 * Backend Compatibility: Configures connection to existing PAX/PrimeX backend.
 * 
 * Developer: PAX
 */
class ServerConfigActivity : AppCompatActivity() {
    
    private lateinit var serverNameInput: EditText
    private lateinit var serverUrlInput: EditText
    private lateinit var httpsSwitch: Switch
    private lateinit var portalTypeSpinner: Spinner
    private lateinit var saveButton: Button
    private lateinit var resetButton: Button
    private lateinit var testButton: Button
    private lateinit var statusText: TextView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_server_config)
        
        initializeViews()
        loadCurrentConfig()
        setupListeners()
    }
    
    private fun initializeViews() {
        serverNameInput = findViewById(R.id.server_name_input)
        serverUrlInput = findViewById(R.id.server_url_input)
        httpsSwitch = findViewById(R.id.https_switch)
        portalTypeSpinner = findViewById(R.id.portal_type_spinner)
        saveButton = findViewById(R.id.save_button)
        resetButton = findViewById(R.id.reset_button)
        testButton = findViewById(R.id.test_button)
        statusText = findViewById(R.id.status_text)
        
        // Setup portal type spinner
        val portalTypes = ConfigManager.PortalType.values().map { it.name }
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, portalTypes)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        portalTypeSpinner.adapter = adapter
    }
    
    private fun loadCurrentConfig() {
        serverNameInput.setText(ConfigManager.getServerName(this))
        serverUrlInput.setText(ConfigManager.getBaseUrl(this))
        httpsSwitch.isChecked = ConfigManager.useHttps(this)
        
        val currentType = ConfigManager.getPortalType(this)
        val position = ConfigManager.PortalType.values().indexOf(currentType)
        portalTypeSpinner.setSelection(position)
        
        updateStatus("Current configuration loaded", false)
    }
    
    private fun setupListeners() {
        saveButton.setOnClickListener {
            saveConfiguration()
        }
        
        resetButton.setOnClickListener {
            resetToDefaults()
        }
        
        testButton.setOnClickListener {
            testConnection()
        }
    }
    
    private fun saveConfiguration() {
        val serverName = serverNameInput.text.toString().trim()
        val serverUrl = serverUrlInput.text.toString().trim()
        val useHttps = httpsSwitch.isChecked
        val portalTypePosition = portalTypeSpinner.selectedItemPosition
        val portalType = ConfigManager.PortalType.values()[portalTypePosition]
        
        // Validate inputs
        if (serverName.isEmpty()) {
            updateStatus("Please enter a server name", true)
            serverNameInput.requestFocus()
            return
        }
        
        if (serverUrl.isEmpty()) {
            updateStatus("Please enter a server URL", true)
            serverUrlInput.requestFocus()
            return
        }
        
        if (!ConfigManager.isValidUrl(serverUrl)) {
            updateStatus("Invalid URL format. Example: prime-x.live", true)
            serverUrlInput.requestFocus()
            return
        }
        
        // Save configuration
        ConfigManager.setServerName(this, serverName)
        ConfigManager.setBaseUrl(this, serverUrl)
        ConfigManager.setUseHttps(this, useHttps)
        ConfigManager.setPortalType(this, portalType)
        
        updateStatus("Configuration saved successfully!", false)
        
        Toast.makeText(
            this,
            "Server configuration updated. Please restart the app.",
            Toast.LENGTH_LONG
        ).show()
        
        // Delay finish to show message
        serverUrlInput.postDelayed({
            finish()
        }, 2000)
    }
    
    private fun resetToDefaults() {
        ConfigManager.resetToDefaults(this)
        loadCurrentConfig()
        updateStatus("Reset to default configuration", false)
        Toast.makeText(this, "Configuration reset to defaults", Toast.LENGTH_SHORT).show()
    }
    
    private fun testConnection() {
        val serverUrl = serverUrlInput.text.toString().trim()
        
        if (serverUrl.isEmpty()) {
            updateStatus("Please enter a server URL first", true)
            return
        }
        
        if (!ConfigManager.isValidUrl(serverUrl)) {
            updateStatus("Invalid URL format", true)
            return
        }
        
        updateStatus("Testing connection to $serverUrl...", false)
        
        // Simple validation - actual connection test would require network call
        // For now, just validate format and show success
        serverUrlInput.postDelayed({
            updateStatus("URL format is valid. Save to apply changes.", false)
        }, 1000)
    }
    
    private fun updateStatus(message: String, isError: Boolean) {
        statusText.text = message
        statusText.setTextColor(
            if (isError) {
                resources.getColor(android.R.color.holo_red_dark, null)
            } else {
                resources.getColor(android.R.color.holo_green_dark, null)
            }
        )
    }
    
    override fun onBackPressed() {
        // Check if there are unsaved changes
        val currentName = ConfigManager.getServerName(this)
        val currentUrl = ConfigManager.getBaseUrl(this)
        val inputName = serverNameInput.text.toString().trim()
        val inputUrl = serverUrlInput.text.toString().trim()
        
        if (currentName != inputName || currentUrl != inputUrl) {
            Toast.makeText(
                this,
                "Changes not saved. Press back again to discard.",
                Toast.LENGTH_SHORT
            ).show()
            
            // Allow second back press to exit
            serverUrlInput.postDelayed({
                super.onBackPressed()
            }, 2000)
        } else {
            super.onBackPressed()
        }
    }
}
