package com.primex.iptv.ui

import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import androidx.leanback.app.DetailsFragment
import androidx.leanback.widget.*
import androidx.core.content.ContextCompat
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.SimpleTarget
import com.bumptech.glide.request.transition.Transition
import com.primex.iptv.R
import com.primex.iptv.models.Movie
import com.primex.iptv.player.PlayerActivity

class MovieDetailsFragment : DetailsFragment() {

    private lateinit var movie: Movie
    private lateinit var detailsOverviewRow: DetailsOverviewRow
    private lateinit var adapter: ArrayObjectAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        movie = arguments?.getSerializable("movie") as? Movie ?: return
        
        setupAdapter()
        setupDetailsOverviewRow()
        loadBackdrop()
    }

    private fun setupAdapter() {
        val presenterSelector = ClassPresenterSelector()
        val detailsPresenter = FullWidthDetailsOverviewRowPresenter(
            DetailsDescriptionPresenter()
        )
        
        detailsPresenter.backgroundColor = ContextCompat.getColor(requireContext(), R.color.background_secondary)
        detailsPresenter.actionsBackgroundColor = ContextCompat.getColor(requireContext(), R.color.background_primary)
        
        presenterSelector.addClassPresenter(DetailsOverviewRow::class.java, detailsPresenter)
        presenterSelector.addClassPresenter(ListRow::class.java, ListRowPresenter())
        
        adapter = ArrayObjectAdapter(presenterSelector)
        this.adapter = adapter
    }

    private fun setupDetailsOverviewRow() {
        detailsOverviewRow = DetailsOverviewRow(movie)
        
        val actionsAdapter = ArrayObjectAdapter()
        
        // Play action
        actionsAdapter.add(Action(
            ACTION_PLAY,
            getString(R.string.play),
            null
        ))
        
        detailsOverviewRow.actionsAdapter = actionsAdapter
        adapter.add(detailsOverviewRow)
        
        // Load poster
        Glide.with(requireContext())
            .asBitmap()
            .load(movie.poster_url)
            .into(object : SimpleTarget<Bitmap>() {
                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                    detailsOverviewRow.setImageBitmap(requireContext(), resource)
                }
            })
        
        // Setup click listener
        onItemViewClickedListener = OnItemViewClickedListener { _, item, _, _ ->
            if (item is Action) {
                when (item.id) {
                    ACTION_PLAY -> playMovie()
                }
            }
        }
    }

    private fun loadBackdrop() {
        val backdropUrl = movie.backdrop_url ?: movie.poster_url
        if (!backdropUrl.isNullOrEmpty()) {
            Glide.with(requireContext())
                .asBitmap()
                .load(backdropUrl)
                .into(object : SimpleTarget<Bitmap>() {
                    override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                        detailsOverviewRow.setImageBitmap(requireContext(), resource)
                    }
                })
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

    inner class DetailsDescriptionPresenter : AbstractDetailsDescriptionPresenter() {
        override fun onBindDescription(vh: ViewHolder, item: Any) {
            val movie = item as Movie
            
            vh.title.text = movie.title
            
            val subtitle = buildString {
                movie.year?.let { append("$it") }
                movie.rating?.let {
                    if (isNotEmpty()) append(" • ")
                    append("★ %.1f".format(it))
                }
                movie.duration?.let {
                    if (isNotEmpty()) append(" • ")
                    append("${it}min")
                }
            }
            vh.subtitle.text = subtitle
            
            vh.body.text = movie.description ?: movie.genre
        }
    }

    companion object {
        private const val ACTION_PLAY = 1L
        
        fun newInstance(movie: Movie): MovieDetailsFragment {
            return MovieDetailsFragment().apply {
                arguments = Bundle().apply {
                    putSerializable("movie", movie)
                }
            }
        }
    }
}
