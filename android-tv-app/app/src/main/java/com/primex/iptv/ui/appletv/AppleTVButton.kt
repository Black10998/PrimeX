package com.primex.iptv.ui.appletv

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Outline
import android.util.AttributeSet
import android.view.View
import android.view.ViewOutlineProvider
import android.view.animation.DecelerateInterpolator
import androidx.appcompat.widget.AppCompatButton
import com.primex.iptv.R

/**
 * AppleTVButton - Button component with Apple TV-style interactions
 * 
 * Features:
 * - Smooth scale animation on focus
 * - Background color transitions
 * - Rounded corners
 * - Optimized for TV remote
 */
class AppleTVButton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatButton(context, attrs, defStyleAttr) {
    
    private val focusScale = 1.05f
    private val normalScale = 1.0f
    private val animationDuration = 150L
    private val interpolator = DecelerateInterpolator(1.2f)
    
    private val cornerRadius = context.resources.getDimension(R.dimen.appletv_button_corner_radius)
    
    private var currentAnimator: AnimatorSet? = null
    
    init {
        // Make focusable
        isFocusable = true
        isFocusableInTouchMode = true
        
        // Set up rounded corners
        clipToOutline = true
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, cornerRadius)
            }
        }
        
        // Default styling
        setBackgroundColor(context.getColor(R.color.appletv_button_normal))
        setTextColor(context.getColor(R.color.appletv_text_primary))
        
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
    }
    
    private fun animateToFocused() {
        currentAnimator?.cancel()
        
        val scaleX = ObjectAnimator.ofFloat(this, "scaleX", scaleX, focusScale)
        val scaleY = ObjectAnimator.ofFloat(this, "scaleY", scaleY, focusScale)
        
        currentAnimator = AnimatorSet().apply {
            playTogether(scaleX, scaleY)
            duration = animationDuration
            interpolator = this@AppleTVButton.interpolator
            start()
        }
        
        setBackgroundColor(context.getColor(R.color.appletv_button_focused))
    }
    
    private fun animateToNormal() {
        currentAnimator?.cancel()
        
        val scaleX = ObjectAnimator.ofFloat(this, "scaleX", scaleX, normalScale)
        val scaleY = ObjectAnimator.ofFloat(this, "scaleY", scaleY, normalScale)
        
        currentAnimator = AnimatorSet().apply {
            playTogether(scaleX, scaleY)
            duration = animationDuration
            interpolator = this@AppleTVButton.interpolator
            start()
        }
        
        setBackgroundColor(context.getColor(R.color.appletv_button_normal))
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        currentAnimator?.cancel()
        currentAnimator = null
    }
}
