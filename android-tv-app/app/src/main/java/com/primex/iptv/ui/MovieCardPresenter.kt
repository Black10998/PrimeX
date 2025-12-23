package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Movie

class MovieCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_content_premium, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val movie = item as Movie
        val cardView = viewHolder.view
        
        val imageView = cardView.findViewById<ImageView>(R.id.card_image)
        val titleView = cardView.findViewById<TextView>(R.id.card_title)
        val qualityBadge = cardView.findViewById<TextView>(R.id.card_quality_badge)
        val ratingContainer = cardView.findViewById<android.view.View>(R.id.card_rating_container)
        val ratingText = cardView.findViewById<TextView>(R.id.card_rating)
        val yearText = cardView.findViewById<TextView>(R.id.card_year)
        val genreText = cardView.findViewById<TextView>(R.id.card_genre)
        val separator = cardView.findViewById<android.view.View>(R.id.card_separator1)

        titleView.text = movie.title
        
        // Show quality badge if available
        movie.quality?.let { quality ->
            qualityBadge.text = quality.uppercase()
            qualityBadge.visibility = android.view.View.VISIBLE
        } ?: run {
            qualityBadge.visibility = android.view.View.GONE
        }
        
        // Show rating if available
        movie.rating?.let { rating ->
            ratingText.text = "%.1f".format(rating)
            ratingContainer.visibility = android.view.View.VISIBLE
        } ?: run {
            ratingContainer.visibility = android.view.View.GONE
        }
        
        // Show year if available
        movie.year?.let { year ->
            yearText.text = year.toString()
            yearText.visibility = android.view.View.VISIBLE
            separator.visibility = android.view.View.VISIBLE
        } ?: run {
            yearText.visibility = android.view.View.GONE
            separator.visibility = android.view.View.GONE
        }
        
        // Show genre if available
        movie.genre?.let { genre ->
            genreText.text = genre
            genreText.visibility = android.view.View.VISIBLE
        } ?: run {
            genreText.visibility = android.view.View.GONE
        }

        if (!movie.poster_url.isNullOrEmpty()) {
            Glide.with(cardView.context)
                .load(movie.poster_url)
                .centerCrop()
                .error(R.drawable.default_movie_poster)
                .into(imageView)
        } else {
            imageView.setImageResource(R.drawable.default_movie_poster)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val imageView = viewHolder.view.findViewById<ImageView>(R.id.card_image)
        imageView.setImageDrawable(null)
    }
}
