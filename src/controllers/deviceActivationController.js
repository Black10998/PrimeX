/**
 * PrimeX IPTV - Device Activation Controller
 * 
 * Industry-standard device activation (4Kmatic-style)
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class DeviceActivationController {
    /**
     * Generate device key (called by TV/app)
     * Public endpoint - no auth required
     */
    async generateDeviceKey(req, res) {
        try {
            const { device_info } = req.body;

            // Generate unique device key (K-DEVICE-XXXXXX format)
            const deviceKey = this.generateUniqueKey();

            // Generate QR code data
            const qrData = JSON.stringify({
                device_key: deviceKey,
                activation_url: `${process.env.APP_URL || 'https://yoursite.com'}/activate`,
                timestamp: Date.now()
            });

            // Set expiration (15 minutes)
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // Insert device activation record
            await pool.query(
                `INSERT INTO device_activations 
                (device_key, qr_code_data, device_info, expires_at, status) 
                VALUES (?, ?, ?, ?, 'pending')`,
                [deviceKey, qrData, JSON.stringify(device_info || {}), expiresAt]
            );

            logger.info('Device key generated', { device_key: deviceKey });

            return res.json(formatResponse(true, {
                device_key: deviceKey,
                qr_code_data: qrData,
                expires_at: expiresAt,
                activation_url: `${process.env.APP_URL || 'https://yoursite.com'}/activate`
            }));

        } catch (error) {
            logger.error('Generate device key error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to generate device key'));
        }
    }

    /**
     * Activate device with key (admin action)
     * Requires admin authentication
     */
    async activateDevice(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { device_key, plan_id, username, duration_days } = req.body;
            const adminId = req.admin?.id || req.user?.userId;

            // Validate required fields
            if (!device_key || !plan_id) {
                await connection.rollback();
                return res.status(400).json(
                    formatResponse(false, null, 'Device key and plan are required')
                );
            }

            // Get device activation record
            const [devices] = await connection.query(
                'SELECT * FROM device_activations WHERE device_key = ?',
                [device_key]
            );

            if (devices.length === 0) {
                await connection.rollback();
                return res.status(404).json(
                    formatResponse(false, null, 'Device key not found')
                );
            }

            const device = devices[0];

            // Check if already activated
            if (device.status === 'activated') {
                await connection.rollback();
                return res.status(400).json(
                    formatResponse(false, null, 'Device already activated')
                );
            }

            // Check if expired
            if (new Date(device.expires_at) < new Date()) {
                await connection.rollback();
                return res.status(400).json(
                    formatResponse(false, null, 'Device key expired')
                );
            }

            // Get plan details
            const [plans] = await connection.query(
                'SELECT * FROM subscription_plans WHERE id = ?',
                [plan_id]
            );

            if (plans.length === 0) {
                await connection.rollback();
                return res.status(404).json(
                    formatResponse(false, null, 'Plan not found')
                );
            }

            const plan = plans[0];

            // Generate username (auto or custom)
            const generatedUsername = username || this.generateUsername(device_key);

            // Check if username exists
            const [existingUsers] = await connection.query(
                'SELECT id FROM users WHERE username = ?',
                [generatedUsername]
            );

            if (existingUsers.length > 0) {
                await connection.rollback();
                return res.status(400).json(
                    formatResponse(false, null, 'Username already exists')
                );
            }

            // Generate secure password
            const plainPassword = this.generatePassword();
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            // Calculate subscription end date
            const subscriptionDays = duration_days || plan.duration_days;
            const subscriptionEnd = new Date();
            subscriptionEnd.setDate(subscriptionEnd.getDate() + subscriptionDays);

            // Create user account
            const [userResult] = await connection.query(
                `INSERT INTO users 
                (username, password, subscription_end, max_devices, status, created_by) 
                VALUES (?, ?, ?, ?, 'active', 'device_activation')`,
                [generatedUsername, hashedPassword, subscriptionEnd, plan.max_devices || 1]
            );

            const userId = userResult.insertId;

            // Get server URL from settings
            const [settings] = await connection.query(
                'SELECT server_url FROM api_settings LIMIT 1'
            );
            const serverUrl = settings[0]?.server_url || process.env.SERVER_URL || 'http://yourserver.com';

            // Update device activation record
            await connection.query(
                `UPDATE device_activations 
                SET user_id = ?, username = ?, password = ?, plain_password = ?, 
                    plan_id = ?, status = 'activated', server_url = ?, 
                    activated_by = ?, activated_at = NOW() 
                WHERE id = ?`,
                [userId, generatedUsername, hashedPassword, plainPassword, plan_id, serverUrl, adminId, device.id]
            );

            await connection.commit();

            logger.info('Device activated', {
                device_key,
                username: generatedUsername,
                user_id: userId,
                activated_by: adminId
            });

            // Return credentials
            return res.json(formatResponse(true, {
                device_key,
                username: generatedUsername,
                password: plainPassword,
                server_url: serverUrl,
                subscription_end: subscriptionEnd,
                plan_name: plan.name_en || plan.name_ar || 'Subscription Plan',
                xtream_url: `${serverUrl}/player_api.php`,
                m3u_url: `${serverUrl}/get.php?username=${generatedUsername}&password=${plainPassword}&type=m3u_plus&output=ts`
            }, 'Device activated successfully'));

        } catch (error) {
            await connection.rollback();
            logger.error('Activate device error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to activate device'));
        } finally {
            connection.release();
        }
    }

    /**
     * Check activation status (polled by TV/app)
     * Public endpoint - no auth required
     */
    async checkActivationStatus(req, res) {
        try {
            const { device_key } = req.params;

            const [devices] = await pool.query(
                `SELECT device_key, status, username, plain_password as password, 
                        server_url, activated_at 
                FROM device_activations 
                WHERE device_key = ?`,
                [device_key]
            );

            if (devices.length === 0) {
                return res.status(404).json(
                    formatResponse(false, null, 'Device key not found')
                );
            }

            const device = devices[0];

            // Check if expired
            if (device.status === 'pending') {
                const [expCheck] = await pool.query(
                    'SELECT expires_at FROM device_activations WHERE device_key = ?',
                    [device_key]
                );

                if (expCheck.length > 0 && new Date(expCheck[0].expires_at) < new Date()) {
                    await pool.query(
                        'UPDATE device_activations SET status = "expired" WHERE device_key = ?',
                        [device_key]
                    );
                    return res.json(formatResponse(false, { status: 'expired' }, 'Device key expired'));
                }
            }

            if (device.status === 'activated') {
                return res.json(formatResponse(true, {
                    status: 'activated',
                    username: device.username,
                    password: device.password,
                    server_url: device.server_url,
                    xtream_url: `${device.server_url}/player_api.php`,
                    activated_at: device.activated_at
                }));
            }

            return res.json(formatResponse(true, {
                status: device.status
            }));

        } catch (error) {
            logger.error('Check activation status error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to check status'));
        }
    }

    /**
     * Get all device activations (admin)
     */
    async getDeviceActivations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const status = req.query.status || '';

            let query = `
                SELECT da.*, u.username as user_username, sp.name_en as plan_name,
                       au.username as activated_by_username
                FROM device_activations da
                LEFT JOIN users u ON da.user_id = u.id
                LEFT JOIN subscription_plans sp ON da.plan_id = sp.id
                LEFT JOIN admin_users au ON da.activated_by = au.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND da.status = ?';
                params.push(status);
            }

            query += ' ORDER BY da.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [devices] = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM device_activations WHERE 1=1';
            const countParams = [];

            if (status) {
                countQuery += ' AND status = ?';
                countParams.push(status);
            }

            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;

            return res.json(formatResponse(true, {
                devices,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }));

        } catch (error) {
            logger.error('Get device activations error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to load devices'));
        }
    }

    /**
     * Deactivate device (admin)
     */
    async deactivateDevice(req, res) {
        try {
            const { id } = req.params;

            // Get device info
            const [devices] = await pool.query(
                'SELECT user_id FROM device_activations WHERE id = ?',
                [id]
            );

            if (devices.length === 0) {
                return res.status(404).json(
                    formatResponse(false, null, 'Device not found')
                );
            }

            const device = devices[0];

            // Update device status
            await pool.query(
                'UPDATE device_activations SET status = "deactivated" WHERE id = ?',
                [id]
            );

            // Optionally disable user account
            if (device.user_id) {
                await pool.query(
                    'UPDATE users SET status = "inactive" WHERE id = ?',
                    [device.user_id]
                );
            }

            logger.info('Device deactivated', { device_id: id, user_id: device.user_id });

            return res.json(formatResponse(true, null, 'Device deactivated successfully'));

        } catch (error) {
            logger.error('Deactivate device error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to deactivate device'));
        }
    }

    /**
     * Helper: Generate unique device key
     */
    generateUniqueKey() {
        // Format: K-DEVICE-XXXXXX (6 random alphanumeric)
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `K-DEVICE-${random}`;
    }

    /**
     * Helper: Generate username from device key
     */
    generateUsername(deviceKey) {
        // Format: device_xxxxxx
        const suffix = deviceKey.replace(/[^A-Z0-9]/g, '').toLowerCase();
        return `device_${suffix}`;
    }

    /**
     * Helper: Generate secure password
     */
    generatePassword() {
        // Generate 12-character secure password
        return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    }
}

module.exports = new DeviceActivationController();
