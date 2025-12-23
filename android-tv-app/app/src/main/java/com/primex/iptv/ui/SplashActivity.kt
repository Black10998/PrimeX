package com.primex.iptv.ui

import android.animation.ObjectAnimator
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.ImageView
import androidx.activity.ComponentActivity
import com.primex.iptv.R
import com.primex.iptv.utils.PreferenceManager

class SplashActivity : ComponentActivity() {

    private val splashDuration = 2500L // 2.5 seconds
    private lateinit var logoView: ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        logoView = findViewById(R.id.splash_logo)

        // Animate logo
        animateLogo()

        // Navigate after delay
        Handler(Looper.getMainLooper()).postDelayed({
            navigateToNextScreen()
        }, splashDuration)
    }

    private fun animateLogo() {
        // Scale animation
        logoView.scaleX = 0.8f
        logoView.scaleY = 0.8f
        logoView.alpha = 0f

        logoView.animate()
            .scaleX(1f)
            .scaleY(1f)
            .alpha(1f)
            .setDuration(1000)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()

        // Subtle rotation for premium feel
        ObjectAnimator.ofFloat(logoView, View.ROTATION, 0f, 360f).apply {
            duration = 20000
            repeatCount = ObjectAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    private fun navigateToNextScreen() {
        val isLoggedIn = PreferenceManager.isLoggedIn(this)
        val username = PreferenceManager.getXtreamUsername(this)
        val password = PreferenceManager.getXtreamPassword(this)

        val intent = if (isLoggedIn && !username.isNullOrEmpty() && !password.isNullOrEmpty()) {
            // User is logged in, go to main
            Intent(this, MainActivity::class.java)
        } else {
            // Not logged in, go to login
            Intent(this, LoginActivity::class.java)
        }

        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        
        // Smooth transition
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }
}
