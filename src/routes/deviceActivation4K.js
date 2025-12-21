const express = require('express');
const router = express.Router();
const deviceActivation4KController = require('../controllers/deviceActivation4KController');
const { authenticateAdmin } = require('../middleware/auth.middleware');

// ==================== TV APP ENDPOINTS (Public) ====================

// Step 1: Register device (TV app first launch)
router.post('/device/register', 
    deviceActivation4KController.validateRegisterDevice(),
    deviceActivation4KController.registerDevice
);

// Step 3: Check activation status (TV app polling)
router.get('/device/status', 
    deviceActivation4KController.checkDeviceStatus
);

// ==================== ADMIN PANEL ENDPOINTS (Protected) ====================

// Step 2: Activate device (admin panel)
router.post('/admin/device/activate', 
    authenticateAdmin,
    deviceActivation4KController.validateActivateDevice(),
    deviceActivation4KController.activateDevice
);

// Get pending devices
router.get('/admin/device/pending', 
    authenticateAdmin,
    deviceActivation4KController.getPendingDevices
);

// Get all devices
router.get('/admin/device/all', 
    authenticateAdmin,
    deviceActivation4KController.getAllDevices
);

module.exports = router;
