/**
 * PrimeX IPTV System v11.0 - Setup Controller
 * 
 * Handles initial system setup and admin creation
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const setupService = require('../services/setup.service');
const logger = require('../utils/logger');

class SetupController {
    /**
     * Check if setup is already complete
     */
    async checkStatus(req, res) {
        try {
            const status = await setupService.checkSetupStatus();
            return res.status(200).json(status);
        } catch (error) {
            logger.error('Setup status check error', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Failed to check setup status'
            });
        }
    }

    /**
     * Initialize system with first admin user
     */
    async initialize(req, res) {
        try {
            const { username, email, password } = req.body;

            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, email, and password are required'
                });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters'
                });
            }

            // Check if setup is already complete
            const status = await setupService.checkSetupStatus();
            if (status.setup_complete) {
                return res.status(403).json({
                    success: false,
                    message: 'Setup has already been completed'
                });
            }

            // Create admin user
            const result = await setupService.createInitialAdmin(username, email, password);

            if (result.success) {
                logger.info('Initial admin created successfully', { username, email });
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }

        } catch (error) {
            logger.error('Setup initialization error', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Setup failed. Please try again.'
            });
        }
    }
}

module.exports = new SetupController();
