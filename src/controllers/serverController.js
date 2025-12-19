const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ServerController {
    async getAllServers(req, res) {
        try {
            const { status, type } = req.query;

            let query = 'SELECT * FROM streaming_servers';
            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }

            if (type) {
                conditions.push('type = ?');
                params.push(type);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY priority DESC, id ASC';

            const [servers] = await pool.query(query, params);

            return res.json(formatResponse(true, servers));
        } catch (error) {
            logger.error('Get servers error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch servers'));
        }
    }

    async getServerById(req, res) {
        try {
            const { id } = req.params;

            const [servers] = await pool.query('SELECT * FROM streaming_servers WHERE id = ?', [id]);

            if (servers.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Server not found'));
            }

            return res.json(formatResponse(true, servers[0]));
        } catch (error) {
            logger.error('Get server error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch server'));
        }
    }

    async createServer(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { name, url, type = 'primary', priority = 0, max_connections = 1000, location, notes } = req.body;

            const [result] = await pool.query(
                'INSERT INTO streaming_servers (name, url, type, priority, max_connections, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, url, type, priority, max_connections, location, notes]
            );

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['server_created', JSON.stringify({ server_id: result.insertId, admin_id: req.admin.id })]
            );

            return res.status(201).json(formatResponse(true, { id: result.insertId }, 'Server created successfully'));
        } catch (error) {
            logger.error('Create server error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to create server'));
        }
    }

    async updateServer(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { id } = req.params;
            const { name, url, type, status, priority, max_connections, current_connections, location, notes } = req.body;

            const [existing] = await pool.query('SELECT id FROM streaming_servers WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Server not found'));
            }

            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (url !== undefined) {
                updates.push('url = ?');
                params.push(url);
            }
            if (type !== undefined) {
                updates.push('type = ?');
                params.push(type);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (priority !== undefined) {
                updates.push('priority = ?');
                params.push(priority);
            }
            if (max_connections !== undefined) {
                updates.push('max_connections = ?');
                params.push(max_connections);
            }
            if (current_connections !== undefined) {
                updates.push('current_connections = ?');
                params.push(current_connections);
            }
            if (location !== undefined) {
                updates.push('location = ?');
                params.push(location);
            }
            if (notes !== undefined) {
                updates.push('notes = ?');
                params.push(notes);
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);
            await pool.query(`UPDATE streaming_servers SET ${updates.join(', ')} WHERE id = ?`, params);

            return res.json(formatResponse(true, null, 'Server updated successfully'));
        } catch (error) {
            logger.error('Update server error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update server'));
        }
    }

    async deleteServer(req, res) {
        try {
            const { id } = req.params;

            await pool.query('DELETE FROM streaming_servers WHERE id = ?', [id]);

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['server_deleted', JSON.stringify({ server_id: id, admin_id: req.admin.id })]
            );

            return res.json(formatResponse(true, null, 'Server deleted successfully'));
        } catch (error) {
            logger.error('Delete server error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete server'));
        }
    }

    async getServerStats(req, res) {
        try {
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
                    SUM(CASE WHEN type = 'primary' THEN 1 ELSE 0 END) as primary_servers,
                    SUM(CASE WHEN type = 'backup' THEN 1 ELSE 0 END) as backup_servers,
                    SUM(current_connections) as total_connections,
                    SUM(max_connections) as total_capacity
                FROM streaming_servers
            `);

            return res.json(formatResponse(true, { stats: stats[0] }));
        } catch (error) {
            logger.error('Get server stats error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch server statistics'));
        }
    }

    async testServerConnection(req, res) {
        try {
            const { id } = req.params;

            const [servers] = await pool.query('SELECT url FROM streaming_servers WHERE id = ?', [id]);

            if (servers.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Server not found'));
            }

            return res.json(formatResponse(true, {
                message: 'Server connection test endpoint',
                note: 'Implement actual connection test based on your streaming protocol'
            }));
        } catch (error) {
            logger.error('Test server error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to test server'));
        }
    }

    validateServer() {
        return [
            body('name').trim().notEmpty().withMessage('Server name is required'),
            body('url').trim().isURL().withMessage('Valid URL is required'),
            body('type').optional().isIn(['primary', 'backup']).withMessage('Type must be primary or backup'),
            body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a positive integer'),
            body('max_connections').optional().isInt({ min: 1 }).withMessage('Max connections must be at least 1')
        ];
    }
}

module.exports = new ServerController();
