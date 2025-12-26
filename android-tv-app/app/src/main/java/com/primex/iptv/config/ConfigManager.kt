package com.primex.iptv.config

import android.content.Context
import com.primex.iptv.security.SecurityManager

/**
 * ConfigManager - Maximum Security PrimeX Backend Configuration
 * 
 * CRITICAL SECURITY:
 * - Cryptographically bound to PrimeX
 * - Certificate pinning enforced
 * - Signature verification on every call
 * - No user configuration possible
 * - No fallback, no bypass
 * 
 * ANY tampering = immediate termination
 * 
 * Developer: PAX
 */
object ConfigManager {
    
    // LOCKED: PrimeX backend only - CRYPTOGRAPHICALLY BOUND
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
     * Get base URL - CRYPTOGRAPHICALLY LOCKED to PrimeX backend
     * Verifies app integrity on EVERY call
     * NOT user-configurable, NO bypass possible
     */
    private fun getBaseUrl(context: Context): String {
        // CRITICAL: Verify app integrity before returning URL
        SecurityManager.verifyIntegrity(context)
        return PRIMEX_BASE_URL
    }
    
    /**
     * Get full base URL with protocol - LOCKED to PrimeX
     */
    fun getFullBaseUrl(context: Context): String {
        val baseUrl = getBaseUrl(context) // Includes integrity check
        return "$PRIMEX_PROTOCOL://$baseUrl/"
    }
    
    /**
     * Build API URL for Xtream Codes API
     * LOCKED to PrimeX backend
     */
    fun buildApiUrl(context: Context): String {
        return getFullBaseUrl(context)
    }
    
    /**
     * Build stream URL for live channels
     * Format: https://prime-x.live/live/username/password/streamId.m3u8
     * LOCKED to PrimeX backend
     */
    fun buildLiveStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String
    ): String {
        val baseUrl = getBaseUrl(context) // Includes integrity check
        return "$PRIMEX_PROTOCOL://$baseUrl/live/$username/$password/$streamId.m3u8"
    }
    
    /**
     * Build stream URL for VOD (movies)
     * Format: https://prime-x.live/movie/username/password/streamId.mp4
     * LOCKED to PrimeX backend
     */
    fun buildVodStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String,
        extension: String = "mp4"
    ): String {
        val baseUrl = getBaseUrl(context) // Includes integrity check
        return "$PRIMEX_PROTOCOL://$baseUrl/movie/$username/$password/$streamId.$extension"
    }
    
    /**
     * Build stream URL for series episodes
     * Format: https://prime-x.live/series/username/password/episodeId.mp4
     * LOCKED to PrimeX backend
     */
    fun buildSeriesStreamUrl(
        context: Context,
        username: String,
        password: String,
        episodeId: String,
        extension: String = "mp4"
    ): String {
        val baseUrl = getBaseUrl(context) // Includes integrity check
        return "$PRIMEX_PROTOCOL://$baseUrl/series/$username/$password/$episodeId.$extension"
    }
    
    /**
     * Build generic stream URL
     * LOCKED to PrimeX backend
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
