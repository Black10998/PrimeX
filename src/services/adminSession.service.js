/**
 * PrimeX IPTV - Admin Session Service
 * 
 * Handles admin session tracking and management
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { pool } = require('../config/database');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AdminSessionService {
    /**
     * Parse user agent to extract device info
     * @param {string} userAgent - User agent string
     * @returns {Object} - { browser, os, device_info }
     */
    parseUserAgent(userAgent) {
        if (!userAgent) {
            return { browser: 'Unknown', os: 'Unknown', device_info: 'Unknown' };
        }

        let browser = 'Unknown';
        let os = 'Unknown';
        let device_info = 'Desktop';

        // Detect browser
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
        } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
            browser = 'Opera';
        }

        // Detect OS
        if (userAgent.includes('Windows')) {
            os = 'Windows';
        } else if (userAgent.includes('Mac OS')) {
            os = 'macOS';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
            device_info = 'Mobile';
        } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            os = 'iOS';
            device_info = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
        }

        // Detect device type
        if (userAgent.includes('Mobile') && device_info === 'Desktop') {
            device_info = 'Mobile';
        } else if (userAgent.includes('Tablet')) {
            device_info = 'Tablet';
        }

        return { browser, os, device_info };
    }

    /**
     * Create admin session
     * @param {number} adminId - Admin user ID
     * @param {string} token - JWT token
     * @param {string} ipAddress - IP address
     * @param {string} userAgent - User agent string
     * @returns {Promise<number>} - Session ID
     */
    async createSession(adminId, token, ipAddress, userAgent) {
        try {
            // Hash token for storage
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

            // Parse user agent
            const { browser, os, device_info } = this.parseUserAgent(userAgent);

            // Calculate expiration (24 hours from now)
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Insert session
            const [result] = await pool.query(
                `INSERT INTO admin_sessions 
                (admin_id, token_hash, ip_address, user_agent, device_info, browser, os, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [adminId, tokenHash, ipAddress, userAgent, device_info, browser, os, expiresAt]
            );

            logger.info('Admin session created', { 
                admin_id: adminId, 
                session_id: result.insertId,
                ip: ipAddress,
                device: device_info 
            });

            return result.insertId;
        } catch (error) {
            logger.error('Create admin session error:', { error: error.message });
            throw error;
        }
    }

    /**
     * Get active sessions for admin
     * @param {number} adminId - Admin user ID
     * @returns {Promise<Array>} - Array of active sessions
     */
    async getActiveSessions(adminId) {
        try {
            const [sessions] = await pool.query(
                `SELECT id, ip_address, user_agent, device_info, browser, os, last_activity, created_at
                FROM admin_sessions
                WHERE admin_id = ? AND expires_at > NOW()
                ORDER BY last_activity DESC`,
                [adminId]
            );

            return sessions;
        } catch (error) {
            logger.error('Get admin sessions error:', { error: error.message });
            throw error;
        }
    }

    /**
     * Update session activity
     * @param {string} token - JWT token
     * @returns {Promise<boolean>} - Success status
     */
    async updateActivity(token) {
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

            await pool.query(
                'UPDATE admin_sessions SET last_activity = NOW() WHERE token_hash = ?',
                [tokenHash]
            );

            return true;
        } catch (error) {
            logger.error('Update admin session activity error:', { error: error.message });
            return false;
        }
    }

    /**
     * Delete specific session
     * @param {number} adminId - Admin user ID
     * @param {number} sessionId - Session ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteSession(adminId, sessionId) {
        try {
            await pool.query(
                'DELETE FROM admin_sessions WHERE id = ? AND admin_id = ?',
                [sessionId, adminId]
            );

            logger.info('Admin session deleted', { admin_id: adminId, session_id: sessionId });
            return true;
        } catch (error) {
            logger.error('Delete admin session error:', { error: error.message });
            throw error;
        }
    }

    /**
     * Delete all sessions for admin
     * @param {number} adminId - Admin user ID
     * @param {string} exceptToken - Token to keep (optional)
     * @returns {Promise<number>} - Number of sessions deleted
     */
    async deleteAllSessions(adminId, exceptToken = null) {
        try {
            let query = 'DELETE FROM admin_sessions WHERE admin_id = ?';
            const params = [adminId];

            if (exceptToken) {
                const tokenHash = crypto.createHash('sha256').update(exceptToken).digest('hex');
                query += ' AND token_hash != ?';
                params.push(tokenHash);
            }

            const [result] = await pool.query(query, params);

            logger.info('Admin sessions deleted', { 
                admin_id: adminId, 
                count: result.affectedRows,
                kept_current: !!exceptToken 
            });

            return result.affectedRows;
        } catch (error) {
            logger.error('Delete all admin sessions error:', { error: error.message });
            throw error;
        }
    }

    /**
     * Clean up expired sessions
     * @returns {Promise<number>} - Number of sessions cleaned
     */
    async cleanupExpiredSessions() {
        try {
            const [result] = await pool.query(
                'DELETE FROM admin_sessions WHERE expires_at < NOW()'
            );

            if (result.affectedRows > 0) {
                logger.info('Expired admin sessions cleaned', { count: result.affectedRows });
            }

            return result.affectedRows;
        } catch (error) {
            logger.error('Cleanup expired admin sessions error:', { error: error.message });
            return 0;
        }
    }

    /**
     * Get session count for admin
     * @param {number} adminId - Admin user ID
     * @returns {Promise<number>} - Number of active sessions
     */
    async getSessionCount(adminId) {
        try {
            const [result] = await pool.query(
                'SELECT COUNT(*) as count FROM admin_sessions WHERE admin_id = ? AND expires_at > NOW()',
                [adminId]
            );

            return result[0].count;
        } catch (error) {
            logger.error('Get admin session count error:', { error: error.message });
            return 0;
        }
    }
}

module.exports = new AdminSessionService();
