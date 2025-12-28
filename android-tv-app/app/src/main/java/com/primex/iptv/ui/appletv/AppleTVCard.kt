package com.primex.iptv.ui.appletv

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Outline
import android.util.AttributeSet
import android.view.View
import android.view.ViewOutlineProvider
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import androidx.core.animation.doOnEnd
import com.primex.iptv.R

/**
 * AppleTVCard - Base card component with Apple TV-style focus animations
 * 
 * Features:
 * - Smooth scale animation on focus
 * - Elevation change
 * - Shadow effects
 * - Rounded corners
 * - Optimized for TV remote navigation
 */
class AppleTVCard @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    
    // Animation properties
    private val focusScale = 1.08f
    private val normalScale = 1.0f
    private val animationDuration = 200L
    private val interpolator = DecelerateInterpolator(1.5f)
    
    // Elevation values
    private val normalElevation = 0f
    private val focusedElevation = context.resources.getDimension(R.dimen.appletv_focus_elevation)
    
    // Corner radius
    private val cornerRadius = context.resources.getDimension(R.dimen.appletv_card_corner_radius)
    
    private var currentAnimator: AnimatorSet? = null
    
    init {
        // Make focusable for TV
        isFocusable = true
        isFocusableInTouchMode = true
        
        // Set up rounded corners
        clipToOutline = true
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, cornerRadius)
            }
        }
        
        // Set up focus listener
        onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                animateToFocused()
            } else {
                animateToNormal()
            }
        }
        
        // Initial state
        scaleX = normalScale
        scaleY = normalScale
        elevation = normalElevation
    }
    
    private fun animateToFocused() {
        currentAnimator?.cancel()
        
        val scaleX = ObjectAnimator.ofFloat(this, "scaleX", scaleX, focusScale)
        val scaleY = ObjectAnimator.ofFloat(this, "scaleY", scaleY, focusScale)
        val elevate = ObjectAnimator.ofFloat(this, "elevation", elevation, focusedElevation)
        
        currentAnimator = AnimatorSet().apply {
            playTogether(scaleX, scaleY, elevate)
            duration = animationDuration
            interpolator = this@AppleTVCard.interpolator
            start()
        }
        
        // Bring to front for proper layering
        bringToFront()
    }
    
    private fun animateToNormal() {
        currentAnimator?.cancel()
        
        val scaleX = ObjectAnimator.ofFloat(this, "scaleX", scaleX, normalScale)
        val scaleY = ObjectAnimator.ofFloat(this, "scaleY", scaleY, normalScale)
        val elevate = ObjectAnimator.ofFloat(this, "elevation", elevation, normalElevation)
        
        currentAnimator = AnimatorSet().apply {
            playTogether(scaleX, scaleY, elevate)
            duration = animationDuration
            interpolator = this@AppleTVCard.interpolator
            start()
        }
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        currentAnimator?.cancel()
        currentAnimator = null
    }
}
