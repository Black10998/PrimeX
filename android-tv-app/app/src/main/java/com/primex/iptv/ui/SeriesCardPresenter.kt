package com.primex.iptv.ui

import android.graphics.Color
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Series

class SeriesCardPresenter : Presenter() {

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
        
        cardView.setMainImageDimensions(CARD_WIDTH, CARD_HEIGHT)

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
