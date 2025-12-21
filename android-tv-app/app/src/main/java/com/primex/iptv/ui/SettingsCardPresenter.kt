package com.primex.iptv.ui

import android.graphics.Color
import android.view.ViewGroup
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.primex.iptv.R

class SettingsCardPresenter : Presenter() {

    companion object {
        private const val CARD_WIDTH = 313
        private const val CARD_HEIGHT = 176
    }

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val cardView = ImageCardView(parent.context).apply {
            isFocusable = true
            isFocusableInTouchMode = true
            setBackgroundColor(Color.DKGRAY)
            layoutParams = ViewGroup.LayoutParams(CARD_WIDTH, CARD_HEIGHT)
        }
        return ViewHolder(cardView)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val settingsItem = item as SettingsItem
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = settingsItem.title
        cardView.contentText = settingsItem.description
        cardView.setMainImageDimensions(CARD_WIDTH, CARD_HEIGHT)
        cardView.mainImage = viewHolder.view.context.getDrawable(R.drawable.ic_settings)
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        cardView.badgeImage = null
        cardView.mainImage = null
    }
}
