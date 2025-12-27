package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Channel

/**
 * ChannelCardsAdapter - Right panel channel cards
 * 
 * Shows:
 * - Channel thumbnail/logo
 * - Channel number
 * - Channel name
 */
class ChannelCardsAdapter(
    private val onChannelClick: (Channel) -> Unit
) : ListAdapter<Channel, ChannelCardsAdapter.ChannelCardViewHolder>(ChannelDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChannelCardViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_channel_card, parent, false)
        return ChannelCardViewHolder(view, onChannelClick)
    }
    
    override fun onBindViewHolder(holder: ChannelCardViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    override fun onBindViewHolder(holder: ChannelCardViewHolder, position: Int, payloads: MutableList<Any>) {
        if (payloads.isEmpty()) {
            super.onBindViewHolder(holder, position, payloads)
        } else {
            // Partial update for better performance
            holder.bind(getItem(position))
        }
    }
    
    class ChannelCardViewHolder(
        itemView: View,
        private val onChannelClick: (Channel) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val channelLogo: ImageView = itemView.findViewById(R.id.channel_logo)
        private val channelNumber: TextView = itemView.findViewById(R.id.channel_number)
        private val channelName: TextView = itemView.findViewById(R.id.channel_name)
        
        fun bind(channel: Channel) {
            channelNumber.text = channel.number.toString().padStart(3, '0')
            channelName.text = channel.name
            
            // Load channel logo with optimizations
            if (!channel.logo_url.isNullOrEmpty()) {
                Glide.with(itemView.context)
                    .load(channel.logo_url)
                    .placeholder(R.drawable.app_icon)
                    .error(R.drawable.app_icon)
                    .thumbnail(0.1f) // Load low-res thumbnail first
                    .override(200, 120) // Resize to exact card size
                    .into(channelLogo)
            } else {
                channelLogo.setImageResource(R.drawable.app_icon)
            }
            
            itemView.setOnClickListener {
                onChannelClick(channel)
            }
            
            // Focus handling for TV remote
            itemView.isFocusable = true
            itemView.isFocusableInTouchMode = true
            
            itemView.setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    view.animate()
                        .scaleX(1.1f)
                        .scaleY(1.1f)
                        .setDuration(150)
                        .start()
                } else {
                    view.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(150)
                        .start()
                }
            }
        }
    }
    
    private class ChannelDiffCallback : DiffUtil.ItemCallback<Channel>() {
        override fun areItemsTheSame(oldItem: Channel, newItem: Channel): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: Channel, newItem: Channel): Boolean {
            return oldItem == newItem
        }
    }
}
