package com.primex.iptv.utils

import android.content.Context
import android.content.res.Configuration
import android.os.Build
import java.util.*

object LocaleHelper {

    fun setLocale(context: Context, languageCode: String): Context {
        PreferenceManager.saveLanguage(context, languageCode)
        return updateResources(context, languageCode)
    }

    fun onAttach(context: Context): Context {
        val lang = PreferenceManager.getLanguage(context)
        return updateResources(context, lang)
    }

    private fun updateResources(context: Context, language: String): Context {
        val locale = Locale(language)
        Locale.setDefault(locale)

        val configuration = Configuration(context.resources.configuration)
        configuration.setLocale(locale)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLayoutDirection(locale)
        }

        return context.createConfigurationContext(configuration)
    }

    fun getCurrentLanguage(context: Context): String {
        return PreferenceManager.getLanguage(context)
    }

    fun isRTL(context: Context): Boolean {
        val lang = getCurrentLanguage(context)
        return lang == "ar"
    }
}
