package com.primex.iptv.config

import android.content.Context
import android.content.SharedPreferences

/**
 * ConfigManager - Dynamic Server Configuration
 * 
 * Manages server URLs and portal configuration dynamically.
 * Replaces all hardcoded URLs with configurable values.
 * 
 * Backend Compatibility: Uses existing PAX/PrimeX API endpoints,
 * just makes the base URL configurable.
 * 
 * Developer: PAX
 */
object ConfigManager {
    
    private const val PREFS_NAME = "pax_server_config"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_SERVER_NAME = "server_name"
    private const val KEY_PORTAL_TYPE = "portal_type"
    private const val KEY_USE_HTTPS = "use_https"
    
    // Default server (existing PAX/PrimeX backend)
    private const val DEFAULT_BASE_URL = "prime-x.live"
    private const val DEFAULT_SERVER_NAME = "PAX IPTV Server"
    
    /**
     * Portal types supported by the application
     */
    enum class PortalType(val value: String) {
        XTREAM_CODES("xtream"),
        STALKER_PORTAL("stalker"),
        CUSTOM("custom");
        
        companion object {
            fun fromValue(value: String): PortalType {
                return values().find { it.value == value } ?: XTREAM_CODES
            }
        }
    }
    
    /**
     * Stream types for URL building
     */
    enum class StreamType {
        LIVE,
        VOD,
        SERIES
    }
    
    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    /**
     * Get configured base URL (without protocol)
     */
    fun getBaseUrl(context: Context): String {
        return getPrefs(context).getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }
    
    /**
     * Set base URL
     */
    fun setBaseUrl(context: Context, url: String) {
        // Clean URL (remove protocol if present)
        val cleanUrl = url.replace("https://", "").replace("http://", "").trim('/')
        getPrefs(context).edit().putString(KEY_BASE_URL, cleanUrl).apply()
    }
    
    /**
     * Get server name
     */
    fun getServerName(context: Context): String {
        return getPrefs(context).getString(KEY_SERVER_NAME, DEFAULT_SERVER_NAME) ?: DEFAULT_SERVER_NAME
    }
    
    /**
     * Set server name
     */
    fun setServerName(context: Context, name: String) {
        getPrefs(context).edit().putString(KEY_SERVER_NAME, name).apply()
    }
    
    /**
     * Get portal type
     */
    fun getPortalType(context: Context): PortalType {
        val value = getPrefs(context).getString(KEY_PORTAL_TYPE, PortalType.XTREAM_CODES.value)
        return PortalType.fromValue(value ?: PortalType.XTREAM_CODES.value)
    }
    
    /**
     * Set portal type
     */
    fun setPortalType(context: Context, type: PortalType) {
        getPrefs(context).edit().putString(KEY_PORTAL_TYPE, type.value).apply()
    }
    
    /**
     * Check if HTTPS should be used
     */
    fun useHttps(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_USE_HTTPS, true)
    }
    
    /**
     * Set HTTPS usage
     */
    fun setUseHttps(context: Context, useHttps: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_USE_HTTPS, useHttps).apply()
    }
    
    /**
     * Get full base URL with protocol
     */
    fun getFullBaseUrl(context: Context): String {
        val protocol = if (useHttps(context)) "https" else "http"
        val baseUrl = getBaseUrl(context)
        return "$protocol://$baseUrl/"
    }
    
    /**
     * Build API URL for Xtream Codes API
     * Compatible with existing PAX/PrimeX backend
     */
    fun buildApiUrl(context: Context): String {
        return getFullBaseUrl(context)
    }
    
    /**
     * Build stream URL for live channels
     * Format: http(s)://domain/live/username/password/streamId.m3u8
     */
    fun buildLiveStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String
    ): String {
        val protocol = if (useHttps(context)) "https" else "http"
        val baseUrl = getBaseUrl(context)
        return "$protocol://$baseUrl/live/$username/$password/$streamId.m3u8"
    }
    
    /**
     * Build stream URL for VOD (movies)
     * Format: http(s)://domain/movie/username/password/streamId.mp4
     */
    fun buildVodStreamUrl(
        context: Context,
        username: String,
        password: String,
        streamId: String,
        extension: String = "mp4"
    ): String {
        val protocol = if (useHttps(context)) "https" else "http"
        val baseUrl = getBaseUrl(context)
        return "$protocol://$baseUrl/movie/$username/$password/$streamId.$extension"
    }
    
    /**
     * Build stream URL for series episodes
     * Format: http(s)://domain/series/username/password/episodeId.mp4
     */
    fun buildSeriesStreamUrl(
        context: Context,
        username: String,
        password: String,
        episodeId: String,
        extension: String = "mp4"
    ): String {
        val protocol = if (useHttps(context)) "https" else "http"
        val baseUrl = getBaseUrl(context)
        return "$protocol://$baseUrl/series/$username/$password/$episodeId.$extension"
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
    
    /**
     * Reset to default configuration
     */
    fun resetToDefaults(context: Context) {
        getPrefs(context).edit().clear().apply()
    }
    
    /**
     * Check if configuration is set (not using defaults)
     */
    fun isConfigured(context: Context): Boolean {
        return getPrefs(context).contains(KEY_BASE_URL)
    }
    
    /**
     * Get configuration summary for display
     */
    fun getConfigSummary(context: Context): String {
        val serverName = getServerName(context)
        val baseUrl = getBaseUrl(context)
        val protocol = if (useHttps(context)) "HTTPS" else "HTTP"
        val portalType = getPortalType(context).name
        
        return """
            Server: $serverName
            URL: $baseUrl
            Protocol: $protocol
            Type: $portalType
        """.trimIndent()
    }
    
    /**
     * Validate URL format
     */
    fun isValidUrl(url: String): Boolean {
        if (url.isBlank()) return false
        
        // Remove protocol if present
        val cleanUrl = url.replace("https://", "").replace("http://", "").trim('/')
        
        // Basic validation: should contain at least one dot and no spaces
        return cleanUrl.contains(".") && !cleanUrl.contains(" ")
    }
}
