/**
 * PrimeX IPTV System v3.0 - Main API Routes
 * 
 * Centralized route definitions
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const express = require('express');
const router = express.Router();

// Import v3 authentication routes
const authRoutes = require('./auth.routes');
const setupRoutes = require('./setup.routes');

// Import controllers
const userController = require('../controllers/userController');
const subscriptionController = require('../controllers/subscriptionController');
const codeController = require('../controllers/codeController');
const channelController = require('../controllers/channelController');
const categoryController = require('../controllers/categoryController');
const serverController = require('../controllers/serverController');
const dashboardController = require('../controllers/dashboardController');
const twoFactorController = require('../controllers/twoFactorController');
const adminSessionController = require('../controllers/adminSessionController');
const notificationController = require('../controllers/notificationController');
const apiSettingsController = require('../controllers/apiSettingsController');

// Import v3 middleware
const { authenticateAdmin, authenticateUser, authenticateAdminOrUser, checkSubscription } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter');

// Authentication routes (v3)
router.use('/auth', authRoutes);

// Setup routes (one-time initialization)
router.use('/setup', setupRoutes);

router.get('/admin/dashboard/stats', authenticateAdmin, dashboardController.getStats);
router.get('/admin/dashboard/health', authenticateAdmin, dashboardController.getSystemHealth);
router.get('/admin/dashboard/revenue', authenticateAdmin, dashboardController.getRevenueStats);

router.get('/admin/users', authenticateAdmin, userController.getAllUsers);
router.get('/admin/users/:id', authenticateAdmin, userController.getUserById);
router.post('/admin/users', authenticateAdmin, userController.validateCreate(), userController.createUser);
router.put('/admin/users/:id', authenticateAdmin, userController.validateUpdate(), userController.updateUser);
router.delete('/admin/users/:id', authenticateAdmin, userController.deleteUser);
router.post('/admin/users/:id/extend', authenticateAdmin, userController.extendSubscription);
router.get('/admin/users/:id/devices', authenticateAdmin, userController.getUserDevices);
router.delete('/admin/users/:id/devices/:deviceId', authenticateAdmin, userController.removeDevice);
router.post('/admin/users/:id/devices/:deviceId/kick', authenticateAdmin, userController.kickDevice);
router.post('/admin/users/:id/force-logout', authenticateAdmin, userController.forceLogoutUser);
router.post('/admin/users/:id/change-password', authenticateAdmin, userController.changeUserPassword);
router.get('/admin/users/online/list', authenticateAdmin, userController.getOnlineUsers);

// Two-Factor Authentication & Security
router.get('/admin/2fa/status', authenticateAdmin, twoFactorController.getStatus);
router.post('/admin/2fa/generate', authenticateAdmin, twoFactorController.generateSetup);
router.post('/admin/2fa/enable', authenticateAdmin, twoFactorController.validateEnable(), twoFactorController.enable);
router.post('/admin/2fa/disable', authenticateAdmin, twoFactorController.validateDisable(), twoFactorController.disable);
router.post('/admin/2fa/regenerate-backup-codes', authenticateAdmin, twoFactorController.validateRegenerateBackupCodes(), twoFactorController.regenerateBackupCodes);
router.post('/admin/security/change-password', authenticateAdmin, twoFactorController.validateChangePassword(), twoFactorController.changePassword);

// Admin Session Management
router.get('/admin/sessions/my', authenticateAdmin, adminSessionController.getMySessions);
router.delete('/admin/sessions/:sessionId', authenticateAdmin, adminSessionController.deleteSession);
router.post('/admin/sessions/logout-all-others', authenticateAdmin, adminSessionController.deleteAllSessions);
router.post('/admin/sessions/logout-all', authenticateAdmin, adminSessionController.forceLogoutAll);

// Subscription plans
router.get('/admin/plans', authenticateAdmin, subscriptionController.getAllPlans);
router.get('/admin/plans/:id', authenticateAdmin, subscriptionController.getPlanById);
router.post('/admin/plans', authenticateAdmin, subscriptionController.validatePlan(), subscriptionController.createPlan);
router.put('/admin/plans/:id', authenticateAdmin, subscriptionController.validatePlan(), subscriptionController.updatePlan);
router.delete('/admin/plans/:id', authenticateAdmin, subscriptionController.deletePlan);
router.post('/admin/plans/:id/channels', authenticateAdmin, subscriptionController.assignChannelsToPlan);
router.get('/admin/subscriptions/expired', authenticateAdmin, subscriptionController.getExpiredSubscriptions);
router.post('/admin/subscriptions/deactivate-expired', authenticateAdmin, subscriptionController.deactivateExpiredSubscriptions);

router.get('/admin/codes', authenticateAdmin, codeController.getAllCodes);
router.get('/admin/codes/stats', authenticateAdmin, codeController.getCodeStats);
router.get('/admin/codes/export', authenticateAdmin, codeController.exportCodes);
router.get('/admin/codes/:id', authenticateAdmin, codeController.getCodeById);
router.post('/admin/codes/generate', authenticateAdmin, codeController.validateGenerate(), codeController.generateCodes);
router.put('/admin/codes/:id', authenticateAdmin, codeController.updateCode);
router.delete('/admin/codes/:id', authenticateAdmin, codeController.deleteCode);
router.post('/admin/codes/bulk-delete', authenticateAdmin, codeController.bulkDeleteCodes);

router.get('/admin/channels', authenticateAdmin, channelController.getAllChannels);
router.get('/admin/channels/:id', authenticateAdmin, channelController.getChannelById);
router.post('/admin/channels', authenticateAdmin, channelController.validateChannel(), channelController.createChannel);
router.put('/admin/channels/:id', authenticateAdmin, channelController.validateChannel(), channelController.updateChannel);
router.delete('/admin/channels/:id', authenticateAdmin, channelController.deleteChannel);
router.post('/admin/channels/reorder', authenticateAdmin, channelController.reorderChannels);
router.post('/admin/channels/import-m3u', authenticateAdmin, channelController.validateM3UImport(), channelController.importM3UPlaylist);

router.get('/admin/categories', authenticateAdmin, categoryController.getAllCategories);
router.get('/admin/categories/:id', authenticateAdmin, categoryController.getCategoryById);
router.post('/admin/categories', authenticateAdmin, categoryController.validateCategory(), categoryController.createCategory);
router.put('/admin/categories/:id', authenticateAdmin, categoryController.validateCategoryUpdate(), categoryController.updateCategory);
router.delete('/admin/categories/:id', authenticateAdmin, categoryController.deleteCategory);
router.post('/admin/categories/reorder', authenticateAdmin, categoryController.reorderCategories);

router.get('/admin/servers', authenticateAdmin, serverController.getAllServers);
router.get('/admin/servers/stats', authenticateAdmin, serverController.getServerStats);
router.get('/admin/servers/:id', authenticateAdmin, serverController.getServerById);
router.post('/admin/servers', authenticateAdmin, serverController.validateServer(), serverController.createServer);
router.put('/admin/servers/:id', authenticateAdmin, serverController.validateServer(), serverController.updateServer);
router.delete('/admin/servers/:id', authenticateAdmin, serverController.deleteServer);
router.get('/admin/servers/:id/test', authenticateAdmin, serverController.testServerConnection);

// Notifications (accessible by both admins and users)
router.get('/notifications', authenticateAdminOrUser, notificationController.getUserNotifications);
router.get('/notifications/unread-count', authenticateAdminOrUser, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticateAdminOrUser, notificationController.markAsRead);
router.put('/notifications/read-all', authenticateAdminOrUser, notificationController.markAllAsRead);
router.post('/admin/notifications', authenticateAdmin, notificationController.createNotification);

// API Settings
router.get('/admin/settings/api', authenticateAdmin, apiSettingsController.getSettings);
router.post('/admin/settings/api', authenticateAdmin, apiSettingsController.updateSettings);

// Public/User endpoints
router.get('/categories', apiLimiter, authenticateUser, checkSubscription, categoryController.getAllCategories);
router.get('/categories/:slug/channels', apiLimiter, authenticateUser, checkSubscription, channelController.getChannelsByCategory);
router.get('/plans', apiLimiter, subscriptionController.getAllPlans);

// Bootstrap endpoints (admin only)
router.post('/admin/bootstrap/run', authenticateAdmin, async (req, res) => {
    try {
        const bootstrapService = require('../services/bootstrapService');
        const result = await bootstrapService.runBootstrap();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/admin/bootstrap/reset', authenticateAdmin, async (req, res) => {
    try {
        const bootstrapService = require('../services/bootstrapService');
        const result = await bootstrapService.resetBootstrap();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/admin/bootstrap/status', authenticateAdmin, async (req, res) => {
    try {
        const bootstrapService = require('../services/bootstrapService');
        const completed = await bootstrapService.isBootstrapCompleted();
        res.json({ success: true, completed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
