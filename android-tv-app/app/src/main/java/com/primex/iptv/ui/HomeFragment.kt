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
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.Channel
import com.primex.iptv.player.PlayerActivity
import com.primex.iptv.utils.PreferenceManager
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private lateinit var brandLogo: ImageView
    private lateinit var contentRecyclerView: RecyclerView
    private lateinit var navHome: TextView
    private lateinit var navLiveTV: TextView
    private lateinit var navMovies: TextView
    private lateinit var navSeries: TextView
    private lateinit var navSearch: ImageView
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
        navSearch = view.findViewById(R.id.nav_search)
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
        
        // Add interactive animation on click/focus
        setupLogoInteraction()
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
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            return
        }

        lifecycleScope.launch {
            try {
                // Load live streams for home sections
                val response = ApiClient.xtreamApiService.getLiveStreams(username, password)
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
        return "https://prime-x.live/live/$username/$password/$streamId.m3u8"
    }

    private fun playChannel(channel: Channel) {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, channel.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, channel.name)
            putExtra(PlayerActivity.EXTRA_TYPE, "channel")
        }
        startActivity(intent)
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
