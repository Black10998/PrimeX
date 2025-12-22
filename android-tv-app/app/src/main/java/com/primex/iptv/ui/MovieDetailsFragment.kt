package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Movie
import com.primex.iptv.player.PlayerActivity

class MovieDetailsFragment : Fragment() {

    private lateinit var movie: Movie

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        movie = arguments?.getSerializable("movie") as? Movie ?: return
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_movie_details, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        val posterImage = view.findViewById<ImageView>(R.id.movie_poster)
        val titleText = view.findViewById<TextView>(R.id.movie_title)
        val metadataText = view.findViewById<TextView>(R.id.movie_metadata)
        val descriptionText = view.findViewById<TextView>(R.id.movie_description)
        val playButton = view.findViewById<Button>(R.id.play_button)
        
        // Load poster
        Glide.with(this)
            .load(movie.poster_url)
            .placeholder(R.drawable.default_movie_poster)
            .error(R.drawable.default_movie_poster)
            .into(posterImage)
        
        // Set title
        titleText.text = movie.title
        
        // Set metadata
        val metadata = buildString {
            movie.year?.let { append("$it") }
            movie.rating?.let {
                if (isNotEmpty()) append(" • ")
                append("★ %.1f".format(it))
            }
            movie.duration?.let {
                if (isNotEmpty()) append(" • ")
                append("${it}min")
            }
            movie.genre?.let {
                if (isNotEmpty()) append(" • ")
                append(it)
            }
        }
        metadataText.text = metadata
        
        // Set description
        descriptionText.text = movie.description ?: getString(R.string.no_content)
        
        // Play button
        playButton.setOnClickListener {
            playMovie()
        }
    }

    private fun playMovie() {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, movie.stream_url)
            putExtra(PlayerActivity.EXTRA_TITLE, movie.title)
            putExtra(PlayerActivity.EXTRA_TYPE, "movie")
        }
        startActivity(intent)
    }

    companion object {
        fun newInstance(movie: Movie): MovieDetailsFragment {
            return MovieDetailsFragment().apply {
                arguments = Bundle().apply {
                    putSerializable("movie", movie)
                }
            }
        }
    }
}
