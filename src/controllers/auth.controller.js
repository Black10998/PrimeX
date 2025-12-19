/**
 * PrimeX IPTV System v3.0 - Authentication Controller
 * 
 * Complete rebuild with:
 * - Clean separation of concerns
 * - Unified response format
 * - Proper validation
 * - Clear error handling
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
    /**
     * Admin login endpoint
     */
    async adminLogin(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { username, password, totp_token, recovery_code } = req.body;
            const ipAddress = this.getClientIp(req);
            const userAgent = req.get('user-agent') || 'Unknown';

            // Call service with 2FA support
            const result = await authService.loginAdmin(username, password, ipAddress, userAgent, totp_token, recovery_code);

            // Return response
            const statusCode = result.success ? 200 : 401;
            return res.status(statusCode).json(result);

        } catch (error) {
            logger.error('Admin login controller error', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * User login endpoint
     */
    async userLogin(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { username, password, device_id, mac_address } = req.body;
            const ipAddress = this.getClientIp(req);

            // Call service
            const result = await authService.loginUser(
                username, 
                password, 
                device_id, 
                mac_address, 
                ipAddress
            );

            // Return response
            const statusCode = result.success ? 200 : (result.subscription_required ? 403 : 401);
            return res.status(statusCode).json(result);

        } catch (error) {
            logger.error('User login controller error', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Login with subscription code
     */
    async loginWithCode(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { code, device_id, mac_address } = req.body;
            const ipAddress = this.getClientIp(req);

            // Call service
            const result = await authService.loginWithCode(
                code, 
                device_id, 
                mac_address, 
                ipAddress
            );

            // Return response
            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            logger.error('Code login controller error', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Refresh token endpoint
     */
    async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            // Call service
            const result = await authService.refreshToken(refresh_token);

            // Return response
            const statusCode = result.success ? 200 : 401;
            return res.status(statusCode).json(result);

        } catch (error) {
            logger.error('Refresh token controller error', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get client IP address
     * @param {Object} req 
     * @returns {string}
     */
    getClientIp(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               'unknown';
    }

    /**
     * Validation rules for admin login
     */
    validateAdminLogin() {
        return [
            body('username')
                .trim()
                .notEmpty().withMessage('Username is required')
                .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
            body('password')
                .notEmpty().withMessage('Password is required')
                .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        ];
    }

    /**
     * Validation rules for user login
     */
    validateUserLogin() {
        return [
            body('username')
                .trim()
                .notEmpty().withMessage('Username is required'),
            body('password')
                .notEmpty().withMessage('Password is required')
        ];
    }

    /**
     * Validation rules for code login
     */
    validateCodeLogin() {
        return [
            body('code')
                .trim()
                .notEmpty().withMessage('Subscription code is required')
                .isLength({ min: 10 }).withMessage('Invalid code format')
        ];
    }
}

module.exports = new AuthController();
