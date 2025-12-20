const db = require('../config/database');
const { formatResponse, paginate } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class VODController {
    // ==================== MOVIES ====================
    
    async getAllMovies(req, res) {
        try {
            const { page = 1, limit = 50, category_id, status, search, sort = 'created_at', order = 'DESC' } = req.query;
            const { limit: queryLimit, offset } = paginate(page, limit);
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            let query = `
                SELECT m.*, 
                    c.name_${lang} as category_name,
                    c.slug as category_slug
                FROM movies m
                LEFT JOIN vod_categories c ON m.category_id = c.id
            `;
            let countQuery = 'SELECT COUNT(*) as total FROM movies m';
            const params = [];
            const conditions = [];

            if (category_id) {
                conditions.push('m.category_id = ?');
                params.push(category_id);
            }

            if (status) {
                conditions.push('m.status = ?');
                params.push(status);
            }

            if (search) {
                conditions.push('(m.name_en LIKE ? OR m.name_ar LIKE ? OR m.description_en LIKE ? OR m.description_ar LIKE ?)');
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            const validSorts = ['created_at', 'rating', 'views', 'release_year', 'name_en'];
            const sortField = validSorts.includes(sort) ? sort : 'created_at';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY m.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;

            const [movies] = await db.query(query, [...params, queryLimit, offset]);
            const [countResult] = await db.query(countQuery, params);

            return res.json(formatResponse(true, {
                movies,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }));
        } catch (error) {
            logger.error('Get movies error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch movies'));
        }
    }

    async getMovieById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            const [movies] = await db.query(`
                SELECT m.*, 
                    c.name_${lang} as category_name,
                    c.slug as category_slug
                FROM movies m
                LEFT JOIN vod_categories c ON m.category_id = c.id
                WHERE m.id = ?
            `, [id]);

            if (movies.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Movie not found'));
            }

            // Increment views
            await db.query('UPDATE movies SET views = views + 1 WHERE id = ?', [id]);

            return res.json(formatResponse(true, movies[0]));
        } catch (error) {
            logger.error('Get movie error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch movie'));
        }
    }

    // ==================== SERIES ====================
    
    async getAllSeries(req, res) {
        try {
            const { page = 1, limit = 50, category_id, status, search, sort = 'created_at', order = 'DESC' } = req.query;
            const { limit: queryLimit, offset } = paginate(page, limit);
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            let query = `
                SELECT s.*, 
                    c.name_${lang} as category_name,
                    c.slug as category_slug
                FROM series s
                LEFT JOIN vod_categories c ON s.category_id = c.id
            `;
            let countQuery = 'SELECT COUNT(*) as total FROM series s';
            const params = [];
            const conditions = [];

            if (category_id) {
                conditions.push('s.category_id = ?');
                params.push(category_id);
            }

            if (status) {
                conditions.push('s.status = ?');
                params.push(status);
            }

            if (search) {
                conditions.push('(s.name_en LIKE ? OR s.name_ar LIKE ? OR s.description_en LIKE ? OR s.description_ar LIKE ?)');
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            const validSorts = ['created_at', 'rating', 'views', 'release_year', 'name_en'];
            const sortField = validSorts.includes(sort) ? sort : 'created_at';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY s.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;

            const [series] = await db.query(query, [...params, queryLimit, offset]);
            const [countResult] = await db.query(countQuery, params);

            return res.json(formatResponse(true, {
                series,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }));
        } catch (error) {
            logger.error('Get series error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch series'));
        }
    }

    async getSeriesById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            const [series] = await db.query(`
                SELECT s.*, 
                    c.name_${lang} as category_name,
                    c.slug as category_slug
                FROM series s
                LEFT JOIN vod_categories c ON s.category_id = c.id
                WHERE s.id = ?
            `, [id]);

            if (series.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Series not found'));
            }

            // Get seasons
            const [seasons] = await db.query(`
                SELECT * FROM seasons 
                WHERE series_id = ? 
                ORDER BY season_number ASC
            `, [id]);

            // Increment views
            await db.query('UPDATE series SET views = views + 1 WHERE id = ?', [id]);

            return res.json(formatResponse(true, {
                ...series[0],
                seasons
            }));
        } catch (error) {
            logger.error('Get series error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch series'));
        }
    }

    async getSeasonEpisodes(req, res) {
        try {
            const { series_id, season_id } = req.params;

            const [episodes] = await db.query(`
                SELECT * FROM episodes 
                WHERE series_id = ? AND season_id = ?
                ORDER BY episode_number ASC
            `, [series_id, season_id]);

            return res.json(formatResponse(true, episodes));
        } catch (error) {
            logger.error('Get episodes error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch episodes'));
        }
    }

    // ==================== M3U IMPORT ====================
    
    async importVODM3U(req, res) {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('VOD import validation failed', { errors: errors.array() });
            return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { m3u_url, content_type, default_category_id } = req.body;

            logger.info('Starting VOD M3U import', { 
                url: m3u_url, 
                type: content_type,
                category: default_category_id 
            });

            // Fetch M3U content
            const fetch = (await import('node-fetch')).default;
            logger.info('Fetching M3U from URL...');
            
            const response = await fetch(m3u_url, {
                headers: {
                    'User-Agent': 'PrimeX-IPTV/1.0'
                }
            });
            
            if (!response.ok) {
                await connection.rollback();
                logger.error('Failed to fetch M3U', { 
                    status: response.status, 
                    statusText: response.statusText,
                    url: m3u_url 
                });
                return res.status(400).json(formatResponse(false, null, `Failed to fetch M3U playlist: ${response.statusText}`));
            }

            logger.info('M3U fetched successfully, reading content...');
            const m3uContent = await response.text();
            logger.info('M3U content received', { size: m3uContent.length });
            
            // Parse M3U
            logger.info('Parsing M3U content...');
            const items = this.parseVODM3U(m3uContent, content_type);
            logger.info('M3U parsed', { items: items.length });
            
            if (items.length === 0) {
                await connection.rollback();
                logger.warn('No VOD content found in playlist');
                return res.status(400).json(formatResponse(false, null, 'No VOD content found in playlist'));
            }

            // Get or create categories
            const categoryMap = new Map();
            const uniqueGroups = [...new Set(items.map(item => item.group).filter(Boolean))];
            
            for (const groupName of uniqueGroups) {
                const slug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
                const [existing] = await connection.query(
                    'SELECT id FROM vod_categories WHERE slug = ?',
                    [slug]
                );
                
                if (existing.length > 0) {
                    categoryMap.set(groupName, existing[0].id);
                } else {
                    const [result] = await connection.query(
                        'INSERT INTO vod_categories (name_en, name_ar, slug, status) VALUES (?, ?, ?, ?)',
                        [groupName, groupName, slug, 'active']
                    );
                    categoryMap.set(groupName, result.insertId);
                }
            }

            let imported = 0;
            let skipped = 0;
            let errors = 0;

            if (content_type === 'movie') {
                // Import movies
                for (const item of items) {
                    try {
                        let categoryId = default_category_id;
                        if (item.group && categoryMap.has(item.group)) {
                            categoryId = categoryMap.get(item.group);
                        }

                        // Check if movie already exists
                        const [existing] = await connection.query(
                            'SELECT id FROM movies WHERE stream_url = ?',
                            [item.url]
                        );

                        if (existing.length > 0) {
                            skipped++;
                            continue;
                        }

                        // Insert movie
                        await connection.query(
                            `INSERT INTO movies (name_en, name_ar, category_id, poster, stream_url, 
                             release_year, duration, quality, status) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                item.name, item.name, categoryId, item.logo || null, item.url,
                                item.year || null, item.duration || null, item.quality || null, 'active'
                            ]
                        );

                        imported++;
                    } catch (error) {
                        logger.error('Error importing movie', { movie: item.name, error: error.message });
                        errors++;
                    }
                }
            } else {
                // Import series (basic - episodes would need separate import)
                for (const item of items) {
                    try {
                        let categoryId = default_category_id;
                        if (item.group && categoryMap.has(item.group)) {
                            categoryId = categoryMap.get(item.group);
                        }

                        // Check if series already exists by name
                        const [existing] = await connection.query(
                            'SELECT id FROM series WHERE name_en = ?',
                            [item.name]
                        );

                        if (existing.length > 0) {
                            skipped++;
                            continue;
                        }

                        // Insert series
                        await connection.query(
                            `INSERT INTO series (name_en, name_ar, category_id, poster, 
                             release_year, status) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [item.name, item.name, categoryId, item.logo || null, item.year || null, 'active']
                        );

                        imported++;
                    } catch (error) {
                        logger.error('Error importing series', { series: item.name, error: error.message });
                        errors++;
                    }
                }
            }

            await connection.commit();

            logger.info('VOD M3U import completed', { imported, skipped, errors, total: items.length });

            return res.json(formatResponse(true, {
                imported,
                skipped,
                errors,
                total: items.length,
                content_type,
                categories_created: uniqueGroups.length
            }, 'VOD M3U playlist imported successfully'));

        } catch (error) {
            await connection.rollback();
            logger.error('VOD M3U import error:', { error: error.message, stack: error.stack });
            return res.status(500).json(formatResponse(false, null, 'Failed to import VOD M3U playlist'));
        } finally {
            connection.release();
        }
    }

    parseVODM3U(content, contentType) {
        const items = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        logger.info('Parsing M3U', { totalLines: lines.length, contentType });
        
        let currentItem = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#EXTINF:')) {
                currentItem = { type: contentType };
                
                // Extract tvg-logo
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) {
                    currentItem.logo = logoMatch[1];
                }
                
                // Extract group-title
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentItem.group = groupMatch[1];
                }
                
                // Extract duration (in seconds)
                const durationMatch = line.match(/#EXTINF:(-?\d+)/);
                if (durationMatch && parseInt(durationMatch[1]) > 0) {
                    currentItem.duration = Math.floor(parseInt(durationMatch[1]) / 60); // Convert to minutes
                }
                
                // Extract year
                const yearMatch = line.match(/\((\d{4})\)/);
                if (yearMatch) {
                    currentItem.year = parseInt(yearMatch[1]);
                }
                
                // Extract quality
                const qualityMatch = line.match(/\[(HD|FHD|4K|UHD|SD)\]/i);
                if (qualityMatch) {
                    currentItem.quality = qualityMatch[1].toUpperCase();
                }
                
                // Extract name (after last comma)
                const nameMatch = line.match(/,(.+)$/);
                if (nameMatch) {
                    let name = nameMatch[1].trim();
                    // Clean up name (remove quality tags, years, etc)
                    name = name.replace(/\[(HD|FHD|4K|UHD|SD)\]/gi, '').trim();
                    name = name.replace(/\(\d{4}\)/, '').trim();
                    currentItem.name = name;
                }
                
            } else if (line.startsWith('http://') || line.startsWith('https://')) {
                if (currentItem.name) {
                    currentItem.url = line;
                    items.push(currentItem);
                } else {
                    logger.warn('Found URL without name', { url: line.substring(0, 50) });
                }
                currentItem = {};
            }
        }
        
        logger.info('M3U parsing complete', { itemsFound: items.length });
        return items;
    }

    // ==================== VOD CATEGORIES ====================
    
    async getVODCategories(req, res) {
        try {
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
            const { status = 'active' } = req.query;

            const [categories] = await db.query(`
                SELECT id, name_${lang} as name, slug, icon, sort_order, status
                FROM vod_categories
                WHERE status = ?
                ORDER BY sort_order ASC, name_${lang} ASC
            `, [status]);

            return res.json(formatResponse(true, categories));
        } catch (error) {
            logger.error('Get VOD categories error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch VOD categories'));
        }
    }

    // ==================== VALIDATION ====================
    
    validateVODImport() {
        return [
            body('m3u_url').notEmpty().isURL().withMessage('Valid M3U URL is required'),
            body('content_type').isIn(['movie', 'series']).withMessage('Content type must be movie or series'),
            body('default_category_id').optional().isInt().withMessage('Category ID must be an integer')
        ];
    }
}

module.exports = new VODController();
