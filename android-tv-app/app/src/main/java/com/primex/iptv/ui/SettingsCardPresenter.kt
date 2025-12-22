package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.primex.iptv.R

class SettingsCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val cardView = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_settings, parent, false) as ImageCardView
        return ViewHolder(cardView)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val settingsItem = item as SettingsItem
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = settingsItem.title
        cardView.contentText = settingsItem.description
        cardView.setMainImageDimensions(313, 176)
        cardView.mainImage = viewHolder.view.context.getDrawable(R.drawable.ic_settings)
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        cardView.badgeImage = null
        cardView.mainImage = null
    }
}
