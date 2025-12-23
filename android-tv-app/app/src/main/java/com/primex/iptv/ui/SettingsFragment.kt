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
        
        // Add settings items
        adapter.add(SettingsItem(
            id = "about",
            title = "About",
            description = "Version ${BuildConfig.VERSION_NAME}",
            icon = R.drawable.ic_info
        ))
        
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
                    "about" -> showAbout()
                    "logout" -> logout()
                }
            }
        }
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
