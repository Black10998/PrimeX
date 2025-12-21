package com.primex.iptv.ui

import android.graphics.Color
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Channel

class ChannelCardPresenter : Presenter() {

    companion object {
        private const val CARD_WIDTH = 313
        private const val CARD_HEIGHT = 176
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
        val channel = item as Channel
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = channel.name
        cardView.contentText = channel.category ?: "Live TV"
        cardView.setMainImageDimensions(CARD_WIDTH, CARD_HEIGHT)

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
