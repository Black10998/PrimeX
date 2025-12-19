const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { formatResponse, paginate, buildPaginationMeta, addDaysToDate } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class UserController {
    async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 20, status, search } = req.query;
            const { limit: queryLimit, offset } = paginate(page, limit);

            let query = `SELECT u.id, u.username, u.email, u.status, 
                         u.subscription_start, u.subscription_end, 
                         u.subscription_end as expiry_date,
                         u.plan_id, u.max_devices as max_connections, 
                         u.created_at, u.last_login,
                         DATEDIFF(u.subscription_end, NOW()) as remaining_days,
                         COUNT(DISTINCT ud.id) as device_count,
                         sp.name_en as plan_name_en,
                         sp.name_ar as plan_name_ar
                         FROM users u
                         LEFT JOIN user_devices ud ON u.id = ud.user_id AND ud.status = 'active'
                         LEFT JOIN subscription_plans sp ON u.plan_id = sp.id`;
            let countQuery = 'SELECT COUNT(*) as total FROM users u';
            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('u.status = ?');
                params.push(status);
            }

            if (search) {
                conditions.push('(u.username LIKE ? OR u.email LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';

            const [users] = await pool.query(query, [...params, queryLimit, offset]);
            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0].total;

            // Add subscription status to each user
            const usersWithStatus = users.map(user => {
                const now = new Date();
                const subEnd = user.subscription_end ? new Date(user.subscription_end) : null;
                let subscriptionStatus = 'active';
                
                if (subEnd) {
                    if (subEnd < now) {
                        subscriptionStatus = 'expired';
                        user.status = 'expired';
                    } else if (user.remaining_days <= 7) {
                        subscriptionStatus = 'expiring_soon';
                    }
                }

                return {
                    ...user,
                    subscription_status: subscriptionStatus
                };
            });

            return res.json(formatResponse(true, {
                users: usersWithStatus,
                pagination: buildPaginationMeta(total, page, limit)
            }));
        } catch (error) {
            logger.error('Get users error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch users'));
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;

            const [users] = await pool.query(
                `SELECT u.*, 
                    sp.name_en as plan_name_en, 
                    sp.name_ar as plan_name_ar,
                    sp.duration_days as plan_duration_days,
                    DATEDIFF(u.subscription_end, NOW()) as remaining_days
                FROM users u 
                LEFT JOIN subscription_plans sp ON u.plan_id = sp.id 
                WHERE u.id = ?`,
                [id]
            );

            if (users.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'User not found'));
            }

            const [devices] = await pool.query(
                'SELECT id, device_id, mac_address, device_name, device_type, last_seen, status FROM user_devices WHERE user_id = ?',
                [id]
            );

            const [categoryCount] = await pool.query(
                'SELECT COUNT(*) as count FROM user_categories WHERE user_id = ?',
                [id]
            );

            const [channelCount] = await pool.query(
                'SELECT COUNT(*) as count FROM user_channels WHERE user_id = ?',
                [id]
            );

            const user = users[0];
            delete user.password;

            // Calculate subscription status
            const now = new Date();
            const subEnd = user.subscription_end ? new Date(user.subscription_end) : null;
            let subscriptionStatus = 'active';
            
            if (subEnd) {
                if (subEnd < now) {
                    subscriptionStatus = 'expired';
                } else if (user.remaining_days <= 7) {
                    subscriptionStatus = 'expiring_soon';
                }
            }

            return res.json(formatResponse(true, { 
                user: {
                    ...user,
                    subscription_status: subscriptionStatus,
                    categories_count: categoryCount[0].count,
                    channels_count: channelCount[0].count
                },
                devices 
            }));
        } catch (error) {
            logger.error('Get user error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch user'));
        }
    }

    async createUser(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            logger.info('Create user request received', { body: req.body });

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                await connection.rollback();
                logger.error('User creation validation failed', { errors: errors.array() });
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { username, password, email, plan_id, duration_days, max_devices = 1 } = req.body;

            const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json(formatResponse(false, null, 'Username already exists'));
            }

            if (!plan_id) {
                await connection.rollback();
                return res.status(400).json(formatResponse(false, null, 'Plan ID is required'));
            }

            // Get plan details
            const [plans] = await connection.query(
                'SELECT duration_days, max_devices as plan_max_devices FROM subscription_plans WHERE id = ? AND status = "active"',
                [plan_id]
            );

            if (plans.length === 0) {
                await connection.rollback();
                return res.status(400).json(formatResponse(false, null, 'Invalid or inactive plan'));
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const subscriptionStart = new Date();
            
            // Get duration from plan if not provided
            const finalDurationDays = duration_days || plans[0].duration_days;
            const finalMaxDevices = max_devices || plans[0].plan_max_devices || 1;
            
            const subscriptionEnd = finalDurationDays ? addDaysToDate(subscriptionStart, finalDurationDays) : null;

            // Create user
            const [result] = await connection.query(
                'INSERT INTO users (username, password, email, status, subscription_start, subscription_end, plan_id, max_devices) VALUES (?, ?, ?, "active", ?, ?, ?, ?)',
                [username, hashedPassword, email, subscriptionStart, subscriptionEnd, plan_id, finalMaxDevices]
            );

            const userId = result.insertId;

            // Auto-assign categories from plan (gracefully handle missing tables)
            let planCategories = [];
            try {
                // First, try to get categories from plan mapping
                const [categories] = await connection.query(`
                    SELECT DISTINCT c.id 
                    FROM categories c
                    INNER JOIN plan_categories pc ON c.id = pc.category_id
                    WHERE pc.plan_id = ? AND c.status = 'active'
                `, [plan_id]);
                planCategories = categories;

                // If no plan mappings exist, assign ALL active categories
                if (planCategories.length === 0) {
                    const [allCategories] = await connection.query(`
                        SELECT id FROM categories WHERE status = 'active'
                    `);
                    planCategories = allCategories;
                    logger.info('No plan-category mappings found, assigning all categories', { 
                        user_id: userId, 
                        category_count: allCategories.length 
                    });
                }

                if (planCategories.length > 0) {
                    const categoryValues = planCategories.map(cat => [userId, cat.id]);
                    await connection.query(
                        'INSERT INTO user_categories (user_id, category_id) VALUES ?',
                        [categoryValues]
                    );
                }
            } catch (error) {
                logger.warn('Category assignment skipped', { error: error.message });
            }

            // Auto-assign channels from plan (gracefully handle missing tables)
            let planChannels = [];
            try {
                // First, try to get channels from plan mapping
                const [channels] = await connection.query(`
                    SELECT DISTINCT ch.id 
                    FROM channels ch
                    INNER JOIN plan_channels pc ON ch.id = pc.channel_id
                    WHERE pc.plan_id = ? AND ch.status = 'active'
                `, [plan_id]);
                planChannels = channels;

                // If no plan mappings exist, assign ALL active channels
                if (planChannels.length === 0) {
                    const [allChannels] = await connection.query(`
                        SELECT id FROM channels WHERE status = 'active'
                    `);
                    planChannels = allChannels;
                    logger.info('No plan-channel mappings found, assigning all channels', { 
                        user_id: userId, 
                        channel_count: allChannels.length 
                    });
                }

                if (planChannels.length > 0) {
                    const channelValues = planChannels.map(ch => [userId, ch.id]);
                    await connection.query(
                        'INSERT INTO user_channels (user_id, channel_id) VALUES ?',
                        [channelValues]
                    );
                }
            } catch (error) {
                logger.warn('Channel assignment skipped', { error: error.message });
            }

            // Create account activated notification (gracefully handle missing table)
            try {
                await connection.query(`
                    INSERT INTO notifications (user_id, type, title_en, title_ar, message_en, message_ar)
                    VALUES (?, 'account_activated', ?, ?, ?, ?)
                `, [
                    userId,
                    'Account Activated',
                    'تم تفعيل الحساب',
                    'Your account has been successfully activated. Enjoy your subscription!',
                    'تم تفعيل حسابك بنجاح. استمتع باشتراكك!'
                ]);
            } catch (error) {
                logger.warn('Notification creation skipped', { error: error.message });
            }

            // Log activity
            await connection.query(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [userId, 'user_created', JSON.stringify({ 
                    created_by: req.admin.id,
                    categories_assigned: planCategories.length,
                    channels_assigned: planChannels.length
                })]
            );

            await connection.commit();

            return res.status(201).json(formatResponse(true, { 
                id: userId,
                categories_assigned: planCategories.length,
                channels_assigned: planChannels.length
            }, 'User created successfully with content assigned'));
        } catch (error) {
            await connection.rollback();
            logger.error('Create user error:', { error: error.message, stack: error.stack });
            return res.status(500).json(formatResponse(false, null, 'Failed to create user'));
        } finally {
            connection.release();
        }
    }

    async updateUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { id } = req.params;
            const { email, status, plan_id, subscription_end, max_devices, password } = req.body;

            const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'User not found'));
            }

            const updates = [];
            const params = [];

            if (email !== undefined) {
                updates.push('email = ?');
                params.push(email);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (plan_id !== undefined) {
                updates.push('plan_id = ?');
                params.push(plan_id);
            }
            if (subscription_end !== undefined) {
                updates.push('subscription_end = ?');
                params.push(subscription_end);
            }
            if (max_devices !== undefined) {
                updates.push('max_devices = ?');
                params.push(max_devices);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                params.push(hashedPassword);
            }

            if (updates.length === 0) {
                return res.status(400).json(formatResponse(false, null, 'No fields to update'));
            }

            params.push(id);
            await pool.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            await pool.query(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [id, 'user_updated', JSON.stringify({ updated_by: req.admin.id, fields: updates })]
            );

            return res.json(formatResponse(true, null, 'User updated successfully'));
        } catch (error) {
            logger.error('Update user error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update user'));
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'User not found'));
            }

            await pool.query('DELETE FROM users WHERE id = ?', [id]);

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['user_deleted', JSON.stringify({ user_id: id, deleted_by: req.admin.id })]
            );

            return res.json(formatResponse(true, null, 'User deleted successfully'));
        } catch (error) {
            logger.error('Delete user error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete user'));
        }
    }

    async extendSubscription(req, res) {
        try {
            const { id } = req.params;
            const { days } = req.body;

            if (!days || days <= 0) {
                return res.status(400).json(formatResponse(false, null, 'Invalid duration'));
            }

            const [users] = await pool.query('SELECT subscription_end FROM users WHERE id = ?', [id]);
            if (users.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'User not found'));
            }

            const currentEnd = users[0].subscription_end ? new Date(users[0].subscription_end) : new Date();
            const newEnd = addDaysToDate(currentEnd > new Date() ? currentEnd : new Date(), days);

            await pool.query('UPDATE users SET subscription_end = ? WHERE id = ?', [newEnd, id]);

            await pool.query(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [id, 'subscription_extended', JSON.stringify({ days, extended_by: req.admin.id })]
            );

            return res.json(formatResponse(true, { new_subscription_end: newEnd }, 'Subscription extended successfully'));
        } catch (error) {
            logger.error('Extend subscription error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to extend subscription'));
        }
    }

    async getUserDevices(req, res) {
        try {
            const { id } = req.params;

            const [devices] = await pool.query(
                'SELECT * FROM user_devices WHERE user_id = ? ORDER BY last_seen DESC',
                [id]
            );

            return res.json(formatResponse(true, { devices }));
        } catch (error) {
            logger.error('Get devices error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch devices'));
        }
    }

    async removeDevice(req, res) {
        try {
            const { id, deviceId } = req.params;

            // Delete device
            await pool.query('DELETE FROM user_devices WHERE user_id = ? AND id = ?', [id, deviceId]);

            // Delete associated sessions
            await pool.query('DELETE FROM user_sessions WHERE user_id = ? AND device_id = ?', [id, deviceId]);

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['device_removed', JSON.stringify({ user_id: id, device_id: deviceId, admin_id: req.admin.id })]
            );

            return res.json(formatResponse(true, null, 'Device removed and kicked successfully'));
        } catch (error) {
            logger.error('Remove device error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to remove device'));
        }
    }

    async kickDevice(req, res) {
        try {
            const { id, deviceId } = req.params;

            // Block device instead of deleting (can be unblocked later)
            await pool.query(
                'UPDATE user_devices SET status = ? WHERE user_id = ? AND id = ?',
                ['blocked', id, deviceId]
            );

            // Delete sessions for this device
            await pool.query('DELETE FROM user_sessions WHERE user_id = ? AND device_id = ?', [id, deviceId]);

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['device_kicked', JSON.stringify({ user_id: id, device_id: deviceId, admin_id: req.admin.id })]
            );

            return res.json(formatResponse(true, null, 'Device kicked successfully'));
        } catch (error) {
            logger.error('Kick device error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to kick device'));
        }
    }

    async forceLogoutUser(req, res) {
        try {
            const { id } = req.params;

            // Delete all sessions for this user
            await pool.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);

            // Optionally remove all devices
            await pool.query('DELETE FROM user_devices WHERE user_id = ?', [id]);

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['force_logout', JSON.stringify({ user_id: id, admin_id: req.admin.id })]
            );

            return res.json(formatResponse(true, null, 'User logged out from all devices'));
        } catch (error) {
            logger.error('Force logout error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to force logout'));
        }
    }

    async getOnlineUsers(req, res) {
        try {
            // Get users with active sessions (last activity within 5 minutes)
            const [users] = await pool.query(`
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.status,
                    sp.name_en as plan_name,
                    ss.name as server_name,
                    COUNT(DISTINCT ud.id) as active_devices,
                    MAX(ud.last_seen) as last_activity
                FROM users u
                LEFT JOIN subscription_plans sp ON u.plan_id = sp.id
                LEFT JOIN streaming_servers ss ON u.server_id = ss.id
                LEFT JOIN user_devices ud ON u.id = ud.user_id 
                    AND ud.last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                    AND ud.status = 'active'
                WHERE u.status = 'active'
                GROUP BY u.id
                HAVING active_devices > 0
                ORDER BY last_activity DESC
            `);

            return res.json(formatResponse(true, { users, count: users.length }));
        } catch (error) {
            logger.error('Get online users error:', { error: error.message, stack: error.stack });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch online users'));
        }
    }

    async changeUserPassword(req, res) {
        try {
            const { id } = req.params;
            const { new_password, logout_all_sessions } = req.body;

            if (!new_password || new_password.length < 6) {
                return res.status(400).json(formatResponse(false, null, 'Password must be at least 6 characters'));
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);

            await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

            if (logout_all_sessions) {
                await pool.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);
                await pool.query('DELETE FROM user_devices WHERE user_id = ?', [id]);
            }

            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['password_changed_by_admin', JSON.stringify({ 
                    user_id: id, 
                    admin_id: req.admin.id,
                    logout_all: logout_all_sessions 
                })]
            );

            return res.json(formatResponse(true, null, 'Password changed successfully'));
        } catch (error) {
            logger.error('Change password error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to change password'));
        }
    }

    validateCreate() {
        return [
            body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
            body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
            body('email').optional().isEmail().withMessage('Invalid email format'),
            body('plan_id').notEmpty().withMessage('Plan ID is required').isInt().withMessage('Invalid plan ID'),
            body('max_devices').optional().isInt({ min: 1 }).withMessage('Max devices must be at least 1')
        ];
    }

    validateUpdate() {
        return [
            body('email').optional().isEmail().withMessage('Invalid email format'),
            body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
            body('max_devices').optional().isInt({ min: 1 }).withMessage('Max devices must be at least 1')
        ];
    }
}

module.exports = new UserController();
