package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Channel Browser - Simplified version that directly uses Live TV data
 * 
 * Two-panel layout:
 * - Left: Categories and search
 * - Right: Channel cards grid
 * 
 * Uses the exact same API call as Live TV fragment
 */
class ChannelBrowserFragment : Fragment() {
    
    private val TAG = "ChannelBrowser"
    
    // Views
    private var searchField: EditText? = null
    private var categoryList: RecyclerView? = null
    private var channelCardsGrid: RecyclerView? = null
    
    // Adapters
    private var categoryAdapter: CategoryListAdapter? = null
    private var channelCardsAdapter: ChannelCardsAdapter? = null
    
    // Data
    private var allChannels: List<Channel> = emptyList()
    private var channelsByCategory: Map<String, List<Channel>> = emptyMap()
    private var currentCategory: String = "All Channels"
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(TAG, "onCreateView")
        return try {
            inflater.inflate(R.layout.fragment_channel_browser, container, false)
        } catch (e: Exception) {
            Log.e(TAG, "Error inflating layout", e)
            Toast.makeText(context, "Error loading Channel Browser", Toast.LENGTH_SHORT).show()
            null
        }
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        Log.d(TAG, "onViewCreated")
        
        try {
            // Try to change background, but don't crash if it fails
            try {
                (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_categories)
            } catch (e: Exception) {
                Log.w(TAG, "Could not change background", e)
            }
            
            setupViews(view)
            loadChannels()
        } catch (e: Exception) {
            Log.e(TAG, "Error in onViewCreated", e)
            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun setupViews(view: View) {
        Log.d(TAG, "Setting up views")
        
        // Search field
        searchField = view.findViewById(R.id.channel_search_field)
        searchField?.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                filterChannels(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })
        
        // Category list (left panel)
        categoryList = view.findViewById(R.id.category_list)
        categoryList?.layoutManager = LinearLayoutManager(requireContext())
        categoryAdapter = CategoryListAdapter { category ->
            onCategorySelected(category)
        }
        categoryList?.adapter = categoryAdapter
        
        // Channel cards grid (right panel)
        channelCardsGrid = view.findViewById(R.id.channel_cards_grid)
        channelCardsGrid?.layoutManager = GridLayoutManager(requireContext(), 4)
        channelCardsAdapter = ChannelCardsAdapter { channel ->
            playChannel(channel)
        }
        channelCardsGrid?.adapter = channelCardsAdapter
        
        Log.d(TAG, "Views setup complete")
    }
    
    private fun loadChannels() {
        Log.d(TAG, "Loading channels...")
        
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            Log.e(TAG, "No credentials")
            Toast.makeText(context, "Please login first", Toast.LENGTH_SHORT).show()
            return
        }
        
        lifecycleScope.launch {
            try {
                Log.d(TAG, "Fetching live streams from API...")
                
                // Use the exact same API call as Live TV
                val response = withContext(Dispatchers.IO) {
                    ApiClient.xtreamApiService.getLiveStreams(username, password)
                }
                
                Log.d(TAG, "API response code: ${response.code()}")
                
                if (response.isSuccessful && response.body() != null) {
                    val streams = response.body()!!
                    Log.d(TAG, "Received ${streams.size} streams")
                    
                    // Convert to Channel objects (same as Live TV)
                    allChannels = streams.mapIndexed { index, stream ->
                        Channel(
                            id = stream.streamId?.toString() ?: "0",
                            name = stream.name ?: "Unknown",
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
                    
                    // Build category list
                    val categories = mutableListOf("All Channels")
                    categories.addAll(channelsByCategory.keys.sorted())
                    
                    Log.d(TAG, "Categories: ${categories.size}")
                    
                    // Update UI
                    categoryAdapter?.submitList(categories)
                    channelCardsAdapter?.submitList(allChannels)
                    
                    Log.d(TAG, "Channels loaded successfully")
                } else {
                    Log.e(TAG, "API error: ${response.code()}")
                    Toast.makeText(context, "Failed to load channels", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading channels", e)
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun onCategorySelected(category: String) {
        Log.d(TAG, "Category selected: $category")
        currentCategory = category
        
        val channels = when (category) {
            "All Channels" -> allChannels
            else -> channelsByCategory[category] ?: emptyList()
        }
        
        Log.d(TAG, "Showing ${channels.size} channels")
        channelCardsAdapter?.submitList(channels)
        channelCardsGrid?.scrollToPosition(0)
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
        
        Log.d(TAG, "Filtered to ${filtered.size} channels")
        channelCardsAdapter?.submitList(filtered)
    }
    
    private fun playChannel(channel: Channel) {
        Log.d(TAG, "Playing channel: ${channel.name}")
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, channel.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, channel.name)
            putExtra(PlayerActivity.EXTRA_TYPE, "channel")
        }
        startActivity(intent)
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        searchField = null
        categoryList = null
        channelCardsGrid = null
        categoryAdapter = null
        channelCardsAdapter = null
    }
    
    companion object {
        fun newInstance() = ChannelBrowserFragment()
    }
}
