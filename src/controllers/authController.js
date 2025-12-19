const authService = require('../services/authService');
const { formatResponse } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');

class AuthController {
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { username, password, device_id, mac_address } = req.body;
            const result = await authService.loginUser(username, password, device_id, mac_address, req);

            if (!result.success) {
                const statusCode = result.subscription_required ? 403 : 401;
                return res.status(statusCode).json(result);
            }

            return res.json(result);
        } catch (error) {
            return res.status(500).json(formatResponse(false, null, 'Login failed'));
        }
    }

    async loginWithCode(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { code, device_id, mac_address } = req.body;
            const result = await authService.loginWithCode(code, device_id, mac_address, req);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.json(result);
        } catch (error) {
            return res.status(500).json(formatResponse(false, null, 'Code activation failed'));
        }
    }

    async adminLogin(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(formatResponse(false, null, 'Validation failed', errors.array()));
            }

            const { username, password } = req.body;
            const result = await authService.loginAdmin(username, password, req);

            if (!result.success) {
                return res.status(401).json(result);
            }

            return res.json(result);
        } catch (error) {
            return res.status(500).json(formatResponse(false, null, 'Admin login failed'));
        }
    }

    async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;
            
            if (!refresh_token) {
                return res.status(400).json(formatResponse(false, null, 'Refresh token required'));
            }

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
            
            const newToken = authService.generateToken(decoded.userId, false);
            
            return res.json(formatResponse(true, { token: newToken }));
        } catch (error) {
            return res.status(401).json(formatResponse(false, null, 'Invalid refresh token'));
        }
    }

    validateLogin() {
        return [
            body('username').trim().notEmpty().withMessage('Username is required'),
            body('password').notEmpty().withMessage('Password is required')
        ];
    }

    validateCodeLogin() {
        return [
            body('code').trim().notEmpty().withMessage('Code is required')
        ];
    }
}

module.exports = new AuthController();
