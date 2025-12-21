package com.primex.iptv.models

import com.google.gson.annotations.SerializedName

// Login - Matches PrimeX backend response format
data class LoginRequest(
    @SerializedName("username")
    val username: String,
    @SerializedName("password")
    val password: String,
    @SerializedName("device_id")
    val device_id: String? = null,
    @SerializedName("mac_address")
    val mac_address: String? = null
)

data class LoginResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("data")
    val data: LoginData? = null
)

data class LoginData(
    @SerializedName("token")
    val token: String,
    @SerializedName("refreshToken")
    val refreshToken: String? = null,
    @SerializedName("user")
    val user: UserInfo
)

data class UserInfo(
    @SerializedName("id")
    val id: Int,
    @SerializedName("username")
    val username: String,
    @SerializedName("email")
    val email: String? = null,
    @SerializedName("subscription_end")
    val subscription_end: String? = null,
    @SerializedName("max_devices")
    val max_devices: Int? = null
)

// Device Registration
data class DeviceRegistrationRequest(
    @SerializedName("mac_address")
    val mac_address: String
)

data class DeviceRegistrationResponse(
    @SerializedName("device_key")
    val device_key: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("message")
    val message: String? = null
)

// Device Status
data class DeviceStatusResponse(
    @SerializedName("status")
    val status: String,
    @SerializedName("device_key")
    val device_key: String? = null,
    @SerializedName("subscription")
    val subscription: Subscription? = null,
    @SerializedName("channels")
    val channels: List<Channel>? = null,
    @SerializedName("vod")
    val vod: VodContent? = null,
    @SerializedName("message")
    val message: String? = null
)

data class Subscription(
    @SerializedName("plan_name")
    val plan_name: String,
    @SerializedName("expires_at")
    val expires_at: String,
    @SerializedName("max_connections")
    val max_connections: Int? = null,
    @SerializedName("features")
    val features: SubscriptionFeatures? = null
)

data class SubscriptionFeatures(
    @SerializedName("live_tv")
    val live_tv: Boolean = true,
    @SerializedName("vod")
    val vod: Boolean = true,
    @SerializedName("series")
    val series: Boolean = true,
    @SerializedName("catchup")
    val catchup: Boolean = false,
    @SerializedName("recording")
    val recording: Boolean = false
)

// Channels
data class Channel(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("stream_url")
    val stream_url: String,
    @SerializedName("logo_url")
    val logo_url: String? = null,
    @SerializedName("category")
    val category: String? = null,
    @SerializedName("epg_channel_id")
    val epg_channel_id: String? = null,
    @SerializedName("is_active")
    val is_active: Boolean = true
)

data class ChannelsResponse(
    @SerializedName("channels")
    val channels: List<Channel>,
    @SerializedName("total")
    val total: Int? = null
)

// VOD Content
data class VodContent(
    @SerializedName("movies")
    val movies: List<Movie>? = null,
    @SerializedName("series")
    val series: List<Series>? = null
)

data class Movie(
    @SerializedName("id")
    val id: Int,
    @SerializedName("title")
    val title: String,
    @SerializedName("description")
    val description: String? = null,
    @SerializedName("stream_url")
    val stream_url: String,
    @SerializedName("poster_url")
    val poster_url: String? = null,
    @SerializedName("backdrop_url")
    val backdrop_url: String? = null,
    @SerializedName("year")
    val year: Int? = null,
    @SerializedName("rating")
    val rating: Float? = null,
    @SerializedName("duration")
    val duration: Int? = null,
    @SerializedName("genre")
    val genre: String? = null,
    @SerializedName("category")
    val category: String? = null
)

data class MoviesResponse(
    @SerializedName("movies")
    val movies: List<Movie>,
    @SerializedName("total")
    val total: Int? = null,
    @SerializedName("page")
    val page: Int? = null,
    @SerializedName("pages")
    val pages: Int? = null
)

data class Series(
    @SerializedName("id")
    val id: Int,
    @SerializedName("title")
    val title: String,
    @SerializedName("description")
    val description: String? = null,
    @SerializedName("poster_url")
    val poster_url: String? = null,
    @SerializedName("backdrop_url")
    val backdrop_url: String? = null,
    @SerializedName("year")
    val year: Int? = null,
    @SerializedName("rating")
    val rating: Float? = null,
    @SerializedName("genre")
    val genre: String? = null,
    @SerializedName("category")
    val category: String? = null,
    @SerializedName("seasons_count")
    val seasons_count: Int? = null
)

data class SeriesResponse(
    @SerializedName("series")
    val series: List<Series>,
    @SerializedName("total")
    val total: Int? = null,
    @SerializedName("page")
    val page: Int? = null,
    @SerializedName("pages")
    val pages: Int? = null
)

data class Episode(
    @SerializedName("id")
    val id: Int,
    @SerializedName("series_id")
    val series_id: Int,
    @SerializedName("season_number")
    val season_number: Int,
    @SerializedName("episode_number")
    val episode_number: Int,
    @SerializedName("title")
    val title: String,
    @SerializedName("description")
    val description: String? = null,
    @SerializedName("stream_url")
    val stream_url: String,
    @SerializedName("thumbnail_url")
    val thumbnail_url: String? = null,
    @SerializedName("duration")
    val duration: Int? = null,
    @SerializedName("air_date")
    val air_date: String? = null
)

data class EpisodesResponse(
    @SerializedName("episodes")
    val episodes: List<Episode>,
    @SerializedName("series_info")
    val series_info: Series? = null
)

// Categories
data class Category(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("type")
    val type: String
)

data class CategoriesResponse(
    @SerializedName("categories")
    val categories: List<Category>
)
