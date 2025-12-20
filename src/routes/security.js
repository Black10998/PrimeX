const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { authenticateAdmin } = require('../middleware/auth');
const { checkModuleAccess } = require('../middleware/rbac');

// All security routes require admin authentication
router.use(authenticateAdmin);

// Get current security status (real-time)
router.get('/status', securityController.getSecurityStatus);

// Get recent security events
router.get('/events', securityController.getRecentEvents);

// Get events by type
router.get('/events/:type', securityController.getEventsByType);

// Get blocked IPs
router.get('/blocked-ips', securityController.getBlockedIPs);

// Block IP (Super Admin only)
router.post('/block-ip', checkModuleAccess('security'), securityController.blockIP);

// Unblock IP (Super Admin only)
router.post('/unblock-ip', checkModuleAccess('security'), securityController.unblockIP);

// Get security statistics
router.get('/stats', securityController.getSecurityStats);

module.exports = router;
