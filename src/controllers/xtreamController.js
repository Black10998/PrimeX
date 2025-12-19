const { pool } = require('../config/database');
const { formatResponse, isSubscriptionActive, getClientIp } = require('../utils/helpers');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class XtreamController {
    async authenticate(req, res, next) {
        try {
            const { username, password } = req.query;

            if (!username || !password) {
                return res.json({
                    user_info: {
                        auth: 0,
                        status: 'Disabled',
                        message: 'Invalid credentials'
                    }
                });
            }

            const [users] = await pool.query(
                'SELECT * FROM users WHERE username = ? AND status = "active"',
                [username]
            );

            if (users.length === 0) {
                return res.json({
                    user_info: {
                        auth: 0,
                        status: 'Disabled',
                        message: 'User not found'
                    }
                });
            }

            const user = users[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.json({
                    user_info: {
                        auth: 0,
                        status: 'Disabled',
                        message: 'Invalid password'
                    }
                });
            }

            // Check subscription status
            // Note: isSubscriptionActive returns true if subscription_end is null (unlimited)
            if (!isSubscriptionActive(user.subscription_end)) {
                const expTimestamp = user.subscription_end ? Math.floor(new Date(user.subscription_end).getTime() / 1000) : null;
                return res.json({
                    user_info: {
                        auth: 0,
                        status: 'Expired',
                        message: 'Subscription expired',
                        exp_date: expTimestamp
                    }
                });
            }

            // Track device activity for online users
            try {
                const clientIp = getClientIp(req);
                const userAgent = req.headers['user-agent'] || 'Unknown';
                
                // Generate device ID from IP and user agent
                const deviceId = crypto.createHash('md5').update(`${clientIp}-${userAgent}`).digest('hex');
                
                // Insert or update device activity
                await pool.query(`
                    INSERT INTO user_devices (user_id, device_id, device_name, device_type, last_seen, status)
                    VALUES (?, ?, ?, ?, NOW(), 'active')
                    ON DUPLICATE KEY UPDATE last_seen = NOW(), status = 'active'
                `, [user.id, deviceId, userAgent.substring(0, 100), 'xtream']);
                
                logger.debug('Device activity tracked', { user_id: user.id, device_id: deviceId });
            } catch (trackError) {
                // Don't fail authentication if tracking fails
                logger.error('Device tracking error:', { error: trackError.message });
            }

            req.xtreamUser = user;
            next();
        } catch (error) {
            logger.error('Xtream auth error:', { error: error.message });
            return res.json({
                user_info: {
                    auth: 0,
                    status: 'Disabled',
                    message: 'Authentication failed'
                }
            });
        }
    }

    async getUserInfo(req, res) {
        try {
            const user = req.xtreamUser;
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';
            const expTimestamp = user.subscription_end ? Math.floor(new Date(user.subscription_end).getTime() / 1000) : null;
            const startTimestamp = user.subscription_start ? Math.floor(new Date(user.subscription_start).getTime() / 1000) : null;
            const createdTimestamp = Math.floor(new Date(user.created_at).getTime() / 1000);

            const [devices] = await pool.query(
                'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND status = "active"',
                [user.id]
            );

            // Get plan details
            const [plans] = await pool.query(
                `SELECT name_en, name_ar, duration_days FROM subscription_plans WHERE id = ?`,
                [user.plan_id]
            );

            // Calculate remaining days and status
            const now = new Date();
            const subEnd = user.subscription_end ? new Date(user.subscription_end) : null;
            let remainingDays = 0;
            let subscriptionStatus = 'Active';
            
            if (subEnd) {
                remainingDays = Math.max(0, Math.ceil((subEnd - now) / (1000 * 60 * 60 * 24)));
                if (subEnd < now) {
                    subscriptionStatus = 'Expired';
                } else if (remainingDays <= 7) {
                    subscriptionStatus = 'Expiring Soon';
                }
            }

            // Get branding info
            const [branding] = await pool.query(
                `SELECT setting_key, value_${lang} as value FROM system_branding`
            );
            const brandingInfo = {};
            branding.forEach(item => {
                brandingInfo[item.setting_key] = item.value;
            });

            return res.json({
                user_info: {
                    username: user.username,
                    password: '********',
                    message: '',
                    auth: 1,
                    status: subscriptionStatus,
                    exp_date: expTimestamp,
                    subscription_start: startTimestamp,
                    subscription_end: expTimestamp,
                    remaining_days: remainingDays,
                    is_trial: '0',
                    active_cons: devices[0].count.toString(),
                    created_at: createdTimestamp,
                    max_connections: user.max_devices.toString(),
                    allowed_output_formats: ['m3u8', 'ts'],
                    plan_name: plans.length > 0 ? (lang === 'ar' ? plans[0].name_ar : plans[0].name_en) : null,
                    plan_duration_days: plans.length > 0 ? plans[0].duration_days : null
                },
                server_info: {
                    url: `${req.protocol}://${req.get('host')}`,
                    port: req.get('host').split(':')[1] || '80',
                    https_port: '443',
                    server_protocol: req.protocol,
                    rtmp_port: '1935',
                    timezone: 'UTC',
                    timestamp_now: Math.floor(Date.now() / 1000),
                    service_name: brandingInfo.service_name || 'PrimeX IPTV',
                    developer_name: brandingInfo.developer_name || 'PAX',
                    support_email: brandingInfo.support_email || 'info@paxdes.com',
                    support_phone: brandingInfo.support_phone || '',
                    support_message: brandingInfo.support_message || 'Contact us for assistance'
                }
            });
        } catch (error) {
            logger.error('Xtream user info error:', { error: error.message });
            return res.status(500).json({ error: 'Failed to fetch user info' });
        }
    }

    async getLiveCategories(req, res) {
        try {
            const user = req.xtreamUser;
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';

            // Get categories assigned to user (not dependent on servers)
            const [categories] = await pool.query(
                `SELECT c.id as category_id, c.name_${lang} as category_name, c.parent_id 
                FROM categories c
                INNER JOIN user_categories uc ON c.id = uc.category_id
                WHERE uc.user_id = ? AND c.status = 'active' 
                ORDER BY c.sort_order ASC`,
                [user.id]
            );

            logger.info('Xtream: getLiveCategories', { 
                username: user.username, 
                category_count: categories.length 
            });

            return res.json(categories);
        } catch (error) {
            logger.error('Xtream categories error:', { error: error.message });
            return res.status(500).json([]);
        }
    }

    async getLiveStreams(req, res) {
        try {
            const { category_id } = req.query;
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';
            const user = req.xtreamUser;

            // Get channels assigned to user (not dependent on servers or plan)
            let query = `
                SELECT 
                    c.id as stream_id,
                    c.id as num,
                    c.name_${lang} as name,
                    c.logo as stream_icon,
                    c.epg_id as epg_channel_id,
                    c.category_id,
                    '1' as added,
                    'live' as stream_type,
                    '1' as tv_archive,
                    '0' as direct_source,
                    '0' as tv_archive_duration
                FROM channels c
                INNER JOIN user_channels uc ON c.id = uc.channel_id
                WHERE uc.user_id = ? AND c.status = 'active'
            `;

            const params = [user.id];

            if (category_id) {
                query += ' AND c.category_id = ?';
                params.push(category_id);
            }

            query += ' ORDER BY c.sort_order ASC';

            const [streams] = await pool.query(query, params);

            logger.info('Xtream: getLiveStreams', { 
                username: user.username, 
                category_id, 
                stream_count: streams.length 
            });

            return res.json(streams);
        } catch (error) {
            logger.error('Xtream streams error:', { error: error.message });
            return res.status(500).json([]);
        }
    }

    async getStreamUrl(req, res) {
        try {
            const { username, password, stream_id, extension } = req.params;

            const [users] = await pool.query(
                'SELECT id, status, subscription_end FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0 || users[0].status !== 'active' || !isSubscriptionActive(users[0].subscription_end)) {
                return res.status(403).send('Access denied');
            }

            const [channels] = await pool.query(
                'SELECT stream_url, backup_stream_url FROM channels WHERE id = ? AND status = "active"',
                [stream_id]
            );

            if (channels.length === 0 || !channels[0].stream_url) {
                return res.status(404).send('Stream not found');
            }

            await pool.query(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [users[0].id, 'stream_access', JSON.stringify({ stream_id, ip: getClientIp(req) })]
            );

            return res.redirect(channels[0].stream_url);
        } catch (error) {
            logger.error('Xtream stream URL error:', { error: error.message });
            return res.status(500).send('Stream error');
        }
    }

    async getVodCategories(req, res) {
        try {
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';

            const [categories] = await pool.query(
                `SELECT id as category_id, name_${lang} as category_name, parent_id 
                FROM categories 
                WHERE status = 'active' AND slug IN ('movies', 'series', 'latest-content', 'classic-content')
                ORDER BY sort_order ASC`
            );

            return res.json(categories);
        } catch (error) {
            logger.error('Xtream VOD categories error:', { error: error.message });
            return res.status(500).json([]);
        }
    }

    async getVodStreams(req, res) {
        try {
            const { category_id } = req.query;
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';

            let query = `
                SELECT 
                    m.id as stream_id,
                    m.id as num,
                    m.title_${lang} as name,
                    m.poster as stream_icon,
                    m.rating,
                    m.year as releasedate,
                    m.description_${lang} as plot,
                    m.genre,
                    m.duration,
                    m.category_id,
                    'movie' as stream_type,
                    'movie' as container_extension
                FROM movies m
                WHERE m.status = 'active'
            `;

            const params = [];

            if (category_id) {
                query += ' AND m.category_id = ?';
                params.push(category_id);
            }

            query += ' ORDER BY m.sort_order ASC, m.created_at DESC';

            const [streams] = await pool.query(query, params);

            return res.json(streams);
        } catch (error) {
            logger.error('Xtream VOD streams error:', { error: error.message });
            return res.status(500).json([]);
        }
    }

    async getSeriesCategories(req, res) {
        try {
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';

            const [categories] = await pool.query(
                `SELECT id as category_id, name_${lang} as category_name, parent_id 
                FROM categories 
                WHERE status = 'active' AND slug = 'series'
                ORDER BY sort_order ASC`
            );

            return res.json(categories);
        } catch (error) {
            logger.error('Xtream series categories error:', { error: error.message });
            return res.status(500).json([]);
        }
    }

    async getSeries(req, res) {
        try {
            const { category_id } = req.query;
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';

            let query = `
                SELECT 
                    s.id as series_id,
                    s.id as num,
                    s.title_${lang} as name,
                    s.poster as cover,
                    s.rating,
                    s.year as releaseDate,
                    s.description_${lang} as plot,
                    s.genre,
                    s.category_id,
                    (SELECT COUNT(DISTINCT season_number) FROM episodes WHERE series_id = s.id) as episode_run_time
                FROM series s
                WHERE s.status = 'active'
            `;

            const params = [];

            if (category_id) {
                query += ' AND s.category_id = ?';
                params.push(category_id);
            }

            query += ' ORDER BY s.created_at DESC';

            const [series] = await pool.query(query, params);

            return res.json(series);
        } catch (error) {
            logger.error('Xtream series error:', { error: error.message });
            return res.status(500).json([]);
        }
    }

    async getSeriesInfo(req, res) {
        try {
            const { series_id } = req.query;
            const lang = req.query.lang === 'ar' ? 'ar' : 'en';

            const [series] = await pool.query(
                `SELECT * FROM series WHERE id = ? AND status = 'active'`,
                [series_id]
            );

            if (series.length === 0) {
                return res.json({});
            }

            const [episodes] = await pool.query(
                `SELECT 
                    id,
                    season_number,
                    episode_number,
                    title_${lang} as title,
                    stream_url,
                    duration,
                    thumbnail as info
                FROM episodes 
                WHERE series_id = ? AND status = 'active'
                ORDER BY season_number ASC, episode_number ASC`,
                [series_id]
            );

            const episodesBySeason = {};
            episodes.forEach(ep => {
                if (!episodesBySeason[ep.season_number]) {
                    episodesBySeason[ep.season_number] = [];
                }
                episodesBySeason[ep.season_number].push({
                    id: ep.id.toString(),
                    episode_num: ep.episode_number,
                    title: ep.title,
                    container_extension: 'mp4',
                    info: {
                        duration: ep.duration,
                        video: {}
                    }
                });
            });

            return res.json({
                seasons: Object.keys(episodesBySeason).map(season => ({
                    season_number: parseInt(season),
                    name: `Season ${season}`,
                    episode_count: episodesBySeason[season].length
                })),
                info: {
                    name: series[0][`title_${lang}`],
                    cover: series[0].poster,
                    plot: series[0][`description_${lang}`],
                    rating: series[0].rating,
                    year: series[0].year,
                    genre: series[0].genre
                },
                episodes: episodesBySeason
            });
        } catch (error) {
            logger.error('Xtream series info error:', { error: error.message });
            return res.status(500).json({});
        }
    }

    async getEpg(req, res) {
        try {
            const { stream_id } = req.query;

            const [programs] = await pool.query(
                `SELECT 
                    id,
                    title_en as title,
                    description_en as description,
                    UNIX_TIMESTAMP(start_time) as start,
                    UNIX_TIMESTAMP(end_time) as stop
                FROM epg_programs 
                WHERE channel_id = ? 
                AND end_time > NOW()
                ORDER BY start_time ASC
                LIMIT 50`,
                [stream_id]
            );

            const epgData = {};
            epgData[stream_id] = {
                epg_listings: programs
            };

            return res.json(epgData);
        } catch (error) {
            logger.error('Xtream EPG error:', { error: error.message });
            return res.status(500).json({});
        }
    }

    async getM3uPlaylist(req, res) {
        try {
            const { username, password, type } = req.query;

            const [users] = await pool.query(
                'SELECT id, username, password as user_password, status, subscription_end, plan_id FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                logger.warn('M3U: User not found', { username });
                return res.status(403).send('#EXTM3U\n#EXTINF:-1,User Not Found\n');
            }

            const user = users[0];

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.user_password);
            if (!passwordMatch) {
                logger.warn('M3U: Invalid password', { username });
                return res.status(403).send('#EXTM3U\n#EXTINF:-1,Invalid Password\n');
            }

            // Check status and subscription
            if (user.status !== 'active') {
                logger.warn('M3U: User not active', { username, status: user.status });
                return res.status(403).send('#EXTM3U\n#EXTINF:-1,Account Not Active\n');
            }

            if (!isSubscriptionActive(user.subscription_end)) {
                logger.warn('M3U: Subscription expired', { username, subscription_end: user.subscription_end });
                return res.status(403).send('#EXTM3U\n#EXTINF:-1,Subscription Expired\n');
            }
            // Build channel query
            let query = `SELECT c.*, cat.name_en as category_name 
                         FROM channels c 
                         LEFT JOIN categories cat ON c.category_id = cat.id 
                         WHERE c.status = "active"`;
            const params = [];

            // If user has a plan, filter by plan channels
            // If no plan or plan has no channels, show all active channels
            if (user.plan_id) {
                const [planChannels] = await pool.query(
                    'SELECT COUNT(*) as count FROM plan_channels WHERE plan_id = ?',
                    [user.plan_id]
                );
                
                if (planChannels[0].count > 0) {
                    query += ' AND c.id IN (SELECT channel_id FROM plan_channels WHERE plan_id = ?)';
                    params.push(user.plan_id);
                }
            }

            query += ' ORDER BY c.sort_order ASC, c.name_en ASC';

            const [channels] = await pool.query(query, params);

            logger.info('M3U: Generating playlist', { 
                username, 
                plan_id: user.plan_id, 
                channel_count: channels.length 
            });

            let m3u = '#EXTM3U\n';
            
            if (channels.length === 0) {
                m3u += '#EXTINF:-1,No Channels Available\n';
                m3u += 'http://example.com/no-channels\n';
            } else {
                channels.forEach(channel => {
                    const streamUrl = `${req.protocol}://${req.get('host')}/live/${username}/${password}/${channel.id}.m3u8`;
                    const categoryName = channel.category_name || 'Uncategorized';
                    m3u += `#EXTINF:-1 tvg-id="${channel.epg_id || ''}" tvg-logo="${channel.logo || ''}" group-title="${categoryName}",${channel.name_en}\n`;
                    m3u += `${channel.stream_url || streamUrl}\n`;
                });
            }

            res.setHeader('Content-Type', 'application/x-mpegURL');
            res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u"');
            return res.send(m3u);
        } catch (error) {
            logger.error('M3U playlist error:', { error: error.message });
            return res.status(500).send('#EXTM3U\n');
        }
    }
}

module.exports = new XtreamController();
