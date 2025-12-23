package com.primex.iptv.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool

object SoundManager {
    private var soundPool: SoundPool? = null
    private var focusSoundId: Int = 0
    private var clickSoundId: Int = 0
    private var isEnabled: Boolean = true

    fun initialize(context: Context) {
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
        if (isEnabled) {
            // Elegant login success sound
            // In production, load custom sound from res/raw
            android.util.Log.d("SoundManager", "Login sound")
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
    }
}
