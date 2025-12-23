package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.leanback.widget.Presenter
import com.primex.iptv.R
import com.primex.iptv.models.SettingsItem

class SettingsCardPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.card_settings_premium, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val settingsItem = item as SettingsItem
        val cardView = viewHolder.view
        
        val iconView = cardView.findViewById<ImageView>(R.id.card_icon)
        val titleView = cardView.findViewById<TextView>(R.id.card_title)
        val subtitleView = cardView.findViewById<TextView>(R.id.card_subtitle)

        titleView.text = settingsItem.title
        subtitleView.text = settingsItem.description
        
        // Set icon if available
        settingsItem.icon?.let { iconRes ->
            iconView.setImageResource(iconRes)
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        // Nothing to unbind
    }
}
