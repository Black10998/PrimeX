package com.primex.iptv.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R
import com.primex.iptv.adapters.ContentRow
import com.primex.iptv.adapters.ContentRowAdapter
import com.primex.iptv.models.Channel

class SeriesFragment : Fragment() {

    private lateinit var contentRecycler: RecyclerView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_content_section, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadSeriesContent()
    }

    private fun loadSeriesContent() {
        // Create placeholder series content
        val placeholderSeries = createPlaceholderSeries()
        
        val rows = listOf(
            ContentRow("Trending Series", placeholderSeries.take(10)),
            ContentRow("New Episodes", placeholderSeries.drop(10).take(10)),
            ContentRow("Drama Series", placeholderSeries.drop(20).take(10)),
            ContentRow("Comedy Series", placeholderSeries.drop(30).take(10)),
            ContentRow("Sci-Fi Series", placeholderSeries.drop(40).take(10))
        )
        
        contentRecycler.adapter = ContentRowAdapter(rows) { series ->
            // Placeholder click action
            android.widget.Toast.makeText(
                requireContext(),
                "Series: ${series.name}",
                android.widget.Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun createPlaceholderSeries(): List<Channel> {
        return (1..50).map { index ->
            Channel(
                id = "series_$index",
                name = "Series $index",
                logo_url = null,
                stream_url = "",
                category = "series"
            )
        }
    }
}
