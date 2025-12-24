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
        val seriesTitles = listOf(
            "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Friends",
            "The Office", "Stranger Things", "The Crown", "Westworld", "Black Mirror",
            "Peaky Blinders", "Sherlock", "The Mandalorian", "House of Cards", "Narcos",
            "Better Call Saul", "The Witcher", "Vikings", "Ozark", "The Boys",
            "Succession", "The Last of Us", "Wednesday", "1899", "Dark",
            "Money Heist", "Squid Game", "Bridgerton", "The Umbrella Academy", "Lucifer",
            "The Handmaid's Tale", "Chernobyl", "True Detective", "Fargo", "Mindhunter",
            "The Expanse", "Foundation", "See", "For All Mankind", "Severance",
            "Ted Lasso", "The Morning Show", "Yellowstone", "The Walking Dead", "Lost",
            "Prison Break", "24", "Dexter", "House M.D.", "Grey's Anatomy"
        )
        
        return (1..50).map { index ->
            val posterIndex = ((index - 1) % 20) + 1
            val drawableId = when (posterIndex) {
                1 -> R.drawable.series_poster_1
                2 -> R.drawable.series_poster_2
                3 -> R.drawable.series_poster_3
                4 -> R.drawable.series_poster_4
                5 -> R.drawable.series_poster_5
                6 -> R.drawable.series_poster_6
                7 -> R.drawable.series_poster_7
                8 -> R.drawable.series_poster_8
                9 -> R.drawable.series_poster_9
                10 -> R.drawable.series_poster_10
                11 -> R.drawable.series_poster_11
                12 -> R.drawable.series_poster_12
                13 -> R.drawable.series_poster_13
                14 -> R.drawable.series_poster_14
                15 -> R.drawable.series_poster_15
                16 -> R.drawable.series_poster_16
                17 -> R.drawable.series_poster_17
                18 -> R.drawable.series_poster_18
                19 -> R.drawable.series_poster_19
                else -> R.drawable.series_poster_20
            }
            
            Channel(
                id = "series_$index",
                name = seriesTitles.getOrElse(index - 1) { "Series $index" },
                logo_url = "android.resource://com.primex.iptv/$drawableId",
                stream_url = "",
                category = "series"
            )
        }
    }
}
