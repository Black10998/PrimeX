# M3U Playlist Generation Fix

## Issue Fixed

M3U playlists were empty even when authentication worked.

**Root Causes:**
1. No password verification in get.php endpoint
2. No logging to debug empty playlists
3. Strict plan filtering even when no channels assigned to plan
4. No fallback message when no channels available

## Changes Made

### Enhanced Authentication (`getM3uPlaylist`)

**Before:**
```javascript
// Only checked if user exists and is active
if (users.length === 0 || users[0].status !== 'active') {
    return res.status(403).send('#EXTM3U\n#EXTINF:-1,Access Denied\n');
}
```

**After:**
```javascript
// Verify password with bcrypt
const passwordMatch = await bcrypt.compare(password, user.user_password);
if (!passwordMatch) {
    return res.status(403).send('#EXTM3U\n#EXTINF:-1,Invalid Password\n');
}

// Check status
if (user.status !== 'active') {
    return res.status(403).send('#EXTM3U\n#EXTINF:-1,Account Not Active\n');
}

// Check subscription
if (!isSubscriptionActive(user.subscription_end)) {
    return res.status(403).send('#EXTM3U\n#EXTINF:-1,Subscription Expired\n');
}
```

### Improved Channel Query

**Before:**
```javascript
// Always filtered by plan, even if plan had no channels
if (user.plan_id) {
    query += ' AND id IN (SELECT channel_id FROM plan_channels WHERE plan_id = ?)';
}
```

**After:**
```javascript
// Check if plan has channels first
if (user.plan_id) {
    const [planChannels] = await pool.query(
        'SELECT COUNT(*) as count FROM plan_channels WHERE plan_id = ?',
        [user.plan_id]
    );
    
    // Only filter if plan has channels assigned
    if (planChannels[0].count > 0) {
        query += ' AND c.id IN (SELECT channel_id FROM plan_channels WHERE plan_id = ?)';
    }
}
// Otherwise, show all active channels
```

### Added Logging

```javascript
logger.info('M3U: Generating playlist', { 
    username, 
    plan_id: user.plan_id, 
    channel_count: channels.length 
});
```

### Added Category Names

```javascript
// Join with categories table to get category names
SELECT c.*, cat.name_en as category_name 
FROM channels c 
LEFT JOIN categories cat ON c.category_id = cat.id
```

### Added Empty State

```javascript
if (channels.length === 0) {
    m3u += '#EXTINF:-1,No Channels Available\n';
    m3u += 'http://example.com/no-channels\n';
}
```

## How It Works Now

### Scenario 1: User with Plan (Plan has Channels)
1. User authenticates with username/password
2. System checks if plan has channels assigned
3. Returns only channels assigned to that plan
4. M3U includes those channels

### Scenario 2: User with Plan (Plan has NO Channels)
1. User authenticates with username/password
2. System checks if plan has channels assigned
3. Plan has 0 channels assigned
4. Returns ALL active channels (fallback)
5. M3U includes all channels

### Scenario 3: User without Plan
1. User authenticates with username/password
2. No plan_id set
3. Returns ALL active channels
4. M3U includes all channels

### Scenario 4: No Channels in Database
1. User authenticates successfully
2. Query returns 0 channels
3. M3U includes placeholder: "No Channels Available"
4. IPTV player shows this message

## Testing

### Test M3U Endpoint

```bash
# Test with curl
curl "http://your-server.com/get.php?username=testuser&password=testpass&type=m3u_plus"

# Should return:
#EXTM3U
#EXTINF:-1 tvg-id="..." tvg-logo="..." group-title="Sports",Channel Name
http://stream-url-here
```

### Check Logs

```bash
# Check PM2 logs for M3U generation
pm2 logs primex-iptv | grep "M3U:"

# Should show:
# M3U: Generating playlist { username: 'testuser', plan_id: 1, channel_count: 10 }
```

### Verify in IPTV Player

1. **IPTV Smarters Pro:**
   - Add Xtream Codes API
   - Enter server URL, username, password
   - Should load channels

2. **TiviMate:**
   - Add playlist
   - Select Xtream Codes
   - Enter credentials
   - Should load channels

3. **GSE Smart IPTV:**
   - Add M3U URL
   - Use: `http://server/get.php?username=X&password=Y&type=m3u_plus`
   - Should load channels

## Creating Test Channels

If you have no channels in the database, create some:

```sql
-- Create a category first
INSERT INTO categories (name_en, name_ar, slug, type) 
VALUES ('Sports', 'رياضة', 'sports', 'live');

-- Create channels
INSERT INTO channels (name_en, name_ar, category_id, stream_url, status) 
VALUES 
('Test Channel 1', 'قناة تجريبية 1', 1, 'http://example.com/stream1.m3u8', 'active'),
('Test Channel 2', 'قناة تجريبية 2', 1, 'http://example.com/stream2.m3u8', 'active'),
('Test Channel 3', 'قناة تجريبية 3', 1, 'http://example.com/stream3.m3u8', 'active');
```

## Troubleshooting

### Issue: M3U still empty

**Check:**
1. Are there channels in database?
   ```sql
   SELECT COUNT(*) FROM channels WHERE status = 'active';
   ```

2. Is user's plan assigned channels?
   ```sql
   SELECT COUNT(*) FROM plan_channels WHERE plan_id = USER_PLAN_ID;
   ```

3. Check PM2 logs:
   ```bash
   pm2 logs primex-iptv --lines 50 | grep "M3U:"
   ```

### Issue: "Invalid Password" in M3U

**Solution:**
- Password must match exactly
- Passwords are bcrypt hashed
- Test authentication first with player_api.php

### Issue: "No Channels Available" message

**Solution:**
- This means authentication worked but no channels found
- Add channels to database
- Or assign channels to user's plan

## API Endpoints

### get.php (M3U Playlist)
```
GET /get.php?username=X&password=Y&type=m3u_plus
```

Returns M3U playlist with all available channels.

### player_api.php (Xtream Codes API)
```
GET /player_api.php?username=X&password=Y
```

Returns user info and server info (JSON).

```
GET /player_api.php?username=X&password=Y&action=get_live_streams
```

Returns live channels (JSON).

## Files Changed

- `src/controllers/xtreamController.js` - Enhanced M3U generation

## Deployment

```bash
cd /var/www/PrimeX
git pull origin main
pm2 restart primex-iptv
```

## Support

**Developer:** PAX  
**Email:** info@paxdes.com  
**Website:** https://paxdes.com/
