/**
 * PrimeX IPTV - Supported Apps Controller
 * 
 * Manages catalog of supported IPTV applications
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class SupportedAppsController {
    /**
     * Get all supported apps (public)
     */
    async getApps(req, res) {
        try {
            const platform = req.query.platform || '';

            let query = `
                SELECT id, name, slug, platform, os, icon_url,
                       supports_device_code, supports_xtream, supports_m3u,
                       download_url, instructions, is_verified
                FROM supported_apps
                WHERE is_active = TRUE
            `;
            const params = [];

            if (platform) {
                query += ' AND platform = ?';
                params.push(platform);
            }

            query += ' ORDER BY display_order ASC, name ASC';

            const [apps] = await pool.query(query, params);

            // Group by platform
            const grouped = {
                tv: [],
                mobile: [],
                desktop: [],
                stb: []
            };

            apps.forEach(app => {
                if (grouped[app.platform]) {
                    grouped[app.platform].push(app);
                }
            });

            return res.json(formatResponse(true, {
                apps,
                grouped
            }));

        } catch (error) {
            logger.error('Get apps error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to load apps'));
        }
    }

    /**
     * Get app details (public)
     */
    async getAppDetails(req, res) {
        try {
            const { slug } = req.params;

            const [apps] = await pool.query(
                `SELECT * FROM supported_apps WHERE slug = ? AND is_active = TRUE`,
                [slug]
            );

            if (apps.length === 0) {
                return res.status(404).json(
                    formatResponse(false, null, 'App not found')
                );
            }

            return res.json(formatResponse(true, apps[0]));

        } catch (error) {
            logger.error('Get app details error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to load app'));
        }
    }

    /**
     * Create app (admin)
     */
    async createApp(req, res) {
        try {
            const {
                name, slug, platform, os, icon_url,
                supports_device_code, supports_xtream, supports_m3u,
                download_url, instructions, is_verified, display_order
            } = req.body;

            // Validate required fields
            if (!name || !slug || !platform) {
                return res.status(400).json(
                    formatResponse(false, null, 'Name, slug, and platform are required')
                );
            }

            // Check if slug exists
            const [existing] = await pool.query(
                'SELECT id FROM supported_apps WHERE slug = ?',
                [slug]
            );

            if (existing.length > 0) {
                return res.status(400).json(
                    formatResponse(false, null, 'Slug already exists')
                );
            }

            // Insert app
            const [result] = await pool.query(
                `INSERT INTO supported_apps 
                (name, slug, platform, os, icon_url, supports_device_code, 
                 supports_xtream, supports_m3u, download_url, instructions, 
                 is_verified, display_order) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, slug, platform, os, icon_url,
                    supports_device_code || false,
                    supports_xtream !== false,
                    supports_m3u !== false,
                    download_url, instructions,
                    is_verified || false,
                    display_order || 0
                ]
            );

            logger.info('App created', { app_id: result.insertId, name });

            return res.status(201).json(formatResponse(true, {
                id: result.insertId,
                name,
                slug
            }, 'App created successfully'));

        } catch (error) {
            logger.error('Create app error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to create app'));
        }
    }

    /**
     * Update app (admin)
     */
    async updateApp(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Check if app exists
            const [existing] = await pool.query(
                'SELECT id FROM supported_apps WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json(
                    formatResponse(false, null, 'App not found')
                );
            }

            // Build update query
            const fields = [];
            const values = [];

            const allowedFields = [
                'name', 'slug', 'platform', 'os', 'icon_url',
                'supports_device_code', 'supports_xtream', 'supports_m3u',
                'download_url', 'instructions', 'is_verified', 'is_active', 'display_order'
            ];

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updates[field]);
                }
            });

            if (fields.length === 0) {
                return res.status(400).json(
                    formatResponse(false, null, 'No fields to update')
                );
            }

            values.push(id);

            await pool.query(
                `UPDATE supported_apps SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            logger.info('App updated', { app_id: id });

            return res.json(formatResponse(true, null, 'App updated successfully'));

        } catch (error) {
            logger.error('Update app error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update app'));
        }
    }

    /**
     * Delete app (admin)
     */
    async deleteApp(req, res) {
        try {
            const { id } = req.params;

            await pool.query('DELETE FROM supported_apps WHERE id = ?', [id]);

            logger.info('App deleted', { app_id: id });

            return res.json(formatResponse(true, null, 'App deleted successfully'));

        } catch (error) {
            logger.error('Delete app error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete app'));
        }
    }
}

module.exports = new SupportedAppsController();
