package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Channel

class ChannelCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_channel_premium, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val channel = item as Channel
        val cardView = viewHolder.view
        
        val imageView = cardView.findViewById<ImageView>(R.id.card_image)
        val titleView = cardView.findViewById<TextView>(R.id.card_title)
        val subtitleView = cardView.findViewById<TextView>(R.id.card_subtitle)

        titleView.text = channel.name
        subtitleView.text = channel.category ?: "Live TV"

        if (!channel.logo_url.isNullOrEmpty()) {
            Glide.with(cardView.context)
                .load(channel.logo_url)
                .centerCrop()
                .error(R.drawable.default_channel_logo)
                .into(imageView)
        } else {
            imageView.setImageResource(R.drawable.default_channel_logo)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val imageView = viewHolder.view.findViewById<ImageView>(R.id.card_image)
        imageView.setImageDrawable(null)
    }
}
