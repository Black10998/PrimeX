package com.primex.iptv.ui

import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import com.primex.iptv.R
import com.primex.iptv.api.ApiClient
import com.primex.iptv.utils.PreferenceManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class AccountActivity : BaseActivity() {

    private lateinit var usernameText: TextView
    private lateinit var emailText: TextView
    private lateinit var planNameText: TextView
    private lateinit var statusText: TextView
    private lateinit var statusBadge: View
    private lateinit var expiryDateText: TextView
    private lateinit var maxDevicesText: TextView
    private lateinit var memberSinceText: TextView
    private lateinit var loadingView: View
    private lateinit var contentView: View
    private lateinit var errorView: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_account)

        initViews()
        loadUserData()
    }

    private fun initViews() {
        usernameText = findViewById(R.id.username_text)
        emailText = findViewById(R.id.email_text)
        planNameText = findViewById(R.id.plan_name_text)
        statusText = findViewById(R.id.status_text)
        statusBadge = findViewById(R.id.status_badge)
        expiryDateText = findViewById(R.id.expiry_date_text)
        maxDevicesText = findViewById(R.id.max_devices_text)
        memberSinceText = findViewById(R.id.member_since_text)
        loadingView = findViewById(R.id.loading_view)
        contentView = findViewById(R.id.content_view)
        errorView = findViewById(R.id.error_view)
    }

    private fun loadUserData() {
        showLoading()
        
        val username = PreferenceManager.getXtreamUsername(this)
        val password = PreferenceManager.getXtreamPassword(this)
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            showError()
            return
        }

        lifecycleScope.launch {
            try {
                // Get Xtream account info
                val response = ApiClient.xtreamApiService.authenticate(username, password)
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    val userInfo = authResponse.userInfo
                    val serverInfo = authResponse.serverInfo
                    
                    if (userInfo != null) {
                        // Display Xtream account info
                        usernameText.text = userInfo.username ?: username
                        emailText.text = userInfo.email ?: "N/A"
                        
                        // Status
                        statusText.text = userInfo.status ?: "Unknown"
                        when (userInfo.status) {
                            "Active" -> {
                                statusBadge.setBackgroundResource(R.color.status_active)
                            }
                            "Expired" -> {
                                statusBadge.setBackgroundResource(R.color.status_expired)
                            }
                            else -> {
                                statusBadge.setBackgroundResource(R.color.status_inactive)
                            }
                        }
                        
                        // Expiry date
                        userInfo.expDate?.let { expDate ->
                            try {
                                val timestamp = expDate.toLongOrNull()
                                if (timestamp != null) {
                                    val date = Date(timestamp * 1000)
                                    val formatter = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                                    expiryDateText.text = formatter.format(date)
                                } else {
                                    expiryDateText.text = expDate
                                }
                            } catch (e: Exception) {
                                expiryDateText.text = expDate
                            }
                        } ?: run {
                            expiryDateText.text = "N/A"
                        }
                        
                        // Max connections
                        maxDevicesText.text = userInfo.maxConnections?.toString() ?: "N/A"
                        
                        // Server info
                        planNameText.text = serverInfo?.serverProtocol ?: "Xtream Codes"
                        
                        // Member since (use created date if available)
                        userInfo.createdAt?.let { createdAt ->
                            try {
                                val timestamp = createdAt.toLongOrNull()
                                if (timestamp != null) {
                                    val date = Date(timestamp * 1000)
                                    val formatter = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                                    memberSinceText.text = formatter.format(date)
                                } else {
                                    memberSinceText.text = "N/A"
                                }
                            } catch (e: Exception) {
                                memberSinceText.text = "N/A"
                            }
                        } ?: run {
                            memberSinceText.text = "N/A"
                        }
                        
                        showContent()
                    } else {
                        showError()
                    }
                } else {
                    showError()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                showError()
            }
        }
    }

    private fun displayUserData(data: com.primex.iptv.models.UserProfileData) {
        // Username
        usernameText.text = data.username
        
        // Email
        emailText.text = data.email ?: getString(R.string.email)
        
        // Subscription
        data.subscription?.let { sub ->
            planNameText.text = sub.plan_name ?: "Standard"
            
            // Status
            val isActive = sub.status == "active"
            statusText.text = if (isActive) {
                getString(R.string.subscription_active)
            } else {
                getString(R.string.subscription_expired)
            }
            
            // Status badge color
            statusBadge.setBackgroundResource(
                if (isActive) R.color.success_color else R.color.error_color
            )
            
            // Expiry date
            sub.expires_at?.let { expiry ->
                expiryDateText.text = formatDate(expiry)
            }
            
            // Max devices
            val deviceText = "${sub.active_devices ?: 0} / ${sub.max_devices ?: 1} ${getString(R.string.devices)}"
            maxDevicesText.text = deviceText
        }
        
        // Member since
        data.created_at?.let { created ->
            memberSinceText.text = formatDate(created)
        }
    }

    private fun formatDate(dateString: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
            val date = inputFormat.parse(dateString)
            date?.let { outputFormat.format(it) } ?: dateString
        } catch (e: Exception) {
            dateString
        }
    }

    private fun showLoading() {
        loadingView.visibility = View.VISIBLE
        contentView.visibility = View.GONE
        errorView.visibility = View.GONE
    }

    private fun showContent() {
        loadingView.visibility = View.GONE
        contentView.visibility = View.VISIBLE
        errorView.visibility = View.GONE
    }

    private fun showError() {
        loadingView.visibility = View.GONE
        contentView.visibility = View.GONE
        errorView.visibility = View.VISIBLE
    }
}
