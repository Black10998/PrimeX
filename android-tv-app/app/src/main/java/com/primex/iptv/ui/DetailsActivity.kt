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

    private var seriesId: String = ""
    private var seriesTitle: String = ""
    private val episodes = mutableListOf<Episode>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)

        seriesId = intent.getStringExtra(EXTRA_SERIES_ID) ?: ""
        seriesTitle = intent.getStringExtra(EXTRA_SERIES_TITLE) ?: ""

        if (seriesId.isNotEmpty()) {
            loadEpisodes()
        }
    }

    private fun loadEpisodes() {
        val username = PreferenceManager.getXtreamUsername(this)
        val password = PreferenceManager.getXtreamPassword(this)
        
        if (username.isNullOrEmpty() || password.isNullOrEmpty()) return
        
        lifecycleScope.launch {
            try {
                // Get series info from Xtream API
                val seriesInfo = ApiClient.xtreamApiService.getSeriesInfo(
                    username = username,
                    password = password,
                    seriesId = seriesId
                )
                
                if (seriesInfo.isSuccessful && seriesInfo.body() != null) {
                    val info = seriesInfo.body()!!
                    
                    // Convert Xtream episodes to app Episode model
                    episodes.clear()
                    info.episodes?.forEach { (seasonNum, seasonEpisodes) ->
                        seasonEpisodes.forEach { xtreamEpisode ->
                            episodes.add(Episode(
                                id = xtreamEpisode.id?.toIntOrNull() ?: 0,
                                series_id = seriesId.toIntOrNull() ?: 0,
                                season_number = seasonNum.toIntOrNull() ?: 0,
                                episode_number = xtreamEpisode.episodeNum ?: 0,
                                title = xtreamEpisode.title ?: "Episode ${xtreamEpisode.episodeNum}",
                                description = xtreamEpisode.info?.plot,
                                stream_url = buildSeriesStreamUrl(username, password, xtreamEpisode.id ?: "0"),
                                thumbnail_url = xtreamEpisode.info?.movieImage,
                                duration = xtreamEpisode.info?.durationSecs,
                                air_date = xtreamEpisode.info?.releasedate
                            ))
                        }
                    }
                    // TODO: Display episodes in fragment
                }
            } catch (e: Exception) {
                android.util.Log.e("DetailsActivity", "Error loading episodes", e)
            }
        }
    }
    
    private fun buildSeriesStreamUrl(username: String, password: String, episodeId: String): String {
        return "https://prime-x.live/series/$username/$password/$episodeId.mp4"
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
