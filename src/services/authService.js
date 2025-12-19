const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { isSubscriptionActive, getClientIp, getUserAgent } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthService {
    async loginUser(username, password, deviceId, macAddress, req) {
        try {
            const [users] = await pool.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                await this.logFailedAttempt(username, getClientIp(req), 'User not found');
                return { success: false, message: 'Invalid credentials' };
            }

            const user = users[0];

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                await this.logFailedAttempt(username, getClientIp(req), 'Invalid password');
                return { success: false, message: 'Invalid credentials' };
            }

            if (user.status !== 'active') {
                return { success: false, message: 'Account is not active' };
            }

            if (!isSubscriptionActive(user.subscription_end)) {
                return {
                    success: false,
                    message: 'Subscription expired or not active',
                    subscription_required: true
                };
            }

            if (deviceId) {
                const deviceCheck = await this.checkAndRegisterDevice(user.id, deviceId, macAddress, req);
                if (!deviceCheck.success) {
                    return deviceCheck;
                }
            }

            const token = this.generateToken(user.id, false);
            const refreshToken = this.generateRefreshToken(user.id);

            await pool.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            await pool.query(
                'INSERT INTO activity_logs (user_id, action, ip_address, user_agent, device_id) VALUES (?, ?, ?, ?, ?)',
                [user.id, 'login', getClientIp(req), getUserAgent(req), deviceId]
            );

            return {
                success: true,
                data: {
                    token,
                    refreshToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        subscription_end: user.subscription_end,
                        max_devices: user.max_devices
                    }
                }
            };
        } catch (error) {
            logger.error('Login error:', { error: error.message, username });
            return { success: false, message: 'Login failed' };
        }
    }

    async loginWithCode(code, deviceId, macAddress, req) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [codes] = await connection.query(
                'SELECT * FROM subscription_codes WHERE code = ? AND status = "active"',
                [code]
            );

            if (codes.length === 0) {
                await connection.rollback();
                return { success: false, message: 'Invalid or expired code' };
            }

            const codeData = codes[0];

            if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                await connection.query(
                    'UPDATE subscription_codes SET status = "expired" WHERE id = ?',
                    [codeData.id]
                );
                await connection.rollback();
                return { success: false, message: 'Code has expired' };
            }

            if (codeData.used_count >= codeData.max_uses) {
                await connection.query(
                    'UPDATE subscription_codes SET status = "used" WHERE id = ?',
                    [codeData.id]
                );
                await connection.rollback();
                return { success: false, message: 'Code has been fully used' };
            }

            const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const tempPassword = Math.random().toString(36).substr(2, 12);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const subscriptionStart = new Date();
            const subscriptionEnd = new Date();
            subscriptionEnd.setDate(subscriptionEnd.getDate() + codeData.duration_days);

            const [result] = await connection.query(
                'INSERT INTO users (username, password, status, subscription_start, subscription_end, plan_id) VALUES (?, ?, "active", ?, ?, ?)',
                [username, hashedPassword, subscriptionStart, subscriptionEnd, codeData.plan_id]
            );

            const userId = result.insertId;

            await connection.query(
                'UPDATE subscription_codes SET used_count = used_count + 1 WHERE id = ?',
                [codeData.id]
            );

            if (codeData.used_count + 1 >= codeData.max_uses) {
                await connection.query(
                    'UPDATE subscription_codes SET status = "used" WHERE id = ?',
                    [codeData.id]
                );
            }

            await connection.query(
                'INSERT INTO code_usage (code_id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                [codeData.id, userId, getClientIp(req), getUserAgent(req)]
            );

            if (deviceId) {
                await connection.query(
                    'INSERT INTO user_devices (user_id, device_id, mac_address, device_name) VALUES (?, ?, ?, ?)',
                    [userId, deviceId, macAddress, getUserAgent(req)]
                );
            }

            await connection.commit();

            const token = this.generateToken(userId, false);
            const refreshToken = this.generateRefreshToken(userId);

            return {
                success: true,
                data: {
                    token,
                    refreshToken,
                    credentials: {
                        username,
                        password: tempPassword
                    },
                    user: {
                        id: userId,
                        username,
                        subscription_end: subscriptionEnd
                    }
                },
                message: 'Account created successfully. Please save your credentials.'
            };
        } catch (error) {
            await connection.rollback();
            logger.error('Code login error:', { error: error.message, code });
            return { success: false, message: 'Code activation failed' };
        } finally {
            connection.release();
        }
    }

    async loginAdmin(username, password, req) {
        try {
            const [admins] = await pool.query(
                'SELECT * FROM admin_users WHERE username = ? AND status = "active"',
                [username]
            );

            if (admins.length === 0) {
                return { success: false, message: 'Invalid credentials' };
            }

            const admin = admins[0];

            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (!passwordMatch) {
                return { success: false, message: 'Invalid credentials' };
            }

            const token = this.generateToken(admin.id, true);

            await pool.query(
                'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
                [admin.id]
            );

            return {
                success: true,
                data: {
                    token,
                    admin: {
                        id: admin.id,
                        username: admin.username,
                        role: admin.role,
                        email: admin.email
                    }
                }
            };
        } catch (error) {
            logger.error('Admin login error:', { error: error.message, username });
            return { success: false, message: 'Login failed' };
        }
    }

    async checkAndRegisterDevice(userId, deviceId, macAddress, req) {
        try {
            const [user] = await pool.query(
                'SELECT max_devices FROM users WHERE id = ?',
                [userId]
            );

            if (user.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const [existingDevice] = await pool.query(
                'SELECT id FROM user_devices WHERE user_id = ? AND device_id = ? AND status = "active"',
                [userId, deviceId]
            );

            if (existingDevice.length > 0) {
                await pool.query(
                    'UPDATE user_devices SET last_seen = NOW() WHERE id = ?',
                    [existingDevice[0].id]
                );
                return { success: true };
            }

            const [activeDevices] = await pool.query(
                'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND status = "active"',
                [userId]
            );

            if (activeDevices[0].count >= user[0].max_devices) {
                return { success: false, message: 'Maximum device limit reached' };
            }

            await pool.query(
                'INSERT INTO user_devices (user_id, device_id, mac_address, device_name) VALUES (?, ?, ?, ?)',
                [userId, deviceId, macAddress, getUserAgent(req)]
            );

            return { success: true };
        } catch (error) {
            logger.error('Device registration error:', { error: error.message });
            return { success: false, message: 'Device registration failed' };
        }
    }

    generateToken(id, isAdmin = false) {
        const payload = isAdmin ? { adminId: id, isAdmin: true } : { userId: id };
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });
    }

    generateRefreshToken(id) {
        return jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        });
    }

    async logFailedAttempt(username, ip, reason) {
        try {
            await pool.query(
                'INSERT INTO activity_logs (action, ip_address, details) VALUES (?, ?, ?)',
                ['failed_login', ip, JSON.stringify({ username, reason })]
            );
        } catch (error) {
            logger.error('Failed to log failed attempt:', { error: error.message });
        }
    }
}

module.exports = new AuthService();
