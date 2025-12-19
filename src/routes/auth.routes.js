/**
 * PrimeX IPTV System v3.0 - Authentication Routes
 * 
 * Clean route definitions for authentication endpoints
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimiter');

// Admin login
router.post(
    '/admin/login',
    loginLimiter,
    authController.validateAdminLogin(),
    authController.adminLogin.bind(authController)
);

// User login
router.post(
    '/user/login',
    loginLimiter,
    authController.validateUserLogin(),
    authController.userLogin.bind(authController)
);

// Login with subscription code
router.post(
    '/code/activate',
    loginLimiter,
    authController.validateCodeLogin(),
    authController.loginWithCode.bind(authController)
);

// Refresh token
router.post(
    '/token/refresh',
    authController.refreshToken.bind(authController)
);

module.exports = router;
