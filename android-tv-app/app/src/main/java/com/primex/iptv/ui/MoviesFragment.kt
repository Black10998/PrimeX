package com.primex.iptv.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.VideoView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.api.ApiClient
import com.primex.iptv.models.Channel
import com.primex.iptv.utils.PreferenceManager
import com.primex.iptv.utils.SessionManager
import com.primex.iptv.utils.VideoBackgroundHelper
import kotlinx.coroutines.launch

class MoviesFragment : Fragment() {

    private lateinit var contentRecycler: RecyclerView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_content_section, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_movies)
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadMoviesContent()
    }

    private fun loadMoviesContent() {
        val username = PreferenceManager.getXtreamUsername(requireContext())
        val password = PreferenceManager.getXtreamPassword(requireContext())

        if (username.isNullOrEmpty() || password.isNullOrEmpty()) {
            showEmptyState("Please login to view movies")
            return
        }

        lifecycleScope.launch {
            try {
                // Load VOD (movies) from backend
                val response = ApiClient.xtreamApiService.getVodStreams(username, password)
                
                // Check for account deactivation
                if (SessionManager.handleUnauthorizedResponse(requireContext(), response.code())) {
                    return@launch
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val movies = response.body()!!
                    
                    if (movies.isEmpty()) {
                        showEmptyState("No movies available")
                        return@launch
                    }
                    
                    // Convert to Channel objects
                    val movieChannels = movies.map { movie ->
                        Channel(
                            id = movie.streamId?.toString() ?: "0",
                            name = movie.name ?: "Unknown Movie",
                            logo_url = movie.streamIcon,
                            stream_url = buildStreamUrl(username, password, movie.streamId?.toString() ?: "0", "movie"),
                            category = movie.categoryId
                        )
                    }
                    
                    // Group by category if available, otherwise show all
                    val rows = if (movieChannels.size > 10) {
                        listOf(
                            ContentRow("All Movies", movieChannels)
                        )
                    } else {
                        listOf(ContentRow("Movies", movieChannels))
                    }
                    
                    contentRecycler.adapter = ContentRowAdapter(rows) { movie ->
                        // Play movie
                        android.widget.Toast.makeText(
                            requireContext(),
                            "Playing: ${movie.name}",
                            android.widget.Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    showEmptyState("Failed to load movies")
                }
            } catch (e: Exception) {
                showEmptyState("Error: ${e.message}")
            }
        }
    }

    private fun buildStreamUrl(username: String, password: String, streamId: String, type: String): String {
        return "https://prime-x.live/$type/$username/$password/$streamId.mp4"
    }

    private fun showEmptyState(message: String) {
        contentRecycler.adapter = ContentRowAdapter(emptyList()) { }
        android.widget.Toast.makeText(requireContext(), message, android.widget.Toast.LENGTH_LONG).show()
    }

}
