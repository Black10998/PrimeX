package com.primex.iptv.ui

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R
import com.primex.iptv.models.Movie

class MovieDetailsActivity : FragmentActivity() {

    companion object {
        const val EXTRA_MOVIE = "movie"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)

        val movie = intent.getSerializableExtra(EXTRA_MOVIE) as? Movie
        
        if (movie != null && savedInstanceState == null) {
            val fragment = MovieDetailsFragment.newInstance(movie)
            supportFragmentManager.beginTransaction()
                .replace(R.id.details_fragment, fragment)
                .commit()
        }
    }
}
