package com.primex.iptv.ui.appletv

import android.animation.Animator
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.Interpolator

/**
 * AppleTVAnimations - Centralized animation utilities
 * 
 * Provides Apple TV-style animations:
 * - Focus animations
 * - Transitions
 * - Fade effects
 * - Scale effects
 */
object AppleTVAnimations {
    
    // Standard durations
    const val DURATION_FAST = 150L
    const val DURATION_NORMAL = 200L
    const val DURATION_SLOW = 300L
    const val DURATION_VERY_SLOW = 500L
    
    // Standard interpolators
    val DECELERATE_INTERPOLATOR = DecelerateInterpolator(1.5f)
    val SMOOTH_INTERPOLATOR = DecelerateInterpolator(1.2f)
    
    // Scale values
    const val SCALE_FOCUSED = 1.08f
    const val SCALE_NORMAL = 1.0f
    const val SCALE_PRESSED = 0.95f
    
    /**
     * Animate view to focused state
     */
    fun animateFocus(
        view: View,
        scale: Float = SCALE_FOCUSED,
        duration: Long = DURATION_NORMAL,
        interpolator: Interpolator = DECELERATE_INTERPOLATOR,
        onEnd: (() -> Unit)? = null
    ): AnimatorSet {
        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", view.scaleX, scale)
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", view.scaleY, scale)
        
        return AnimatorSet().apply {
            playTogether(scaleX, scaleY)
            this.duration = duration
            this.interpolator = interpolator
            onEnd?.let {
                addListener(object : Animator.AnimatorListener {
                    override fun onAnimationEnd(animation: Animator) = it()
                    override fun onAnimationStart(animation: Animator) {}
                    override fun onAnimationCancel(animation: Animator) {}
                    override fun onAnimationRepeat(animation: Animator) {}
                })
            }
            start()
        }
    }
    
    /**
     * Animate view to normal state
     */
    fun animateUnfocus(
        view: View,
        duration: Long = DURATION_NORMAL,
        interpolator: Interpolator = DECELERATE_INTERPOLATOR,
        onEnd: (() -> Unit)? = null
    ): AnimatorSet {
        return animateFocus(view, SCALE_NORMAL, duration, interpolator, onEnd)
    }
    
    /**
     * Fade in animation
     */
    fun fadeIn(
        view: View,
        duration: Long = DURATION_NORMAL,
        onEnd: (() -> Unit)? = null
    ): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "alpha", view.alpha, 1f).apply {
            this.duration = duration
            interpolator = SMOOTH_INTERPOLATOR
            onEnd?.let {
                addListener(object : Animator.AnimatorListener {
                    override fun onAnimationEnd(animation: Animator) = it()
                    override fun onAnimationStart(animation: Animator) {}
                    override fun onAnimationCancel(animation: Animator) {}
                    override fun onAnimationRepeat(animation: Animator) {}
                })
            }
            start()
        }
    }
    
    /**
     * Fade out animation
     */
    fun fadeOut(
        view: View,
        duration: Long = DURATION_NORMAL,
        onEnd: (() -> Unit)? = null
    ): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "alpha", view.alpha, 0f).apply {
            this.duration = duration
            interpolator = SMOOTH_INTERPOLATOR
            onEnd?.let {
                addListener(object : Animator.AnimatorListener {
                    override fun onAnimationEnd(animation: Animator) = it()
                    override fun onAnimationStart(animation: Animator) {}
                    override fun onAnimationCancel(animation: Animator) {}
                    override fun onAnimationRepeat(animation: Animator) {}
                })
            }
            start()
        }
    }
    
    /**
     * Slide in from bottom
     */
    fun slideInFromBottom(
        view: View,
        distance: Float = 100f,
        duration: Long = DURATION_SLOW,
        onEnd: (() -> Unit)? = null
    ): AnimatorSet {
        val translateY = ObjectAnimator.ofFloat(view, "translationY", distance, 0f)
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 0f, 1f)
        
        return AnimatorSet().apply {
            playTogether(translateY, alpha)
            this.duration = duration
            interpolator = DECELERATE_INTERPOLATOR
            onEnd?.let {
                addListener(object : Animator.AnimatorListener {
                    override fun onAnimationEnd(animation: Animator) = it()
                    override fun onAnimationStart(animation: Animator) {}
                    override fun onAnimationCancel(animation: Animator) {}
                    override fun onAnimationRepeat(animation: Animator) {}
                })
            }
            start()
        }
    }
    
    /**
     * Slide out to bottom
     */
    fun slideOutToBottom(
        view: View,
        distance: Float = 100f,
        duration: Long = DURATION_SLOW,
        onEnd: (() -> Unit)? = null
    ): AnimatorSet {
        val translateY = ObjectAnimator.ofFloat(view, "translationY", 0f, distance)
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 1f, 0f)
        
        return AnimatorSet().apply {
            playTogether(translateY, alpha)
            this.duration = duration
            interpolator = DECELERATE_INTERPOLATOR
            onEnd?.let {
                addListener(object : Animator.AnimatorListener {
                    override fun onAnimationEnd(animation: Animator) = it()
                    override fun onAnimationStart(animation: Animator) {}
                    override fun onAnimationCancel(animation: Animator) {}
                    override fun onAnimationRepeat(animation: Animator) {}
                })
            }
            start()
        }
    }
    
    /**
     * Cross-fade between two views
     */
    fun crossFade(
        viewOut: View,
        viewIn: View,
        duration: Long = DURATION_NORMAL
    ) {
        fadeOut(viewOut, duration)
        fadeIn(viewIn, duration)
    }
}
