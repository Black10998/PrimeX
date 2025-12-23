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
import com.primex.iptv.models.SettingsItem
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
    
    // Category maps: categoryId -> list of items
    private val channelsByCategory = mutableMapOf<String, MutableList<Channel>>()
    private val moviesByCategory = mutableMapOf<String, MutableList<Movie>>()
    private val seriesByCategory = mutableMapOf<String, MutableList<Series>>()
    
    // Category names: categoryId -> categoryName
    private val liveCategories = mutableMapOf<String, String>()
    private val vodCategories = mutableMapOf<String, String>()
    private val seriesCategories = mutableMapOf<String, String>()
    
    private var isLoading = false

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)

        setupUI()
        setupBackgroundManager()
        loadContent()
        setupEventListeners()
    }

    private fun setupUI() {
        // Set Amarco branding with elegant styling
        title = "Amarco"
        headersState = HEADERS_ENABLED
        isHeadersTransitionOnBackEnabled = true
        
        // Use subtle gold accent
        brandColor = ContextCompat.getColor(requireContext(), R.color.amarco_gold_dark)
        searchAffordanceColor = ContextCompat.getColor(requireContext(), R.color.amarco_gold)
        
        // Set badge drawable
        badgeDrawable = ContextCompat.getDrawable(requireContext(), R.drawable.amarco_logo)
        
        // Enable search
        setOnSearchClickedListener {
            val intent = Intent(requireContext(), SearchActivity::class.java)
            startActivity(intent)
        }
    }

    private fun setupBackgroundManager() {
        backgroundManager = BackgroundManager.getInstance(requireActivity())
        backgroundManager.attach(requireActivity().window)
        // Use Amarco dark background
        backgroundManager.color = Color.parseColor("#0A0A0A")
    }

    private fun loadContent() {
        // Prevent multiple simultaneous loads
        if (isLoading) return
        
        // Always show UI first - load content in background
        setupRows()
        
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        // Load content if user is authenticated
        if (!username.isNullOrEmpty() && !password.isNullOrEmpty()) {
            isLoading = true
            progressBarManager?.show()
            
            lifecycleScope.launch {
                try {
                    android.util.Log.d("MainFragment", "Loading content for user: $username")
                    
                    // Load categories first
                    loadCategories(username, password)
                    
                    // Load live streams (channels)
                    val liveStreamsResponse = ApiClient.xtreamApiService.getLiveStreams(username, password)
                    if (liveStreamsResponse.isSuccessful && liveStreamsResponse.body() != null) {
                        val liveStreams = liveStreamsResponse.body()!!
                        android.util.Log.d("MainFragment", "Loaded ${liveStreams.size} live streams")
                        
                        channels.clear()
                        channelsByCategory.clear()
                        
                        liveStreams.forEach { stream ->
                            val channel = Channel(
                                id = stream.streamId?.toString() ?: stream.num?.toString() ?: "0",
                                name = stream.name ?: "Unknown Channel",
                                logo_url = stream.streamIcon,
                                stream_url = buildXtreamStreamUrl(username, password, stream.streamId?.toString() ?: "0", "live"),
                                category = stream.categoryId
                            )
                            channels.add(channel)
                            
                            // Organize by category
                            val categoryId = stream.categoryId ?: "0"
                            if (!channelsByCategory.containsKey(categoryId)) {
                                channelsByCategory[categoryId] = mutableListOf()
                            }
                            channelsByCategory[categoryId]?.add(channel)
                        }
                    }
                    
                    // Load VOD streams (movies)
                    val vodStreamsResponse = ApiClient.xtreamApiService.getVodStreams(username, password)
                    if (vodStreamsResponse.isSuccessful && vodStreamsResponse.body() != null) {
                        val vodStreams = vodStreamsResponse.body()!!
                        android.util.Log.d("MainFragment", "Loaded ${vodStreams.size} VOD streams")
                        
                        movies.clear()
                        moviesByCategory.clear()
                        
                        vodStreams.forEach { vod ->
                            val movie = Movie(
                                id = vod.streamId?.toString() ?: vod.num?.toString() ?: "0",
                                title = vod.name ?: "Unknown Movie",
                                poster_url = vod.streamIcon,
                                backdrop_url = vod.streamIcon,
                                stream_url = buildXtreamStreamUrl(username, password, vod.streamId?.toString() ?: "0", "movie"),
                                rating = vod.rating?.toFloatOrNull(),
                                year = vod.added?.substring(0, 4)?.toIntOrNull(),
                                description = null, // VOD list doesn't include plot, need to call get_vod_info for details
                                category = vod.categoryId
                            )
                            movies.add(movie)
                            
                            // Organize by category
                            val categoryId = vod.categoryId ?: "0"
                            if (!moviesByCategory.containsKey(categoryId)) {
                                moviesByCategory[categoryId] = mutableListOf()
                            }
                            moviesByCategory[categoryId]?.add(movie)
                        }
                    }
                    
                    // Load series
                    val seriesStreamsResponse = ApiClient.xtreamApiService.getSeries(username, password)
                    if (seriesStreamsResponse.isSuccessful && seriesStreamsResponse.body() != null) {
                        val seriesStreams = seriesStreamsResponse.body()!!
                        android.util.Log.d("MainFragment", "Loaded ${seriesStreams.size} series")
                        
                        series.clear()
                        seriesByCategory.clear()
                        
                        seriesStreams.forEach { seriesItem ->
                            val seriesObj = Series(
                                id = seriesItem.seriesId?.toString() ?: seriesItem.num?.toString() ?: "0",
                                title = seriesItem.name ?: "Unknown Series",
                                poster_url = seriesItem.cover,
                                backdrop_url = seriesItem.cover,
                                rating = seriesItem.rating?.toFloatOrNull(),
                                year = seriesItem.releaseDate?.substring(0, 4)?.toIntOrNull(),
                                description = seriesItem.plot,
                                category = seriesItem.categoryId
                            )
                            series.add(seriesObj)
                            
                            // Organize by category
                            val categoryId = seriesItem.categoryId ?: "0"
                            if (!seriesByCategory.containsKey(categoryId)) {
                                seriesByCategory[categoryId] = mutableListOf()
                            }
                            seriesByCategory[categoryId]?.add(seriesObj)
                        }
                    }
                    
                    android.util.Log.d("MainFragment", "Content loaded - Channels: ${channels.size}, Movies: ${movies.size}, Series: ${series.size}")
                    
                    // Refresh UI with loaded content
                    setupRows()
                } catch (e: Exception) {
                    android.util.Log.e("MainFragment", "Error loading content", e)
                    setupRows()
                } finally {
                    isLoading = false
                    progressBarManager?.hide()
                }
            }
        }
    }
    
    private suspend fun loadCategories(username: String, password: String) {
        try {
            // Load live categories
            val liveCatResponse = ApiClient.xtreamApiService.getLiveCategories(username, password)
            if (liveCatResponse.isSuccessful && liveCatResponse.body() != null) {
                liveCategories.clear()
                liveCatResponse.body()!!.forEach { cat ->
                    cat.categoryId?.let { id ->
                        liveCategories[id] = cat.categoryName ?: "Category $id"
                    }
                }
                android.util.Log.d("MainFragment", "Loaded ${liveCategories.size} live categories")
            }
            
            // Load VOD categories
            val vodCatResponse = ApiClient.xtreamApiService.getVodCategories(username, password)
            if (vodCatResponse.isSuccessful && vodCatResponse.body() != null) {
                vodCategories.clear()
                vodCatResponse.body()!!.forEach { cat ->
                    cat.categoryId?.let { id ->
                        vodCategories[id] = cat.categoryName ?: "Category $id"
                    }
                }
                android.util.Log.d("MainFragment", "Loaded ${vodCategories.size} VOD categories")
            }
            
            // Load series categories
            val seriesCatResponse = ApiClient.xtreamApiService.getSeriesCategories(username, password)
            if (seriesCatResponse.isSuccessful && seriesCatResponse.body() != null) {
                seriesCategories.clear()
                seriesCatResponse.body()!!.forEach { cat ->
                    cat.categoryId?.let { id ->
                        seriesCategories[id] = cat.categoryName ?: "Category $id"
                    }
                }
                android.util.Log.d("MainFragment", "Loaded ${seriesCategories.size} series categories")
            }
        } catch (e: Exception) {
            android.util.Log.e("MainFragment", "Error loading categories", e)
        }
    }
    
    private fun buildXtreamStreamUrl(username: String, password: String, streamId: String, type: String): String {
        val baseUrl = "https://prime-x.live"
        return when (type) {
            "live" -> "$baseUrl/live/$username/$password/$streamId.m3u8"
            "movie" -> "$baseUrl/movie/$username/$password/$streamId.mp4"
            else -> "$baseUrl/$type/$username/$password/$streamId"
        }
    }

    private fun setupRows() {
        val rowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        var rowId = 0L

        // Settings/Menu Row
        val settingsHeader = HeaderItem(rowId++, "Menu")
        val settingsAdapter = ArrayObjectAdapter(SettingsCardPresenter())
        
        settingsAdapter.add(com.primex.iptv.models.SettingsItem(
            id = "account",
            title = "Account",
            description = "View your profile",
            icon = R.drawable.ic_account
        ))
        
        settingsAdapter.add(com.primex.iptv.models.SettingsItem(
            id = "settings",
            title = "Settings",
            description = "App preferences",
            icon = R.drawable.ic_settings
        ))
        
        settingsAdapter.add(com.primex.iptv.models.SettingsItem(
            id = "refresh",
            title = "Refresh",
            description = "Reload content",
            icon = R.drawable.ic_refresh
        ))
        
        settingsAdapter.add(com.primex.iptv.models.SettingsItem(
            id = "logout",
            title = "Sign Out",
            description = "Exit your account",
            icon = R.drawable.ic_logout
        ))
        
        rowsAdapter.add(ListRow(settingsHeader, settingsAdapter))

        // Section Header: Live TV
        val liveTvSection = HeaderItem(rowId++, "📺 LIVE TV")
        val emptyLiveTvAdapter = ArrayObjectAdapter()
        rowsAdapter.add(ListRow(liveTvSection, emptyLiveTvAdapter))

        // Live TV Channels - Organized by Categories
        if (channelsByCategory.isNotEmpty()) {
            // Sort categories by name
            val sortedCategories = channelsByCategory.keys.sortedBy { categoryId ->
                liveCategories[categoryId] ?: "Unknown"
            }
            
            sortedCategories.forEach { categoryId ->
                val categoryChannels = channelsByCategory[categoryId]
                if (!categoryChannels.isNullOrEmpty()) {
                    val categoryName = liveCategories[categoryId] ?: "Live TV"
                    val channelsHeader = HeaderItem(rowId++, categoryName)
                    val channelsAdapter = ArrayObjectAdapter(ChannelCardPresenter())
                    // Show ALL channels in category, no limit
                    categoryChannels.forEach { channelsAdapter.add(it) }
                    rowsAdapter.add(ListRow(channelsHeader, channelsAdapter))
                }
            }
        } else if (channels.isNotEmpty()) {
            // Fallback: show all channels in one row if no categories
            val channelsHeader = HeaderItem(rowId++, getString(R.string.live_tv))
            val channelsAdapter = ArrayObjectAdapter(ChannelCardPresenter())
            channels.forEach { channelsAdapter.add(it) }
            rowsAdapter.add(ListRow(channelsHeader, channelsAdapter))
        }

        // Section Header: Movies
        val moviesSection = HeaderItem(rowId++, "🎬 MOVIES")
        val emptyMoviesAdapter = ArrayObjectAdapter()
        rowsAdapter.add(ListRow(moviesSection, emptyMoviesAdapter))

        // Movies - Organized by Categories
        if (moviesByCategory.isNotEmpty()) {
            val sortedCategories = moviesByCategory.keys.sortedBy { categoryId ->
                vodCategories[categoryId] ?: "Unknown"
            }
            
            sortedCategories.forEach { categoryId ->
                val categoryMovies = moviesByCategory[categoryId]
                if (!categoryMovies.isNullOrEmpty()) {
                    val categoryName = vodCategories[categoryId] ?: "Movies"
                    val moviesHeader = HeaderItem(rowId++, categoryName)
                    val moviesAdapter = ArrayObjectAdapter(MovieCardPresenter())
                    // Show ALL movies in category
                    categoryMovies.forEach { moviesAdapter.add(it) }
                    rowsAdapter.add(ListRow(moviesHeader, moviesAdapter))
                }
            }
        } else if (movies.isNotEmpty()) {
            // Fallback: show all movies in one row if no categories
            val moviesHeader = HeaderItem(rowId++, getString(R.string.movies))
            val moviesAdapter = ArrayObjectAdapter(MovieCardPresenter())
            movies.forEach { moviesAdapter.add(it) }
            rowsAdapter.add(ListRow(moviesHeader, moviesAdapter))
        }

        // Section Header: Series
        val seriesSection = HeaderItem(rowId++, "📺 SERIES")
        val emptySeriesAdapter = ArrayObjectAdapter()
        rowsAdapter.add(ListRow(seriesSection, emptySeriesAdapter))

        // Series - Organized by Categories
        if (seriesByCategory.isNotEmpty()) {
            val sortedCategories = seriesByCategory.keys.sortedBy { categoryId ->
                seriesCategories[categoryId] ?: "Unknown"
            }
            
            sortedCategories.forEach { categoryId ->
                val categorySeries = seriesByCategory[categoryId]
                if (!categorySeries.isNullOrEmpty()) {
                    val categoryName = seriesCategories[categoryId] ?: "Series"
                    val seriesHeader = HeaderItem(rowId++, categoryName)
                    val seriesAdapter = ArrayObjectAdapter(SeriesCardPresenter())
                    // Show ALL series in category
                    categorySeries.forEach { seriesAdapter.add(it) }
                    rowsAdapter.add(ListRow(seriesHeader, seriesAdapter))
                }
            }
        } else if (series.isNotEmpty()) {
            // Fallback: show all series in one row if no categories
            val seriesHeader = HeaderItem(rowId++, getString(R.string.series))
            val seriesAdapter = ArrayObjectAdapter(SeriesCardPresenter())
            series.forEach { seriesAdapter.add(it) }
            rowsAdapter.add(ListRow(seriesHeader, seriesAdapter))
        }

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
        when (item.id) {
            "account" -> showAccountInfo()
            "settings" -> showSettings()
            "refresh" -> {
                // Reload content
                loadContent()
            }
            "logout" -> performLogout()
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
