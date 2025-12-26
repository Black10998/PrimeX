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
import android.widget.VideoView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.api.ApiClient
import com.primex.iptv.config.ConfigManager
import com.primex.iptv.models.Channel
import com.primex.iptv.player.PlayerActivity
import com.primex.iptv.utils.PreferenceManager
import com.primex.iptv.utils.SessionManager
import com.primex.iptv.utils.VideoBackgroundHelper
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private lateinit var brandLogo: ImageView
    private lateinit var contentRecyclerView: RecyclerView
    private lateinit var navHome: TextView
    private lateinit var navLiveTV: TextView
    private lateinit var navMovies: TextView
    private lateinit var navSeries: TextView
    private lateinit var navCategories: TextView
    private lateinit var navFavorites: TextView
    private lateinit var navSearch: ImageView
    private lateinit var navSettings: TextView
    private lateinit var welcomeMessage: TextView
    private lateinit var welcomeSubtitle: TextView
    private lateinit var socialMessage: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Tell MainActivity to show home video background
        (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_home)
        
        setupViews(view)
        animateLogo()
        animateWelcomeMessage()
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
        navCategories = view.findViewById(R.id.nav_categories)
        navFavorites = view.findViewById(R.id.nav_favorites)
        navSearch = view.findViewById(R.id.nav_search)
        navSettings = view.findViewById(R.id.nav_settings)
        
        welcomeMessage = view.findViewById(R.id.welcome_message)
        welcomeSubtitle = view.findViewById(R.id.welcome_subtitle)
        socialMessage = view.findViewById(R.id.social_message)
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
        
        // Add interactive animation on click/focus
        setupLogoInteraction()
        
        // Start continuous subtle rotation
        startLogoRotation()
    }

    private fun startLogoRotation() {
        // Note: Since logo is a single image, we can't rotate only the circular part
        // For now, disable rotation to keep logo fixed
        // To implement circular-only rotation, logo would need to be split into layers
        // (background circle + foreground text as separate views)
    }

    private fun setupLogoInteraction() {
        brandLogo.isFocusable = true
        brandLogo.isClickable = true
        
        // Subtle pulse animation on click
        brandLogo.setOnClickListener {
            animateLogoPulse()
        }
        
        // Subtle glow on focus
        brandLogo.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                brandLogo.animate()
                    .scaleX(1.05f)
                    .scaleY(1.05f)
                    .alpha(1.0f)
                    .setDuration(200)
                    .start()
            } else {
                brandLogo.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .alpha(1.0f)
                    .setDuration(200)
                    .start()
            }
        }
    }

    private fun animateLogoPulse() {
        // Elegant pulse animation
        brandLogo.animate()
            .scaleX(1.1f)
            .scaleY(1.1f)
            .setDuration(150)
            .withEndAction {
                brandLogo.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(150)
                    .start()
            }
            .start()
    }

    private fun animateWelcomeMessage() {
        // Set initial positions
        welcomeMessage.translationY = -30f
        welcomeSubtitle.translationY = -20f
        socialMessage.translationY = -10f
        
        // Luxurious fade in for main message
        welcomeMessage.postDelayed({
            welcomeMessage.animate()
                .alpha(1f)
                .translationY(0f)
                .scaleX(1.0f)
                .scaleY(1.0f)
                .setDuration(1000)
                .setInterpolator(DecelerateInterpolator(2f))
                .start()
        }, 500)
        
        // Elegant fade in for subtitle
        welcomeSubtitle.postDelayed({
            welcomeSubtitle.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(1000)
                .setInterpolator(DecelerateInterpolator(2f))
                .start()
        }, 800)
        
        // Subtle fade in for social message
        socialMessage.postDelayed({
            socialMessage.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(1000)
                .setInterpolator(DecelerateInterpolator(2f))
                .start()
        }, 1100)
    }



    private fun setupNavigation() {
        // Setup click and focus listeners
        navHome.setOnClickListener {
            selectNav(navHome)
            (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_home)
            showHomeContent()
        }
        navHome.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                selectNav(navHome)
            }
        }
        
        navLiveTV.setOnClickListener {
            selectNav(navLiveTV)
            (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_live_tv)
            loadLiveTVContent()
        }
        navLiveTV.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                selectNav(navLiveTV)
            }
        }
        
        navMovies.setOnClickListener {
            selectNav(navMovies)
            (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_movies)
            showMoviesFragment()
        }
        navMovies.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                selectNav(navMovies)
            }
        }
        
        navSeries.setOnClickListener {
            selectNav(navSeries)
            (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_series)
            showSeriesFragment()
        }
        navSeries.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                selectNav(navSeries)
            }
        }
        
        navCategories.setOnClickListener {
            selectNav(navCategories)
            (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_categories)
            showCategoriesFragment()
        }
        navCategories.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                selectNav(navCategories)
            }
        }
        
        navFavorites.setOnClickListener {
            selectNav(navFavorites)
            (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_favorites)
            showFavoritesFragment()
        }
        navFavorites.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                selectNav(navFavorites)
            }
        }
        
        navSearch.setOnClickListener {
            val intent = Intent(requireContext(), SearchActivity::class.java)
            startActivity(intent)
        }
        navSearch.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                navSearch.setColorFilter(0xFFFFFFFF.toInt())
            } else {
                navSearch.setColorFilter(0x80FFFFFF.toInt())
            }
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
        navCategories.setTextColor(0x80FFFFFF.toInt())
        navFavorites.setTextColor(0x80FFFFFF.toInt())
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
        listOf(navHome, navLiveTV, navMovies, navSeries, navCategories, navFavorites, navSettings).forEach {
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

    private fun showHomeContent() {
        // Clear any child fragments
        childFragmentManager.fragments.forEach {
            childFragmentManager.beginTransaction().remove(it).commit()
        }
        
        // Show welcome section
        view?.findViewById<View>(R.id.welcome_section)?.visibility = View.VISIBLE
        
        // Load home content
        loadHomeContent()
    }

    private fun loadHomeContent() {
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            return
        }

        lifecycleScope.launch {
            try {
                // Load live streams for home sections
                val response = ApiClient.xtreamApiService.getLiveStreams(username, password)
                
                // CRITICAL SECURITY: Check for account deactivation
                if (SessionManager.handleUnauthorizedResponse(requireContext(), response.code())) {
                    return@launch
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val streams = response.body()!!
                    
                    val allChannels = streams.map { stream ->
                        Channel(
                            id = stream.streamId?.toString() ?: "0",
                            name = stream.name ?: "Unknown Channel",
                            logo_url = stream.streamIcon,
                            stream_url = buildStreamUrl(username, password, stream.streamId?.toString() ?: "0"),
                            category = stream.categoryId
                        )
                    }
                    
                    // Create premium home sections
                    val rows = mutableListOf<ContentRow>()
                    
                    // Continue Watching (placeholder - would come from watch history)
                    if (allChannels.isNotEmpty()) {
                        rows.add(ContentRow(
                            title = "Continue Watching",
                            channels = allChannels.take(8)
                        ))
                    }
                    
                    // Featured / Recommended
                    if (allChannels.size > 8) {
                        rows.add(ContentRow(
                            title = "Featured Channels",
                            channels = allChannels.shuffled().take(10)
                        ))
                    }
                    
                    // Live TV Preview
                    if (allChannels.size > 18) {
                        rows.add(ContentRow(
                            title = "Live TV",
                            channels = allChannels.drop(8).take(10)
                        ))
                    }
                    
                    // Favorites (placeholder - would come from user favorites)
                    if (allChannels.size > 28) {
                        rows.add(ContentRow(
                            title = "Favorites",
                            channels = allChannels.drop(18).take(8)
                        ))
                    }
                    
                    // Recently Added
                    if (allChannels.size > 36) {
                        rows.add(ContentRow(
                            title = "Recently Added",
                            channels = allChannels.takeLast(10)
                        ))
                    }
                    
                    // Update RecyclerView
                    contentRecyclerView.adapter = ContentRowAdapter(rows) { channel ->
                        playChannel(channel)
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("HomeFragment", "Error loading home content", e)
            }
        }
    }

    private fun loadLiveTVContent() {
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            android.widget.Toast.makeText(requireContext(), "No credentials found", android.widget.Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                // Load live streams
                val response = ApiClient.xtreamApiService.getLiveStreams(username, password)
                
                // CRITICAL SECURITY: Check for account deactivation
                if (SessionManager.handleUnauthorizedResponse(requireContext(), response.code())) {
                    return@launch
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val streams = response.body()!!
                    
                    // Group channels by category
                    val channelsByCategory = mutableMapOf<String, MutableList<Channel>>()
                    
                    streams.forEach { stream ->
                        val channel = Channel(
                            id = stream.streamId?.toString() ?: "0",
                            name = stream.name ?: "Unknown Channel",
                            logo_url = stream.streamIcon,
                            stream_url = buildStreamUrl(username, password, stream.streamId?.toString() ?: "0"),
                            category = stream.categoryId
                        )
                        
                        val categoryId = stream.categoryId ?: "0"
                        if (!channelsByCategory.containsKey(categoryId)) {
                            channelsByCategory[categoryId] = mutableListOf()
                        }
                        channelsByCategory[categoryId]?.add(channel)
                    }
                    
                    // Create content rows
                    val rows = channelsByCategory.map { (categoryId, channels) ->
                        ContentRow(
                            title = "Category $categoryId",
                            channels = channels
                        )
                    }
                    
                    // Update RecyclerView
                    contentRecyclerView.adapter = ContentRowAdapter(rows) { channel ->
                        playChannel(channel)
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("HomeFragment", "Error loading channels", e)
                android.widget.Toast.makeText(requireContext(), "Error loading channels", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun buildStreamUrl(username: String, password: String, streamId: String): String {
        return ConfigManager.buildLiveStreamUrl(requireContext(), username, password, streamId)
    }

    private fun playChannel(channel: Channel) {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, channel.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, channel.name)
            putExtra(PlayerActivity.EXTRA_TYPE, "channel")
        }
        startActivity(intent)
    }

    private fun showMoviesFragment() {
        childFragmentManager.beginTransaction()
            .replace(R.id.content_container, MoviesFragment())
            .commit()
        
        // Hide welcome section when showing other fragments
        view?.findViewById<View>(R.id.welcome_section)?.visibility = View.GONE
    }

    private fun showSeriesFragment() {
        childFragmentManager.beginTransaction()
            .replace(R.id.content_container, SeriesFragment())
            .commit()
        
        view?.findViewById<View>(R.id.welcome_section)?.visibility = View.GONE
    }

    private fun showCategoriesFragment() {
        childFragmentManager.beginTransaction()
            .replace(R.id.content_container, CategoriesFragment())
            .commit()
        
        view?.findViewById<View>(R.id.welcome_section)?.visibility = View.GONE
    }

    private fun showFavoritesFragment() {
        childFragmentManager.beginTransaction()
            .replace(R.id.content_container, FavoritesFragment())
            .commit()
        
        view?.findViewById<View>(R.id.welcome_section)?.visibility = View.GONE
    }


}
