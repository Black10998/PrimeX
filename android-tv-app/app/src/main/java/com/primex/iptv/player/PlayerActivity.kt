package com.primex.iptv.player

import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.primex.iptv.R

class PlayerActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_STREAM_URL = "stream_url"
        const val EXTRA_TITLE = "title"
        const val EXTRA_TYPE = "type"
    }

    private lateinit var playerView: PlayerView
    private var player: ExoPlayer? = null
    private var streamUrl: String? = null
    private var contentTitle: String? = null
    private var contentType: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.player_view)
        
        streamUrl = intent.getStringExtra(EXTRA_STREAM_URL)
        contentTitle = intent.getStringExtra(EXTRA_TITLE)
        contentType = intent.getStringExtra(EXTRA_TYPE)

        if (streamUrl.isNullOrEmpty()) {
            Toast.makeText(this, "Invalid stream URL", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupPlayer()
    }

    private fun setupPlayer() {
        player = ExoPlayer.Builder(this).build().also { exoPlayer ->
            playerView.player = exoPlayer
            
            // Set media item
            val mediaItem = MediaItem.fromUri(streamUrl!!)
            exoPlayer.setMediaItem(mediaItem)
            
            // Prepare and play
            exoPlayer.prepare()
            exoPlayer.playWhenReady = true
            
            // Add listener for errors
            exoPlayer.addListener(object : Player.Listener {
                override fun onPlayerError(error: PlaybackException) {
                    handlePlaybackError(error)
                }

                override fun onPlaybackStateChanged(playbackState: Int) {
                    when (playbackState) {
                        Player.STATE_BUFFERING -> {
                            // Show buffering indicator
                        }
                        Player.STATE_READY -> {
                            // Hide buffering indicator
                        }
                        Player.STATE_ENDED -> {
                            // Playback ended
                            finish()
                        }
                    }
                }
            })
        }

        // Configure player view
        playerView.apply {
            controllerShowTimeoutMs = 5000
            controllerHideOnTouch = false
            useController = true
        }
    }

    private fun handlePlaybackError(error: PlaybackException) {
        val errorMessage = when (error.errorCode) {
            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED,
            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT -> 
                "Network connection failed. Please check your internet connection."
            PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS ->
                "Stream not available. Please try again later."
            PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED,
            PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED ->
                "Invalid stream format."
            else -> "Playback error: ${error.message}"
        }
        
        Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
        finish()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle back button
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            releasePlayer()
            finish()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
    }

    override fun onResume() {
        super.onResume()
        player?.play()
    }

    override fun onDestroy() {
        super.onDestroy()
        releasePlayer()
    }

    private fun releasePlayer() {
        player?.let {
            it.release()
            player = null
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }
}
