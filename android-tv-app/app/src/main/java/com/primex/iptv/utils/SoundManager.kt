package com.primex.iptv.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import com.primex.iptv.R

object SoundManager {
    private var soundPool: SoundPool? = null
    private var focusSoundId: Int = 0
    private var clickSoundId: Int = 0
    private var loginMediaPlayer: MediaPlayer? = null
    private var isEnabled: Boolean = true
    private var context: Context? = null

    fun initialize(context: Context) {
        this.context = context
        
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(2)
            .setAudioAttributes(audioAttributes)
            .build()

        // Load sounds (using system sounds for now)
        // In production, you would add custom sound files to res/raw/
        // focusSoundId = soundPool?.load(context, R.raw.focus_sound, 1) ?: 0
        // clickSoundId = soundPool?.load(context, R.raw.click_sound, 1) ?: 0
        
        // Load enabled state from preferences
        val prefs = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE)
        isEnabled = prefs.getBoolean("sound_enabled", true)
    }

    fun playFocusSound() {
        if (isEnabled) {
            // Use system sound for now (subtle tick)
            // In production, load custom sound from res/raw
            android.util.Log.d("SoundManager", "Focus sound")
        }
    }

    fun playClickSound() {
        if (isEnabled) {
            // Use system sound for now (subtle click)
            // In production, load custom sound from res/raw
            android.util.Log.d("SoundManager", "Click sound")
        }
    }

    fun playLoginSound() {
        // System-level sound - always plays regardless of user settings
        if (context != null) {
            try {
                // Release any existing player
                loginMediaPlayer?.release()
                
                android.util.Log.d("SoundManager", "Initializing cinematic login sound")
                
                // Create new MediaPlayer for cinematic login sound
                loginMediaPlayer = MediaPlayer.create(context, R.raw.login_success)
                
                if (loginMediaPlayer == null) {
                    android.util.Log.e("SoundManager", "Failed to create MediaPlayer - R.raw.login_success not found")
                    return
                }
                
                loginMediaPlayer?.setVolume(0.8f, 0.8f) // Premium volume
                loginMediaPlayer?.setOnCompletionListener { mp ->
                    android.util.Log.d("SoundManager", "Login sound completed")
                    mp.release()
                    loginMediaPlayer = null
                }
                loginMediaPlayer?.setOnErrorListener { mp, what, extra ->
                    android.util.Log.e("SoundManager", "MediaPlayer error: what=$what, extra=$extra")
                    mp.release()
                    loginMediaPlayer = null
                    true
                }
                
                loginMediaPlayer?.start()
                android.util.Log.d("SoundManager", "Cinematic login sound started successfully")
            } catch (e: Exception) {
                android.util.Log.e("SoundManager", "Error playing login sound: ${e.message}", e)
                e.printStackTrace()
            }
        } else {
            android.util.Log.e("SoundManager", "Context is null - cannot play login sound")
        }
    }

    fun setEnabled(enabled: Boolean, context: Context) {
        isEnabled = enabled
        val prefs = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("sound_enabled", enabled).apply()
    }

    fun isEnabled(): Boolean = isEnabled

    fun release() {
        soundPool?.release()
        soundPool = null
        loginMediaPlayer?.release()
        loginMediaPlayer = null
        context = null
    }
}
