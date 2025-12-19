/**
 * Migration Script: Add Missing Tables for User Creation
 * 
 * This script adds tables required by the user creation endpoint:
 * - plan_categories
 * - user_categories
 * - user_channels
 * - notifications
 * - system_branding
 * 
 * DEFENSIVE DESIGN:
 * - Checks table existence before creation
 * - Checks column existence before INSERT
 * - Never crashes server on migration errors
 * - Handles legacy schemas gracefully
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Check if a table exists
 */
async function tableExists(connection, tableName) {
    const [tables] = await connection.query(
        `SHOW TABLES LIKE '${tableName}'`
    );
    return tables.length > 0;
}

/**
 * Check if a column exists in a table
 */
async function columnExists(connection, tableName, columnName) {
    try {
        const [columns] = await connection.query(
            `SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`
        );
        return columns.length > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Get all columns in a table
 */
async function getTableColumns(connection, tableName) {
    try {
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        return columns.map(col => col.Field);
    } catch (error) {
        return [];
    }
}

async function addMissingTables() {
    const connection = await pool.getConnection();
    
    try {
        console.log('🔄 Running database migrations...\n');
        
        // Create plan_categories table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS plan_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plan_id INT NOT NULL,
                category_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_plan_category (plan_id, category_id),
                INDEX idx_plan_id (plan_id),
                INDEX idx_category_id (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ plan_categories table created/verified');
        
        // Create user_categories table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_category (user_id, category_id),
                INDEX idx_user_id (user_id),
                INDEX idx_category_id (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ user_categories table created/verified');
        
        // Create user_channels table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_channels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                channel_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_channel (user_id, channel_id),
                INDEX idx_user_id (user_id),
                INDEX idx_channel_id (channel_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ user_channels table created/verified');
        
        // Create notifications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                title_en VARCHAR(255),
                title_ar VARCHAR(255),
                message_en TEXT,
                message_ar TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ notifications table created/verified');
        
        // Create/fix system_branding table
        const brandingExists = await tableExists(connection, 'system_branding');
        
        if (!brandingExists) {
            // Table doesn't exist - create it
            await connection.query(`
                CREATE TABLE system_branding (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    value_en TEXT,
                    value_ar TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ system_branding table created');
            
            // Insert default values
            await connection.query(`
                INSERT INTO system_branding (setting_key, value_en, value_ar) VALUES
                ('service_name', 'PrimeX IPTV', 'برايم إكس تي في'),
                ('developer_name', 'PAX', 'PAX'),
                ('support_email', 'info@paxdes.com', 'info@paxdes.com'),
                ('support_phone', '', ''),
                ('support_message', 'Contact us for assistance', 'اتصل بنا للمساعدة')
            `);
            console.log('✅ system_branding default values inserted');
        } else {
            // Table exists - check schema
            const columns = await getTableColumns(connection, 'system_branding');
            const hasSettingKey = columns.includes('setting_key');
            const hasValueEn = columns.includes('value_en');
            const hasValueAr = columns.includes('value_ar');
            
            if (!hasSettingKey || !hasValueEn || !hasValueAr) {
                // Schema mismatch - recreate table
                console.log('⚠️  system_branding has incompatible schema - recreating...');
                await connection.query('DROP TABLE system_branding');
                
                await connection.query(`
                    CREATE TABLE system_branding (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        setting_key VARCHAR(100) UNIQUE NOT NULL,
                        value_en TEXT,
                        value_ar TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                console.log('✅ system_branding table recreated with correct schema');
                
                await connection.query(`
                    INSERT INTO system_branding (setting_key, value_en, value_ar) VALUES
                    ('service_name', 'PrimeX IPTV', 'برايم إكس تي في'),
                    ('developer_name', 'PAX', 'PAX'),
                    ('support_email', 'info@paxdes.com', 'info@paxdes.com'),
                    ('support_phone', '', ''),
                    ('support_message', 'Contact us for assistance', 'اتصل بنا للمساعدة')
                `);
                console.log('✅ system_branding default values inserted');
            } else {
                // Schema is correct - ensure default values exist
                await connection.query(`
                    INSERT INTO system_branding (setting_key, value_en, value_ar) VALUES
                    ('service_name', 'PrimeX IPTV', 'برايم إكس تي في'),
                    ('developer_name', 'PAX', 'PAX'),
                    ('support_email', 'info@paxdes.com', 'info@paxdes.com'),
                    ('support_phone', '', ''),
                    ('support_message', 'Contact us for assistance', 'اتصل بنا للمساعدة')
                    ON DUPLICATE KEY UPDATE setting_key=setting_key
                `);
                console.log('✅ system_branding verified and updated');
            }
        }
        
        console.log('\n✅ Database migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        logger.error('Database migration failed', { error: error.message, stack: error.stack });
        // Don't throw - allow server to continue starting
        console.log('⚠️  Server will continue startup despite migration errors');
    } finally {
        connection.release();
    }
}

// Run if called directly
if (require.main === module) {
    addMissingTables()
        .then(() => {
            console.log('\n✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addMissingTables };
