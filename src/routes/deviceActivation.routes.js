/**
 * PrimeX IPTV - Device Activation Routes
 * 
 * Industry-standard device activation (4Kmatic-style)
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const express = require('express');
const router = express.Router();
const deviceActivationController = require('../controllers/deviceActivationController');
const supportedAppsController = require('../controllers/supportedAppsController');
const { authenticateAdmin } = require('../middleware/auth.middleware');
const { checkModuleAccess } = require('../middleware/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

// ============================================
// PUBLIC ROUTES (for TV/apps)
// ============================================

// Generate device key (called by TV/app)
router.post('/device/generate-key', apiLimiter, deviceActivationController.generateDeviceKey);

// Check activation status (polled by TV/app)
router.get('/device/check/:device_key', apiLimiter, deviceActivationController.checkActivationStatus);

// Get supported apps (public catalog)
router.get('/apps', supportedAppsController.getApps);
router.get('/apps/:slug', supportedAppsController.getAppDetails);

// ============================================
// ADMIN ROUTES (device management)
// ============================================

// Activate device with key
router.post('/admin/device/activate', 
    authenticateAdmin, 
    checkModuleAccess('codes'), 
    deviceActivationController.activateDevice
);

// Get all device activations
router.get('/admin/device/activations', 
    authenticateAdmin, 
    checkModuleAccess('codes'), 
    deviceActivationController.getDeviceActivations
);

// Deactivate device
router.delete('/admin/device/:id', 
    authenticateAdmin, 
    checkModuleAccess('codes'), 
    deviceActivationController.deactivateDevice
);

// ============================================
// ADMIN ROUTES (app management)
// ============================================

// Manage supported apps
router.post('/admin/apps', 
    authenticateAdmin, 
    checkModuleAccess('settings'), 
    supportedAppsController.createApp
);

router.put('/admin/apps/:id', 
    authenticateAdmin, 
    checkModuleAccess('settings'), 
    supportedAppsController.updateApp
);

router.delete('/admin/apps/:id', 
    authenticateAdmin, 
    checkModuleAccess('settings'), 
    supportedAppsController.deleteApp
);

module.exports = router;
