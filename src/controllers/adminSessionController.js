/**
 * PrimeX IPTV - Admin Session Controller
 * 
 * Handles admin session management endpoints
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { formatResponse } = require('../utils/helpers');
const adminSessionService = require('../services/adminSession.service');
const logger = require('../utils/logger');

class AdminSessionController {
    /**
     * Get current admin's active sessions
     */
    async getMySessions(req, res) {
        try {
            const adminId = req.admin.id;

            const sessions = await adminSessionService.getActiveSessions(adminId);

            return res.json(formatResponse(true, { 
                sessions,
                count: sessions.length 
            }));
        } catch (error) {
            logger.error('Get admin sessions error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch sessions'));
        }
    }

    /**
     * Delete specific session (kick device)
     */
    async deleteSession(req, res) {
        try {
            const adminId = req.admin.id;
            const { sessionId } = req.params;

            await adminSessionService.deleteSession(adminId, sessionId);

            return res.json(formatResponse(true, null, 'Session deleted successfully'));
        } catch (error) {
            logger.error('Delete admin session error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to delete session'));
        }
    }

    /**
     * Delete all sessions except current
     */
    async deleteAllSessions(req, res) {
        try {
            const adminId = req.admin.id;
            const currentToken = req.headers.authorization?.replace('Bearer ', '');

            const count = await adminSessionService.deleteAllSessions(adminId, currentToken);

            return res.json(formatResponse(true, { 
                deleted_count: count 
            }, 'All other sessions logged out'));
        } catch (error) {
            logger.error('Delete all admin sessions error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to logout all sessions'));
        }
    }

    /**
     * Force logout all sessions (including current)
     */
    async forceLogoutAll(req, res) {
        try {
            const adminId = req.admin.id;

            const count = await adminSessionService.deleteAllSessions(adminId);

            return res.json(formatResponse(true, { 
                deleted_count: count 
            }, 'All sessions logged out'));
        } catch (error) {
            logger.error('Force logout all admin sessions error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to logout all sessions'));
        }
    }
}

module.exports = new AdminSessionController();
