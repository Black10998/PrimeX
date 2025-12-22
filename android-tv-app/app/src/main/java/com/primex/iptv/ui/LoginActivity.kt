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
        
        setContentView(R.layout.activity_login)

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

                val request = LoginRequest(username, password)
                val response = ApiClient.apiService.login(request)

                if (response.isSuccessful && response.body() != null) {
                    val loginResponse = response.body()!!

                    if (loginResponse.success && loginResponse.data != null) {
                        // Save user credentials with subscription expiry
                        val expiresAt = loginResponse.data.user.subscription?.expires_at
                        PreferenceManager.saveUserCredentials(
                            this@LoginActivity,
                            loginResponse.data.user.username,
                            loginResponse.data.token,
                            loginResponse.data.user.id,
                            expiresAt
                        )

                        // Navigate to main screen
                        navigateToMain()
                    } else {
                        showError(loginResponse.message ?: "Login failed")
                    }
                } else {
                    showError("Login failed: ${response.message()}")
                }
            } catch (e: Exception) {
                showError("Connection error: ${e.message}")
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
