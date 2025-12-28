package com.primex.iptv.ui.appletv

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Channel

/**
 * ContentRowAdapter - Adapter for horizontal content rows
 * 
 * Displays content cards in Apple TV style with:
 * - Smooth focus animations
 * - Image loading with Glide
 * - Progress indicators
 * - Metadata display
 */
class ContentRowAdapter(
    private val onItemClick: (Channel) -> Unit
) : ListAdapter<Channel, ContentRowAdapter.ContentViewHolder>(ContentDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ContentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.appletv_card_content, parent, false)
        return ContentViewHolder(view, onItemClick)
    }
    
    override fun onBindViewHolder(holder: ContentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    class ContentViewHolder(
        itemView: View,
        private val onItemClick: (Channel) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val cardImage: ImageView = itemView.findViewById(R.id.card_image)
        private val cardTitle: TextView = itemView.findViewById(R.id.card_title)
        private val cardSubtitle: TextView = itemView.findViewById(R.id.card_subtitle)
        private val cardProgress: ProgressBar? = itemView.findViewById(R.id.card_progress)
        
        fun bind(channel: Channel) {
            cardTitle.text = channel.name
            cardSubtitle.text = channel.category ?: "Channel ${channel.number}"
            
            // Load image with Glide
            if (!channel.logo_url.isNullOrEmpty()) {
                Glide.with(itemView.context)
                    .load(channel.logo_url)
                    .placeholder(R.drawable.app_icon)
                    .error(R.drawable.app_icon)
                    .thumbnail(0.1f)
                    .override(300, 450)
                    .into(cardImage)
            } else {
                cardImage.setImageResource(R.drawable.app_icon)
            }
            
            // Hide progress by default
            cardProgress?.visibility = View.GONE
            
            // Click listener
            itemView.setOnClickListener {
                onItemClick(channel)
            }
        }
    }
    
    private class ContentDiffCallback : DiffUtil.ItemCallback<Channel>() {
        override fun areItemsTheSame(oldItem: Channel, newItem: Channel): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: Channel, newItem: Channel): Boolean {
            return oldItem == newItem
        }
    }
}
