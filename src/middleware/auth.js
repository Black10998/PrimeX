const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { formatResponse, getClientIp, isSubscriptionActive } = require('../utils/helpers');
const logger = require('../utils/logger');

async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json(formatResponse(false, null, 'Access token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [users] = await pool.query(
            'SELECT id, username, status, subscription_end, max_devices FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json(formatResponse(false, null, 'User not found'));
        }

        const user = users[0];

        if (user.status !== 'active') {
            return res.status(403).json(formatResponse(false, null, 'Account is not active'));
        }

        req.user = {
            id: user.id,
            username: user.username,
            subscriptionEnd: user.subscription_end,
            maxDevices: user.max_devices
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json(formatResponse(false, null, 'Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json(formatResponse(false, null, 'Token expired'));
        }
        logger.error('Authentication error:', { error: error.message });
        return res.status(500).json(formatResponse(false, null, 'Authentication failed'));
    }
}

async function authenticateAdmin(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json(formatResponse(false, null, 'Access token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.isAdmin) {
            return res.status(403).json(formatResponse(false, null, 'Admin access required'));
        }

        const [admins] = await pool.query(
            'SELECT id, username, role, status FROM admin_users WHERE id = ?',
            [decoded.adminId]
        );

        if (admins.length === 0 || admins[0].status !== 'active') {
            return res.status(401).json(formatResponse(false, null, 'Invalid admin credentials'));
        }

        req.admin = {
            id: admins[0].id,
            username: admins[0].username,
            role: admins[0].role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json(formatResponse(false, null, 'Invalid or expired token'));
        }
        logger.error('Admin authentication error:', { error: error.message });
        return res.status(500).json(formatResponse(false, null, 'Authentication failed'));
    }
}

async function checkSubscription(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, null, 'Authentication required'));
        }

        if (!isSubscriptionActive(req.user.subscriptionEnd)) {
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
            const constants = require('../config/constants');
            const info = constants.SUBSCRIPTION_INFO[lang];
            
            return res.status(403).json({
                success: false,
                message: info.message,
                subscription_info: {
                    title: info.title,
                    contact: info.contact,
                    email: info.email,
                    plans: info.plans,
                    payment_methods: info.payment_methods
                }
            });
        }

        next();
    } catch (error) {
        logger.error('Subscription check error:', { error: error.message });
        return res.status(500).json(formatResponse(false, null, 'Subscription validation failed'));
    }
}

async function checkDeviceLimit(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, null, 'Authentication required'));
        }

        const deviceId = req.headers['x-device-id'] || req.body.device_id;
        const macAddress = req.headers['x-mac-address'] || req.body.mac_address;

        if (!deviceId && !macAddress) {
            return res.status(400).json(formatResponse(false, null, 'Device identification required'));
        }

        const [devices] = await pool.query(
            'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND status = "active"',
            [req.user.id]
        );

        const activeDevices = devices[0].count;

        if (deviceId) {
            const [existingDevice] = await pool.query(
                'SELECT id FROM user_devices WHERE user_id = ? AND device_id = ? AND status = "active"',
                [req.user.id, deviceId]
            );

            if (existingDevice.length === 0 && activeDevices >= req.user.maxDevices) {
                return res.status(403).json(formatResponse(false, null, 'Maximum device limit reached'));
            }

            if (existingDevice.length === 0) {
                await pool.query(
                    'INSERT INTO user_devices (user_id, device_id, mac_address, device_name, last_seen) VALUES (?, ?, ?, ?, NOW())',
                    [req.user.id, deviceId, macAddress, req.headers['user-agent']]
                );
            } else {
                await pool.query(
                    'UPDATE user_devices SET last_seen = NOW() WHERE id = ?',
                    [existingDevice[0].id]
                );
            }
        }

        next();
    } catch (error) {
        logger.error('Device limit check error:', { error: error.message });
        return res.status(500).json(formatResponse(false, null, 'Device validation failed'));
    }
}

async function logActivity(action, details = {}) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || req.admin?.id || null;
            const ip = getClientIp(req);
            const userAgent = req.headers['user-agent'];
            const deviceId = req.headers['x-device-id'];

            await pool.query(
                'INSERT INTO activity_logs (user_id, action, ip_address, user_agent, device_id, details) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, action, ip, userAgent, deviceId, JSON.stringify(details)]
            );
        } catch (error) {
            logger.error('Activity logging error:', { error: error.message });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authenticateAdmin,
    checkSubscription,
    checkDeviceLimit,
    logActivity
};
