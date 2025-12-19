/**
 * Subscription Check Cron Job
 * Checks for expiring and expired subscriptions and creates notifications
 * 
 * Run this script daily via cron:
 * 0 0 * * * node /path/to/checkSubscriptions.js
 */

const { initEnv } = require('../config/env');
initEnv();

const { pool } = require('../config/database');
const notificationController = require('../controllers/notificationController');
const logger = require('../utils/logger');

async function main() {
    try {
        logger.info('Starting subscription check...');

        // Check for expiring subscriptions
        await notificationController.checkExpiringSubscriptions();

        // Check for expired subscriptions
        await notificationController.checkExpiredSubscriptions();

        logger.info('Subscription check completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Subscription check failed:', { error: error.message });
        process.exit(1);
    }
}

main();
