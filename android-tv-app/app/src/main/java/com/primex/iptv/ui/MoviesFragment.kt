package com.primex.iptv.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.VideoView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.models.Channel
import com.primex.iptv.utils.VideoBackgroundHelper

class MoviesFragment : Fragment() {

    private lateinit var contentRecycler: RecyclerView
    private var videoBackground: VideoView? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_content_section, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Setup video background
        videoBackground = view.findViewById(R.id.video_background)
        videoBackground?.let {
            VideoBackgroundHelper.setupVideoBackground(it, R.raw.bg_movies)
        }
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadMoviesContent()
    }

    override fun onPause() {
        super.onPause()
        VideoBackgroundHelper.pauseVideo(videoBackground)
    }

    override fun onResume() {
        super.onResume()
        VideoBackgroundHelper.resumeVideo(videoBackground)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        VideoBackgroundHelper.releaseVideo(videoBackground)
    }

    private fun loadMoviesContent() {
        // Create placeholder movie content
        val placeholderMovies = createPlaceholderMovies()
        
        val rows = listOf(
            ContentRow("Popular Movies", placeholderMovies.take(10)),
            ContentRow("New Releases", placeholderMovies.drop(10).take(10)),
            ContentRow("Action Movies", placeholderMovies.drop(20).take(10)),
            ContentRow("Drama", placeholderMovies.drop(30).take(10)),
            ContentRow("Comedy", placeholderMovies.drop(40).take(10))
        )
        
        contentRecycler.adapter = ContentRowAdapter(rows) { movie ->
            // Placeholder click action
            android.widget.Toast.makeText(
                requireContext(),
                "Movie: ${movie.name}",
                android.widget.Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun createPlaceholderMovies(): List<Channel> {
        val movieTitles = listOf(
            "The Dark Knight", "Inception", "Interstellar", "The Matrix", "Pulp Fiction",
            "The Godfather", "Fight Club", "Forrest Gump", "The Shawshank Redemption", "Gladiator",
            "The Prestige", "Memento", "The Departed", "Goodfellas", "Casino Royale",
            "Blade Runner 2049", "Mad Max: Fury Road", "John Wick", "The Revenant", "Dunkirk",
            "Parasite", "Joker", "1917", "Tenet", "Dune",
            "No Time to Die", "Top Gun: Maverick", "Avatar", "Titanic", "The Avengers",
            "Iron Man", "The Dark Knight Rises", "Skyfall", "Spectre", "Mission Impossible",
            "Fast & Furious", "Transformers", "Jurassic World", "Star Wars", "The Lion King",
            "Frozen", "Toy Story", "Finding Nemo", "The Incredibles", "Up",
            "WALL-E", "Ratatouille", "Inside Out", "Coco", "Soul"
        )
        
        return (1..50).map { index ->
            val posterIndex = ((index - 1) % 20) + 1
            val drawableId = when (posterIndex) {
                1 -> R.drawable.movie_poster_1
                2 -> R.drawable.movie_poster_2
                3 -> R.drawable.movie_poster_3
                4 -> R.drawable.movie_poster_4
                5 -> R.drawable.movie_poster_5
                6 -> R.drawable.movie_poster_6
                7 -> R.drawable.movie_poster_7
                8 -> R.drawable.movie_poster_8
                9 -> R.drawable.movie_poster_9
                10 -> R.drawable.movie_poster_10
                11 -> R.drawable.movie_poster_11
                12 -> R.drawable.movie_poster_12
                13 -> R.drawable.movie_poster_13
                14 -> R.drawable.movie_poster_14
                15 -> R.drawable.movie_poster_15
                16 -> R.drawable.movie_poster_16
                17 -> R.drawable.movie_poster_17
                18 -> R.drawable.movie_poster_18
                19 -> R.drawable.movie_poster_19
                else -> R.drawable.movie_poster_20
            }
            
            Channel(
                id = "movie_$index",
                name = movieTitles.getOrElse(index - 1) { "Movie $index" },
                logo_url = "android.resource://com.primex.iptv/$drawableId",
                stream_url = "",
                category = "movies"
            )
        }
    }
}
