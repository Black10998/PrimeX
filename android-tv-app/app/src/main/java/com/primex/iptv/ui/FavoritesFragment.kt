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

class FavoritesFragment : Fragment() {

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
        
        // Set cinematic space background
        view.setBackgroundResource(R.drawable.bg_space_favorites)
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadFavoritesContent()
    }

    private fun loadFavoritesContent() {
        // Create placeholder favorites content
        val placeholderFavorites = createPlaceholderFavorites()
        
        val rows = listOf(
            ContentRow("My Favorites", placeholderFavorites.take(15)),
            ContentRow("Recently Added to Favorites", placeholderFavorites.drop(15).take(10)),
            ContentRow("Watch Later", placeholderFavorites.drop(25).take(10))
        )
        
        contentRecycler.adapter = ContentRowAdapter(rows) { favorite ->
            // Placeholder click action
            android.widget.Toast.makeText(
                requireContext(),
                "Favorite: ${favorite.name}",
                android.widget.Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun createPlaceholderFavorites(): List<Channel> {
        return (1..35).map { index ->
            Channel(
                id = "favorite_$index",
                name = "Favorite Item $index",
                logo_url = null,
                stream_url = "",
                category = "favorites"
            )
        }
    }
}
