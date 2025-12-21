/**
 * PrimeX IPTV - 4K Player-Style Device Activation Controller
 * 
 * Implements industry-standard device activation flow:
 * 1. TV app registers device with key + MAC
 * 2. Admin activates via device key
 * 3. TV app polls for activation status
 * 4. Auto-loads content when activated
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const db = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class DeviceActivation4KController {
    
    // ==================== TV APP ENDPOINTS ====================
    
    /**
     * Step 1: Register Device (TV App)
     * TV app calls this on first launch to register device
     */
    async registerDevice(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { mac_address, device_info } = req.body;
            const ip = req.ip || req.connection.remoteAddress;

            // Generate unique 8-digit device key
            const device_key = this.generateDeviceKey();

            logger.info('Device registration request', { mac_address, device_key, ip });

            // Check if device already registered
            const [existing] = await db.query(
                'SELECT device_key, status, expires_at FROM device_activations WHERE mac_address = ?',
                [mac_address]
            );

            if (existing.length > 0) {
                const device = existing[0];
                
                // If active and not expired, return existing activation
                if (device.status === 'active' && new Date(device.expires_at) > new Date()) {
                    logger.info('Device already activated', { mac_address, device_key: device.device_key });
                    return res.json(formatResponse(true, {
                        device_key: device.device_key,
                        status: 'active',
                        message: 'Device already activated'
                    }));
                }
                
                // If pending or expired, return existing key
                logger.info('Device already registered', { mac_address, device_key: device.device_key, status: device.status });
                return res.json(formatResponse(true, {
                    device_key: device.device_key,
                    status: device.status,
                    message: 'Device already registered. Please activate using admin panel.'
                }));
            }

            // Register new device
            await db.query(
                `INSERT INTO device_activations 
                (device_key, mac_address, device_info, status, last_ip, last_check_at) 
                VALUES (?, ?, ?, 'pending', ?, NOW())`,
                [device_key, mac_address, JSON.stringify(device_info || {}), ip]
            );

            // Log history
            const [result] = await db.query(
                'SELECT id FROM device_activations WHERE device_key = ?',
                [device_key]
            );

            if (result.length > 0) {
                await db.query(
                    `INSERT INTO device_activation_history 
                    (device_activation_id, action, details, ip_address) 
                    VALUES (?, 'registered', ?, ?)`,
                    [result[0].id, JSON.stringify({ device_info }), ip]
                );
            }

            logger.info('Device registered successfully', { device_key, mac_address });

            return res.json(formatResponse(true, {
                device_key,
                status: 'pending',
                message: 'Device registered successfully. Please activate using the device key in admin panel.'
            }));

        } catch (error) {
            logger.error('Device registration error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to register device'));
        }
    }

    /**
     * Step 3: Check Activation Status (TV App)
     * TV app polls this endpoint to check if device has been activated
     */
    async checkDeviceStatus(req, res) {
        try {
            const { device_key, mac_address } = req.query;

            if (!device_key || !mac_address) {
                return res.status(400).json(formatResponse(false, null, 'Device key and MAC address required'));
            }

            const ip = req.ip || req.connection.remoteAddress;

            // Get device status
            const [devices] = await db.query(
                `SELECT 
                    d.id, d.device_key, d.mac_address, d.status, d.expires_at,
                    d.max_connections, d.allowed_channels, d.allowed_vod,
                    sp.name_en as plan_name, sp.duration_days
                FROM device_activations d
                LEFT JOIN subscription_plans sp ON d.subscription_plan_id = sp.id
                WHERE d.device_key = ? AND d.mac_address = ?`,
                [device_key, mac_address]
            );

            if (devices.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Device not found'));
            }

            const device = devices[0];

            // Update last check
            await db.query(
                `UPDATE device_activations 
                SET last_check_at = NOW(), last_ip = ?, check_count = check_count + 1 
                WHERE id = ?`,
                [ip, device.id]
            );

            // Check if expired
            if (device.status === 'active' && device.expires_at && new Date(device.expires_at) < new Date()) {
                await db.query(
                    'UPDATE device_activations SET status = ? WHERE id = ?',
                    ['expired', device.id]
                );
                device.status = 'expired';
            }

            // Prepare response based on status
            const response = {
                device_key: device.device_key,
                status: device.status,
                expires_at: device.expires_at,
                plan_name: device.plan_name
            };

            if (device.status === 'active') {
                // Include content access information
                response.content_access = {
                    channels: device.allowed_channels ? JSON.parse(device.allowed_channels) : 'all',
                    vod: device.allowed_vod ? JSON.parse(device.allowed_vod) : 'all',
                    max_connections: device.max_connections
                };
            }

            logger.info('Device status checked', { device_key, status: device.status, ip });

            return res.json(formatResponse(true, response));

        } catch (error) {
            logger.error('Check device status error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to check device status'));
        }
    }

    // ==================== ADMIN PANEL ENDPOINTS ====================
    
    /**
     * Step 2: Activate Device (Admin Panel)
     * Admin uses device key to activate device with subscription plan
     */
    async activateDevice(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { device_key, subscription_plan_id, duration_days } = req.body;
            const admin_id = req.admin?.id || req.user?.id;

            logger.info('Device activation request', { device_key, subscription_plan_id, admin_id });

            // Get device
            const [devices] = await db.query(
                'SELECT * FROM device_activations WHERE device_key = ?',
                [device_key]
            );

            if (devices.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Device not found. Please check the device key.'));
            }

            const device = devices[0];

            // Get subscription plan
            const [plans] = await db.query(
                'SELECT * FROM subscription_plans WHERE id = ?',
                [subscription_plan_id]
            );

            if (plans.length === 0) {
                return res.status(404).json(formatResponse(false, null, 'Subscription plan not found'));
            }

            const plan = plans[0];
            const days = duration_days || plan.duration_days;
            const expires_at = new Date();
            expires_at.setDate(expires_at.getDate() + days);

            // Activate device
            await db.query(
                `UPDATE device_activations 
                SET status = 'active', 
                    subscription_plan_id = ?,
                    activated_by = ?,
                    activated_at = NOW(),
                    expires_at = ?,
                    max_connections = ?
                WHERE id = ?`,
                [subscription_plan_id, admin_id, expires_at, plan.max_devices || 1, device.id]
            );

            // Log history
            await db.query(
                `INSERT INTO device_activation_history 
                (device_activation_id, action, performed_by, details) 
                VALUES (?, 'activated', ?, ?)`,
                [device.id, admin_id, JSON.stringify({ 
                    plan_id: subscription_plan_id,
                    plan_name: plan.name_en,
                    duration_days: days,
                    expires_at
                })]
            );

            logger.info('Device activated successfully', { 
                device_key, 
                plan: plan.name_en, 
                expires_at,
                admin_id 
            });

            return res.json(formatResponse(true, {
                device_key,
                mac_address: device.mac_address,
                status: 'active',
                plan_name: plan.name_en,
                expires_at,
                message: 'Device activated successfully'
            }));

        } catch (error) {
            logger.error('Device activation error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to activate device'));
        }
    }

    /**
     * Get Pending Devices (Admin Panel)
     * List all devices waiting for activation
     */
    async getPendingDevices(req, res) {
        try {
            const [devices] = await db.query(
                `SELECT 
                    id, device_key, mac_address, device_info, status,
                    created_at, last_check_at, check_count, last_ip
                FROM device_activations
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 100`
            );

            return res.json(formatResponse(true, devices));

        } catch (error) {
            logger.error('Get pending devices error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch pending devices'));
        }
    }

    /**
     * Get All Devices (Admin Panel)
     * List all devices with filters
     */
    async getAllDevices(req, res) {
        try {
            const { status, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    d.id, d.device_key, d.mac_address, d.status, d.expires_at,
                    d.created_at, d.activated_at, d.last_check_at, d.check_count,
                    sp.name_en as plan_name, sp.duration_days
                FROM device_activations d
                LEFT JOIN subscription_plans sp ON d.subscription_plan_id = sp.id
            `;

            const params = [];
            if (status) {
                query += ' WHERE d.status = ?';
                params.push(status);
            }

            query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [devices] = await db.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM device_activations';
            if (status) {
                countQuery += ' WHERE status = ?';
            }
            const [countResult] = await db.query(countQuery, status ? [status] : []);

            return res.json(formatResponse(true, {
                devices,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }));

        } catch (error) {
            logger.error('Get all devices error:', error);
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch devices'));
        }
    }

    // ==================== UTILITIES ====================
    
    /**
     * Generate unique 8-digit device key
     */
    generateDeviceKey() {
        // Generate 8-digit number (10000000 to 99999999)
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    /**
     * Validation rules
     */
    validateRegisterDevice() {
        return [
            body('mac_address').notEmpty().matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).withMessage('Valid MAC address required'),
            body('device_info').optional().isObject().withMessage('Device info must be an object')
        ];
    }

    validateActivateDevice() {
        return [
            body('device_key').notEmpty().isLength({ min: 8, max: 8 }).isNumeric().withMessage('Valid 8-digit device key required'),
            body('subscription_plan_id').notEmpty().isInt().withMessage('Subscription plan ID required'),
            body('duration_days').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer')
        ];
    }
}

module.exports = new DeviceActivation4KController();
