/**
 * User Session Service
 * 
 * Handles user session management and invalidation
 * Critical for security: ensures inactive users are immediately logged out
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class UserSessionService {
    /**
     * Invalidate all sessions for a specific user
     * Called when user is deactivated or deleted
     * 
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Number of sessions invalidated
     */
    async invalidateAllUserSessions(userId) {
        try {
            // Check if user_sessions table exists
            const [tables] = await pool.query(
                "SHOW TABLES LIKE 'user_sessions'"
            );

            if (tables.length > 0) {
                // Delete all sessions for this user
                const [result] = await pool.query(
                    'DELETE FROM user_sessions WHERE user_id = ?',
                    [userId]
                );
                
                logger.info(`Invalidated ${result.affectedRows} sessions for user ${userId}`);
                return result.affectedRows;
            }

            // If table doesn't exist, sessions are managed via JWT only
            // JWT tokens will be rejected on next request due to status check
            logger.info(`Session invalidation for user ${userId} - JWT-only mode`);
            return 0;
        } catch (error) {
            logger.error('Session invalidation error:', { 
                userId, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Invalidate all active devices for a user
     * Marks devices as inactive to force re-authentication
     * 
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Number of devices deactivated
     */
    async deactivateAllUserDevices(userId) {
        try {
            const [result] = await pool.query(
                'UPDATE user_devices SET status = "inactive" WHERE user_id = ? AND status = "active"',
                [userId]
            );
            
            logger.info(`Deactivated ${result.affectedRows} devices for user ${userId}`);
            return result.affectedRows;
        } catch (error) {
            logger.error('Device deactivation error:', { 
                userId, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Complete user access revocation
     * Invalidates sessions and deactivates devices
     * 
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - Revocation summary
     */
    async revokeUserAccess(userId) {
        try {
            const sessionsInvalidated = await this.invalidateAllUserSessions(userId);
            const devicesDeactivated = await this.deactivateAllUserDevices(userId);

            const summary = {
                userId,
                sessionsInvalidated,
                devicesDeactivated,
                timestamp: new Date()
            };

            logger.info('User access revoked:', summary);
            return summary;
        } catch (error) {
            logger.error('Access revocation error:', { 
                userId, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Clean up expired sessions
     * Should be called periodically (e.g., via cron job)
     * 
     * @returns {Promise<number>} - Number of sessions cleaned
     */
    async cleanupExpiredSessions() {
        try {
            const [tables] = await pool.query(
                "SHOW TABLES LIKE 'user_sessions'"
            );

            if (tables.length > 0) {
                const [result] = await pool.query(
                    'DELETE FROM user_sessions WHERE expires_at < NOW()'
                );
                
                if (result.affectedRows > 0) {
                    logger.info(`Cleaned up ${result.affectedRows} expired sessions`);
                }
                return result.affectedRows;
            }

            return 0;
        } catch (error) {
            logger.error('Session cleanup error:', { error: error.message });
            throw error;
        }
    }

    /**
     * Get active session count for a user
     * 
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Number of active sessions
     */
    async getActiveSessionCount(userId) {
        try {
            const [tables] = await pool.query(
                "SHOW TABLES LIKE 'user_sessions'"
            );

            if (tables.length > 0) {
                const [result] = await pool.query(
                    'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
                    [userId]
                );
                return result[0].count;
            }

            return 0;
        } catch (error) {
            logger.error('Get session count error:', { 
                userId, 
                error: error.message 
            });
            return 0;
        }
    }
}

module.exports = new UserSessionService();
