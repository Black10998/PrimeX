/**
 * PrimeX IPTV System v11.0 - Setup Routes
 * 
 * One-time setup endpoint for initial admin creation
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setup.controller');

// Check setup status
router.get('/status', setupController.checkStatus.bind(setupController));

// Initialize system (create first admin)
router.post('/initialize', setupController.initialize.bind(setupController));

module.exports = router;
