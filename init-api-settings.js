/**
 * Initialize API Settings
 * Sets default API Base URL in database
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function initAPISettings() {
    console.log('🔧 Initializing API Settings...\n');

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database\n');

        // Set default API Base URL
        const apiBaseUrl = process.env.APP_URL || 'https://prime-x.live';
        
        await connection.query(`
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
            VALUES ('xtream_base_url', ?, 'string', 'Base URL for Xtream Codes API and M3U generation')
            ON DUPLICATE KEY UPDATE 
                setting_value = IF(setting_value = 'http://your-domain.com' OR setting_value IS NULL, VALUES(setting_value), setting_value)
        `, [apiBaseUrl]);

        console.log(`✅ API Base URL set to: ${apiBaseUrl}`);

        // Set other default settings
        await connection.query(`
            INSERT INTO system_settings (setting_key, setting_value, setting_type)
            VALUES 
                ('enable_xtream_api', 'true', 'boolean'),
                ('enable_m3u', 'true', 'boolean'),
                ('api_version', 'v1', 'string'),
                ('rate_limit', '100', 'number')
            ON DUPLICATE KEY UPDATE setting_key = setting_key
        `);

        console.log('✅ Default API settings initialized\n');

        // Verify settings
        const [settings] = await connection.query(`
            SELECT setting_key, setting_value 
            FROM system_settings 
            WHERE setting_key IN ('xtream_base_url', 'enable_xtream_api', 'enable_m3u')
        `);

        console.log('📊 Current API Settings:');
        settings.forEach(setting => {
            console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
        });

        console.log('\n🎉 API settings initialization complete!\n');

    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initAPISettings();
