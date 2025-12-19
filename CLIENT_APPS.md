# PrimeX IPTV - Supported Client Applications

## Overview
PrimeX IPTV System is fully compatible with industry-standard IPTV client applications through Xtream Codes API and M3U playlist support.

## Connection Details

### Xtream Codes API
- **Server URL**: `http://your-server.com`
- **Port**: `3000` (or your configured port)
- **Username**: Your subscription username
- **Password**: Your subscription password

### M3U Playlist
- **URL**: `http://your-server.com:3000/get.php?username=USERNAME&password=PASSWORD`

---

## Smart TV Applications

### ✅ IPTV Smarters Pro (TV)
**Status**: Fully Supported  
**Platform**: Android TV, Fire TV, Apple TV  
**Setup**:
1. Install IPTV Smarters Pro from app store
2. Select "Login with Xtream Codes API"
3. Enter server URL, username, and password
4. Supports EPG, VOD, and Series

### ✅ TiviMate
**Status**: Fully Supported  
**Platform**: Android TV, Fire TV  
**Setup**:
1. Install TiviMate from Google Play Store
2. Add playlist via Xtream Codes API
3. Enter server details
4. Premium features: EPG, recording, multi-view

### ✅ XCIPTV
**Status**: Fully Supported  
**Platform**: Android TV, Fire TV, Smart TVs  
**Setup**:
1. Install XCIPTV
2. Add playlist using Xtream Codes
3. Supports categories, EPG, and VOD

### ✅ IBO Player
**Status**: Fully Supported  
**Platform**: Android TV, Fire TV  
**Setup**:
1. Install IBO Player
2. Select Xtream Codes login
3. Enter server credentials
4. Supports live TV, VOD, and series

### ✅ Smart IPTV
**Status**: Fully Supported  
**Platform**: Samsung, LG, Android TV  
**Setup**:
1. Install Smart IPTV app
2. Upload M3U playlist via website
3. Or use Xtream Codes API
4. One-time activation fee required

### ✅ 4K Matic
**Status**: Fully Supported  
**Platform**: Android TV, Fire TV  
**Setup**:
1. Install 4K Matic
2. Add Xtream Codes API connection
3. Optimized for 4K streaming

---

## Mobile Applications

### ✅ IPTV Smarters Pro (Mobile)
**Status**: Fully Supported  
**Platform**: Android, iOS  
**Setup**:
1. Download from Play Store / App Store
2. Login with Xtream Codes API
3. Full feature support including EPG

### ✅ GSE Smart IPTV
**Status**: Fully Supported  
**Platform**: Android, iOS  
**Setup**:
1. Install GSE Smart IPTV
2. Add remote playlist (M3U or Xtream)
3. Advanced features: EPG, parental control

### ✅ Perfect Player
**Status**: Fully Supported  
**Platform**: Android  
**Setup**:
1. Install Perfect Player
2. Add playlist via Xtream Codes or M3U
3. Highly customizable interface

### ✅ VLC Media Player
**Status**: Basic Support  
**Platform**: Android, iOS, Desktop  
**Setup**:
1. Open VLC
2. Network Stream → Enter M3U URL
3. Basic playback only (no EPG)

---

## Features by Client

| Feature | Smarters Pro | TiviMate | XCIPTV | IBO Player | GSE Smart |
|---------|--------------|----------|--------|------------|-----------|
| Live TV | ✅ | ✅ | ✅ | ✅ | ✅ |
| EPG | ✅ | ✅ | ✅ | ✅ | ✅ |
| VOD | ✅ | ✅ | ✅ | ✅ | ✅ |
| Series | ✅ | ✅ | ✅ | ✅ | ✅ |
| Catch-up | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-screen | ✅ | ✅ | ❌ | ❌ | ✅ |
| Recording | ❌ | ✅ | ❌ | ❌ | ❌ |
| Parental Control | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## API Endpoints

### Xtream Codes API
```
GET /player_api.php?username=USER&password=PASS
GET /player_api.php?username=USER&password=PASS&action=get_live_categories
GET /player_api.php?username=USER&password=PASS&action=get_live_streams
GET /player_api.php?username=USER&password=PASS&action=get_vod_categories
GET /player_api.php?username=USER&password=PASS&action=get_vod_streams
GET /player_api.php?username=USER&password=PASS&action=get_series
GET /player_api.php?username=USER&password=PASS&action=get_short_epg&stream_id=ID
```

### M3U Playlist
```
GET /get.php?username=USER&password=PASS
```

### Stream URLs
```
GET /live/USER/PASS/STREAM_ID.m3u8
GET /movie/USER/PASS/STREAM_ID.mp4
GET /series/USER/PASS/EPISODE_ID.mp4
```

---

## Device Binding
- Maximum devices per subscription: Configurable per plan
- Device tracking: Automatic via MAC address and device ID
- Device management: Available in admin panel

---

## Troubleshooting

### Connection Issues
1. Verify server URL and port
2. Check username/password
3. Ensure subscription is active
4. Check firewall settings

### Playback Issues
1. Test stream URL directly
2. Check internet connection speed
3. Try different player
4. Verify stream format compatibility

### EPG Not Loading
1. Ensure EPG data is configured
2. Check EPG ID mapping
3. Refresh EPG in client app
4. Verify server EPG endpoint

---

## Support
For technical support or client app configuration assistance:
- Email: info@paxdes.com
- Admin Panel: http://your-server.com:3000

---

**Last Updated**: December 2024  
**System Version**: 5.0.0  
**Developer**: PAX
