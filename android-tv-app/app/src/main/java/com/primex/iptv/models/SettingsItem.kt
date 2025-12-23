package com.primex.iptv.models

data class SettingsItem(
    val id: String,
    val title: String,
    val description: String,
    val icon: Int? = null
)
