/**
 * PrimeX IPTV System v3.0 - Authentication Service
 * 
 * Complete rebuild with:
 * - Proper bcrypt handling
 * - Unified response format
 * - Comprehensive logging
 * - Clear error messages
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class AuthService {
    /**
     * Admin Login
     * @param {string} username 
     * @param {string} password 
     * @param {string} ipAddress 
     * @returns {Promise<Object>}
     */
    async loginAdmin(username, password, ipAddress, userAgent, totpToken = null, recoveryCode = null) {
        try {
            logger.info('Admin login attempt', { username, ip: ipAddress, has2FA: !!totpToken || !!recoveryCode });

            // Fetch admin user with 2FA fields
            const [admins] = await pool.query(
                'SELECT id, username, password, email, role, status, two_factor_enabled, two_factor_secret, two_factor_backup_codes FROM admin_users WHERE username = ?',
                [username]
            );

            if (admins.length === 0) {
                logger.warn('Admin login failed: user not found', { username, ip: ipAddress });
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            const admin = admins[0];

            // Check status
            if (admin.status !== 'active') {
                logger.warn('Admin login failed: account inactive', { username, ip: ipAddress });
                return {
                    success: false,
                    message: 'Account is not active'
                };
            }

            // Verify password
            logger.debug('Verifying admin password', { username });
            const passwordMatch = await bcrypt.compare(password, admin.password);

            if (!passwordMatch) {
                logger.warn('Admin login failed: invalid password', { username, ip: ipAddress });
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            // Check if 2FA is enabled
            if (admin.two_factor_enabled) {
                // If no 2FA token or recovery code provided, request it
                if (!totpToken && !recoveryCode) {
                    logger.info('2FA required for admin', { username });
                    return {
                        success: false,
                        requires_2fa: true,
                        message: '2FA verification required'
                    };
                }

                // Verify 2FA
                const totpService = require('./totp.service');
                let twoFactorValid = false;

                if (totpToken) {
                    // Verify TOTP token
                    twoFactorValid = totpService.verifyToken(totpToken, admin.two_factor_secret);
                    if (!twoFactorValid) {
                        logger.warn('Admin login failed: invalid 2FA token', { username, ip: ipAddress });
                        return {
                            success: false,
                            message: 'Invalid 2FA code'
                        };
                    }
                } else if (recoveryCode) {
                    // Verify recovery code
                    const result = totpService.verifyRecoveryCode(recoveryCode, admin.two_factor_backup_codes);
                    if (!result.valid) {
                        logger.warn('Admin login failed: invalid recovery code', { username, ip: ipAddress });
                        return {
                            success: false,
                            message: 'Invalid recovery code'
                        };
                    }

                    // Update remaining recovery codes
                    await pool.query(
                        'UPDATE admin_users SET two_factor_backup_codes = ? WHERE id = ?',
                        [result.remainingCodes, admin.id]
                    );

                    twoFactorValid = true;
                    logger.info('Admin login with recovery code', { username, remaining: totpService.getRemainingCodesCount(result.remainingCodes) });
                }

                if (!twoFactorValid) {
                    return {
                        success: false,
                        message: '2FA verification failed'
                    };
                }
            }

            // Generate token
            const token = this.generateAdminToken(admin.id, admin.role);

            // Create admin session
            const adminSessionService = require('./adminSession.service');
            await adminSessionService.createSession(admin.id, token, ipAddress, userAgent);

            // Update last login
            await pool.query(
                'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
                [admin.id]
            );

            // Log successful login
            await this.logActivity(admin.id, 'admin_login', ipAddress, { success: true, with_2fa: admin.two_factor_enabled });

            logger.info('Admin login successful', { username, adminId: admin.id, ip: ipAddress, with_2fa: admin.two_factor_enabled });

            return {
                success: true,
                data: {
                    token,
                    admin: {
                        id: admin.id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    }
                }
            };

        } catch (error) {
            logger.error('Admin login error', { 
                error: error.message, 
                stack: error.stack,
                username 
            });
            return {
                success: false,
                message: 'Login failed due to server error'
            };
        }
    }

    /**
     * User Login
     * @param {string} username 
     * @param {string} password 
     * @param {string} deviceId 
     * @param {string} macAddress 
     * @param {string} ipAddress 
     * @returns {Promise<Object>}
     */
    async loginUser(username, password, deviceId, macAddress, ipAddress) {
        try {
            logger.info('User login attempt', { username, deviceId, ip: ipAddress });

            // Fetch user
            const [users] = await pool.query(
                'SELECT id, username, password, email, status, subscription_start, subscription_end, plan_id, max_devices FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                logger.warn('User login failed: user not found', { username, ip: ipAddress });
                await this.logFailedAttempt(username, ipAddress, 'user_not_found');
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            const user = users[0];

            // Check status
            if (user.status !== 'active') {
                logger.warn('User login failed: account inactive', { username, status: user.status, ip: ipAddress });
                return {
                    success: false,
                    message: 'Account is not active'
                };
            }

            // Verify password
            logger.debug('Verifying user password', { username });
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                logger.warn('User login failed: invalid password', { username, ip: ipAddress });
                await this.logFailedAttempt(username, ipAddress, 'invalid_password');
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            // Check subscription
            if (!this.isSubscriptionActive(user.subscription_end)) {
                logger.warn('User login failed: subscription expired', { 
                    username, 
                    subscriptionEnd: user.subscription_end,
                    ip: ipAddress 
                });
                return {
                    success: false,
                    message: 'Your subscription has expired',
                    subscription_required: true,
                    subscription_end: user.subscription_end
                };
            }

            // Handle device registration if provided
            if (deviceId) {
                const deviceCheck = await this.registerDevice(user.id, deviceId, macAddress, user.max_devices);
                if (!deviceCheck.success) {
                    logger.warn('User login failed: device limit', { username, deviceId, ip: ipAddress });
                    return deviceCheck;
                }
            }

            // Generate tokens
            const token = this.generateUserToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);

            // Update last login
            await pool.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            // Log successful login
            await this.logActivity(user.id, 'user_login', ipAddress, { 
                success: true, 
                deviceId 
            });

            logger.info('User login successful', { username, userId: user.id, ip: ipAddress });

            return {
                success: true,
                data: {
                    token,
                    refreshToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        subscription_end: user.subscription_end,
                        max_devices: user.max_devices
                    }
                }
            };

        } catch (error) {
            logger.error('User login error', { 
                error: error.message, 
                stack: error.stack,
                username 
            });
            return {
                success: false,
                message: 'Login failed due to server error'
            };
        }
    }

    /**
     * Login with subscription code
     * @param {string} code 
     * @param {string} deviceId 
     * @param {string} macAddress 
     * @param {string} ipAddress 
     * @returns {Promise<Object>}
     */
    async loginWithCode(code, deviceId, macAddress, ipAddress) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            logger.info('Code activation attempt', { code: code.substring(0, 8) + '...', ip: ipAddress });

            // Fetch code
            const [codes] = await connection.query(
                'SELECT id, source_name, duration_days, max_uses, used_count, status, expires_at, plan_id FROM subscription_codes WHERE code = ?',
                [code]
            );

            if (codes.length === 0) {
                await connection.rollback();
                logger.warn('Code activation failed: code not found', { code: code.substring(0, 8) + '...', ip: ipAddress });
                return {
                    success: false,
                    message: 'Invalid subscription code'
                };
            }

            const codeData = codes[0];

            // Check code status
            if (codeData.status !== 'active') {
                await connection.rollback();
                logger.warn('Code activation failed: code not active', { 
                    code: code.substring(0, 8) + '...', 
                    status: codeData.status,
                    ip: ipAddress 
                });
                return {
                    success: false,
                    message: 'This code is no longer valid'
                };
            }

            // Check expiry
            if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                await connection.query(
                    'UPDATE subscription_codes SET status = "expired" WHERE id = ?',
                    [codeData.id]
                );
                await connection.rollback();
                logger.warn('Code activation failed: code expired', { 
                    code: code.substring(0, 8) + '...', 
                    expiresAt: codeData.expires_at,
                    ip: ipAddress 
                });
                return {
                    success: false,
                    message: 'This code has expired'
                };
            }

            // Check usage limit
            if (codeData.used_count >= codeData.max_uses) {
                await connection.query(
                    'UPDATE subscription_codes SET status = "used" WHERE id = ?',
                    [codeData.id]
                );
                await connection.rollback();
                logger.warn('Code activation failed: max uses reached', { 
                    code: code.substring(0, 8) + '...', 
                    usedCount: codeData.used_count,
                    maxUses: codeData.max_uses,
                    ip: ipAddress 
                });
                return {
                    success: false,
                    message: 'This code has been fully used'
                };
            }

            // Get plan details including server
            const [plans] = await connection.query(
                'SELECT * FROM subscription_plans WHERE id = ?',
                [codeData.plan_id]
            );

            if (plans.length === 0) {
                await connection.rollback();
                logger.error('Code activation failed: plan not found', { planId: codeData.plan_id });
                return {
                    success: false,
                    message: 'Subscription plan not found'
                };
            }

            const plan = plans[0];

            // Validate server assignment
            if (!plan.server_id) {
                await connection.rollback();
                logger.error('Code activation failed: no server assigned to plan', { planId: plan.id });
                return {
                    success: false,
                    message: 'Validation failed: Plan has no streaming server assigned'
                };
            }

            // Generate credentials
            const username = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const tempPassword = this.generatePassword();
            const hashedPassword = await bcrypt.hash(tempPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

            // Calculate subscription dates
            const subscriptionStart = new Date();
            const subscriptionEnd = new Date();
            subscriptionEnd.setDate(subscriptionEnd.getDate() + (plan.duration_days || codeData.duration_days));

            // Create user with server_id from plan
            const [result] = await connection.query(
                'INSERT INTO users (username, password, status, subscription_start, subscription_end, plan_id, server_id, max_devices) VALUES (?, ?, "active", ?, ?, ?, ?, ?)',
                [username, hashedPassword, subscriptionStart, subscriptionEnd, plan.id, plan.server_id, plan.max_devices || 1]
            );

            const userId = result.insertId;

            // Update code usage
            await connection.query(
                'UPDATE subscription_codes SET used_count = used_count + 1 WHERE id = ?',
                [codeData.id]
            );

            // Mark as used if limit reached
            if (codeData.used_count + 1 >= codeData.max_uses) {
                await connection.query(
                    'UPDATE subscription_codes SET status = "used" WHERE id = ?',
                    [codeData.id]
                );
            }

            // Log code usage
            await connection.query(
                'INSERT INTO code_usage (code_id, user_id, ip_address) VALUES (?, ?, ?)',
                [codeData.id, userId, ipAddress]
            );

            // Register device if provided
            if (deviceId) {
                await connection.query(
                    'INSERT INTO user_devices (user_id, device_id, mac_address, status) VALUES (?, ?, ?, "active")',
                    [userId, deviceId, macAddress]
                );
            }

            await connection.commit();

            // Generate tokens
            const token = this.generateUserToken(userId);
            const refreshToken = this.generateRefreshToken(userId);

            logger.info('Code activation successful', { 
                code: code.substring(0, 8) + '...', 
                userId, 
                username,
                ip: ipAddress 
            });

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
            logger.error('Code activation error', { 
                error: error.message, 
                stack: error.stack,
                code: code.substring(0, 8) + '...'
            });
            return {
                success: false,
                message: 'Code activation failed due to server error'
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Refresh access token
     * @param {string} refreshToken 
     * @returns {Promise<Object>}
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
            
            if (!decoded.userId) {
                return {
                    success: false,
                    message: 'Invalid refresh token'
                };
            }

            // Generate new access token
            const newToken = this.generateUserToken(decoded.userId);

            logger.info('Token refreshed', { userId: decoded.userId });

            return {
                success: true,
                data: {
                    token: newToken
                }
            };

        } catch (error) {
            logger.warn('Token refresh failed', { error: error.message });
            return {
                success: false,
                message: 'Invalid or expired refresh token'
            };
        }
    }

    /**
     * Register or update device
     * @param {number} userId 
     * @param {string} deviceId 
     * @param {string} macAddress 
     * @param {number} maxDevices 
     * @returns {Promise<Object>}
     */
    async registerDevice(userId, deviceId, macAddress, maxDevices) {
        try {
            // Check if device already registered
            const [existing] = await pool.query(
                'SELECT id FROM user_devices WHERE user_id = ? AND device_id = ? AND status = "active"',
                [userId, deviceId]
            );

            if (existing.length > 0) {
                // Update last seen
                await pool.query(
                    'UPDATE user_devices SET last_seen = NOW() WHERE id = ?',
                    [existing[0].id]
                );
                return { success: true };
            }

            // Check device limit
            const [activeDevices] = await pool.query(
                'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND status = "active"',
                [userId]
            );

            if (activeDevices[0].count >= maxDevices) {
                return {
                    success: false,
                    message: 'Maximum device limit reached. Please remove a device first.'
                };
            }

            // Register new device
            await pool.query(
                'INSERT INTO user_devices (user_id, device_id, mac_address, status) VALUES (?, ?, ?, "active")',
                [userId, deviceId, macAddress]
            );

            logger.info('Device registered', { userId, deviceId });

            return { success: true };

        } catch (error) {
            logger.error('Device registration error', { 
                error: error.message, 
                userId, 
                deviceId 
            });
            return {
                success: false,
                message: 'Device registration failed'
            };
        }
    }

    /**
     * Generate admin JWT token
     * @param {number} adminId 
     * @param {string} role 
     * @returns {string}
     */
    generateAdminToken(adminId, role) {
        return jwt.sign(
            { 
                adminId, 
                role,
                isAdmin: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    /**
     * Generate user JWT token
     * @param {number} userId 
     * @returns {string}
     */
    generateUserToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    /**
     * Generate refresh token
     * @param {number} userId 
     * @returns {string}
     */
    generateRefreshToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );
    }

    /**
     * Generate random password
     * @returns {string}
     */
    generatePassword() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    /**
     * Check if subscription is active
     * @param {Date} subscriptionEnd 
     * @returns {boolean}
     */
    isSubscriptionActive(subscriptionEnd) {
        if (!subscriptionEnd) return false;
        return new Date(subscriptionEnd) > new Date();
    }

    /**
     * Log activity
     * @param {number} userId 
     * @param {string} action 
     * @param {string} ipAddress 
     * @param {Object} details 
     */
    async logActivity(userId, action, ipAddress, details = {}) {
        try {
            await pool.query(
                'INSERT INTO activity_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
                [userId, action, ipAddress, JSON.stringify(details)]
            );
        } catch (error) {
            logger.error('Activity logging error', { error: error.message });
        }
    }

    /**
     * Log failed login attempt
     * @param {string} username 
     * @param {string} ipAddress 
     * @param {string} reason 
     */
    async logFailedAttempt(username, ipAddress, reason) {
        try {
            await pool.query(
                'INSERT INTO activity_logs (action, ip_address, details) VALUES (?, ?, ?)',
                ['failed_login', ipAddress, JSON.stringify({ username, reason })]
            );
        } catch (error) {
            logger.error('Failed attempt logging error', { error: error.message });
        }
    }
}

module.exports = new AuthService();
