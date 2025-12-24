package com.primex.iptv.views

import android.content.Context
import android.util.AttributeSet
import android.widget.VideoView

/**
 * Custom VideoView that automatically adapts to any screen size and aspect ratio.
 * Provides Netflix/Prime Video-like fullscreen rendering:
 * - Fills entire screen naturally
 * - Maintains video quality
 * - No black borders
 * - No stretched or broken visuals
 * - Works on all TV sizes and resolutions
 */
class AdaptiveVideoView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : VideoView(context, attrs, defStyleAttr) {

    private var videoWidth = 0
    private var videoHeight = 0

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        // Get the screen dimensions
        val screenWidth = MeasureSpec.getSize(widthMeasureSpec)
        val screenHeight = MeasureSpec.getSize(heightMeasureSpec)

        if (videoWidth > 0 && videoHeight > 0) {
            // Calculate aspect ratios
            val videoAspect = videoWidth.toFloat() / videoHeight.toFloat()
            val screenAspect = screenWidth.toFloat() / screenHeight.toFloat()

            val finalWidth: Int
            val finalHeight: Int

            if (videoAspect > screenAspect) {
                // Video is wider than screen - fit to height and crop sides
                finalHeight = screenHeight
                finalWidth = (screenHeight * videoAspect).toInt()
            } else {
                // Video is taller than screen - fit to width and crop top/bottom
                finalWidth = screenWidth
                finalHeight = (screenWidth / videoAspect).toInt()
            }

            setMeasuredDimension(finalWidth, finalHeight)
        } else {
            // Video dimensions not yet known - use screen dimensions
            setMeasuredDimension(screenWidth, screenHeight)
        }
    }

    /**
     * Called when video dimensions are known.
     * This triggers a remeasure with the correct aspect ratio.
     */
    fun setVideoSize(width: Int, height: Int) {
        if (width > 0 && height > 0) {
            videoWidth = width
            videoHeight = height
            requestLayout()
        }
    }
}
