package com.primex.iptv.ui

import android.os.Bundle
import androidx.leanback.app.GuidedStepSupportFragment
import androidx.leanback.widget.GuidanceStylist
import androidx.leanback.widget.GuidedAction
import com.primex.iptv.BuildConfig
import com.primex.iptv.R
import com.primex.iptv.utils.LocaleHelper
import com.primex.iptv.utils.PreferenceManager

class SettingsFragment : GuidedStepSupportFragment() {

    companion object {
        private const val ACTION_LANGUAGE = 1L
        private const val ACTION_QUALITY = 2L
        private const val ACTION_AUTOPLAY = 3L
        private const val ACTION_NOTIFICATIONS = 4L
        private const val ACTION_CACHE = 5L
        private const val ACTION_ABOUT = 6L
        private const val ACTION_LOGOUT = 7L
    }

    override fun onCreateGuidance(savedInstanceState: Bundle?): GuidanceStylist.Guidance {
        return GuidanceStylist.Guidance(
            "Settings",
            "Configure your Amarco experience",
            "",
            null
        )
    }

    override fun onCreateActions(actions: MutableList<GuidedAction>, savedInstanceState: Bundle?) {
        val context = requireContext()
        
        // Language
        addAction(
            actions,
            ACTION_LANGUAGE,
            "Language",
            getCurrentLanguageDescription(),
            GuidedAction.DEFAULT_CHECK_SET_ID
        )
        
        // Video Quality
        addAction(
            actions,
            ACTION_QUALITY,
            "Video Quality",
            "Auto (Recommended)",
            GuidedAction.DEFAULT_CHECK_SET_ID
        )
        
        // Autoplay
        addAction(
            actions,
            ACTION_AUTOPLAY,
            "Autoplay Next Episode",
            "Enabled",
            GuidedAction.DEFAULT_CHECK_SET_ID
        )
        
        // Notifications
        addAction(
            actions,
            ACTION_NOTIFICATIONS,
            "Notifications",
            "Enabled",
            GuidedAction.DEFAULT_CHECK_SET_ID
        )
        
        // Clear Cache
        addAction(
            actions,
            ACTION_CACHE,
            "Clear Cache",
            "Free up storage space"
        )
        
        // About
        addAction(
            actions,
            ACTION_ABOUT,
            "About",
            "Version ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})"
        )
        
        // Logout
        addAction(
            actions,
            ACTION_LOGOUT,
            "Sign Out",
            "Exit your account"
        )
    }

    override fun onGuidedActionClicked(action: GuidedAction) {
        when (action.id) {
            ACTION_LANGUAGE -> showLanguageOptions()
            ACTION_QUALITY -> showQualityOptions()
            ACTION_AUTOPLAY -> toggleAutoplay()
            ACTION_NOTIFICATIONS -> toggleNotifications()
            ACTION_CACHE -> clearCache()
            ACTION_ABOUT -> showAbout()
            ACTION_LOGOUT -> logout()
        }
    }

    private fun addAction(
        actions: MutableList<GuidedAction>,
        id: Long,
        title: String,
        description: String,
        checkSetId: Int = GuidedAction.NO_CHECK_SET
    ) {
        actions.add(
            GuidedAction.Builder(requireContext())
                .id(id)
                .title(title)
                .description(description)
                .checkSetId(checkSetId)
                .build()
        )
    }

    private fun getCurrentLanguageDescription(): String {
        val currentLang = LocaleHelper.getCurrentLanguage(requireContext())
        return when (currentLang) {
            "ar" -> "العربية"
            else -> "English"
        }
    }

    private fun showLanguageOptions() {
        // TODO: Show language selection dialog
        android.widget.Toast.makeText(requireContext(), "Language selection", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun showQualityOptions() {
        // TODO: Show quality selection dialog
        android.widget.Toast.makeText(requireContext(), "Quality selection", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun toggleAutoplay() {
        android.widget.Toast.makeText(requireContext(), "Autoplay toggled", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun toggleNotifications() {
        android.widget.Toast.makeText(requireContext(), "Notifications toggled", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun clearCache() {
        android.widget.Toast.makeText(requireContext(), "Cache cleared", android.widget.Toast.LENGTH_SHORT).show()
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
        requireActivity().finish()
    }
}
