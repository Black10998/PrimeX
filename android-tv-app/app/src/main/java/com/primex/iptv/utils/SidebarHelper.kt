package com.primex.iptv.utils

import android.content.Context
import android.util.Log
import com.primex.iptv.api.ApiClient
import com.primex.iptv.config.ConfigManager
import com.primex.iptv.models.Channel
import com.primex.iptv.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/**
 * SidebarHelper - Helper to load and populate channel sidebar
 * 
 * Makes it easy to integrate sidebar in any fragment
 */
object SidebarHelper {
    
    private const val TAG = "SidebarHelper"
    
    /**
     * Load live channels and populate sidebar
     */
    fun loadLiveChannelsToSidebar(
        context: Context,
        activity: MainActivity?,
        scope: CoroutineScope
    ) {
        val username = PreferenceManager.getXtreamUsername(context)
        val password = PreferenceManager.getXtreamPassword(context)
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            Log.w(TAG, "No credentials - cannot load channels")
            return
        }
        
        scope.launch {
            try {
                val response = ApiClient.xtreamApiService.getLiveStreams(username, password)
                
                if (response.isSuccessful && response.body() != null) {
                    val streams = response.body()!!
                    
                    // Convert to Channel objects with numbers
                    val channels = streams.mapIndexed { index, stream ->
                        Channel(
                            id = stream.streamId?.toString() ?: "0",
                            name = stream.name ?: "Unknown Channel",
                            number = index + 1,
                            logo_url = stream.streamIcon,
                            stream_url = ConfigManager.buildLiveStreamUrl(
                                context,
                                username,
                                password,
                                stream.streamId?.toString() ?: "0"
                            ),
                            category = stream.categoryName
                        )
                    }
                    
                    // Update sidebar
                    activity?.setSidebarChannels(channels)
                    
                    Log.d(TAG, "Loaded ${channels.size} channels to sidebar")
                } else {
                    Log.e(TAG, "Failed to load channels: ${response.code()}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading channels: ${e.message}", e)
            }
        }
    }
    
    /**
     * Setup channel selection handler for playback
     */
    fun setupChannelPlayback(
        context: Context,
        activity: MainActivity?,
        onChannelSelected: (Channel) -> Unit
    ) {
        activity?.setOnChannelSelectedListener { channel ->
            onChannelSelected(channel)
        }
    }
}
