# VOD & Series Support - Deployment Guide

## Overview

This update adds complete VOD (Video on Demand) and Series support to PrimeX IPTV, including:
- Movies management
- Series with seasons and episodes
- M3U playlist import for VOD content
- Admin panel interface for VOD management
- User watch history and favorites

## What's New

### Database Tables
- `vod_categories` - VOD content categories
- `movies` - Movie library
- `series` - TV series library
- `seasons` - Series seasons
- `episodes` - Series episodes
- `user_vod_history` - Watch progress tracking
- `user_favorites` - User favorites

### Backend Features
- VOD controller with full CRUD operations
- M3U import for movies and series
- Category auto-detection from playlists
- Metadata extraction (year, quality, duration)
- RESTful API endpoints

### Frontend Features
- VOD & Series management interface
- Grid view with posters
- M3U import modal
- Movies and Series tabs
- Search and filtering

## Deployment Steps

### Step 1: Pull Latest Changes

```bash
cd /path/to/PrimeX
git pull origin main
```

### Step 2: Database Migration (Automatic)

The VOD tables will be created automatically on server restart. No manual migration needed.

**What happens:**
- Server detects missing `vod_categories` table
- Runs migration script automatically
- Creates all 7 VOD tables
- Inserts 10 default categories

**Verify migration:**
```bash
# After restart, check PM2 logs
pm2 logs primex-iptv --lines 50

# Should see:
# 🎬 Initializing VOD/Series tables...
# ✅ VOD/Series tables created successfully
```

### Step 3: Restart PM2

```bash
pm2 restart primex-iptv
```

### Step 4: Verify Installation

1. **Check PM2 Logs:**
   ```bash
   pm2 logs primex-iptv --lines 100
   ```
   
   Look for:
   - ✅ VOD/Series tables created successfully
   - ✅ Server started successfully
   - No errors related to VOD

2. **Test Admin Panel:**
   - Login to admin panel
   - Look for "VOD & Series" in sidebar (film icon)
   - Click to open VOD management
   - Should see empty state with import button

3. **Test API Endpoints:**
   ```bash
   # Get VOD categories
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/v1/admin/vod/categories
   
   # Should return 10 default categories
   ```

## Using VOD Features

### Importing Movies

1. Go to **VOD & Series** in admin panel
2. Click **Import M3U** button
3. Select **Movies** as content type
4. Enter M3U playlist URL
5. (Optional) Select default category
6. Click **Import**

**M3U Format Example:**
```m3u
#EXTINF:-1 tvg-logo="https://image.url/poster.jpg" group-title="Action",Movie Name (2023) [HD]
https://stream.url/movie.mp4
```

**What gets extracted:**
- Movie name (cleaned)
- Poster URL (tvg-logo)
- Category (group-title)
- Year (from parentheses)
- Quality (from brackets: HD, FHD, 4K)
- Duration (from EXTINF duration)

### Importing Series

1. Go to **VOD & Series** in admin panel
2. Click **Import M3U** button
3. Select **Series** as content type
4. Enter M3U playlist URL
5. Click **Import**

**Note:** Series import creates series entries. Episodes need separate import or manual addition.

### API Endpoints

All endpoints require admin authentication.

**Movies:**
- `GET /api/v1/admin/vod/movies` - List movies
- `GET /api/v1/admin/vod/movies/:id` - Get movie details

**Series:**
- `GET /api/v1/admin/vod/series` - List series
- `GET /api/v1/admin/vod/series/:id` - Get series with seasons
- `GET /api/v1/admin/vod/series/:series_id/seasons/:season_id/episodes` - Get episodes

**Categories:**
- `GET /api/v1/admin/vod/categories` - List VOD categories

**Import:**
- `POST /api/v1/admin/vod/import-m3u` - Import M3U playlist
  ```json
  {
    "m3u_url": "https://example.com/playlist.m3u",
    "content_type": "movie",
    "default_category_id": 1
  }
  ```

## Troubleshooting

### Tables Not Created

**Symptom:** VOD menu shows errors or empty

**Solution:**
```bash
# Check if tables exist
mysql -u primex_user -p primex -e "SHOW TABLES LIKE 'vod_%'"

# If missing, manually run migration
mysql -u primex_user -p primex < src/migrations/012_vod_series_support.sql

# Restart PM2
pm2 restart primex-iptv
```

### Import Fails with 400 Error

**Symptom:** "Content type must be movie or series"

**Solution:**
- Ensure `content_type` is exactly "movie" or "series" (lowercase)
- Check M3U URL is accessible
- Verify M3U format is correct

### No Movies/Series Showing

**Symptom:** Import succeeds but grid is empty

**Solution:**
```bash
# Check database
mysql -u primex_user -p primex -e "SELECT COUNT(*) FROM movies"
mysql -u primex_user -p primex -e "SELECT COUNT(*) FROM series"

# Check browser console for errors
# Verify API endpoints return data
```

### Permission Denied

**Symptom:** "Access Denied" when accessing VOD module

**Solution:**
- VOD uses same permissions as Channels module
- Ensure your admin role has `channels` permission
- Super Admin has access by default

## Database Schema

### Movies Table
```sql
- id, name_en, name_ar
- category_id (FK to vod_categories)
- description_en, description_ar
- poster, backdrop, stream_url
- duration, release_year, rating
- imdb_id, tmdb_id
- director, cast, genres (JSON)
- quality, audio_languages, subtitle_languages
- views, status
```

### Series Table
```sql
- id, name_en, name_ar
- category_id (FK to vod_categories)
- description_en, description_ar
- poster, backdrop
- release_year, rating
- total_seasons, total_episodes
- views, status
```

### Episodes Table
```sql
- id, series_id, season_id
- episode_number
- name_en, name_ar
- description_en, description_ar
- thumbnail, stream_url
- duration, release_date
- quality, views, status
```

## Performance Considerations

- **Indexing:** All tables have proper indexes for fast queries
- **Pagination:** API returns 50 items per page by default
- **Caching:** Consider adding Redis for frequently accessed content
- **CDN:** Use CDN for posters and video streams

## Security

- All VOD endpoints require admin authentication
- RBAC permissions inherited from Channels module
- SQL injection protection via parameterized queries
- Input validation on all imports

## Future Enhancements

Potential additions (not included in this release):
- Episode-level M3U import
- TMDB/IMDB metadata integration
- Subtitle file management
- Multi-quality stream support
- User ratings and reviews
- Recommendation engine

## Support

For issues or questions:
- Check PM2 logs: `pm2 logs primex-iptv`
- Review this guide
- Contact: info@paxdes.com

---

**Version:** 1.0  
**Date:** 2025-12-20  
**Developer:** PAX
