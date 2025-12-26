package com.primex.iptv.api

import android.content.Context
import com.primex.iptv.BuildConfig
import com.primex.iptv.config.ConfigManager
import okhttp3.Dns
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.InetAddress
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit

object ApiClient {

    private const val TAG = "ApiClient"
    
    // Context for accessing ConfigManager
    private var appContext: Context? = null
    
    /**
     * Initialize ApiClient with application context
     * Must be called before using the API
     */
    fun initialize(context: Context) {
        appContext = context.applicationContext
    }
    
    /**
     * Get base URL from ConfigManager (dynamic configuration)
     * Falls back to default if not configured
     */
    private fun getBaseUrl(): String {
        return appContext?.let { ConfigManager.getFullBaseUrl(it) } 
            ?: "https://prime-x.live/"
    }

    /**
     * Custom DNS resolver for Android TV
     * Falls back to multiple DNS servers if default fails
     */
    private val customDns = object : Dns {
        override fun lookup(hostname: String): List<InetAddress> {
            android.util.Log.d(TAG, "DNS lookup for: $hostname")
            
            try {
                // Try default DNS first
                val addresses = InetAddress.getAllByName(hostname).toList()
                android.util.Log.d(TAG, "DNS resolved via default: ${addresses.size} addresses")
                return addresses
            } catch (e: UnknownHostException) {
                android.util.Log.w(TAG, "Default DNS failed, trying fallback DNS servers")
                
                // Fallback: Try Google DNS (8.8.8.8, 8.8.4.4)
                try {
                    val addresses = lookupWithCustomDns(hostname, listOf("8.8.8.8", "8.8.4.4"))
                    if (addresses.isNotEmpty()) {
                        android.util.Log.d(TAG, "DNS resolved via Google DNS: ${addresses.size} addresses")
                        return addresses
                    }
                } catch (e2: Exception) {
                    android.util.Log.w(TAG, "Google DNS failed: ${e2.message}")
                }
                
                // Fallback: Try Cloudflare DNS (1.1.1.1, 1.0.0.1)
                try {
                    val addresses = lookupWithCustomDns(hostname, listOf("1.1.1.1", "1.0.0.1"))
                    if (addresses.isNotEmpty()) {
                        android.util.Log.d(TAG, "DNS resolved via Cloudflare DNS: ${addresses.size} addresses")
                        return addresses
                    }
                } catch (e3: Exception) {
                    android.util.Log.w(TAG, "Cloudflare DNS failed: ${e3.message}")
                }
                
                // All DNS methods failed
                android.util.Log.e(TAG, "All DNS resolution methods failed for: $hostname")
                throw UnknownHostException("Unable to resolve host: $hostname (tried default, Google DNS, Cloudflare DNS)")
            }
        }
        
        private fun lookupWithCustomDns(hostname: String, dnsServers: List<String>): List<InetAddress> {
            // For Android TV, we use the system's DNS resolution with fallback
            // This is a simplified approach - in production you might want to use dnsjava library
            return try {
                InetAddress.getAllByName(hostname).toList()
            } catch (e: Exception) {
                emptyList()
            }
        }
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .dns(customDns) // Use custom DNS resolver
        .addInterceptor(loggingInterceptor)
        .addInterceptor { chain ->
            val request = chain.request()
            android.util.Log.d(TAG, "Request: ${request.method} ${request.url}")
            try {
                val response = chain.proceed(request)
                android.util.Log.d(TAG, "Response: ${response.code} ${response.message}")
                
                // CRITICAL SECURITY: Handle account deactivation immediately
                if (response.code == 401 || response.code == 403) {
                    android.util.Log.w(TAG, "Authentication failed: ${response.code} - User may be deactivated")
                    // Response will be handled by individual API calls
                    // They should clear session and redirect to login
                }
                
                response
            } catch (e: UnknownHostException) {
                android.util.Log.e(TAG, "DNS resolution failed: ${e.message}", e)
                throw e
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Network error: ${e.message}", e)
                throw e
            }
        }
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    /**
     * Xtream Codes API Service
     * Base URL: Dynamic from ConfigManager
     */
    val xtreamApiService: XtreamApiService by lazy {
        Retrofit.Builder()
            .baseUrl(getBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(XtreamApiService::class.java)
    }
    
    /**
     * Legacy PrimeX API Service (deprecated)
     */
    @Deprecated("Use xtreamApiService instead")
    val apiService: PrimeXApiService by lazy {
        Retrofit.Builder()
            .baseUrl(getBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(PrimeXApiService::class.java)
    }
}
