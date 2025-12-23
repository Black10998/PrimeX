package com.primex.iptv.ui

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.primex.iptv.R

class SearchActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)
        
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.search_fragment, SearchFragment())
                .commit()
        }
    }
}
