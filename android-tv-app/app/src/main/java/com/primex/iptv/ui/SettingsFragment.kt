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

    private fun setupAdapter() {
        val gridPresenter = VerticalGridPresenter()
        gridPresenter.numberOfColumns = 1
        setGridPresenter(gridPresenter)
        
        adapter = ArrayObjectAdapter(SettingsCardPresenter())
        
        // Account Section
        adapter.add(SettingsItem(
            id = "account",
            title = "Account",
            description = "Manage your profile and subscription",
            icon = R.drawable.ic_account
        ))
        
        // Playback Settings
        adapter.add(SettingsItem(
            id = "playback",
            title = "Playback Settings",
            description = "Video quality and autoplay",
            icon = R.drawable.ic_play
        ))
        
        // Parental Controls
        adapter.add(SettingsItem(
            id = "parental",
            title = "Parental Controls",
            description = "Manage content restrictions",
            icon = R.drawable.ic_info
        ))
        
        // Language & Subtitles
        adapter.add(SettingsItem(
            id = "language",
            title = "Language & Subtitles",
            description = "Audio and subtitle preferences",
            icon = R.drawable.ic_subtitles
        ))
        
        // Notifications
        adapter.add(SettingsItem(
            id = "notifications",
            title = "Notifications",
            description = "Manage app notifications",
            icon = R.drawable.ic_info
        ))
        
        // Storage
        adapter.add(SettingsItem(
            id = "storage",
            title = "Storage",
            description = "Clear cache and manage downloads",
            icon = R.drawable.ic_downloads
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
                    "account" -> showAccount()
                    "playback" -> showPlaybackSettings()
                    "parental" -> showParentalControls()
                    "language" -> showLanguageSettings()
                    "notifications" -> showNotifications()
                    "storage" -> showStorage()
                    "help" -> showHelp()
                    "about" -> showAbout()
                    "logout" -> logout()
                }
            }
        }
    }

    private fun showAccount() {
        android.widget.Toast.makeText(requireContext(), "Account Settings", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showPlaybackSettings() {
        val intent = Intent(requireContext(), PlaybackSettingsActivity::class.java)
        startActivity(intent)
    }

    private fun showParentalControls() {
        android.widget.Toast.makeText(requireContext(), "Parental Controls", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showLanguageSettings() {
        android.widget.Toast.makeText(requireContext(), "Language & Subtitles", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showNotifications() {
        android.widget.Toast.makeText(requireContext(), "Notifications", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showStorage() {
        android.widget.Toast.makeText(requireContext(), "Storage Management", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showHelp() {
        android.widget.Toast.makeText(requireContext(), "Help & Support", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showAbout() {
        android.widget.Toast.makeText(
            requireContext(),
            "Amarco v${BuildConfig.VERSION_NAME}",
            android.widget.Toast.LENGTH_SHORT
        ).show()
    }

    private fun logout() {
        PreferenceManager.logout(requireContext())
        val intent = Intent(requireContext(), LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        requireActivity().finish()
    }
}
