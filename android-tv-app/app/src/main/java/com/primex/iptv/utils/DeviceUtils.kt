package com.primex.iptv.utils

import android.content.Context
import android.net.wifi.WifiManager
import android.provider.Settings
import java.net.NetworkInterface
import java.util.*

object DeviceUtils {

    /**
     * Get stable device identifier
     * Always returns a valid ID - never null or empty
     * Uses ANDROID_ID as primary method for emulator compatibility
     */
    fun getDeviceId(context: Context): String {
        try {
            // Primary: Use ANDROID_ID (works on emulators and real devices)
            val androidId = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            )
            if (!androidId.isNullOrEmpty() && androidId != "9774d56d682e549c") {
                return formatAndroidIdAsMac(androidId)
            }

            // Secondary: Try WiFi MAC address (real devices only)
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            wifiManager?.connectionInfo?.macAddress?.let { mac ->
                if (mac != "02:00:00:00:00:00" && mac.isNotEmpty()) {
                    return mac.uppercase()
                }
            }

            // Tertiary: Try network interfaces
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                val mac = networkInterface.hardwareAddress
                if (mac != null && mac.isNotEmpty()) {
                    val macAddress = mac.joinToString(":") { byte ->
                        String.format("%02X", byte)
                    }
                    if (macAddress != "02:00:00:00:00:00") {
                        return macAddress
                    }
                }
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Fallback: Generate consistent ID from device info
        return generateFallbackMac(context)
    }

    /**
     * Legacy method - redirects to getDeviceId
     */
    @Deprecated("Use getDeviceId instead", ReplaceWith("getDeviceId(context)"))
    fun getMacAddress(context: Context): String = getDeviceId(context)

    private fun formatAndroidIdAsMac(androidId: String): String {
        // Take first 12 characters and format as MAC
        val cleaned = androidId.take(12).padEnd(12, '0')
        return cleaned.chunked(2).joinToString(":")
    }

    private fun generateFallbackMac(context: Context): String {
        // Generate a consistent MAC based on device info
        val deviceInfo = "${android.os.Build.MANUFACTURER}${android.os.Build.MODEL}${android.os.Build.SERIAL}"
        val hash = deviceInfo.hashCode().toString().padStart(12, '0').take(12)
        return hash.chunked(2).joinToString(":")
    }

    /**
     * Get device model name
     */
    fun getDeviceModel(): String {
        return "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
    }

    /**
     * Get Android version
     */
    fun getAndroidVersion(): String {
        return "Android ${android.os.Build.VERSION.RELEASE}"
    }
}
