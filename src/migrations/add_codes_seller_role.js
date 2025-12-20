/**
 * PrimeX IPTV - Migration: Add codes_seller role
 * 
 * Adds 'codes_seller' role to admin_users table
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function migrate() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        logger.info('Starting migration: Add codes_seller role');

        // Alter admin_users table to add codes_seller role
        await connection.query(`
            ALTER TABLE admin_users 
            MODIFY COLUMN role ENUM('super_admin', 'admin', 'moderator', 'codes_seller') 
            DEFAULT 'super_admin'
        `);

        logger.info('Migration completed: codes_seller role added successfully');
        
        return {
            success: true,
            message: 'codes_seller role added to admin_users table'
        };

    } catch (error) {
        // Check if error is because role already exists
        if (error.message.includes('Duplicate entry') || error.message.includes('already exists')) {
            logger.info('Migration skipped: codes_seller role already exists');
            return {
                success: true,
                message: 'codes_seller role already exists'
            };
        }

        logger.error('Migration failed:', { error: error.message });
        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate()
        .then(result => {
            console.log('✅', result.message);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        });
}

module.exports = { migrate };
