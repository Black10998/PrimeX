const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class NotificationController {
    async getUserNotifications(req, res) {
        try {
            const userId = req.user?.id || req.xtreamUser?.id || req.admin?.id;
            const { unread_only } = req.query;

            if (!userId) {
                return res.status(401).json(formatResponse(false, null, 'Unauthorized'));
            }

            // Determine if this is an admin or user request
            const isAdmin = !!req.admin;
            const userField = isAdmin ? 'admin_id' : 'user_id';

            let query = `
                SELECT 
                    id,
                    type,
                    title,
                    message,
                    is_read,
                    read_at,
                    created_at
                FROM notifications
                WHERE ${userField} = ?
            `;

            const params = [userId];

            if (unread_only === 'true') {
                query += ' AND is_read = FALSE';
            }

            query += ' ORDER BY created_at DESC LIMIT 50';

            const [notifications] = await pool.query(query, params);

            return res.json(formatResponse(true, { notifications }));
        } catch (error) {
            logger.error('Get notifications error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch notifications'));
        }
    }

    async markAsRead(req, res) {
        try {
            const userId = req.user?.id || req.xtreamUser?.id || req.admin?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json(formatResponse(false, null, 'Unauthorized'));
            }

            const isAdmin = !!req.admin;
            const userField = isAdmin ? 'admin_id' : 'user_id';

            await pool.query(
                `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND ${userField} = ?`,
                [id, userId]
            );

            return res.json(formatResponse(true, null, 'Notification marked as read'));
        } catch (error) {
            logger.error('Mark notification read error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update notification'));
        }
    }

    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.id || req.xtreamUser?.id || req.admin?.id;

            if (!userId) {
                return res.status(401).json(formatResponse(false, null, 'Unauthorized'));
            }

            const isAdmin = !!req.admin;
            const userField = isAdmin ? 'admin_id' : 'user_id';

            await pool.query(
                `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE ${userField} = ? AND is_read = FALSE`,
                [userId]
            );

            return res.json(formatResponse(true, null, 'All notifications marked as read'));
        } catch (error) {
            logger.error('Mark all notifications read error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update notifications'));
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.id || req.xtreamUser?.id || req.admin?.id;

            if (!userId) {
                return res.status(401).json(formatResponse(false, null, 'Unauthorized'));
            }

            const isAdmin = !!req.admin;
            const userField = isAdmin ? 'admin_id' : 'user_id';

            const [result] = await pool.query(
                `SELECT COUNT(*) as count FROM notifications 
                WHERE ${userField} = ? AND is_read = FALSE`,
                [userId]
            );

            return res.json(formatResponse(true, { unread_count: result[0].count }));
        } catch (error) {
            logger.error('Get unread count error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch count'));
        }
    }

    // Admin: Create notification for user
    async createNotification(req, res) {
        try {
            const { user_id, type, title, message } = req.body;

            if (!title || !message) {
                return res.status(400).json(formatResponse(false, null, 'Title and message are required'));
            }

            // If user_id is provided, create for specific user, otherwise for all users
            if (user_id) {
                const [result] = await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message)
                    VALUES (?, ?, ?, ?)`,
                    [user_id, type || 'info', title, message]
                );
                return res.status(201).json(formatResponse(true, { id: result.insertId }, 'Notification created'));
            } else {
                // Create notification for all users
                const [users] = await pool.query('SELECT id FROM users WHERE status = "active"');
                
                for (const user of users) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message)
                        VALUES (?, ?, ?, ?)`,
                        [user.id, type || 'info', title, message]
                    );
                }
                
                return res.status(201).json(formatResponse(true, { count: users.length }, 'Notifications created for all users'));
            }
        } catch (error) {
            logger.error('Create notification error:', { error: error.message, stack: error.stack });
            return res.status(500).json(formatResponse(false, null, 'Failed to create notification'));
        }
    }

    // System: Check and create expiring soon notifications
    async checkExpiringSubscriptions() {
        try {
            // Find users expiring in 3 days who haven't been notified
            const [users] = await pool.query(`
                SELECT u.id, u.username, u.subscription_end
                FROM users u
                WHERE u.status = 'active'
                AND u.subscription_end IS NOT NULL
                AND DATEDIFF(u.subscription_end, NOW()) = 3
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n
                    WHERE n.user_id = u.id 
                    AND n.type = 'subscription_expiring'
                    AND DATE(n.created_at) = CURDATE()
                )
            `);

            for (const user of users) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, message)
                    VALUES (?, 'warning', ?, ?)
                `, [
                    user.id,
                    'Subscription Expiring Soon',
                    'Your subscription will expire in 3 days. Please renew to continue enjoying our service.'
                ]);
            }

            logger.info('Expiring subscription notifications created', { count: users.length });
        } catch (error) {
            logger.error('Check expiring subscriptions error:', { error: error.message });
        }
    }

    // System: Check and create expired notifications
    async checkExpiredSubscriptions() {
        try {
            // Find users who just expired today
            const [users] = await pool.query(`
                SELECT u.id, u.username
                FROM users u
                WHERE u.status = 'active'
                AND u.subscription_end IS NOT NULL
                AND DATE(u.subscription_end) = CURDATE()
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n
                    WHERE n.user_id = u.id 
                    AND n.type = 'subscription_expired'
                    AND DATE(n.created_at) = CURDATE()
                )
            `);

            for (const user of users) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title_en, title_ar, message_en, message_ar)
                    VALUES (?, 'subscription_expired', ?, ?, ?, ?)
                `, [
                    user.id,
                    'Subscription Expired',
                    'انتهى الاشتراك',
                    'Your subscription has expired. Please renew to regain access.',
                    'انتهى اشتراكك. يرجى التجديد لاستعادة الوصول.'
                ]);

                // Update user status
                await pool.query('UPDATE users SET status = "expired" WHERE id = ?', [user.id]);
            }

            logger.info('Expired subscription notifications created', { count: users.length });
        } catch (error) {
            logger.error('Check expired subscriptions error:', { error: error.message });
        }
    }
}

module.exports = new NotificationController();
