package com.primex.iptv.api

import com.primex.iptv.models.*
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Xtream Codes API Service
 * Base URL: https://prime-x.live
 */
interface XtreamApiService {

    /**
     * Authenticate user and get account info
     * GET /player_api.php?username=xxx&password=xxx
     */
    @GET("player_api.php")
    suspend fun authenticate(
        @Query("username") username: String,
        @Query("password") password: String
    ): Response<XtreamAuthResponse>

    /**
     * Get live streams
     * GET /player_api.php?username=xxx&password=xxx&action=get_live_streams
     */
    @GET("player_api.php")
    suspend fun getLiveStreams(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_streams",
        @Query("category_id") categoryId: String? = null
    ): Response<List<XtreamLiveStream>>

    /**
     * Get VOD streams (movies)
     * GET /player_api.php?username=xxx&password=xxx&action=get_vod_streams
     */
    @GET("player_api.php")
    suspend fun getVodStreams(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_streams",
        @Query("category_id") categoryId: String? = null
    ): Response<List<XtreamVodStream>>

    /**
     * Get VOD info (movie details)
     * GET /player_api.php?username=xxx&password=xxx&action=get_vod_info&vod_id=xxx
     */
    @GET("player_api.php")
    suspend fun getVodInfo(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_info",
        @Query("vod_id") vodId: Int
    ): Response<XtreamVodInfo>

    /**
     * Get series
     * GET /player_api.php?username=xxx&password=xxx&action=get_series
     */
    @GET("player_api.php")
    suspend fun getSeries(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series",
        @Query("category_id") categoryId: String? = null
    ): Response<List<XtreamSeries>>

    /**
     * Get series info (episodes)
     * GET /player_api.php?username=xxx&password=xxx&action=get_series_info&series_id=xxx
     */
    @GET("player_api.php")
    suspend fun getSeriesInfo(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series_info",
        @Query("series_id") seriesId: String
    ): Response<XtreamSeriesInfo>

    /**
     * Get live categories
     * GET /player_api.php?username=xxx&password=xxx&action=get_live_categories
     */
    @GET("player_api.php")
    suspend fun getLiveCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_categories"
    ): Response<List<XtreamCategory>>

    /**
     * Get VOD categories
     * GET /player_api.php?username=xxx&password=xxx&action=get_vod_categories
     */
    @GET("player_api.php")
    suspend fun getVodCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_categories"
    ): Response<List<XtreamCategory>>

    /**
     * Get series categories
     * GET /player_api.php?username=xxx&password=xxx&action=get_series_categories
     */
    @GET("player_api.php")
    suspend fun getSeriesCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series_categories"
    ): Response<List<XtreamCategory>>
}
