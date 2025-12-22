package com.primex.iptv.models

import com.google.gson.annotations.SerializedName

// User Profile
data class UserProfileResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("data")
    val data: UserProfileData? = null
)

data class UserProfileData(
    @SerializedName("id")
    val id: Int,
    @SerializedName("username")
    val username: String,
    @SerializedName("email")
    val email: String? = null,
    @SerializedName("created_at")
    val created_at: String? = null,
    @SerializedName("subscription")
    val subscription: UserSubscription? = null
)

data class UserSubscription(
    @SerializedName("plan_name")
    val plan_name: String? = null,
    @SerializedName("status")
    val status: String? = null,
    @SerializedName("expires_at")
    val expires_at: String? = null,
    @SerializedName("max_devices")
    val max_devices: Int? = null,
    @SerializedName("active_devices")
    val active_devices: Int? = null
)

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
    val max_devices: Int? = null,
    @SerializedName("subscription")
    val subscription: UserSubscription? = null
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

// Channels - Compatible with Xtream API
data class Channel(
    val id: String,
    val name: String,
    val stream_url: String,
    val logo_url: String? = null,
    val category: String? = null,
    val epg_channel_id: String? = null,
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

// Movie - Compatible with Xtream API
data class Movie(
    val id: String,
    val title: String,
    val description: String? = null,
    val stream_url: String,
    val poster_url: String? = null,
    val backdrop_url: String? = null,
    val year: Int? = null,
    val rating: Float? = null,
    val duration: Int? = null,
    val genre: String? = null,
    val category: String? = null,
    val quality: String? = null
) : java.io.Serializable

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

// Series - Compatible with Xtream API
data class Series(
    val id: String,
    val title: String,
    val description: String? = null,
    val poster_url: String? = null,
    val backdrop_url: String? = null,
    val year: Int? = null,
    val rating: Float? = null,
    val genre: String? = null,
    val category: String? = null,
    val seasons_count: Int? = null,
    val quality: String? = null
) : java.io.Serializable

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

// Episode - Compatible with Xtream API
data class Episode(
    val id: Int,
    val series_id: Int,
    val season_number: Int,
    val episode_number: Int,
    val title: String,
    val description: String? = null,
    val stream_url: String,
    val thumbnail_url: String? = null,
    val duration: Int? = null,
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
