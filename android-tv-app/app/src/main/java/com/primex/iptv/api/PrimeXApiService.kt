package com.primex.iptv.api

import com.primex.iptv.models.*
import retrofit2.Response
import retrofit2.http.*

interface PrimeXApiService {

    /**
     * Register a new device with MAC address
     * Returns device_key for activation
     */
    @POST("device/register")
    suspend fun registerDevice(
        @Body request: DeviceRegistrationRequest
    ): Response<DeviceRegistrationResponse>

    /**
     * Check device activation status
     * Returns status and content if activated
     */
    @GET("device/status")
    suspend fun checkDeviceStatus(
        @Query("device_key") deviceKey: String,
        @Query("mac_address") macAddress: String
    ): Response<DeviceStatusResponse>

    /**
     * Get live TV channels
     */
    @GET("channels")
    suspend fun getChannels(
        @Header("Authorization") token: String
    ): Response<ChannelsResponse>

    /**
     * Get VOD movies
     */
    @GET("vod/movies")
    suspend fun getMovies(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<MoviesResponse>

    /**
     * Get VOD series
     */
    @GET("vod/series")
    suspend fun getSeries(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<SeriesResponse>

    /**
     * Get series episodes
     */
    @GET("vod/series/{seriesId}/episodes")
    suspend fun getSeriesEpisodes(
        @Header("Authorization") token: String,
        @Path("seriesId") seriesId: Int
    ): Response<EpisodesResponse>

    /**
     * Get VOD categories
     */
    @GET("vod/categories")
    suspend fun getVodCategories(
        @Header("Authorization") token: String
    ): Response<CategoriesResponse>

    /**
     * Get channel categories
     */
    @GET("channels/categories")
    suspend fun getChannelCategories(
        @Header("Authorization") token: String
    ): Response<CategoriesResponse>
}
