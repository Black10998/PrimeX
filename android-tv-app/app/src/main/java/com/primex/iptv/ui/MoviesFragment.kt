package com.primex.iptv.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.models.Channel

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
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadMoviesContent()
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
        return (1..50).map { index ->
            Channel(
                id = "movie_$index",
                name = "Movie $index",
                logo_url = null,
                stream_url = "",
                category = "movies"
            )
        }
    }
}
