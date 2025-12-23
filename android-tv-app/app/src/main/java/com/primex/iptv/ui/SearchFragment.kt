package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import androidx.leanback.app.SearchSupportFragment
import androidx.leanback.widget.*
import com.primex.iptv.models.Channel
import com.primex.iptv.models.Movie
import com.primex.iptv.models.Series
import com.primex.iptv.player.PlayerActivity

class SearchFragment : SearchSupportFragment(), SearchSupportFragment.SearchResultProvider {

    private val rowsAdapter = ArrayObjectAdapter(ListRowPresenter())
    private var searchQuery: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setSearchResultProvider(this)
        setOnItemViewClickedListener { _, item, _, _ ->
            when (item) {
                is Channel -> playChannel(item)
                is Movie -> playMovie(item)
                is Series -> playSeries(item)
            }
        }
    }

    override fun getResultsAdapter(): ObjectAdapter {
        return rowsAdapter
    }

    override fun onQueryTextChange(newQuery: String): Boolean {
        searchQuery = newQuery
        loadSearchResults(newQuery)
        return true
    }

    override fun onQueryTextSubmit(query: String): Boolean {
        searchQuery = query
        loadSearchResults(query)
        return true
    }

    private fun loadSearchResults(query: String) {
        rowsAdapter.clear()
        
        if (query.isEmpty()) {
            return
        }

        // TODO: Implement actual search logic
        // For now, show a placeholder message
        val headerItem = HeaderItem(0, "Search Results for \"$query\"")
        val listRowAdapter = ArrayObjectAdapter()
        rowsAdapter.add(ListRow(headerItem, listRowAdapter))
    }

    private fun playChannel(channel: Channel) {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra("STREAM_URL", channel.stream_url)
            putExtra("STREAM_TITLE", channel.name)
            putExtra("STREAM_TYPE", "live")
        }
        startActivity(intent)
    }

    private fun playMovie(movie: Movie) {
        val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
            putExtra("STREAM_URL", movie.stream_url)
            putExtra("STREAM_TITLE", movie.title)
            putExtra("STREAM_TYPE", "movie")
        }
        startActivity(intent)
    }

    private fun playSeries(series: Series) {
        // TODO: Show series details with episodes
        android.widget.Toast.makeText(
            requireContext(),
            "Series playback coming soon",
            android.widget.Toast.LENGTH_SHORT
        ).show()
    }
}
