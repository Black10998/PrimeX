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
import com.primex.iptv.config.ConfigManager
import com.primex.iptv.models.Channel
import android.widget.VideoView
import com.primex.iptv.utils.PreferenceManager
import com.primex.iptv.utils.SessionManager
import com.primex.iptv.utils.VideoBackgroundHelper
import kotlinx.coroutines.launch

class CategoriesFragment : Fragment() {

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
        
        (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_categories)
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadCategoriesContent()
    }

    private fun loadCategoriesContent() {
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            showEmptyState("Please login to view categories")
            return
        }

        lifecycleScope.launch {
            try {
                // Load live streams and group by category
                val response = ApiClient.xtreamApiService.getLiveStreams(username, password)
                
                // Check for account deactivation
                if (SessionManager.handleUnauthorizedResponse(requireContext(), response.code())) {
                    return@launch
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val streams = response.body()!!
                    
                    if (streams.isEmpty()) {
                        showEmptyState("No content available")
                        return@launch
                    }
                    
                    // Group channels by category
                    val channelsByCategory = streams.groupBy { it.categoryId ?: "Uncategorized" }
                    
                    // Create rows for each category
                    val rows = channelsByCategory.map { (categoryId, categoryStreams) ->
                        val channels = categoryStreams.map { stream ->
                            Channel(
                                id = stream.streamId?.toString() ?: "0",
                                name = stream.name ?: "Unknown Channel",
                                logo_url = stream.streamIcon,
                                stream_url = buildStreamUrl(username, password, stream.streamId?.toString() ?: "0"),
                                category = categoryId
                            )
                        }
                        ContentRow("Category $categoryId", channels)
                    }
                    
                    contentRecycler.adapter = ContentRowAdapter(rows) { channel ->
                        // Play channel
                        android.widget.Toast.makeText(
                            requireContext(),
                            "Playing: ${channel.name}",
                            android.widget.Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    showEmptyState("Failed to load categories")
                }
            } catch (e: Exception) {
                showEmptyState("Error: ${e.message}")
            }
        }
    }

    private fun buildStreamUrl(username: String, password: String, streamId: String): String {
        return ConfigManager.buildLiveStreamUrl(requireContext(), username, password, streamId)
    }

    private fun showEmptyState(message: String) {
        contentRecycler.adapter = ContentRowAdapter(emptyList()) { }
        android.widget.Toast.makeText(requireContext(), message, android.widget.Toast.LENGTH_LONG).show()
    }

}
