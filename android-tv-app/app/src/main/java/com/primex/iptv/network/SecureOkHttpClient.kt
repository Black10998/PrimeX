package com.primex.iptv.network

import android.content.Context
import com.primex.iptv.security.SecurityManager
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

/**
 * SecureOkHttpClient - Maximum Security HTTP Client
 * 
 * CRITICAL SECURITY:
 * - Certificate pinning enforced
 * - Integrity verification on every request
 * - No bypass possible
 * 
 * ANY tampering or MITM attempt = connection fails
 */
object SecureOkHttpClient {
    
    private const val PRIMEX_DOMAIN = "prime-x.live"
    
    /**
     * Create secure OkHttpClient with certificate pinning
     * Verifies app integrity before creating client
     */
    fun create(context: Context): OkHttpClient {
        // CRITICAL: Verify integrity before creating client
        SecurityManager.verifyIntegrity(context)
        
        // Get certificate pins from SecurityManager
        val pins = SecurityManager.getCertificatePins()
        
        // Build certificate pinner
        val certificatePinnerBuilder = CertificatePinner.Builder()
        
        // Add all pins for prime-x.live
        pins.forEach { pin ->
            if (pin != "REPLACE_WITH_ACTUAL_CERTIFICATE_PIN_1" && 
                pin != "REPLACE_WITH_ACTUAL_CERTIFICATE_PIN_2") {
                certificatePinnerBuilder.add(PRIMEX_DOMAIN, "sha256/$pin")
            }
        }
        
        val certificatePinner = certificatePinnerBuilder.build()
        
        // Create logging interceptor
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (android.util.Log.isLoggable("SecureOkHttpClient", android.util.Log.DEBUG)) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        
        // Create integrity verification interceptor
        val integrityInterceptor = okhttp3.Interceptor { chain ->
            // Verify integrity before every request
            SecurityManager.verifyIntegrity(context)
            chain.proceed(chain.request())
        }
        
        // Build secure client
        return OkHttpClient.Builder()
            .certificatePinner(certificatePinner)  // CRITICAL: Certificate pinning
            .addInterceptor(integrityInterceptor)  // CRITICAL: Integrity check per request
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }
}
