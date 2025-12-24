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

class CategoriesFragment : Fragment() {

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
        
        loadCategoriesContent()
    }

    private fun loadCategoriesContent() {
        // Create placeholder content organized by categories
        val placeholderContent = createPlaceholderContent()
        
        val rows = listOf(
            ContentRow("Action & Adventure", placeholderContent.take(10)),
            ContentRow("Drama & Romance", placeholderContent.drop(10).take(10)),
            ContentRow("Comedy & Entertainment", placeholderContent.drop(20).take(10)),
            ContentRow("Documentary", placeholderContent.drop(30).take(10)),
            ContentRow("Kids & Family", placeholderContent.drop(40).take(10)),
            ContentRow("Sports", placeholderContent.drop(50).take(10))
        )
        
        contentRecycler.adapter = ContentRowAdapter(rows) { item ->
            // Placeholder click action
            android.widget.Toast.makeText(
                requireContext(),
                "Category Item: ${item.name}",
                android.widget.Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun createPlaceholderContent(): List<Channel> {
        val channelNames = listOf(
            "HBO", "ESPN", "CNN", "BBC", "Discovery", "National Geographic", "Fox News", "MTV",
            "Comedy Central", "Cartoon Network", "Disney Channel", "Nickelodeon", "History Channel",
            "Animal Planet", "Food Network", "HGTV", "TLC", "Bravo", "E! Entertainment", "TNT",
            "USA Network", "FX", "AMC", "Showtime", "Starz", "Cinemax", "NBC", "CBS", "ABC", "Fox",
            "The CW", "PBS", "Syfy", "TBS", "Lifetime", "A&E", "Travel Channel", "Investigation Discovery",
            "Oxygen", "VH1", "BET", "Freeform", "Hallmark", "Paramount Network", "truTV", "IFC",
            "Sundance TV", "WE tv", "OWN", "TV Land", "Nick Jr", "Disney Junior", "Boomerang",
            "Universal Kids", "TeenNick", "Nick at Nite", "Adult Swim", "Toonami", "Cartoon Network Too"
        )
        
        return (1..60).map { index ->
            val logoIndex = ((index - 1) % 20) + 1
            val drawableId = when (logoIndex) {
                1 -> R.drawable.channel_logo_1
                2 -> R.drawable.channel_logo_2
                3 -> R.drawable.channel_logo_3
                4 -> R.drawable.channel_logo_4
                5 -> R.drawable.channel_logo_5
                6 -> R.drawable.channel_logo_6
                7 -> R.drawable.channel_logo_7
                8 -> R.drawable.channel_logo_8
                9 -> R.drawable.channel_logo_9
                10 -> R.drawable.channel_logo_10
                11 -> R.drawable.channel_logo_11
                12 -> R.drawable.channel_logo_12
                13 -> R.drawable.channel_logo_13
                14 -> R.drawable.channel_logo_14
                15 -> R.drawable.channel_logo_15
                16 -> R.drawable.channel_logo_16
                17 -> R.drawable.channel_logo_17
                18 -> R.drawable.channel_logo_18
                19 -> R.drawable.channel_logo_19
                else -> R.drawable.channel_logo_20
            }
            
            Channel(
                id = "category_item_$index",
                name = channelNames.getOrElse(index - 1) { "Channel $index" },
                logo_url = "android.resource://com.primex.iptv/$drawableId",
                stream_url = "",
                category = "category"
            )
        }
    }
}
