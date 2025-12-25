package com.primex.iptv.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.Channel
import android.widget.VideoView
import com.primex.iptv.utils.PreferenceManager
import com.primex.iptv.utils.SessionManager
import com.primex.iptv.utils.VideoBackgroundHelper
import kotlinx.coroutines.launch

class SeriesFragment : Fragment() {

    private lateinit var contentRecycler: RecyclerView
    

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_content_section, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_series)
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadSeriesContent()
    }

    private fun loadSeriesContent() {
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            showEmptyState("Please login to view series")
            return
        }

        lifecycleScope.launch {
            try {
                // Load series from backend
                val response = ApiClient.xtreamApiService.getSeries(username, password)
                
                // Check for account deactivation
                if (SessionManager.handleUnauthorizedResponse(requireContext(), response.code())) {
                    return@launch
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val series = response.body()!!
                    
                    if (series.isEmpty()) {
                        showEmptyState("No series available")
                        return@launch
                    }
                    
                    // Convert to Channel objects
                    val seriesChannels = series.map { show ->
                        Channel(
                            id = show.seriesId?.toString() ?: "0",
                            name = show.name ?: "Unknown Series",
                            logo_url = show.cover,
                            stream_url = "", // Series don't have direct stream URLs
                            category = show.categoryId
                        )
                    }
                    
                    // Show all series
                    val rows = listOf(
                        ContentRow("All Series", seriesChannels)
                    )
                    
                    contentRecycler.adapter = ContentRowAdapter(rows) { show ->
                        // Show series details
                        android.widget.Toast.makeText(
                            requireContext(),
                            "Series: ${show.name}",
                            android.widget.Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    showEmptyState("Failed to load series")
                }
            } catch (e: Exception) {
                showEmptyState("Error: ${e.message}")
            }
        }
    }

    private fun showEmptyState(message: String) {
        contentRecycler.adapter = ContentRowAdapter(emptyList()) { }
        android.widget.Toast.makeText(requireContext(), message, android.widget.Toast.LENGTH_LONG).show()
    }

}
