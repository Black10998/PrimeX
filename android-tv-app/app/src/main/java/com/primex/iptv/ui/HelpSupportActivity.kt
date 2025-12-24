package com.primex.iptv.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.TextView
import com.primex.iptv.BuildConfig
import com.primex.iptv.R

class HelpSupportActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_help_support)

        setupClickListeners()
        displayAppInfo()
    }

    private fun setupClickListeners() {
        findViewById<View>(R.id.faq_card).setOnClickListener {
            showFAQ()
        }

        findViewById<View>(R.id.contact_card).setOnClickListener {
            contactSupport()
        }

        findViewById<View>(R.id.guides_card).setOnClickListener {
            showGuides()
        }

        findViewById<View>(R.id.feedback_card).setOnClickListener {
            sendFeedback()
        }
    }

    private fun displayAppInfo() {
        findViewById<TextView>(R.id.version_text).text = "Version ${BuildConfig.VERSION_NAME}"
        findViewById<TextView>(R.id.build_text).text = "Build ${BuildConfig.VERSION_CODE}"
    }

    private fun showFAQ() {
        val faqText = """
            Frequently Asked Questions
            
            Q: How do I change the language?
            A: Go to Settings > Language and select your preferred language.
            
            Q: How do I add content to favorites?
            A: Long press on any content card and select "Add to Favorites".
            
            Q: Can I watch on multiple devices?
            A: Yes, depending on your subscription plan. Check Account settings for details.
            
            Q: How do I improve video quality?
            A: Go to Settings > Control and adjust playback settings.
            
            Q: What should I do if content won't play?
            A: Check your internet connection and try restarting the app.
        """.trimIndent()

        android.app.AlertDialog.Builder(this)
            .setTitle("FAQ")
            .setMessage(faqText)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun contactSupport() {
        val email = "info@paxdes.com"
        val subject = "PrimeX Support Request"
        val body = "Please describe your issue:\n\n"

        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:")
            putExtra(Intent.EXTRA_EMAIL, arrayOf(email))
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, body)
        }

        try {
            startActivity(Intent.createChooser(intent, "Send Email"))
        } catch (e: Exception) {
            android.app.AlertDialog.Builder(this)
                .setTitle("Contact Support")
                .setMessage("Email: $email\n\nPlease contact us for assistance.")
                .setPositiveButton("OK", null)
                .show()
        }
    }

    private fun showGuides() {
        val guidesText = """
            User Guides
            
            Getting Started:
            1. Sign in with your credentials
            2. Browse content by category
            3. Select content to start watching
            
            Navigation:
            • Use arrow keys to navigate
            • Press OK/Enter to select
            • Press Back to return
            
            Features:
            • Favorites: Save your preferred content
            • Search: Find content quickly
            • Settings: Customize your experience
            
            Tips:
            • Enable subtitles in playback controls
            • Adjust video quality for your connection
            • Use parental controls for family safety
        """.trimIndent()

        android.app.AlertDialog.Builder(this)
            .setTitle("User Guides")
            .setMessage(guidesText)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun sendFeedback() {
        val email = "info@paxdes.com"
        val subject = "PrimeX Feedback"
        val body = "Your feedback:\n\n"

        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:")
            putExtra(Intent.EXTRA_EMAIL, arrayOf(email))
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, body)
        }

        try {
            startActivity(Intent.createChooser(intent, "Send Feedback"))
        } catch (e: Exception) {
            android.app.AlertDialog.Builder(this)
                .setTitle("Send Feedback")
                .setMessage("Email: $email\n\nWe'd love to hear from you!")
                .setPositiveButton("OK", null)
                .show()
        }
    }
}
