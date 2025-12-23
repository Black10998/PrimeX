package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import com.primex.iptv.R
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.LoginRequest
import com.primex.iptv.utils.PreferenceManager
import kotlinx.coroutines.launch

class LoginActivity : BaseActivity() {

    private lateinit var usernameInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var errorText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Check if user is already logged in with valid session
        if (com.primex.iptv.utils.SessionManager.checkSessionValidity(this)) {
            navigateToMain()
            return
        }
        
        setContentView(R.layout.activity_login_premium)

        initViews()
        setupListeners()
        
        // Show logout reason if provided
        intent.getStringExtra("logout_reason")?.let { reason ->
            showError(reason)
        }
    }

    private fun initViews() {
        usernameInput = findViewById(R.id.username_input)
        passwordInput = findViewById(R.id.password_input)
        loginButton = findViewById(R.id.login_button)
        progressBar = findViewById(R.id.progress_bar)
        errorText = findViewById(R.id.error_text)
    }

    private fun setupListeners() {
        loginButton.setOnClickListener {
            val username = usernameInput.text.toString().trim()
            val password = passwordInput.text.toString().trim()

            if (validateInput(username, password)) {
                performLogin(username, password)
            }
        }
    }

    private fun validateInput(username: String, password: String): Boolean {
        return when {
            username.isEmpty() -> {
                showError("Please enter your username")
                usernameInput.requestFocus()
                false
            }
            password.isEmpty() -> {
                showError("Please enter your password")
                passwordInput.requestFocus()
                false
            }
            else -> true
        }
    }

    private fun performLogin(username: String, password: String) {
        lifecycleScope.launch {
            try {
                showLoading(true)
                errorText.visibility = View.GONE
                
                android.util.Log.d("LoginActivity", "Starting Xtream login for user: $username")

                // Xtream Codes authentication
                val response = ApiClient.xtreamApiService.authenticate(username, password)
                
                android.util.Log.d("LoginActivity", "Response code: ${response.code()}")

                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    val userInfo = authResponse.userInfo
                    
                    android.util.Log.d("LoginActivity", "Auth: ${userInfo?.auth}, Status: ${userInfo?.status}")

                    // Check if authentication was successful
                    // Accept login when auth == 1 and status is NOT blocked (Expired, Banned, Disabled)
                    val isBlocked = userInfo?.status in listOf("Expired", "Banned", "Disabled")
                    
                    if (userInfo?.auth == 1 && !isBlocked) {
                        val expDate = userInfo.expDate
                        
                        android.util.Log.d("LoginActivity", "Login successful - User: $username, Status: ${userInfo.status}")
                        android.util.Log.d("LoginActivity", "Expires: $expDate, Max connections: ${userInfo.maxConnections}")
                        
                        // Save Xtream credentials
                        PreferenceManager.saveXtreamCredentials(
                            this@LoginActivity,
                            username,
                            password,
                            expDate
                        )
                        
                        // Verify save was successful
                        val savedUsername = PreferenceManager.getXtreamUsername(this@LoginActivity)
                        if (savedUsername == username) {
                            android.util.Log.d("LoginActivity", "Credentials saved successfully - navigating to main")
                            kotlinx.coroutines.delay(500)
                            navigateToMain()
                        } else {
                            android.util.Log.e("LoginActivity", "Credential save verification FAILED")
                            showError("Failed to save login credentials. Please try again.")
                        }
                    } else {
                        val errorMsg = when {
                            userInfo?.auth != 1 -> "Invalid username or password"
                            userInfo.status == "Expired" -> "Your subscription has expired"
                            userInfo.status == "Banned" -> "Your account has been banned"
                            userInfo.status == "Disabled" -> "Your account has been disabled"
                            else -> userInfo?.message ?: "Login failed"
                        }
                        android.util.Log.e("LoginActivity", "Login failed: $errorMsg")
                        showError(errorMsg)
                    }
                } else {
                    val errorMsg = "Login failed: ${response.code()} - ${response.message()}"
                    android.util.Log.e("LoginActivity", errorMsg)
                    showError(errorMsg)
                }
            } catch (e: java.net.UnknownHostException) {
                val errorMsg = "Cannot reach server. Check network connection."
                android.util.Log.e("LoginActivity", "DNS/Network error: ${e.message}", e)
                showError(errorMsg)
            } catch (e: javax.net.ssl.SSLException) {
                val errorMsg = "SSL/Certificate error. Server connection failed."
                android.util.Log.e("LoginActivity", "SSL error: ${e.message}", e)
                showError(errorMsg)
            } catch (e: java.net.SocketTimeoutException) {
                val errorMsg = "Connection timeout. Server not responding."
                android.util.Log.e("LoginActivity", "Timeout error: ${e.message}", e)
                showError(errorMsg)
            } catch (e: java.io.IOException) {
                val errorMsg = "Network I/O error: ${e.message}"
                android.util.Log.e("LoginActivity", "I/O error: ${e.message}", e)
                showError(errorMsg)
            } catch (e: Exception) {
                val errorMsg = "Connection error: ${e.javaClass.simpleName} - ${e.message}"
                android.util.Log.e("LoginActivity", "Unexpected error: ${e.javaClass.name}", e)
                e.printStackTrace()
                showError(errorMsg)
            } finally {
                showLoading(false)
            }
        }
    }

    private fun showLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        loginButton.isEnabled = !loading
        usernameInput.isEnabled = !loading
        passwordInput.isEnabled = !loading
    }

    private fun showError(message: String) {
        errorText.text = message
        errorText.visibility = View.VISIBLE
    }

    private fun navigateToMain() {
        val intent = Intent(this@LoginActivity, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
