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
        return (1..60).map { index ->
            Channel(
                id = "category_item_$index",
                name = "Content $index",
                logo_url = null,
                stream_url = "",
                category = "category"
            )
        }
    }
}
