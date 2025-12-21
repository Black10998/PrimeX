package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.primex.iptv.R
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.DeviceRegistrationRequest
import com.primex.iptv.models.DeviceStatusResponse
import com.primex.iptv.utils.DeviceUtils
import com.primex.iptv.utils.PreferenceManager
import kotlinx.coroutines.launch

class ActivationActivity : AppCompatActivity() {

    private lateinit var deviceKeyText: TextView
    private lateinit var statusText: TextView
    private lateinit var instructionsText: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorText: TextView

    private val handler = Handler(Looper.getMainLooper())
    private var pollingRunnable: Runnable? = null
    private var deviceKey: String? = null
    private var macAddress: String? = null

    companion object {
        private const val POLLING_INTERVAL = 5000L // 5 seconds
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_activation)

        initViews()
        registerDevice()
    }

    private fun initViews() {
        deviceKeyText = findViewById(R.id.device_key_text)
        statusText = findViewById(R.id.status_text)
        instructionsText = findViewById(R.id.instructions_text)
        progressBar = findViewById(R.id.progress_bar)
        errorText = findViewById(R.id.error_text)
    }

    private fun registerDevice() {
        // Always get a device ID - never fail
        macAddress = DeviceUtils.getDeviceId(this)
        
        lifecycleScope.launch {
            try {
                progressBar.visibility = View.VISIBLE
                statusText.text = "Registering device..."
                errorText.visibility = View.GONE
                
                val request = DeviceRegistrationRequest(macAddress!!)
                val response = ApiClient.apiService.registerDevice(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val registrationResponse = response.body()!!
                    deviceKey = registrationResponse.device_key
                    
                    // Save device credentials
                    PreferenceManager.saveDeviceKey(this@ActivationActivity, deviceKey!!)
                    PreferenceManager.saveMacAddress(this@ActivationActivity, macAddress!!)
                    
                    // Display device key
                    deviceKeyText.text = deviceKey
                    deviceKeyText.visibility = View.VISIBLE
                    instructionsText.visibility = View.VISIBLE
                    progressBar.visibility = View.GONE
                    statusText.text = "Waiting for activation..."
                    
                    // Start polling for activation status
                    startPolling()
                } else {
                    showError("Registration failed: ${response.message()}", true)
                }
            } catch (e: Exception) {
                showError("Registration error: ${e.message}", true)
            }
        }
    }

    private fun startPolling() {
        pollingRunnable = object : Runnable {
            override fun run() {
                checkActivationStatus()
                handler.postDelayed(this, POLLING_INTERVAL)
            }
        }
        handler.post(pollingRunnable!!)
    }

    private fun stopPolling() {
        pollingRunnable?.let {
            handler.removeCallbacks(it)
        }
    }

    private fun checkActivationStatus() {
        if (deviceKey.isNullOrEmpty() || macAddress.isNullOrEmpty()) {
            return
        }

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.checkDeviceStatus(deviceKey!!, macAddress!!)
                
                if (response.isSuccessful && response.body() != null) {
                    val statusResponse = response.body()!!
                    handleStatusResponse(statusResponse)
                }
            } catch (e: Exception) {
                // Silent fail during polling - continue trying
            }
        }
    }

    private fun handleStatusResponse(response: DeviceStatusResponse) {
        when (response.status) {
            "active" -> {
                // Device is activated!
                stopPolling()
                
                // Save subscription info
                response.subscription?.let { subscription ->
                    PreferenceManager.saveSubscriptionInfo(
                        this,
                        subscription.plan_name,
                        subscription.expires_at
                    )
                }
                
                // Navigate to main activity
                statusText.text = "Activation successful!"
                progressBar.visibility = View.VISIBLE
                
                handler.postDelayed({
                    val intent = Intent(this, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }, 1500)
            }
            "pending" -> {
                // Still waiting
                statusText.text = "Waiting for activation..."
            }
            "expired" -> {
                stopPolling()
                showError("Device subscription has expired. Please contact support.", false)
            }
            "blocked" -> {
                stopPolling()
                showError("Device has been blocked. Please contact support.", false)
            }
            else -> {
                statusText.text = "Status: ${response.status}"
            }
        }
    }

    private fun showError(message: String, showRetry: Boolean = false) {
        progressBar.visibility = View.GONE
        
        val errorMessage = if (showRetry) {
            "$message\n\nPress BACK to return to main menu, or wait to retry automatically."
        } else {
            "$message\n\nPress BACK to return to main menu."
        }
        
        errorText.text = errorMessage
        errorText.visibility = View.VISIBLE
        statusText.text = "Error"
        
        // Auto-retry after 10 seconds if showRetry is true
        if (showRetry) {
            handler.postDelayed({
                if (!isFinishing) {
                    errorText.visibility = View.GONE
                    registerDevice()
                }
            }, 10000)
        }
    }

    override fun onBackPressed() {
        // Allow user to return to main menu
        super.onBackPressed()
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPolling()
        handler.removeCallbacksAndMessages(null)
    }
}
