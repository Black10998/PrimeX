/**
 * PrimeX IPTV - Two-Factor Authentication Controller
 * 
 * Handles 2FA setup, verification, and management for admin users
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');
const totpService = require('../services/totp.service');
const logger = require('../utils/logger');

class TwoFactorController {
    /**
     * Generate 2FA setup (secret + QR code)
     */
    async generateSetup(req, res) {
        try {
            const adminId = req.admin.id;
            const username = req.admin.username;

            // Check if 2FA is already enabled
            const [admin] = await pool.query(
                'SELECT two_factor_enabled FROM admin_users WHERE id = ?',
                [adminId]
            );

            if (admin[0].two_factor_enabled) {
                return res.status(400).json(formatResponse(false, null, '2FA is already enabled'));
            }

            // Generate secret and QR code
            const { secret, otpauth_url } = totpService.generateSecret(username);
            const qrCode = await totpService.generateQRCode(otpauth_url);

            // Store secret temporarily (not enabled yet)
            await pool.query(
                'UPDATE admin_users SET two_factor_secret = ? WHERE id = ?',
                [secret, adminId]
            );

            return res.json(formatResponse(true, {
                secret,
                qrCode
            }, '2FA setup generated'));
        } catch (error) {
            logger.error('Generate 2FA setup error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to generate 2FA setup'));
        }
    }

    /**
     * Enable 2FA (verify token and generate backup codes)
     */
    async enable(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const adminId = req.admin.id;
            const { token } = req.body;

            // Get admin's secret
            const [admin] = await pool.query(
                'SELECT two_factor_secret, two_factor_enabled FROM admin_users WHERE id = ?',
                [adminId]
            );

            if (!admin[0].two_factor_secret) {
                return res.status(400).json(formatResponse(false, null, 'Please generate 2FA setup first'));
            }

            if (admin[0].two_factor_enabled) {
                return res.status(400).json(formatResponse(false, null, '2FA is already enabled'));
            }

            // Verify token
            const isValid = totpService.verifyToken(token, admin[0].two_factor_secret);
            if (!isValid) {
                return res.status(400).json(formatResponse(false, null, 'Invalid verification code'));
            }

            // Generate backup codes
            const recoveryCodes = totpService.generateRecoveryCodes(10);
            const hashedCodes = totpService.hashRecoveryCodes(recoveryCodes);

            // Enable 2FA
            await pool.query(
                'UPDATE admin_users SET two_factor_enabled = TRUE, two_factor_backup_codes = ?, two_factor_enabled_at = NOW() WHERE id = ?',
                [hashedCodes, adminId]
            );

            // Log activity
            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['2fa_enabled', JSON.stringify({ admin_id: adminId })]
            );

            // Force logout all admin sessions
            const adminSessionService = require('../services/adminSession.service');
            await adminSessionService.deleteAllSessions(adminId);

            return res.json(formatResponse(true, {
                recoveryCodes
            }, '2FA enabled successfully. Please login again.'));
        } catch (error) {
            logger.error('Enable 2FA error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to enable 2FA'));
        }
    }

    /**
     * Disable 2FA
     */
    async disable(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const adminId = req.admin.id;
            const { password } = req.body;

            // Verify password
            const bcrypt = require('bcrypt');
            const [admin] = await pool.query(
                'SELECT password, two_factor_enabled FROM admin_users WHERE id = ?',
                [adminId]
            );

            if (!admin[0].two_factor_enabled) {
                return res.status(400).json(formatResponse(false, null, '2FA is not enabled'));
            }

            const isPasswordValid = await bcrypt.compare(password, admin[0].password);
            if (!isPasswordValid) {
                return res.status(400).json(formatResponse(false, null, 'Invalid password'));
            }

            // Disable 2FA
            await pool.query(
                'UPDATE admin_users SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_backup_codes = NULL, two_factor_enabled_at = NULL WHERE id = ?',
                [adminId]
            );

            // Log activity
            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['2fa_disabled', JSON.stringify({ admin_id: adminId })]
            );

            // Force logout all admin sessions
            const adminSessionService = require('../services/adminSession.service');
            await adminSessionService.deleteAllSessions(adminId);

            return res.json(formatResponse(true, null, '2FA disabled successfully. Please login again.'));
        } catch (error) {
            logger.error('Disable 2FA error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to disable 2FA'));
        }
    }

    /**
     * Get 2FA status
     */
    async getStatus(req, res) {
        try {
            const adminId = req.admin.id;

            const [admin] = await pool.query(
                'SELECT two_factor_enabled, two_factor_enabled_at, two_factor_backup_codes FROM admin_users WHERE id = ?',
                [adminId]
            );

            const remainingCodes = admin[0].two_factor_backup_codes 
                ? totpService.getRemainingCodesCount(admin[0].two_factor_backup_codes)
                : 0;

            return res.json(formatResponse(true, {
                enabled: admin[0].two_factor_enabled,
                enabled_at: admin[0].two_factor_enabled_at,
                remaining_backup_codes: remainingCodes
            }));
        } catch (error) {
            logger.error('Get 2FA status error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to get 2FA status'));
        }
    }

    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const adminId = req.admin.id;
            const { password } = req.body;

            // Verify password
            const bcrypt = require('bcrypt');
            const [admin] = await pool.query(
                'SELECT password, two_factor_enabled FROM admin_users WHERE id = ?',
                [adminId]
            );

            if (!admin[0].two_factor_enabled) {
                return res.status(400).json(formatResponse(false, null, '2FA is not enabled'));
            }

            const isPasswordValid = await bcrypt.compare(password, admin[0].password);
            if (!isPasswordValid) {
                return res.status(400).json(formatResponse(false, null, 'Invalid password'));
            }

            // Generate new backup codes
            const recoveryCodes = totpService.generateRecoveryCodes(10);
            const hashedCodes = totpService.hashRecoveryCodes(recoveryCodes);

            await pool.query(
                'UPDATE admin_users SET two_factor_backup_codes = ? WHERE id = ?',
                [hashedCodes, adminId]
            );

            // Log activity
            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['2fa_backup_codes_regenerated', JSON.stringify({ admin_id: adminId })]
            );

            return res.json(formatResponse(true, {
                recoveryCodes
            }, 'Backup codes regenerated successfully'));
        } catch (error) {
            logger.error('Regenerate backup codes error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to regenerate backup codes'));
        }
    }

    // Validation methods
    validateEnable() {
        return [
            body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
        ];
    }

    validateDisable() {
        return [
            body('password').notEmpty().withMessage('Password is required')
        ];
    }

    validateRegenerateBackupCodes() {
        return [
            body('password').notEmpty().withMessage('Password is required')
        ];
    }

    /**
     * Change admin password
     */
    async changePassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const adminId = req.admin.id;
            const { current_password, new_password } = req.body;

            if (new_password.length < 6) {
                return res.status(400).json(formatResponse(false, null, 'New password must be at least 6 characters'));
            }

            // Verify current password
            const bcrypt = require('bcrypt');
            const [admin] = await pool.query(
                'SELECT password FROM admin_users WHERE id = ?',
                [adminId]
            );

            const isPasswordValid = await bcrypt.compare(current_password, admin[0].password);
            if (!isPasswordValid) {
                return res.status(400).json(formatResponse(false, null, 'Current password is incorrect'));
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Update password
            await pool.query(
                'UPDATE admin_users SET password = ? WHERE id = ?',
                [hashedPassword, adminId]
            );

            // Logout all admin sessions
            const adminSessionService = require('../services/adminSession.service');
            await adminSessionService.deleteAllSessions(adminId);

            // Log activity
            await pool.query(
                'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
                ['admin_password_changed', JSON.stringify({ admin_id: adminId })]
            );

            return res.json(formatResponse(true, null, 'Password changed successfully. Please login again.'));
        } catch (error) {
            logger.error('Change admin password error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to change password'));
        }
    }

    validateChangePassword() {
        return [
            body('current_password').notEmpty().withMessage('Current password is required'),
            body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        ];
    }
}

module.exports = new TwoFactorController();
