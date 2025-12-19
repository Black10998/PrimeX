/**
 * API Settings Controller
 * Manages Xtream API and system API configuration
 */

const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class APISettingsController {
    /**
     * Get API settings
     */
    async getSettings(req, res) {
        try {
            const [settings] = await pool.query(
                `SELECT setting_key, setting_value 
                 FROM system_settings 
                 WHERE setting_key LIKE 'api_%' OR setting_key LIKE 'xtream_%'`
            );

            const settingsObj = {};
            settings.forEach(setting => {
                try {
                    settingsObj[setting.setting_key] = JSON.parse(setting.setting_value);
                } catch {
                    settingsObj[setting.setting_key] = setting.setting_value;
                }
            });

            // Set defaults if not configured
            if (!settingsObj.xtream_base_url) {
                settingsObj.xtream_base_url = process.env.APP_URL || 'https://prime-x.live';
            }

            return res.json(formatResponse(true, settingsObj));
        } catch (error) {
            logger.error('Get API settings error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to load API settings'));
        }
    }

    /**
     * Update API settings
     */
    async updateSettings(req, res) {
        try {
            const settings = req.body;

            // Save each setting
            for (const [key, value] of Object.entries(settings)) {
                const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                
                await pool.query(
                    `INSERT INTO system_settings (setting_key, setting_value, setting_type) 
                     VALUES (?, ?, 'string')
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [key, settingValue]
                );
            }

            // Update .env file with base URL if changed
            if (settings.xtream_base_url) {
                // This would require fs module and proper env file handling
                // For now, we'll just store in database
                logger.info('API Base URL updated', { url: settings.xtream_base_url });
            }

            return res.json(formatResponse(true, null, 'API settings updated successfully'));
        } catch (error) {
            logger.error('Update API settings error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to update API settings'));
        }
    }
}

module.exports = new APISettingsController();
