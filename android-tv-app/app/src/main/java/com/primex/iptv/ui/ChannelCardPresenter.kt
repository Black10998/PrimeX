package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Channel

class ChannelCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val cardView = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_channel, parent, false) as ImageCardView
        return ViewHolder(cardView)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val channel = item as Channel
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = channel.name
        cardView.contentText = channel.category ?: "Live TV"
        cardView.setMainImageDimensions(313, 176)

        if (!channel.logo_url.isNullOrEmpty()) {
            Glide.with(viewHolder.view.context)
                .load(channel.logo_url)
                .centerCrop()
                .error(R.drawable.default_channel_logo)
                .into(cardView.mainImageView)
        } else {
            cardView.mainImage = viewHolder.view.context.getDrawable(R.drawable.default_channel_logo)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        cardView.badgeImage = null
        cardView.mainImage = null
    }
}
