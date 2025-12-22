package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Series

class SeriesCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val cardView = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_series, parent, false) as ImageCardView
        return ViewHolder(cardView)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val series = item as Series
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = series.title
        
        val contentText = buildString {
            series.year?.let { append("$it") }
            series.seasons_count?.let { 
                if (isNotEmpty()) append(" • ")
                append("$it Season${if (it > 1) "s" else ""}")
            }
            series.rating?.let { 
                if (isNotEmpty()) append(" • ")
                append("★ %.1f".format(it))
            }
        }
        cardView.contentText = contentText.ifEmpty { series.genre ?: "Series" }
        
        cardView.setMainImageDimensions(200, 300)

        if (!series.poster_url.isNullOrEmpty()) {
            Glide.with(viewHolder.view.context)
                .load(series.poster_url)
                .centerCrop()
                .error(R.drawable.default_series_poster)
                .into(cardView.mainImageView)
        } else {
            cardView.mainImage = viewHolder.view.context.getDrawable(R.drawable.default_series_poster)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        cardView.badgeImage = null
        cardView.mainImage = null
    }
}
