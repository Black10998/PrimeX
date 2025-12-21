package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import com.primex.iptv.R
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.Episode
import com.primex.iptv.player.PlayerActivity
import com.primex.iptv.utils.PreferenceManager
import kotlinx.coroutines.launch

class DetailsActivity : FragmentActivity() {

    companion object {
        const val EXTRA_SERIES_ID = "series_id"
        const val EXTRA_SERIES_TITLE = "series_title"
    }

    private var seriesId: Int = -1
    private var seriesTitle: String = ""
    private val episodes = mutableListOf<Episode>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)

        seriesId = intent.getIntExtra(EXTRA_SERIES_ID, -1)
        seriesTitle = intent.getStringExtra(EXTRA_SERIES_TITLE) ?: ""

        if (seriesId != -1) {
            loadEpisodes()
        }
    }

    private fun loadEpisodes() {
        val deviceKey = PreferenceManager.getDeviceKey(this) ?: return
        
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getSeriesEpisodes(
                    "Bearer $deviceKey",
                    seriesId
                )
                
                if (response.isSuccessful && response.body() != null) {
                    episodes.clear()
                    episodes.addAll(response.body()!!.episodes)
                    // TODO: Display episodes in fragment
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun playEpisode(episode: Episode) {
        val intent = Intent(this, PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, episode.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, "${seriesTitle} - S${episode.season_number}E${episode.episode_number}")
            putExtra(PlayerActivity.EXTRA_TYPE, "episode")
        }
        startActivity(intent)
    }
}
