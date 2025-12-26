package com.primex.iptv.config

import android.content.Context

/**
 * ConfigManager - Production PrimeX Backend Configuration
 * 
 * LOCKED TO PRIMEX:
 * - Hardcoded to prime-x.live
 * - HTTPS only
 * - No user configuration
 * 
 * Clean, simple, production-grade.
 */
object ConfigManager {
    
    // LOCKED: PrimeX backend only
    private const val PRIMEX_BASE_URL = "prime-x.live"
    private const val PRIMEX_PROTOCOL = "https"
    
    /**
     * Stream types for URL building
     */
    enum class StreamType {
        LIVE,
        VOD,
        SERIES
    }
    
    /**
     * Get base URL - LOCKED to PrimeX backend
     */
    private fun getBaseUrl(): String {
        return PRIMEX_BASE_URL
    }
    
    /**
     * Get full base URL with protocol
     */
    fun getFullBaseUrl(context: Context): String {
        val baseUrl = getBaseUrl()
        return "$PRIMEX_PROTOCOL://$baseUrl/"
    }
    
    /**
     * Build API URL for Xtream Codes API
     */
    fun buildApiUrl(context: Context): String {
        return getFullBaseUrl(context)
    }
    
    /**
     * Build stream URL for live channels
     * Format: https://prime-x.live/live/username/password/streamId.m3u8
     */
    fun buildLiveStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String
    ): String {
        val baseUrl = getBaseUrl()
        return "$PRIMEX_PROTOCOL://$baseUrl/live/$username/$password/$streamId.m3u8"
    }
    
    /**
     * Build stream URL for VOD (movies)
     * Format: https://prime-x.live/movie/username/password/streamId.mp4
     */
    fun buildVodStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String,
        extension: String = "mp4"
    ): String {
        val baseUrl = getBaseUrl()
        return "$PRIMEX_PROTOCOL://$baseUrl/movie/$username/$password/$streamId.$extension"
    }
    
    /**
     * Build stream URL for series episodes
     * Format: https://prime-x.live/series/username/password/episodeId.mp4
     */
    fun buildSeriesStreamUrl(
        context: Context,
        username: String,
        password: String,
        episodeId: String,
        extension: String = "mp4"
    ): String {
        val baseUrl = getBaseUrl()
        return "$PRIMEX_PROTOCOL://$baseUrl/series/$username/$password/$episodeId.$extension"
    }
    
    /**
     * Build generic stream URL
     */
    fun buildStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String,
        type: StreamType,
        extension: String? = null
    ): String {
        return when (type) {
            StreamType.LIVE -> buildLiveStreamUrl(context, username, password, streamId)
            StreamType.VOD -> buildVodStreamUrl(context, username, password, streamId, extension ?: "mp4")
            StreamType.SERIES -> buildSeriesStreamUrl(context, username, password, streamId, extension ?: "mp4")
        }
    }
}
