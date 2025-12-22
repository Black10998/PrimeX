package com.primex.iptv.ui

import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.leanback.app.BackgroundManager
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.*
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.primex.iptv.R
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.Channel
import com.primex.iptv.models.Movie
import com.primex.iptv.models.Series
import com.primex.iptv.player.PlayerActivity
import com.primex.iptv.utils.PreferenceManager
import kotlinx.coroutines.launch

class MainFragment : BrowseSupportFragment() {

    private lateinit var backgroundManager: BackgroundManager
    private val handler = Handler(Looper.getMainLooper())
    private var backgroundTimer: Runnable? = null

    private val channels = mutableListOf<Channel>()
    private val movies = mutableListOf<Movie>()
    private val series = mutableListOf<Series>()
    
    private var isLoading = false

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)

        setupUI()
        setupBackgroundManager()
        loadContent()
        setupEventListeners()
    }

    private fun setupUI() {
        title = getString(R.string.app_name)
        headersState = HEADERS_ENABLED
        isHeadersTransitionOnBackEnabled = true
        brandColor = ContextCompat.getColor(requireContext(), R.color.accent_color)
        searchAffordanceColor = ContextCompat.getColor(requireContext(), R.color.accent_color)
    }

    private fun setupBackgroundManager() {
        backgroundManager = BackgroundManager.getInstance(requireActivity())
        backgroundManager.attach(requireActivity().window)
        backgroundManager.color = Color.parseColor("#1a1a1a")
    }

    private fun loadContent() {
        // Prevent multiple simultaneous loads
        if (isLoading) return
        
        // Always show UI first - load content in background
        setupRows()
        
        val authToken = PreferenceManager.getAuthToken(requireContext())

        // Load content if user is authenticated
        if (!authToken.isNullOrEmpty()) {
            isLoading = true
            progressBarManager?.show()
            
            lifecycleScope.launch {
                try {
                    // Load channels
                    val channelsResponse = ApiClient.apiService.getChannels("Bearer $authToken")
                    if (channelsResponse.isSuccessful && channelsResponse.body() != null) {
                        channels.clear()
                        channels.addAll(channelsResponse.body()!!.channels)
                    }
                    
                    // Load movies
                    val moviesResponse = ApiClient.apiService.getMovies("Bearer $authToken")
                    if (moviesResponse.isSuccessful && moviesResponse.body() != null) {
                        movies.clear()
                        movies.addAll(moviesResponse.body()!!.movies)
                    }
                    
                    // Load series
                    val seriesResponse = ApiClient.apiService.getSeries("Bearer $authToken")
                    if (seriesResponse.isSuccessful && seriesResponse.body() != null) {
                        series.clear()
                        series.addAll(seriesResponse.body()!!.series)
                    }
                    
                    // Refresh UI with loaded content
                    setupRows()
                } catch (e: Exception) {
                    // Silent fail - show empty state
                    e.printStackTrace()
                    setupRows()
                } finally {
                    isLoading = false
                    progressBarManager?.hide()
                }
            }
        }
    }

    private fun setupRows() {
        val rowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        var rowId = 0L

        // Featured/Trending Movies
        if (movies.isNotEmpty()) {
            val featuredMovies = movies.sortedByDescending { it.rating ?: 0f }.take(10)
            if (featuredMovies.isNotEmpty()) {
                val featuredHeader = HeaderItem(rowId++, getString(R.string.featured))
                val featuredAdapter = ArrayObjectAdapter(MovieCardPresenter())
                featuredMovies.forEach { featuredAdapter.add(it) }
                rowsAdapter.add(ListRow(featuredHeader, featuredAdapter))
            }
        }

        // Live TV Channels
        if (channels.isNotEmpty()) {
            val channelsHeader = HeaderItem(rowId++, getString(R.string.live_tv))
            val channelsAdapter = ArrayObjectAdapter(ChannelCardPresenter())
            channels.take(20).forEach { channelsAdapter.add(it) }
            rowsAdapter.add(ListRow(channelsHeader, channelsAdapter))
        }

        // All Movies
        if (movies.isNotEmpty()) {
            val moviesHeader = HeaderItem(rowId++, getString(R.string.movies))
            val moviesAdapter = ArrayObjectAdapter(MovieCardPresenter())
            movies.take(30).forEach { moviesAdapter.add(it) }
            rowsAdapter.add(ListRow(moviesHeader, moviesAdapter))
        }

        // New Releases (Movies from current year)
        val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        val newMovies = movies.filter { it.year == currentYear }
        if (newMovies.isNotEmpty()) {
            val newReleasesHeader = HeaderItem(rowId++, getString(R.string.new_releases))
            val newReleasesAdapter = ArrayObjectAdapter(MovieCardPresenter())
            newMovies.take(15).forEach { newReleasesAdapter.add(it) }
            rowsAdapter.add(ListRow(newReleasesHeader, newReleasesAdapter))
        }

        // All Series
        if (series.isNotEmpty()) {
            val seriesHeader = HeaderItem(rowId++, getString(R.string.series))
            val seriesAdapter = ArrayObjectAdapter(SeriesCardPresenter())
            series.take(30).forEach { seriesAdapter.add(it) }
            rowsAdapter.add(ListRow(seriesHeader, seriesAdapter))
        }

        // Trending Series
        if (series.isNotEmpty()) {
            val trendingSeries = series.sortedByDescending { it.rating ?: 0f }.take(10)
            if (trendingSeries.isNotEmpty()) {
                val trendingHeader = HeaderItem(rowId++, getString(R.string.trending_now))
                val trendingAdapter = ArrayObjectAdapter(SeriesCardPresenter())
                trendingSeries.forEach { trendingAdapter.add(it) }
                rowsAdapter.add(ListRow(trendingHeader, trendingAdapter))
            }
        }

        // Settings Row - Always visible
        val settingsHeader = HeaderItem(rowId++, getString(R.string.settings))
        val settingsAdapter = ArrayObjectAdapter(SettingsCardPresenter())
        
        settingsAdapter.add(SettingsItem(getString(R.string.account), getString(R.string.account_description)))
        settingsAdapter.add(SettingsItem(getString(R.string.settings), getString(R.string.settings_description)))
        settingsAdapter.add(SettingsItem(getString(R.string.refresh), getString(R.string.refresh_description)))
        settingsAdapter.add(SettingsItem(getString(R.string.logout), getString(R.string.logout_description)))
        rowsAdapter.add(ListRow(settingsHeader, settingsAdapter))

        adapter = rowsAdapter
    }

    private fun setupEventListeners() {
        onItemViewClickedListener = OnItemViewClickedListener { _, item, _, _ ->
            when (item) {
                is Channel -> playChannel(item)
                is Movie -> playMovie(item)
                is Series -> showSeriesDetails(item)
                is SettingsItem -> handleSettingsClick(item)
            }
        }

        onItemViewSelectedListener = OnItemViewSelectedListener { _, item, _, _ ->
            when (item) {
                is Movie -> updateBackground(item.backdrop_url ?: item.poster_url)
                is Series -> updateBackground(item.backdrop_url ?: item.poster_url)
                is Channel -> updateBackground(item.logo_url)
            }
        }
    }

    private fun playChannel(channel: Channel) {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, channel.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, channel.name)
            putExtra(PlayerActivity.EXTRA_TYPE, "channel")
        }
        startActivity(intent)
    }

    private fun playMovie(movie: Movie) {
        val intent = Intent(requireContext(), MovieDetailsActivity::class.java).apply {
            putExtra(MovieDetailsActivity.EXTRA_MOVIE, movie)
        }
        startActivity(intent)
    }

    private fun showSeriesDetails(series: Series) {
        val intent = Intent(requireContext(), DetailsActivity::class.java).apply {
            putExtra(DetailsActivity.EXTRA_SERIES_ID, series.id)
            putExtra(DetailsActivity.EXTRA_SERIES_TITLE, series.title)
        }
        startActivity(intent)
    }

    private fun handleSettingsClick(item: SettingsItem) {
        val accountStr = getString(R.string.account)
        val settingsStr = getString(R.string.settings)
        val refreshStr = getString(R.string.refresh)
        val logoutStr = getString(R.string.logout)
        
        when (item.title) {
            accountStr -> showAccountInfo()
            settingsStr -> showSettings()
            refreshStr -> loadContent()
            logoutStr -> performLogout()
        }
    }
    
    private fun showAccountInfo() {
        val intent = Intent(requireContext(), AccountActivity::class.java)
        startActivity(intent)
    }
    
    private fun showSettings() {
        val intent = Intent(requireContext(), SettingsActivity::class.java)
        startActivity(intent)
    }
    
    private fun performLogout() {
        PreferenceManager.logout(requireContext())
        val intent = Intent(requireContext(), LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        requireActivity().finish()
    }

    private fun showDeviceInfo() {
        val deviceKey = PreferenceManager.getDeviceKey(requireContext())
        val plan = PreferenceManager.getSubscriptionPlan(requireContext())
        val expires = PreferenceManager.getSubscriptionExpires(requireContext())
        
        // TODO: Show dialog with device info
    }

    private fun updateBackground(imageUrl: String?) {
        if (imageUrl.isNullOrEmpty()) return

        backgroundTimer?.let { handler.removeCallbacks(it) }
        backgroundTimer = Runnable {
            Glide.with(requireContext())
                .load(imageUrl)
                .centerCrop()
                .into(object : CustomTarget<Drawable>() {
                    override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
                        backgroundManager.drawable = resource
                    }
                    override fun onLoadCleared(placeholder: Drawable?) {
                        // Do nothing
                    }
                })
        }
        handler.postDelayed(backgroundTimer!!, 300)
    }

    private fun showError(message: String) {
        val intent = Intent(requireContext(), BrowseErrorActivity::class.java).apply {
            putExtra(BrowseErrorActivity.EXTRA_ERROR_MESSAGE, message)
        }
        startActivity(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        backgroundTimer?.let { handler.removeCallbacks(it) }
    }
}

// Settings item data class
data class SettingsItem(val title: String, val description: String)
