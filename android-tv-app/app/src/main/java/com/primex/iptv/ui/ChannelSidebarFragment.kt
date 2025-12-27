package com.primex.iptv.ui

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.models.Channel

/**
 * ChannelSidebarFragment - Advanced Channel Browser
 * 
 * Features:
 * - Structured channel list with numbers and names
 * - Real-time search filtering
 * - Smooth animations
 * - TV remote friendly (D-pad navigation)
 * - Focus management
 * 
 * UX: Premium Smart TV experience (Live TV Hub style)
 */
class ChannelSidebarFragment : Fragment() {
    
    private lateinit var searchField: EditText
    private lateinit var channelList: RecyclerView
    private lateinit var channelAdapter: ChannelSidebarAdapter
    
    private var allChannels: List<Channel> = emptyList()
    private var filteredChannels: List<Channel> = emptyList()
    
    private var onChannelSelectedListener: ((Channel) -> Unit)? = null
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_channel_sidebar, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupSearchField(view)
        setupChannelList(view)
    }
    
    private fun setupSearchField(view: View) {
        searchField = view.findViewById(R.id.sidebar_search_field)
        
        // Real-time search filtering
        searchField.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                filterChannels(s?.toString() ?: "")
            }
            
            override fun afterTextChanged(s: Editable?) {}
        })
    }
    
    private fun setupChannelList(view: View) {
        channelList = view.findViewById(R.id.sidebar_channel_list)
        channelList.layoutManager = LinearLayoutManager(requireContext())
        
        channelAdapter = ChannelSidebarAdapter { channel ->
            onChannelSelectedListener?.invoke(channel)
        }
        
        channelList.adapter = channelAdapter
    }
    
    /**
     * Set channels to display in sidebar
     */
    fun setChannels(channels: List<Channel>) {
        allChannels = channels
        filteredChannels = channels
        channelAdapter.submitList(filteredChannels)
    }
    
    /**
     * Filter channels based on search query
     */
    private fun filterChannels(query: String) {
        filteredChannels = if (query.isEmpty()) {
            allChannels
        } else {
            allChannels.filter { channel ->
                channel.name.contains(query, ignoreCase = true) ||
                channel.number.toString().contains(query)
            }
        }
        
        channelAdapter.submitList(filteredChannels)
    }
    
    /**
     * Set listener for channel selection
     */
    fun setOnChannelSelectedListener(listener: (Channel) -> Unit) {
        onChannelSelectedListener = listener
    }
    
    /**
     * Request focus on search field
     */
    fun requestSearchFocus() {
        searchField.requestFocus()
    }
    
    /**
     * Clear search and show all channels
     */
    fun clearSearch() {
        searchField.text.clear()
    }
    
    companion object {
        fun newInstance(): ChannelSidebarFragment {
            return ChannelSidebarFragment()
        }
    }
}
