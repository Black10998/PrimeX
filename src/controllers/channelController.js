const { pool } = require('../config/database');
const { formatResponse, paginate, buildPaginationMeta, normalizeStreamUrl } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ChannelController {
    async getAllChannels(req, res) {
        try {
            const { page = 1, limit = 50, category_id, status, search } = req.query;
            const { limit: queryLimit, offset } = paginate(page, limit);
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            let query = `
                SELECT c.*, 
                    cat.name_${lang} as category_name,
                    cat.slug as category_slug
                FROM channels c
                LEFT JOIN categories cat ON c.category_id = cat.id
            `;
            let countQuery = 'SELECT COUNT(*) as total FROM channels c';
            const params = [];
            const conditions = [];

            if (category_id) {
                conditions.push('c.category_id = ?');
                params.push(category_id);
            }

            if (status) {
                conditions.push('c.status = ?');
                params.push(status);
            }

            if (search) {
                conditions.push('(c.name_en LIKE ? OR c.name_ar LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY c.sort_order ASC, c.id ASC LIMIT ? OFFSET ?';

            const [channels] = await pool.query(query, [...params, queryLimit, offset]);
            const [countResult] = await pool.query(countQuery, params);

            return res.json(formatResponse(true, {
                channels,
                pagination: buildPaginationMeta(countResult[0].total, page, limit)
            }));
        } catch (error) {
            logger.error('Get channels error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch channels'));
        }
    }

    async getChannelById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            const [channels] = await pool.query(
                `SELECT c.*, cat.name_${lang} as category_name 
                FROM channels c 
                LEFT JOIN categories cat ON c.category_id = cat.id 
                WHERE c.id = ?`,
                [id]
            );

            if (channels.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Channel not found'));
            }

            return res.json(formatResponse(true, { channel: channels[0] }));
        } catch (error) {
            logger.error('Get channel error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch channel'));
        }
    }

    async createChannel(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { name_en, name_ar, category_id, logo, stream_url, backup_stream_url, epg_id, sort_order = 0 } = req.body;

            const [result] = await pool.query(
                'INSERT INTO channels (name_en, name_ar, category_id, logo, stream_url, backup_stream_url, epg_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name_en, name_ar, category_id, logo, stream_url, backup_stream_url, epg_id, sort_order]
            );

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['channel_created', JSON.stringify({ channel_id: result.insertId, admin_id: req.admin.id })]
            );

            return res.status(201).json(formatResponse(true, { id: result.insertId }, 'Channel created successfully'));
        } catch (error) {
            logger.error('Create channel error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to create channel'));
        }
    }

    async updateChannel(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { id } = req.params;
            const { name_en, name_ar, category_id, logo, stream_url, backup_stream_url, epg_id, sort_order, status } = req.body;

            const [existing] = await pool.query('SELECT id FROM channels WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Channel not found'));
            }

            const updates = [];
            const params = [];

            if (name_en !== undefined) {
                updates.push('name_en = ?');
                params.push(name_en);
            }
            if (name_ar !== undefined) {
                updates.push('name_ar = ?');
                params.push(name_ar);
            }
            if (category_id !== undefined) {
                updates.push('category_id = ?');
                params.push(category_id);
            }
            if (logo !== undefined) {
                updates.push('logo = ?');
                params.push(logo);
            }
            if (stream_url !== undefined) {
                updates.push('stream_url = ?');
                params.push(stream_url);
            }
            if (backup_stream_url !== undefined) {
                updates.push('backup_stream_url = ?');
                params.push(backup_stream_url);
            }
            if (epg_id !== undefined) {
                updates.push('epg_id = ?');
                params.push(epg_id);
            }
            if (sort_order !== undefined) {
                updates.push('sort_order = ?');
                params.push(sort_order);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);
            await pool.query(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`, params);

            return res.json(formatResponse(true, null, 'Channel updated successfully'));
        } catch (error) {
            logger.error('Update channel error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update channel'));
        }
    }

    async deleteChannel(req, res) {
        try {
            const { id } = req.params;

            await pool.query('DELETE FROM channels WHERE id = ?', [id]);

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['channel_deleted', JSON.stringify({ channel_id: id, admin_id: req.admin.id })]
            );

            return res.json(formatResponse(true, null, 'Channel deleted successfully'));
        } catch (error) {
            logger.error('Delete channel error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete channel'));
        }
    }

    async reorderChannels(req, res) {
        try {
            const { orders } = req.body;

            if (!Array.isArray(orders)) {
                return res.status(400).json(formatResponse(false, null, 'Invalid orders format'));
            }

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                for (const order of orders) {
                    await connection.query(
                        'UPDATE channels SET sort_order = ? WHERE id = ?',
                        [order.sort_order, order.id]
                    );
                }

                await connection.commit();
                return res.json(formatResponse(true, null, 'Channels reordered successfully'));
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            logger.error('Reorder channels error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to reorder channels'));
        }
    }

    async getChannelsByCategory(req, res) {
        try {
            const { slug } = req.params;
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

            const [category] = await pool.query(
                'SELECT id, name_en, name_ar FROM categories WHERE slug = ? AND status = "active"',
                [slug]
            );

            if (category.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Category not found'));
            }

            const [channels] = await pool.query(
                `SELECT id, name_${lang} as name, logo, epg_id, sort_order 
                FROM channels 
                WHERE category_id = ? AND status = 'active' 
                ORDER BY sort_order ASC`,
                [category[0].id]
            );

            return res.json(formatResponse(true, {
                category: {
                    id: category[0].id,
                    name: category[0][`name_${lang}`]
                },
                channels
            }));
        } catch (error) {
            logger.error('Get channels by category error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch channels'));
        }
    }

    async importM3UPlaylist(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { m3u_url, default_category_id } = req.body;

            if (!m3u_url) {
                await connection.rollback();
                return res.status(400).json(formatResponse(false, null, 'M3U URL is required'));
            }

            logger.info('Starting M3U import', { url: m3u_url });

            // Fetch M3U content
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(m3u_url);
            
            if (!response.ok) {
                await connection.rollback();
                return res.status(400).json(formatResponse(false, null, 'Failed to fetch M3U playlist'));
            }

            const m3uContent = await response.text();
            
            // Parse M3U
            const channels = this.parseM3U(m3uContent);
            
            if (channels.length === 0) {
                await connection.rollback();
                return res.status(400).json(formatResponse(false, null, 'No channels found in playlist'));
            }

            // Get or create categories
            const categoryMap = new Map();
            const uniqueGroups = [...new Set(channels.map(ch => ch.group).filter(Boolean))];
            
            for (const groupName of uniqueGroups) {
                const slug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
                // Check if category exists
                const [existing] = await connection.query(
                    'SELECT id FROM categories WHERE slug = ?',
                    [slug]
                );
                
                if (existing.length > 0) {
                    categoryMap.set(groupName, existing[0].id);
                } else {
                    // Create new category
                    const [result] = await connection.query(
                        'INSERT INTO categories (name_en, name_ar, slug, status) VALUES (?, ?, ?, ?)',
                        [groupName, groupName, slug, 'active']
                    );
                    categoryMap.set(groupName, result.insertId);
                }
            }

            // Import channels
            let imported = 0;
            let skipped = 0;
            let errors = 0;

            for (const channel of channels) {
                try {
                    // Determine category
                    let categoryId = default_category_id;
                    if (channel.group && categoryMap.has(channel.group)) {
                        categoryId = categoryMap.get(channel.group);
                    }

                    if (!categoryId) {
                        // Create default category if needed
                        const [defaultCat] = await connection.query(
                            'SELECT id FROM categories WHERE slug = ?',
                            ['imported']
                        );
                        
                        if (defaultCat.length > 0) {
                            categoryId = defaultCat[0].id;
                        } else {
                            const [result] = await connection.query(
                                'INSERT INTO categories (name_en, name_ar, slug, status) VALUES (?, ?, ?, ?)',
                                ['Imported', 'مستورد', 'imported', 'active']
                            );
                            categoryId = result.insertId;
                        }
                    }

                    // Check if channel already exists
                    const [existingChannel] = await connection.query(
                        'SELECT id FROM channels WHERE stream_url = ?',
                        [channel.url]
                    );

                    if (existingChannel.length > 0) {
                        skipped++;
                        continue;
                    }

                    // Insert channel
                    await connection.query(
                        'INSERT INTO channels (name_en, name_ar, category_id, logo, stream_url, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [channel.name, channel.name, categoryId, channel.logo || null, channel.url, 'active']
                    );

                    imported++;
                } catch (error) {
                    logger.error('Error importing channel', { channel: channel.name, error: error.message });
                    errors++;
                }
            }

            await connection.commit();

            logger.info('M3U import completed', { imported, skipped, errors, total: channels.length });

            return res.json(formatResponse(true, {
                imported,
                skipped,
                errors,
                total: channels.length,
                categories_created: uniqueGroups.length
            }, 'M3U playlist imported successfully'));

        } catch (error) {
            await connection.rollback();
            logger.error('M3U import error:', { error: error.message, stack: error.stack });
            return res.status(500).json(formatResponse(false, null, 'Failed to import M3U playlist'));
        } finally {
            connection.release();
        }
    }

    parseM3U(content) {
        const channels = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        let currentChannel = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#EXTINF:')) {
                // Parse EXTINF line
                currentChannel = {};
                
                // Extract tvg-logo
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) {
                    currentChannel.logo = logoMatch[1];
                }
                
                // Extract group-title
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }
                
                // Extract channel name (after last comma)
                const nameMatch = line.match(/,(.+)$/);
                if (nameMatch) {
                    currentChannel.name = nameMatch[1].trim();
                }
                
            } else if (line.startsWith('http://') || line.startsWith('https://')) {
                // This is the stream URL
                if (currentChannel.name) {
                    currentChannel.url = line;
                    channels.push({ ...currentChannel });
                    currentChannel = {};
                }
            }
        }
        
        return channels;
    }

    validateChannel() {
        return [
            body('name_en').trim().notEmpty().withMessage('English name is required'),
            body('name_ar').trim().notEmpty().withMessage('Arabic name is required'),
            body('category_id').isInt().withMessage('Valid category ID is required')
        ];
    }

    validateM3UImport() {
        return [
            body('m3u_url').trim().notEmpty().isURL().withMessage('Valid M3U URL is required'),
            body('default_category_id').optional().isInt().withMessage('Valid category ID required')
        ];
    }
}

module.exports = new ChannelController();
