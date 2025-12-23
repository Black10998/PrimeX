package com.primex.iptv.ui

import android.animation.ObjectAnimator
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R

class HomeFragment : Fragment() {

    private lateinit var brandLogo: ImageView
    private lateinit var contentRecyclerView: RecyclerView
    private lateinit var navHome: TextView
    private lateinit var navLiveTV: TextView
    private lateinit var navMovies: TextView
    private lateinit var navSeries: TextView
    private lateinit var navSettings: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews(view)
        animateLogo()
        setupNavigation()
        loadContent()
    }

    private fun setupViews(view: View) {
        brandLogo = view.findViewById(R.id.brand_logo)
        contentRecyclerView = view.findViewById(R.id.content_recycler)
        contentRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        
        navHome = view.findViewById(R.id.nav_home)
        navLiveTV = view.findViewById(R.id.nav_live_tv)
        navMovies = view.findViewById(R.id.nav_movies)
        navSeries = view.findViewById(R.id.nav_series)
        navSettings = view.findViewById(R.id.nav_settings)
    }

    private fun animateLogo() {
        // Fade in animation
        val fadeIn = ObjectAnimator.ofFloat(brandLogo, "alpha", 0f, 1f)
        fadeIn.duration = 800
        fadeIn.interpolator = DecelerateInterpolator()
        
        // Scale animation
        val scaleX = ObjectAnimator.ofFloat(brandLogo, "scaleX", 0.8f, 1f)
        scaleX.duration = 800
        scaleX.interpolator = DecelerateInterpolator()
        
        val scaleY = ObjectAnimator.ofFloat(brandLogo, "scaleY", 0.8f, 1f)
        scaleY.duration = 800
        scaleY.interpolator = DecelerateInterpolator()
        
        fadeIn.start()
        scaleX.start()
        scaleY.start()
    }

    private fun setupNavigation() {
        // Setup click and focus listeners
        navHome.setOnClickListener {
            selectNav(navHome)
            loadHomeContent()
        }
        navHome.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) selectNav(navHome)
        }
        
        navLiveTV.setOnClickListener {
            selectNav(navLiveTV)
            loadLiveTVContent()
        }
        navLiveTV.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) selectNav(navLiveTV)
        }
        
        navMovies.setOnClickListener {
            selectNav(navMovies)
            loadMoviesContent()
        }
        navMovies.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) selectNav(navMovies)
        }
        
        navSeries.setOnClickListener {
            selectNav(navSeries)
            loadSeriesContent()
        }
        navSeries.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) selectNav(navSeries)
        }
        
        navSettings.setOnClickListener {
            val intent = Intent(requireContext(), SettingsActivity::class.java)
            startActivity(intent)
        }
        navSettings.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                navSettings.setTextColor(0xFFFFFFFF.toInt())
            } else {
                navSettings.setTextColor(0x80FFFFFF.toInt())
            }
        }
        
        // Set Home as selected by default and request focus
        selectNav(navHome)
        navHome.requestFocus()
    }

    private fun selectNav(selected: TextView) {
        // Reset all
        navHome.setTextColor(0x80FFFFFF.toInt())
        navLiveTV.setTextColor(0x80FFFFFF.toInt())
        navMovies.setTextColor(0x80FFFFFF.toInt())
        navSeries.setTextColor(0x80FFFFFF.toInt())
        navSettings.setTextColor(0x80FFFFFF.toInt())
        
        // Highlight selected
        selected.setTextColor(0xFFFFFFFF.toInt())
        
        // Add scale animation
        selected.animate()
            .scaleX(1.05f)
            .scaleY(1.05f)
            .setDuration(200)
            .start()
        
        // Reset scale for others
        listOf(navHome, navLiveTV, navMovies, navSeries, navSettings).forEach {
            if (it != selected) {
                it.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(200)
                    .start()
            }
        }
    }

    private fun loadContent() {
        loadHomeContent()
    }

    private fun loadHomeContent() {
        // TODO: Load home content rows
        android.widget.Toast.makeText(requireContext(), "Home", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun loadLiveTVContent() {
        // TODO: Load live TV content rows
        android.widget.Toast.makeText(requireContext(), "Live TV", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun loadMoviesContent() {
        // TODO: Load movies content rows
        android.widget.Toast.makeText(requireContext(), "Movies", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun loadSeriesContent() {
        // TODO: Load series content rows
        android.widget.Toast.makeText(requireContext(), "Series", android.widget.Toast.LENGTH_SHORT).show()
    }
}
