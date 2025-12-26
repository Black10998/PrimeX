package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.leanback.widget.ArrayObjectAdapter
import androidx.leanback.widget.ItemBridgeAdapter
import androidx.leanback.widget.OnItemViewClickedListener
import androidx.leanback.widget.VerticalGridPresenter
import androidx.leanback.app.VerticalGridSupportFragment
import com.primex.iptv.BuildConfig
import com.primex.iptv.R
import com.primex.iptv.models.SettingsItem
import com.primex.iptv.utils.PreferenceManager

class SettingsFragment : VerticalGridSupportFragment() {

    private lateinit var adapter: ArrayObjectAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setupAdapter()
        setupEventListeners()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Remove title area completely to prevent overlay
        title = ""
        
        // Aggressively hide all potential overlay elements
        view.findViewById<View>(androidx.leanback.R.id.browse_title_group)?.apply {
            visibility = View.GONE
            layoutParams?.height = 0
        }
        
        view.findViewById<View>(androidx.leanback.R.id.browse_headers)?.apply {
            visibility = View.GONE
            layoutParams?.height = 0
        }
        
        view.findViewById<View>(androidx.leanback.R.id.browse_headers_dock)?.apply {
            visibility = View.GONE
            layoutParams?.height = 0
        }
        
        view.findViewById<View>(androidx.leanback.R.id.browse_frame)?.background = null
        view.findViewById<View>(androidx.leanback.R.id.browse_grid)?.background = null
        view.findViewById<View>(androidx.leanback.R.id.browse_container_dock)?.background = null
        
        // Remove background from the entire fragment view
        view.background = null
    }

    private fun setupAdapter() {
        val gridPresenter = VerticalGridPresenter()
        gridPresenter.numberOfColumns = 1
        gridPresenter.shadowEnabled = false
        setGridPresenter(gridPresenter)
        
        adapter = ArrayObjectAdapter(SettingsCardPresenter())
        
        // Server Configuration (NEW)
        adapter.add(SettingsItem(
            id = "server_config",
            title = "Server Configuration",
            description = "Configure IPTV server connection",
            icon = R.drawable.ic_settings
        ))
        
        // Account Section
        adapter.add(SettingsItem(
            id = "account",
            title = "Account",
            description = "Manage your profile and subscription",
            icon = R.drawable.ic_account
        ))
        
        // Partner
        adapter.add(SettingsItem(
            id = "partner",
            title = "Partner",
            description = "Partner program and referrals",
            icon = R.drawable.ic_info
        ))
        
        // Control
        adapter.add(SettingsItem(
            id = "control",
            title = "Control",
            description = "Remote control and device settings",
            icon = R.drawable.ic_settings
        ))
        
        // Language
        adapter.add(SettingsItem(
            id = "language",
            title = "Language",
            description = "Change app language (العربية / English)",
            icon = R.drawable.ic_subtitles
        ))
        
        // Notifications
        adapter.add(SettingsItem(
            id = "notifications",
            title = "Notifications",
            description = "Manage app notifications and alerts",
            icon = R.drawable.ic_info
        ))
        
        // Stroke
        adapter.add(SettingsItem(
            id = "stroke",
            title = "Stroke",
            description = "Display and subtitle stroke settings",
            icon = R.drawable.ic_subtitles
        ))
        
        // Help & Support
        adapter.add(SettingsItem(
            id = "help",
            title = "Help & Support",
            description = "Get help and contact support",
            icon = R.drawable.ic_info
        ))
        
        // About
        adapter.add(SettingsItem(
            id = "about",
            title = "About",
            description = "Version ${BuildConfig.VERSION_NAME}",
            icon = R.drawable.ic_info
        ))
        
        // Sign Out
        adapter.add(SettingsItem(
            id = "logout",
            title = "Sign Out",
            description = "Exit your account",
            icon = R.drawable.ic_logout
        ))
        
        setAdapter(adapter)
    }

    private fun setupEventListeners() {
        onItemViewClickedListener = OnItemViewClickedListener { _, item, _, _ ->
            if (item is SettingsItem) {
                when (item.id) {
                    "server_config" -> showServerConfig()
                    "account" -> showAccount()
                    "partner" -> showPartner()
                    "control" -> showControl()
                    "language" -> showLanguageSettings()
                    "notifications" -> showNotifications()
                    "stroke" -> showStroke()
                    "help" -> showHelp()
                    "about" -> showAbout()
                    "logout" -> logout()
                }
            }
        }
    }
    
    private fun showServerConfig() {
        val intent = Intent(requireContext(), ServerConfigActivity::class.java)
        startActivity(intent)
    }

    private fun showAccount() {
        val intent = Intent(requireContext(), AccountActivity::class.java)
        startActivity(intent)
    }

    private fun showPartner() {
        val intent = Intent(requireContext(), PartnerActivity::class.java)
        startActivity(intent)
    }

    private fun showControl() {
        val intent = Intent(requireContext(), ControlSettingsActivity::class.java)
        startActivity(intent)
    }

    private fun showLanguageSettings() {
        val intent = Intent(requireContext(), LanguageSettingsActivity::class.java)
        startActivity(intent)
    }

    private fun showNotifications() {
        val intent = Intent(requireContext(), NotificationsActivity::class.java)
        startActivity(intent)
    }

    private fun showStroke() {
        val intent = Intent(requireContext(), StrokeSettingsActivity::class.java)
        startActivity(intent)
    }

    private fun showHelp() {
        val intent = Intent(requireContext(), HelpSupportActivity::class.java)
        startActivity(intent)
    }

    private fun showAbout() {
        showSimpleDialog(
            "About Amarco",
            "Version: ${BuildConfig.VERSION_NAME}\nBuild: ${BuildConfig.VERSION_CODE}\n\nDeveloper: PAX\nSupport: info@paxdes.com"
        )
    }

    private fun showSimpleDialog(title: String, message: String) {
        android.app.AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun logout() {
        PreferenceManager.logout(requireContext())
        val intent = Intent(requireContext(), LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        requireActivity().finish()
    }
}
