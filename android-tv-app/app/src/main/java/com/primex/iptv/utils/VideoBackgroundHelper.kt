package com.primex.iptv.utils

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.view.View
import android.widget.VideoView
import com.primex.iptv.views.AdaptiveVideoView

object VideoBackgroundHelper {

    /**
     * Universal adaptive video setup for all screens.
     * Works like Netflix/Prime Video - automatically adapts to any TV size, resolution, and aspect ratio.
     */
    fun setupVideoBackground(videoView: VideoView, videoResId: Int) {
        try {
            android.util.Log.d("VideoBackground", "Setting up adaptive video: $videoResId")
            
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
                    android.util.Log.d("VideoBackground", "Video prepared")
                    
                    // Mute and loop
                    mediaPlayer.isLooping = true
                    mediaPlayer.setVolume(0f, 0f)
                    
                    // Get video dimensions
                    val videoWidth = mediaPlayer.videoWidth
                    val videoHeight = mediaPlayer.videoHeight
                    
                    android.util.Log.d("VideoBackground", "Video dimensions: ${videoWidth}x${videoHeight}")
                    
                    // If using AdaptiveVideoView, set video size for proper aspect ratio handling
                    if (videoView is AdaptiveVideoView) {
                        videoView.setVideoSize(videoWidth, videoHeight)
                        android.util.Log.d("VideoBackground", "Using AdaptiveVideoView - automatic aspect ratio")
                    } else {
                        // Fallback for regular VideoView - apply centerCrop scaling
                        val viewWidth = videoView.width.toFloat()
                        val viewHeight = videoView.height.toFloat()
                        
                        if (viewWidth > 0 && viewHeight > 0) {
                            val scaleX = viewWidth / videoWidth
                            val scaleY = viewHeight / videoHeight
                            val scale = Math.max(scaleX, scaleY)
                            
                            videoView.scaleX = scale
                            videoView.scaleY = scale
                            
                            android.util.Log.d("VideoBackground", "Applied scale: $scale")
                        }
                    }
                    
                    // Start playback immediately
                    mediaPlayer.start()
                    android.util.Log.d("VideoBackground", "Playback started")
                    
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
