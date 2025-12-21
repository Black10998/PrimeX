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
        // Always show UI first - load content in background
        setupRows()
        
        val deviceKey = PreferenceManager.getDeviceKey(requireContext())
        val deviceId = PreferenceManager.getMacAddress(requireContext())

        // Only attempt to load content if device credentials exist
        if (!deviceKey.isNullOrEmpty() && !deviceId.isNullOrEmpty()) {
            lifecycleScope.launch {
                try {
                    val response = ApiClient.apiService.checkDeviceStatus(deviceKey, deviceId)
                    
                    if (response.isSuccessful && response.body() != null) {
                        val statusResponse = response.body()!!
                        
                        if (statusResponse.status == "active") {
                            // Load channels
                            statusResponse.channels?.let {
                                channels.clear()
                                channels.addAll(it)
                            }
                            
                            // Load VOD content
                            statusResponse.vod?.let { vod ->
                                vod.movies?.let {
                                    movies.clear()
                                    movies.addAll(it)
                                }
                                vod.series?.let {
                                    series.clear()
                                    series.addAll(it)
                                }
                            }
                            
                            // Refresh UI with loaded content
                            setupRows()
                        }
                    }
                } catch (e: Exception) {
                    // Silent fail - app still works, just shows activation option
                    e.printStackTrace()
                }
            }
        }
    }

    private fun setupRows() {
        val rowsAdapter = ArrayObjectAdapter(ListRowPresenter())

        // Live TV Row
        if (channels.isNotEmpty()) {
            val channelsHeader = HeaderItem(0, "Live TV")
            val channelsAdapter = ArrayObjectAdapter(ChannelCardPresenter())
            channels.take(20).forEach { channelsAdapter.add(it) }
            rowsAdapter.add(ListRow(channelsHeader, channelsAdapter))
        }

        // Movies Row
        if (movies.isNotEmpty()) {
            val moviesHeader = HeaderItem(1, "Movies")
            val moviesAdapter = ArrayObjectAdapter(MovieCardPresenter())
            movies.take(20).forEach { moviesAdapter.add(it) }
            rowsAdapter.add(ListRow(moviesHeader, moviesAdapter))
        }

        // Series Row
        if (series.isNotEmpty()) {
            val seriesHeader = HeaderItem(2, "Series")
            val seriesAdapter = ArrayObjectAdapter(SeriesCardPresenter())
            series.take(20).forEach { seriesAdapter.add(it) }
            rowsAdapter.add(ListRow(seriesHeader, seriesAdapter))
        }

        // Settings Row - Always visible
        val settingsHeader = HeaderItem(3, "Settings")
        val settingsAdapter = ArrayObjectAdapter(SettingsCardPresenter())
        
        // Show activation option if not activated
        val deviceKey = PreferenceManager.getDeviceKey(requireContext())
        if (deviceKey.isNullOrEmpty()) {
            settingsAdapter.add(SettingsItem("Activate Device", "Get activation code to unlock content"))
        }
        
        settingsAdapter.add(SettingsItem("Device Info", "View device and subscription info"))
        settingsAdapter.add(SettingsItem("Refresh Content", "Reload channels and content"))
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
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, movie.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, movie.title)
            putExtra(PlayerActivity.EXTRA_TYPE, "movie")
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
        when (item.title) {
            "Activate Device" -> openActivationScreen()
            "Device Info" -> showDeviceInfo()
            "Refresh Content" -> loadContent()
        }
    }
    
    private fun openActivationScreen() {
        val intent = Intent(requireContext(), ActivationActivity::class.java)
        startActivity(intent)
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
