const { pool } = require('../config/database');
const { formatResponse, paginate, buildPaginationMeta } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class SubscriptionController {
    async getAllPlans(req, res) {
        try {
            const { status } = req.query;
            
            let query = 'SELECT * FROM subscription_plans';
            const params = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            query += ' ORDER BY duration_days ASC';

            const [plans] = await pool.query(query, params);

            return res.json(formatResponse(true, plans));
        } catch (error) {
            logger.error('Get plans error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch plans'));
        }
    }

    async getPlanById(req, res) {
        try {
            const { id } = req.params;

            const [plans] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [id]);

            if (plans.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Plan not found'));
            }

            const [channelCount] = await pool.query(
                'SELECT COUNT(*) as count FROM plan_channels WHERE plan_id = ?',
                [id]
            );

            const [userCount] = await pool.query(
                'SELECT COUNT(*) as count FROM users WHERE plan_id = ? AND status = "active"',
                [id]
            );

            return res.json(formatResponse(true, {
                plan: plans[0],
                stats: {
                    channels: channelCount[0].count,
                    active_users: userCount[0].count
                }
            }));
        } catch (error) {
            logger.error('Get plan error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch plan'));
        }
    }

    async createPlan(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { name_en, name_ar, duration_days, price, max_devices = 1, server_id, features } = req.body;

            const [result] = await pool.query(
                'INSERT INTO subscription_plans (name_en, name_ar, duration_days, price, max_devices, server_id, features) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name_en, name_ar, duration_days, price, max_devices, server_id, JSON.stringify(features || {})]
            );

            return res.status(201).json(formatResponse(true, { id: result.insertId }, 'Plan created successfully'));
        } catch (error) {
            logger.error('Create plan error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to create plan'));
        }
    }

    async updatePlan(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { id } = req.params;
            const { name_en, name_ar, duration_days, price, max_devices, server_id, status, features } = req.body;

            const [existing] = await pool.query('SELECT id FROM subscription_plans WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Plan not found'));
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
            if (duration_days !== undefined) {
                updates.push('duration_days = ?');
                params.push(duration_days);
            }
            if (price !== undefined) {
                updates.push('price = ?');
                params.push(price);
            }
            if (max_devices !== undefined) {
                updates.push('max_devices = ?');
                params.push(max_devices);
            }
            if (server_id !== undefined) {
                updates.push('server_id = ?');
                params.push(server_id);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (features !== undefined) {
                updates.push('features = ?');
                params.push(JSON.stringify(features));
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);
            await pool.query(`UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`, params);

            return res.json(formatResponse(true, null, 'Plan updated successfully'));
        } catch (error) {
            logger.error('Update plan error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update plan'));
        }
    }

    async deletePlan(req, res) {
        try {
            const { id } = req.params;

            const [userCount] = await pool.query(
                'SELECT COUNT(*) as count FROM users WHERE plan_id = ?',
                [id]
            );

            if (userCount[0].count > 0) {
                return res.status(400).json(formatResponse(false, null, 'Cannot delete plan with active users'));
            }

            await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);

            return res.json(formatResponse(true, null, 'Plan deleted successfully'));
        } catch (error) {
            logger.error('Delete plan error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete plan'));
        }
    }

    async assignChannelsToPlan(req, res) {
        try {
            const { id } = req.params;
            const { channel_ids } = req.body;

            if (!Array.isArray(channel_ids)) {
                return res.status(400).json(formatResponse(false, null, 'channel_ids must be an array'));
            }

            await pool.query('DELETE FROM plan_channels WHERE plan_id = ?', [id]);

            if (channel_ids.length > 0) {
                const values = channel_ids.map(channelId => [id, channelId]);
                await pool.query(
                    'INSERT INTO plan_channels (plan_id, channel_id) VALUES ?',
                    [values]
                );
            }

            return res.json(formatResponse(true, null, 'Channels assigned successfully'));
        } catch (error) {
            logger.error('Assign channels error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to assign channels'));
        }
    }

    async getExpiredSubscriptions(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const { limit: queryLimit, offset } = paginate(page, limit);

            const [users] = await pool.query(
                `SELECT id, username, email, subscription_end, plan_id 
                FROM users 
                WHERE subscription_end < NOW() AND status = 'active'
                ORDER BY subscription_end DESC
                LIMIT ? OFFSET ?`,
                [queryLimit, offset]
            );

            const [countResult] = await pool.query(
                'SELECT COUNT(*) as total FROM users WHERE subscription_end < NOW() AND status = "active"'
            );

            return res.json(formatResponse(true, {
                users,
                pagination: buildPaginationMeta(countResult[0].total, page, limit)
            }));
        } catch (error) {
            logger.error('Get expired subscriptions error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch expired subscriptions'));
        }
    }

    async deactivateExpiredSubscriptions(req, res) {
        try {
            const [result] = await pool.query(
                'UPDATE users SET status = "inactive" WHERE subscription_end < NOW() AND status = "active"'
            );

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['bulk_deactivation', JSON.stringify({ affected_rows: result.affectedRows, admin_id: req.admin.id })]
            );

            return res.json(formatResponse(true, { deactivated_count: result.affectedRows }, 'Expired subscriptions deactivated'));
        } catch (error) {
            logger.error('Deactivate expired error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to deactivate subscriptions'));
        }
    }

    validatePlan() {
        return [
            body('name_en').trim().notEmpty().withMessage('English name is required'),
            body('name_ar').trim().notEmpty().withMessage('Arabic name is required'),
            body('duration_days').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
            body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
            body('max_devices').optional().isInt({ min: 1 }).withMessage('Max devices must be at least 1'),
            body('server_id').notEmpty().isInt().withMessage('Streaming server is required')
        ];
    }
}

module.exports = new SubscriptionController();
