package com.primex.iptv.utils

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.view.View
import android.widget.VideoView

object VideoBackgroundHelper {

    private var isPreparing = false

    fun setupVideoBackground(videoView: VideoView, videoResId: Int) {
        // Prevent multiple simultaneous setups
        if (isPreparing) {
            android.util.Log.w("VideoBackground", "Already preparing video, skipping")
            return
        }
        
        isPreparing = true
        try {
            // Ensure VideoView doesn't intercept focus or touch events
            videoView.isFocusable = false
            videoView.isFocusableInTouchMode = false
            videoView.isClickable = false
            
            // Force VideoView to fill parent and scale properly
            videoView.layoutParams = videoView.layoutParams.apply {
                width = android.view.ViewGroup.LayoutParams.MATCH_PARENT
                height = android.view.ViewGroup.LayoutParams.MATCH_PARENT
            }
            
            val uri = Uri.parse("android.resource://${videoView.context.packageName}/$videoResId")
            videoView.setVideoURI(uri)
            
            // Mute the video and setup fullscreen scaling
            videoView.setOnPreparedListener { mediaPlayer ->
                try {
                    mediaPlayer.isLooping = true
                    mediaPlayer.setVolume(0f, 0f)
                    
                    // Get actual dimensions
                    val videoWidth = mediaPlayer.videoWidth
                    val videoHeight = mediaPlayer.videoHeight
                    val viewWidth = videoView.width
                    val viewHeight = videoView.height
                    
                    android.util.Log.d("VideoBackground", "Video: ${videoWidth}x${videoHeight}, View: ${viewWidth}x${viewHeight}")
                    
                    // Calculate scale to fill screen (centerCrop behavior)
                    val videoAspect = videoWidth.toFloat() / videoHeight.toFloat()
                    val viewAspect = viewWidth.toFloat() / viewHeight.toFloat()
                    
                    val scaleX: Float
                    val scaleY: Float
                    
                    if (videoAspect > viewAspect) {
                        // Video is wider - scale to height
                        scaleY = viewHeight.toFloat() / videoHeight.toFloat()
                        scaleX = scaleY
                    } else {
                        // Video is taller - scale to width
                        scaleX = viewWidth.toFloat() / videoWidth.toFloat()
                        scaleY = scaleX
                    }
                    
                    // Apply scaling
                    videoView.scaleX = scaleX * (viewWidth.toFloat() / videoWidth.toFloat())
                    videoView.scaleY = scaleY * (viewHeight.toFloat() / videoHeight.toFloat())
                    
                    android.util.Log.d("VideoBackground", "Applied scale: X=${videoView.scaleX}, Y=${videoView.scaleY}")
                    
                    // Start immediately for instant playback
                    mediaPlayer.start()
                    
                    isPreparing = false
                } catch (e: Exception) {
                    android.util.Log.e("VideoBackground", "Error in onPrepared", e)
                    isPreparing = false
                }
            }
            
            // Handle errors
            videoView.setOnErrorListener { _, what, extra ->
                android.util.Log.e("VideoBackground", "Error playing video: what=$what, extra=$extra")
                isPreparing = false
                true
            }
            
            // Start playing immediately
            videoView.start()
            
        } catch (e: Exception) {
            android.util.Log.e("VideoBackground", "Failed to setup video background", e)
            isPreparing = false
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
