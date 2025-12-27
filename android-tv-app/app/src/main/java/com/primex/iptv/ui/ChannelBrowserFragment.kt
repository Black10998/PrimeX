package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.api.ApiClient
import com.primex.iptv.config.ConfigManager
import com.primex.iptv.models.Channel
import com.primex.iptv.player.PlayerActivity
import com.primex.iptv.utils.PreferenceManager
import com.primex.iptv.utils.SessionManager
import kotlinx.coroutines.launch

/**
 * ChannelBrowserFragment - Two-Panel Channel Browser
 * 
 * LEFT PANEL:
 * - Channel categories/lists
 * - Search field
 * - Channel numbers and names
 * 
 * RIGHT PANEL:
 * - Channel cards (thumbnails)
 * - Updates dynamically based on left selection
 * 
 * UI-driven navigation, not remote-triggered
 */
class ChannelBrowserFragment : Fragment() {
    
    // Left panel
    private lateinit var searchField: EditText
    private lateinit var categoryList: RecyclerView
    private lateinit var categoryAdapter: CategoryListAdapter
    
    // Right panel
    private lateinit var channelCardsGrid: RecyclerView
    private lateinit var channelCardsAdapter: ChannelCardsAdapter
    
    // Data
    private var allChannels: List<Channel> = emptyList()
    private var channelsByCategory: Map<String, List<Channel>> = emptyMap()
    private var currentCategory: String = "All Channels"
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_channel_browser, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_categories)
        
        setupLeftPanel(view)
        setupRightPanel(view)
        loadChannels()
    }
    
    private fun setupLeftPanel(view: View) {
        // Search field
        searchField = view.findViewById(R.id.channel_search_field)
        searchField.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                filterChannels(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })
        
        // Category list
        categoryList = view.findViewById(R.id.category_list)
        categoryList.layoutManager = LinearLayoutManager(requireContext())
        
        categoryAdapter = CategoryListAdapter { category ->
            onCategorySelected(category)
        }
        categoryList.adapter = categoryAdapter
    }
    
    private fun setupRightPanel(view: View) {
        channelCardsGrid = view.findViewById(R.id.channel_cards_grid)
        channelCardsGrid.layoutManager = GridLayoutManager(requireContext(), 4)
        
        channelCardsAdapter = ChannelCardsAdapter { channel ->
            playChannel(channel)
        }
        channelCardsGrid.adapter = channelCardsAdapter
    }
    
    private fun loadChannels() {
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            showError("Please login to view channels")
            return
        }
        
        lifecycleScope.launch {
            try {
                val response = ApiClient.xtreamApiService.getLiveStreams(username, password)
                
                if (SessionManager.handleUnauthorizedResponse(requireContext(), response.code())) {
                    return@launch
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val streams = response.body()!!
                    
                    // Convert to Channel objects
                    allChannels = streams.mapIndexed { index, stream ->
                        Channel(
                            id = stream.streamId?.toString() ?: "0",
                            name = stream.name ?: "Unknown Channel",
                            number = index + 1,
                            logo_url = stream.streamIcon,
                            stream_url = ConfigManager.buildLiveStreamUrl(
                                requireContext(),
                                username,
                                password,
                                stream.streamId?.toString() ?: "0"
                            ),
                            category = stream.categoryId ?: "Uncategorized"
                        )
                    }
                    
                    // Group by category
                    channelsByCategory = allChannels.groupBy { it.category ?: "Uncategorized" }
                    
                    // Create category list
                    val categories = mutableListOf("All Channels")
                    categories.addAll(channelsByCategory.keys.sorted())
                    
                    categoryAdapter.submitList(categories)
                    
                    // Show all channels initially
                    updateChannelCards(allChannels)
                    
                } else {
                    showError("Failed to load channels")
                }
            } catch (e: Exception) {
                showError("Error: ${e.message}")
            }
        }
    }
    
    private fun onCategorySelected(category: String) {
        currentCategory = category
        
        val channels = if (category == "All Channels") {
            allChannels
        } else {
            channelsByCategory[category] ?: emptyList()
        }
        
        updateChannelCards(channels)
    }
    
    private fun filterChannels(query: String) {
        if (query.isEmpty()) {
            onCategorySelected(currentCategory)
            return
        }
        
        val filtered = allChannels.filter { channel ->
            channel.name.contains(query, ignoreCase = true) ||
            channel.number.toString().contains(query)
        }
        
        updateChannelCards(filtered)
    }
    
    private fun updateChannelCards(channels: List<Channel>) {
        channelCardsAdapter.submitList(channels)
    }
    
    private fun playChannel(channel: Channel) {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, channel.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, channel.name)
            putExtra(PlayerActivity.EXTRA_TYPE, "channel")
        }
        startActivity(intent)
    }
    
    private fun showError(message: String) {
        android.widget.Toast.makeText(requireContext(), message, android.widget.Toast.LENGTH_LONG).show()
    }
    
    companion object {
        fun newInstance(): ChannelBrowserFragment {
            return ChannelBrowserFragment()
        }
    }
}
