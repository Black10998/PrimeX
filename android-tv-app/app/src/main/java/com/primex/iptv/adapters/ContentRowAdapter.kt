package com.primex.iptv.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.models.Channel

data class ContentRow(
    val title: String,
    val channels: List<Channel>
)

class ContentRowAdapter(
    private val rows: List<ContentRow>,
    private val onChannelClick: (Channel) -> Unit
) : RecyclerView.Adapter<ContentRowAdapter.RowViewHolder>() {

    inner class RowViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView = view.findViewById(R.id.row_title)
        val recycler: RecyclerView = view.findViewById(R.id.row_recycler)

        fun bind(row: ContentRow) {
            title.text = row.title
            
            recycler.layoutManager = LinearLayoutManager(
                itemView.context,
                LinearLayoutManager.HORIZONTAL,
                false
            )
            
            recycler.adapter = ChannelAdapter(row.channels, onChannelClick)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RowViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_content_row, parent, false)
        return RowViewHolder(view)
    }

    override fun onBindViewHolder(holder: RowViewHolder, position: Int) {
        holder.bind(rows[position])
    }

    override fun getItemCount() = rows.size
}
