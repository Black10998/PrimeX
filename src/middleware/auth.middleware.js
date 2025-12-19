/**
 * PrimeX IPTV System v3.0 - Authentication Middleware
 * 
 * Complete rebuild with:
 * - Clear token validation
 * - Proper error handling
 * - Subscription checking
 * - Device validation
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Authenticate admin token
 */
async function authenticateAdmin(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.isAdmin || !decoded.adminId) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Fetch admin details
        const [admins] = await pool.query(
            'SELECT id, username, role, status FROM admin_users WHERE id = ?',
            [decoded.adminId]
        );

        if (admins.length === 0 || admins[0].status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive admin account'
            });
        }

        // Attach admin to request
        req.admin = {
            id: admins[0].id,
            username: admins[0].username,
            role: admins[0].role
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        logger.error('Admin authentication error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}

/**
 * Authenticate user token
 */
async function authenticateUser(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        // Fetch user details
        const [users] = await pool.query(
            'SELECT id, username, email, status, subscription_end, max_devices FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            subscriptionEnd: user.subscription_end,
            maxDevices: user.max_devices
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        logger.error('User authentication error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}

/**
 * Check if user subscription is active
 */
async function checkSubscription(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const subscriptionEnd = req.user.subscriptionEnd;

        if (!subscriptionEnd || new Date(subscriptionEnd) <= new Date()) {
            const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
            
            const messages = {
                en: {
                    title: 'Subscription Required',
                    message: 'Your subscription has expired or is not active',
                    contact: 'For subscription inquiries, please contact: info@paxdes.com',
                    plans: 'Available plans: Weekly, Monthly, Yearly',
                    payment: 'Payment methods: Credit Card, Bank Transfer, PayPal'
                },
                ar: {
                    title: 'يتطلب اشتراك',
                    message: 'انتهت صلاحية اشتراكك أو غير نشط',
                    contact: 'للاستفسار عن الاشتراك، يرجى الاتصال: info@paxdes.com',
                    plans: 'الخطط المتاحة: أسبوعية، شهرية، سنوية',
                    payment: 'طرق الدفع: بطاقة ائتمان، تحويل بنكي، باي بال'
                }
            };

            const msg = messages[lang];

            return res.status(403).json({
                success: false,
                message: msg.message,
                subscription_info: {
                    title: msg.title,
                    contact: msg.contact,
                    plans: msg.plans,
                    payment_methods: msg.payment
                }
            });
        }

        next();

    } catch (error) {
        logger.error('Subscription check error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Subscription validation failed'
        });
    }
}

/**
 * Check device limit
 */
async function checkDeviceLimit(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const deviceId = req.headers['x-device-id'] || req.body.device_id;

        if (!deviceId) {
            // Device ID not required for all endpoints
            return next();
        }

        // Check if device is registered
        const [devices] = await pool.query(
            'SELECT id FROM user_devices WHERE user_id = ? AND device_id = ? AND status = "active"',
            [req.user.id, deviceId]
        );

        if (devices.length > 0) {
            // Update last seen
            await pool.query(
                'UPDATE user_devices SET last_seen = NOW() WHERE id = ?',
                [devices[0].id]
            );
            return next();
        }

        // Check device limit
        const [activeDevices] = await pool.query(
            'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND status = "active"',
            [req.user.id]
        );

        if (activeDevices[0].count >= req.user.maxDevices) {
            return res.status(403).json({
                success: false,
                message: 'Maximum device limit reached. Please remove a device first.'
            });
        }

        // Register new device
        await pool.query(
            'INSERT INTO user_devices (user_id, device_id, status) VALUES (?, ?, "active")',
            [req.user.id, deviceId]
        );

        next();

    } catch (error) {
        logger.error('Device limit check error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Device validation failed'
        });
    }
}

/**
 * Authenticate either admin or user token
 * Used for endpoints that both admins and users can access
 */
async function authenticateAdminOrUser(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's an admin token
        if (decoded.isAdmin && decoded.adminId) {
            const [admins] = await pool.query(
                'SELECT id, username, role, status FROM admin_users WHERE id = ?',
                [decoded.adminId]
            );

            if (admins.length > 0 && admins[0].status === 'active') {
                req.admin = {
                    id: admins[0].id,
                    username: admins[0].username,
                    role: admins[0].role
                };
                return next();
            }
        }

        // Check if it's a user token
        if (decoded.userId) {
            const [users] = await pool.query(
                'SELECT id, username, email, status FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (users.length > 0) {
                req.user = {
                    id: users[0].id,
                    username: users[0].username,
                    email: users[0].email,
                    status: users[0].status
                };
                return next();
            }
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        logger.error('Authentication error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}

/**
 * Extract token from request
 * @param {Object} req 
 * @returns {string|null}
 */
function extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

module.exports = {
    authenticateAdmin,
    authenticateUser,
    authenticateAdminOrUser,
    checkSubscription,
    checkDeviceLimit
};
