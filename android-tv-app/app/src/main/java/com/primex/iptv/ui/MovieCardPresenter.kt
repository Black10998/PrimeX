package com.primex.iptv.ui

import android.graphics.Color
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Movie

class MovieCardPresenter : Presenter() {

    companion object {
        private const val CARD_WIDTH = 200
        private const val CARD_HEIGHT = 300
    }

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val cardView = ImageCardView(parent.context).apply {
            isFocusable = true
            isFocusableInTouchMode = true
            setBackgroundColor(Color.DKGRAY)
        }
        return ViewHolder(cardView)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val movie = item as Movie
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = movie.title
        
        val contentText = buildString {
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
        cardView.contentText = contentText.ifEmpty { movie.genre ?: "Movie" }
        
        cardView.setMainImageDimensions(CARD_WIDTH, CARD_HEIGHT)

        if (!movie.poster_url.isNullOrEmpty()) {
            Glide.with(viewHolder.view.context)
                .load(movie.poster_url)
                .centerCrop()
                .error(R.drawable.default_movie_poster)
                .into(cardView.mainImageView)
        } else {
            cardView.mainImage = viewHolder.view.context.getDrawable(R.drawable.default_movie_poster)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        cardView.badgeImage = null
        cardView.mainImage = null
    }
}
