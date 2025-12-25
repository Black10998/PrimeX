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
import android.widget.VideoView
import com.primex.iptv.utils.VideoBackgroundHelper

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
        
        (activity as? MainActivity)?.changeVideoBackground(R.raw.bg_favorites)
        
        contentRecycler = view.findViewById(R.id.section_content_recycler)
        contentRecycler.layoutManager = LinearLayoutManager(requireContext())
        
        loadFavoritesContent()
    }

    private fun loadFavoritesContent() {
        // Favorites feature not yet implemented - show empty state
        showEmptyState("Favorites feature coming soon")
    }

    private fun showEmptyState(message: String) {
        contentRecycler.adapter = ContentRowAdapter(emptyList()) { }
        android.widget.Toast.makeText(requireContext(), message, android.widget.Toast.LENGTH_LONG).show()
    }
}
