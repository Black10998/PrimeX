package com.primex.iptv.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R

class HomeFragment : Fragment() {

    private lateinit var contentRecyclerView: RecyclerView
    private lateinit var navHome: TextView
    private lateinit var navLiveTV: TextView
    private lateinit var navMovies: TextView
    private lateinit var navSeries: TextView
    private lateinit var navSettings: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews(view)
        setupNavigation()
        loadContent()
    }

    private fun setupViews(view: View) {
        contentRecyclerView = view.findViewById(R.id.content_recycler)
        contentRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        
        navHome = view.findViewById(R.id.nav_home)
        navLiveTV = view.findViewById(R.id.nav_live_tv)
        navMovies = view.findViewById(R.id.nav_movies)
        navSeries = view.findViewById(R.id.nav_series)
        navSettings = view.findViewById(R.id.nav_settings)
    }

    private fun setupNavigation() {
        navHome.setOnClickListener {
            selectNav(navHome)
            loadHomeContent()
        }
        
        navLiveTV.setOnClickListener {
            selectNav(navLiveTV)
            loadLiveTVContent()
        }
        
        navMovies.setOnClickListener {
            selectNav(navMovies)
            loadMoviesContent()
        }
        
        navSeries.setOnClickListener {
            selectNav(navSeries)
            loadSeriesContent()
        }
        
        navSettings.setOnClickListener {
            val intent = Intent(requireContext(), SettingsActivity::class.java)
            startActivity(intent)
        }
        
        // Set Home as selected by default
        selectNav(navHome)
    }

    private fun selectNav(selected: TextView) {
        // Reset all
        navHome.setTextColor(0x80FFFFFF.toInt())
        navLiveTV.setTextColor(0x80FFFFFF.toInt())
        navMovies.setTextColor(0x80FFFFFF.toInt())
        navSeries.setTextColor(0x80FFFFFF.toInt())
        navSettings.setTextColor(0x80FFFFFF.toInt())
        
        // Highlight selected
        selected.setTextColor(0xFFFFFFFF.toInt())
    }

    private fun loadContent() {
        loadHomeContent()
    }

    private fun loadHomeContent() {
        // TODO: Load home content rows
        android.widget.Toast.makeText(requireContext(), "Home", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun loadLiveTVContent() {
        // TODO: Load live TV content rows
        android.widget.Toast.makeText(requireContext(), "Live TV", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun loadMoviesContent() {
        // TODO: Load movies content rows
        android.widget.Toast.makeText(requireContext(), "Movies", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun loadSeriesContent() {
        // TODO: Load series content rows
        android.widget.Toast.makeText(requireContext(), "Series", android.widget.Toast.LENGTH_SHORT).show()
    }
}
