package com.primex.iptv.models

import com.google.gson.annotations.SerializedName

/**
 * Xtream Codes API Models
 * Base URL: https://prime-x.live
 */

// Authentication Response from /player_api.php
data class XtreamAuthResponse(
    @SerializedName("user_info")
    val userInfo: XtreamUserInfo?,
    
    @SerializedName("server_info")
    val serverInfo: XtreamServerInfo?
)

data class XtreamUserInfo(
    @SerializedName("username")
    val username: String?,
    
    @SerializedName("password")
    val password: String?,
    
    @SerializedName("message")
    val message: String?,
    
    @SerializedName("auth")
    val auth: Int?, // 1 = success, 0 = failed
    
    @SerializedName("status")
    val status: String?, // "Active", "Banned", "Disabled", "Expired"
    
    @SerializedName("exp_date")
    val expDate: String?, // Unix timestamp
    
    @SerializedName("is_trial")
    val isTrial: String?, // "0" or "1"
    
    @SerializedName("active_cons")
    val activeCons: String?, // Active connections
    
    @SerializedName("created_at")
    val createdAt: String?, // Unix timestamp
    
    @SerializedName("max_connections")
    val maxConnections: String?, // Max allowed connections
    
    @SerializedName("allowed_output_formats")
    val allowedOutputFormats: List<String>?
)

data class XtreamServerInfo(
    @SerializedName("url")
    val url: String?,
    
    @SerializedName("port")
    val port: String?,
    
    @SerializedName("https_port")
    val httpsPort: String?,
    
    @SerializedName("server_protocol")
    val serverProtocol: String?,
    
    @SerializedName("rtmp_port")
    val rtmpPort: String?,
    
    @SerializedName("timezone")
    val timezone: String?,
    
    @SerializedName("timestamp_now")
    val timestampNow: Long?,
    
    @SerializedName("time_now")
    val timeNow: String?
)

// Live Streams from /player_api.php?action=get_live_streams
data class XtreamLiveStream(
    @SerializedName("num")
    val num: Int?,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("stream_type")
    val streamType: String?,
    
    @SerializedName("stream_id")
    val streamId: Int?,
    
    @SerializedName("stream_icon")
    val streamIcon: String?,
    
    @SerializedName("epg_channel_id")
    val epgChannelId: String?,
    
    @SerializedName("added")
    val added: String?,
    
    @SerializedName("category_id")
    val categoryId: String?,
    
    @SerializedName("custom_sid")
    val customSid: String?,
    
    @SerializedName("tv_archive")
    val tvArchive: Int?,
    
    @SerializedName("direct_source")
    val directSource: String?,
    
    @SerializedName("tv_archive_duration")
    val tvArchiveDuration: Int?
)

// VOD Streams from /player_api.php?action=get_vod_streams
data class XtreamVodStream(
    @SerializedName("num")
    val num: Int?,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("stream_type")
    val streamType: String?,
    
    @SerializedName("stream_id")
    val streamId: Int?,
    
    @SerializedName("stream_icon")
    val streamIcon: String?,
    
    @SerializedName("rating")
    val rating: String?,
    
    @SerializedName("rating_5based")
    val rating5based: Float?,
    
    @SerializedName("added")
    val added: String?,
    
    @SerializedName("category_id")
    val categoryId: String?,
    
    @SerializedName("container_extension")
    val containerExtension: String?,
    
    @SerializedName("custom_sid")
    val customSid: String?,
    
    @SerializedName("direct_source")
    val directSource: String?
)

// VOD Info from /player_api.php?action=get_vod_info&vod_id=
data class XtreamVodInfo(
    @SerializedName("info")
    val info: XtreamVodDetails?,
    
    @SerializedName("movie_data")
    val movieData: XtreamMovieData?
)

data class XtreamVodDetails(
    @SerializedName("kinopoisk_url")
    val kinopoiskUrl: String?,
    
    @SerializedName("tmdb_id")
    val tmdbId: String?,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("o_name")
    val originalName: String?,
    
    @SerializedName("cover_big")
    val coverBig: String?,
    
    @SerializedName("movie_image")
    val movieImage: String?,
    
    @SerializedName("releasedate")
    val releaseDate: String?,
    
    @SerializedName("episode_run_time")
    val episodeRunTime: String?,
    
    @SerializedName("youtube_trailer")
    val youtubeTrailer: String?,
    
    @SerializedName("director")
    val director: String?,
    
    @SerializedName("actors")
    val actors: String?,
    
    @SerializedName("cast")
    val cast: String?,
    
    @SerializedName("description")
    val description: String?,
    
    @SerializedName("plot")
    val plot: String?,
    
    @SerializedName("age")
    val age: String?,
    
    @SerializedName("rating")
    val rating: String?,
    
    @SerializedName("rating_5based")
    val rating5based: Float?,
    
    @SerializedName("duration_secs")
    val durationSecs: Int?,
    
    @SerializedName("duration")
    val duration: String?,
    
    @SerializedName("video")
    val video: Map<String, Any>?,
    
    @SerializedName("audio")
    val audio: Map<String, Any>?,
    
    @SerializedName("bitrate")
    val bitrate: Int?
)

data class XtreamMovieData(
    @SerializedName("stream_id")
    val streamId: Int?,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("added")
    val added: String?,
    
    @SerializedName("category_id")
    val categoryId: String?,
    
    @SerializedName("container_extension")
    val containerExtension: String?,
    
    @SerializedName("custom_sid")
    val customSid: String?,
    
    @SerializedName("direct_source")
    val directSource: String?
)

// Series from /player_api.php?action=get_series
data class XtreamSeries(
    @SerializedName("num")
    val num: Int?,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("series_id")
    val seriesId: Int?,
    
    @SerializedName("cover")
    val cover: String?,
    
    @SerializedName("plot")
    val plot: String?,
    
    @SerializedName("cast")
    val cast: String?,
    
    @SerializedName("director")
    val director: String?,
    
    @SerializedName("genre")
    val genre: String?,
    
    @SerializedName("releaseDate")
    val releaseDate: String?,
    
    @SerializedName("last_modified")
    val lastModified: String?,
    
    @SerializedName("rating")
    val rating: String?,
    
    @SerializedName("rating_5based")
    val rating5based: Float?,
    
    @SerializedName("backdrop_path")
    val backdropPath: List<String>?,
    
    @SerializedName("youtube_trailer")
    val youtubeTrailer: String?,
    
    @SerializedName("episode_run_time")
    val episodeRunTime: String?,
    
    @SerializedName("category_id")
    val categoryId: String?
)

// Categories
data class XtreamCategory(
    @SerializedName("category_id")
    val categoryId: String?,
    
    @SerializedName("category_name")
    val categoryName: String?,
    
    @SerializedName("parent_id")
    val parentId: Int?
)

// Series Info from /player_api.php?action=get_series_info&series_id=xxx
data class XtreamSeriesInfo(
    @SerializedName("seasons")
    val seasons: List<XtreamSeason>?,
    
    @SerializedName("info")
    val info: XtreamSeriesDetails?,
    
    @SerializedName("episodes")
    val episodes: Map<String, List<XtreamEpisode>>? // Map of season number to episodes
)

data class XtreamSeason(
    @SerializedName("air_date")
    val airDate: String?,
    
    @SerializedName("episode_count")
    val episodeCount: Int?,
    
    @SerializedName("id")
    val id: Int?,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("overview")
    val overview: String?,
    
    @SerializedName("season_number")
    val seasonNumber: Int?,
    
    @SerializedName("cover")
    val cover: String?,
    
    @SerializedName("cover_big")
    val coverBig: String?
)

data class XtreamSeriesDetails(
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("cover")
    val cover: String?,
    
    @SerializedName("plot")
    val plot: String?,
    
    @SerializedName("cast")
    val cast: String?,
    
    @SerializedName("director")
    val director: String?,
    
    @SerializedName("genre")
    val genre: String?,
    
    @SerializedName("releaseDate")
    val releaseDate: String?,
    
    @SerializedName("last_modified")
    val lastModified: String?,
    
    @SerializedName("rating")
    val rating: String?,
    
    @SerializedName("rating_5based")
    val rating5based: Float?,
    
    @SerializedName("backdrop_path")
    val backdropPath: List<String>?,
    
    @SerializedName("youtube_trailer")
    val youtubeTrailer: String?,
    
    @SerializedName("episode_run_time")
    val episodeRunTime: String?,
    
    @SerializedName("category_id")
    val categoryId: String?
)

data class XtreamEpisode(
    @SerializedName("id")
    val id: String?,
    
    @SerializedName("episode_num")
    val episodeNum: Int?,
    
    @SerializedName("title")
    val title: String?,
    
    @SerializedName("container_extension")
    val containerExtension: String?,
    
    @SerializedName("info")
    val info: XtreamEpisodeInfo?,
    
    @SerializedName("custom_sid")
    val customSid: String?,
    
    @SerializedName("added")
    val added: String?,
    
    @SerializedName("season")
    val season: Int?,
    
    @SerializedName("direct_source")
    val directSource: String?
)

data class XtreamEpisodeInfo(
    @SerializedName("movie_image")
    val movieImage: String?,
    
    @SerializedName("plot")
    val plot: String?,
    
    @SerializedName("duration_secs")
    val durationSecs: Int?,
    
    @SerializedName("duration")
    val duration: String?,
    
    @SerializedName("video")
    val video: Map<String, Any>?,
    
    @SerializedName("audio")
    val audio: Map<String, Any>?,
    
    @SerializedName("bitrate")
    val bitrate: Int?,
    
    @SerializedName("rating")
    val rating: String?,
    
    @SerializedName("releasedate")
    val releasedate: String?,
    
    @SerializedName("subtitles")
    val subtitles: List<String>?
)
