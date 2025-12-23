package com.primex.iptv.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.primex.iptv.R
import com.primex.iptv.models.Channel

class ChannelAdapter(
    private val channels: List<Channel>,
    private val onChannelClick: (Channel) -> Unit
) : RecyclerView.Adapter<ChannelAdapter.ChannelViewHolder>() {

    inner class ChannelViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val logo: ImageView = view.findViewById(R.id.channel_logo)
        val name: TextView = view.findViewById(R.id.channel_name)

        fun bind(channel: Channel) {
            name.text = channel.name
            
            // Load channel logo
            if (!channel.logo_url.isNullOrEmpty()) {
                Glide.with(itemView.context)
                    .load(channel.logo_url)
                    .placeholder(R.drawable.ic_tv)
                    .error(R.drawable.ic_tv)
                    .into(logo)
            } else {
                logo.setImageResource(R.drawable.ic_tv)
            }

            itemView.setOnClickListener {
                onChannelClick(channel)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChannelViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_channel_card, parent, false)
        return ChannelViewHolder(view)
    }

    override fun onBindViewHolder(holder: ChannelViewHolder, position: Int) {
        holder.bind(channels[position])
    }

    override fun getItemCount() = channels.size
}
