package com.primex.iptv.utils

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.view.View
import android.widget.VideoView

object VideoBackgroundHelper {

    fun setupVideoBackground(videoView: VideoView, videoResId: Int) {
        try {
            // Ensure VideoView doesn't intercept focus or touch events
            videoView.isFocusable = false
            videoView.isFocusableInTouchMode = false
            videoView.isClickable = false
            
            val uri = Uri.parse("android.resource://${videoView.context.packageName}/$videoResId")
            videoView.setVideoURI(uri)
            
            // Mute the video and setup fullscreen scaling
            videoView.setOnPreparedListener { mediaPlayer ->
                mediaPlayer.isLooping = true
                mediaPlayer.setVolume(0f, 0f)
                
                // Scale video to fill screen (fullscreen)
                val videoWidth = mediaPlayer.videoWidth.toFloat()
                val videoHeight = mediaPlayer.videoHeight.toFloat()
                val viewWidth = videoView.width.toFloat()
                val viewHeight = videoView.height.toFloat()
                
                val scaleX = viewWidth / videoWidth
                val scaleY = viewHeight / videoHeight
                val scale = Math.max(scaleX, scaleY)
                
                val scaledWidth = (videoWidth * scale).toInt()
                val scaledHeight = (videoHeight * scale).toInt()
                
                videoView.layoutParams = videoView.layoutParams.apply {
                    width = scaledWidth
                    height = scaledHeight
                }
                
                // Center the video
                videoView.translationX = (viewWidth - scaledWidth) / 2f
                videoView.translationY = (viewHeight - scaledHeight) / 2f
                
                mediaPlayer.start()
            }
            
            // Handle errors
            videoView.setOnErrorListener { _, what, extra ->
                android.util.Log.e("VideoBackground", "Error playing video: what=$what, extra=$extra")
                true
            }
            
            // Start playing
            videoView.start()
            
        } catch (e: Exception) {
            android.util.Log.e("VideoBackground", "Failed to setup video background", e)
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
