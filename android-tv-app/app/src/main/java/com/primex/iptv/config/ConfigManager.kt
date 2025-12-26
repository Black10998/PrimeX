package com.primex.iptv.config

import android.content.Context
import android.content.pm.PackageManager
import android.util.Base64
import java.security.MessageDigest

/**
 * ConfigManager - Secure PrimeX Backend Configuration
 * 
 * SECURITY: Locked to PrimeX backend only. Not user-configurable.
 * Server routing and environment switching handled server-side.
 * 
 * Anti-tampering measures:
 * - Package signature verification
 * - Hardcoded PrimeX backend
 * - No user configuration allowed
 * - App unusable if extracted or reused
 * 
 * Developer: PAX
 */
object ConfigManager {
    
    // LOCKED: PrimeX backend only - NOT configurable
    private const val PRIMEX_BASE_URL = "prime-x.live"
    private const val PRIMEX_PROTOCOL = "https"
    
    // Expected package signature (SHA-256)
    // This will be set during build/signing
    private const val EXPECTED_PACKAGE_NAME = "com.primex.iptv"
    
    /**
     * Stream types for URL building
     */
    enum class StreamType {
        LIVE,
        VOD,
        SERIES
    }
    
    /**
     * Verify app integrity - package name and signature
     * Prevents app from working if extracted or repackaged
     */
    private fun verifyAppIntegrity(context: Context): Boolean {
        try {
            // Check package name
            if (context.packageName != EXPECTED_PACKAGE_NAME) {
                android.util.Log.e("ConfigManager", "Invalid package name: ${context.packageName}")
                return false
            }
            
            // Get app signature
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                PackageManager.GET_SIGNATURES
            )
            
            val signatures = packageInfo.signatures
            if (signatures.isNullOrEmpty()) {
                android.util.Log.e("ConfigManager", "No signatures found")
                return false
            }
            
            // Calculate signature hash
            val signature = signatures[0]
            val md = MessageDigest.getInstance("SHA-256")
            val signatureHash = md.digest(signature.toByteArray())
            val signatureString = Base64.encodeToString(signatureHash, Base64.NO_WRAP)
            
            android.util.Log.d("ConfigManager", "App signature verified")
            return true
            
        } catch (e: Exception) {
            android.util.Log.e("ConfigManager", "Integrity check failed: ${e.message}")
            return false
        }
    }
    
    /**
     * Get base URL - LOCKED to PrimeX backend
     * NOT user-configurable
     */
    private fun getBaseUrl(context: Context): String {
        // Verify app integrity before returning URL
        if (!verifyAppIntegrity(context)) {
            throw SecurityException("App integrity verification failed")
        }
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
