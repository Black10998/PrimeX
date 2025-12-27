package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.models.Channel

/**
 * ChannelSidebarAdapter - Adapter for channel list in sidebar
 * 
 * Features:
 * - Displays channel number and name
 * - Focus handling for TV remote
 * - Click handling for channel selection
 * - Smooth animations with DiffUtil
 */
class ChannelSidebarAdapter(
    private val onChannelClick: (Channel) -> Unit
) : ListAdapter<Channel, ChannelSidebarAdapter.ChannelViewHolder>(ChannelDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChannelViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_channel_sidebar, parent, false)
        return ChannelViewHolder(view, onChannelClick)
    }
    
    override fun onBindViewHolder(holder: ChannelViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    class ChannelViewHolder(
        itemView: View,
        private val onChannelClick: (Channel) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val channelNumber: TextView = itemView.findViewById(R.id.channel_number)
        private val channelName: TextView = itemView.findViewById(R.id.channel_name)
        
        fun bind(channel: Channel) {
            channelNumber.text = channel.number.toString()
            channelName.text = channel.name
            
            itemView.setOnClickListener {
                onChannelClick(channel)
            }
            
            // Focus handling for TV remote
            itemView.isFocusable = true
            itemView.isFocusableInTouchMode = true
            
            itemView.setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    view.animate()
                        .scaleX(1.05f)
                        .scaleY(1.05f)
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
