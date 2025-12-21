package com.primex.iptv.ui

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.ErrorSupportFragment
import com.primex.iptv.R

class BrowseErrorActivity : FragmentActivity() {

    companion object {
        const val EXTRA_ERROR_MESSAGE = "error_message"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_browse_error)

        val errorMessage = intent.getStringExtra(EXTRA_ERROR_MESSAGE) ?: "An error occurred"

        val fragment = ErrorSupportFragment().apply {
            message = errorMessage
            setDefaultBackground(true)
            buttonText = "Retry"
            setButtonClickListener {
                finish()
            }
        }

        supportFragmentManager.beginTransaction()
            .replace(R.id.error_fragment, fragment)
            .commit()
    }
}
