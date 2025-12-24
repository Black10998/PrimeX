package com.primex.iptv.utils

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.view.View
import android.widget.VideoView

object VideoBackgroundHelper {

    fun setupVideoBackground(videoView: VideoView, videoResId: Int) {
        try {
            android.util.Log.d("VideoBackground", "Setting up video: $videoResId")
            
            // Ensure VideoView doesn't intercept focus or touch events
            videoView.isFocusable = false
            videoView.isFocusableInTouchMode = false
            videoView.isClickable = false
            
            // Set URI
            val uri = Uri.parse("android.resource://${videoView.context.packageName}/$videoResId")
            videoView.setVideoURI(uri)
            
            // Setup video when prepared
            videoView.setOnPreparedListener { mediaPlayer ->
                try {
                    android.util.Log.d("VideoBackground", "Video prepared, starting playback")
                    
                    // Mute and loop
                    mediaPlayer.isLooping = true
                    mediaPlayer.setVolume(0f, 0f)
                    
                    // Get dimensions
                    val videoWidth = mediaPlayer.videoWidth.toFloat()
                    val videoHeight = mediaPlayer.videoHeight.toFloat()
                    val viewWidth = videoView.width.toFloat()
                    val viewHeight = videoView.height.toFloat()
                    
                    android.util.Log.d("VideoBackground", "Video: ${videoWidth}x${videoHeight}, View: ${viewWidth}x${viewHeight}")
                    
                    // Calculate scale to fill screen completely (centerCrop)
                    val scaleX = viewWidth / videoWidth
                    val scaleY = viewHeight / videoHeight
                    val scale = Math.max(scaleX, scaleY)
                    
                    // Apply uniform scale to fill screen
                    videoView.scaleX = scale
                    videoView.scaleY = scale
                    
                    android.util.Log.d("VideoBackground", "Applied uniform scale: $scale")
                    
                    // Start playback
                    mediaPlayer.start()
                } catch (e: Exception) {
                    android.util.Log.e("VideoBackground", "Error in onPrepared", e)
                }
            }
            
            // Handle errors
            videoView.setOnErrorListener { _, what, extra ->
                android.util.Log.e("VideoBackground", "Error: what=$what, extra=$extra")
                true
            }
            
            // Request focus on parent to ensure video doesn't steal it
            (videoView.parent as? android.view.View)?.requestFocus()
            
        } catch (e: Exception) {
            android.util.Log.e("VideoBackground", "Setup failed", e)
        }
    }

    fun pauseVideo(videoView: VideoView?) {
        try {
            videoView?.pause()
        } catch (e: Exception) {
            android.util.Log.e("VideoBackground", "Error pausing video", e)
        }
    }

    fun resumeVideo(videoView: VideoView?) {
        try {
            videoView?.start()
        } catch (e: Exception) {
            android.util.Log.e("VideoBackground", "Error resuming video", e)
        }
    }

    fun releaseVideo(videoView: VideoView?) {
        try {
            videoView?.stopPlayback()
        } catch (e: Exception) {
            android.util.Log.e("VideoBackground", "Error releasing video", e)
        }
    }
}
