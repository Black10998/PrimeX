/**
 * Apply Database Schema Fix
 * Adds all missing columns and creates missing tables
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applySchemaFix() {
    console.log('🔧 Applying database schema fixes...\n');

    let connection;
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to database\n');

        // Fix admin_users table - add missing column
        console.log('1️⃣ Fixing admin_users table...');
        try {
            await connection.query(`
                ALTER TABLE admin_users 
                ADD COLUMN two_factor_enabled_at DATETIME DEFAULT NULL AFTER two_factor_backup_codes
            `);
            console.log('   ✅ Added two_factor_enabled_at column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('   ℹ️  Column already exists');
            } else {
                throw error;
            }
        }

        // Create admin_sessions table
        console.log('\n2️⃣ Creating admin_sessions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                admin_id INT NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                device_info VARCHAR(255),
                browser VARCHAR(100),
                os VARCHAR(100),
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
                INDEX idx_admin_id (admin_id),
                INDEX idx_token_hash (token_hash),
                INDEX idx_expires_at (expires_at),
                INDEX idx_last_activity (last_activity)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ admin_sessions table ready');

        // Create user_devices table
        console.log('\n3️⃣ Creating user_devices table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_devices (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                device_id VARCHAR(255) NOT NULL,
                device_name VARCHAR(100),
                device_type VARCHAR(50),
                mac_address VARCHAR(17),
                ip_address VARCHAR(45),
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_device (user_id, device_id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_last_seen (last_seen)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ user_devices table ready');

        // Create notifications table
        console.log('\n4️⃣ Creating notifications table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT DEFAULT NULL,
                admin_id INT DEFAULT NULL,
                type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                read_at DATETIME DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_admin_id (admin_id),
                INDEX idx_is_read (is_read),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ notifications table ready');

        // Verify schema
        console.log('\n5️⃣ Verifying schema...');
        
        const [adminCols] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users'
        `, [process.env.DB_NAME]);
        
        const hasEnabledAt = adminCols.some(col => col.COLUMN_NAME === 'two_factor_enabled_at');
        console.log(`   ${hasEnabledAt ? '✅' : '❌'} admin_users.two_factor_enabled_at`);

        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('admin_sessions', 'user_devices', 'notifications')
        `, [process.env.DB_NAME]);
        
        const tableNames = tables.map(t => t.TABLE_NAME);
        console.log(`   ${tableNames.includes('admin_sessions') ? '✅' : '❌'} admin_sessions table`);
        console.log(`   ${tableNames.includes('user_devices') ? '✅' : '❌'} user_devices table`);
        console.log(`   ${tableNames.includes('notifications') ? '✅' : '❌'} notifications table`);

        console.log('\n🎉 Database schema fix completed successfully!\n');

    } catch (error) {
        console.error('❌ Schema fix failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

applySchemaFix();
