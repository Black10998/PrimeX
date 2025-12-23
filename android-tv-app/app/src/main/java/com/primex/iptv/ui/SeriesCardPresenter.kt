package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Series

class SeriesCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_content_premium, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val series = item as Series
        val cardView = viewHolder.view
        
        val imageView = cardView.findViewById<ImageView>(R.id.card_image)
        val titleView = cardView.findViewById<TextView>(R.id.card_title)
        val subtitleView = cardView.findViewById<TextView>(R.id.card_subtitle)
        val qualityBadge = cardView.findViewById<TextView>(R.id.card_quality_badge)

        titleView.text = series.title
        
        // Show quality badge if available
        series.quality?.let { quality ->
            qualityBadge.text = quality.uppercase()
            qualityBadge.visibility = android.view.View.VISIBLE
        } ?: run {
            qualityBadge.visibility = android.view.View.GONE
        }
        
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
        subtitleView.text = contentText.ifEmpty { series.genre ?: "Series" }

        if (!series.poster_url.isNullOrEmpty()) {
            Glide.with(cardView.context)
                .load(series.poster_url)
                .centerCrop()
                .error(R.drawable.default_series_poster)
                .into(imageView)
        } else {
            imageView.setImageResource(R.drawable.default_series_poster)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val imageView = viewHolder.view.findViewById<ImageView>(R.id.card_image)
        imageView.setImageDrawable(null)
    }
}
