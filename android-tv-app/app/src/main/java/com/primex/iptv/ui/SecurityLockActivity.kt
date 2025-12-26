package com.primex.iptv.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.security.SecurityLockManager

/**
 * SecurityLockActivity - Professional Security Warning Screen
 * 
 * Shown when app enters Security Lock Mode due to:
 * - Repackaging
 * - Re-signing
 * - Code tampering
 * - Backend mismatch
 * 
 * Provides clear, professional messaging and guidance to user.
 * Android TV optimized with D-pad navigation.
 */
class SecurityLockActivity : FragmentActivity() {
    
    private lateinit var titleText: TextView
    private lateinit var messageText: TextView
    private lateinit var detailsText: TextView
    private lateinit var actionButton: Button
    private lateinit var exitButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_security_lock)
        
        initializeViews()
        setupContent()
        setupActions()
    }
    
    private fun initializeViews() {
        titleText = findViewById(R.id.security_lock_title)
        messageText = findViewById(R.id.security_lock_message)
        detailsText = findViewById(R.id.security_lock_details)
        actionButton = findViewById(R.id.security_lock_action_button)
        exitButton = findViewById(R.id.security_lock_exit_button)
    }
    
    private fun setupContent() {
        val lockReason = SecurityLockManager.getLockReason()
        
        // Set title
        titleText.text = "Security Verification Failed"
        
        // Set user-friendly message
        messageText.text = SecurityLockManager.getLockMessage()
        
        // Set technical details (collapsed by default)
        detailsText.text = SecurityLockManager.getTechnicalDetails()
        detailsText.visibility = View.GONE
    }
    
    private fun setupActions() {
        // Primary action: Open Google Play
        actionButton.text = "Download Official App"
        actionButton.setOnClickListener {
            openGooglePlay()
        }
        actionButton.requestFocus() // Focus on primary action
        
        // Secondary action: Exit app
        exitButton.text = "Exit"
        exitButton.setOnClickListener {
            finishAffinity() // Close all activities
        }
        
        // Toggle technical details on long press
        titleText.setOnLongClickListener {
            toggleTechnicalDetails()
            true
        }
    }
    
    private fun openGooglePlay() {
        try {
            // Try to open Google Play
            val packageName = packageName
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("market://details?id=$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            // Fallback to web browser
            try {
                val packageName = packageName
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            } catch (e2: Exception) {
                // Could not open Play Store
                android.util.Log.e("SecurityLockActivity", "Failed to open Play Store", e2)
            }
        }
    }
    
    private fun toggleTechnicalDetails() {
        if (detailsText.visibility == View.VISIBLE) {
            detailsText.visibility = View.GONE
        } else {
            detailsText.visibility = View.VISIBLE
        }
    }
    
    override fun onBackPressed() {
        // Prevent back navigation from security lock screen
        // User must use Exit button
    }
    
    companion object {
        /**
         * Check if security lock screen should be shown
         * Call this from MainActivity or other entry points
         */
        fun shouldShowSecurityLock(): Boolean {
            return SecurityLockManager.isSecurityLocked()
        }
        
        /**
         * Start security lock activity
         */
        fun start(activity: FragmentActivity) {
            val intent = Intent(activity, SecurityLockActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            activity.startActivity(intent)
            activity.finish()
        }
    }
}
