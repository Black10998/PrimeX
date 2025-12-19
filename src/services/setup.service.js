/**
 * PrimeX IPTV System v11.0 - Setup Service
 * 
 * Handles initial system setup logic
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class SetupService {
    /**
     * Check if setup is already complete
     * @returns {Promise<Object>}
     */
    async checkSetupStatus() {
        try {
            // Check if admin_users table exists and has any records
            const [tables] = await pool.query(
                "SHOW TABLES LIKE 'admin_users'"
            );

            if (tables.length === 0) {
                // Table doesn't exist, setup not complete
                return {
                    success: true,
                    setup_complete: false,
                    message: 'Setup required'
                };
            }

            // Check if any admin users exist
            const [admins] = await pool.query(
                'SELECT COUNT(*) as count FROM admin_users'
            );

            const setupComplete = admins[0].count > 0;

            return {
                success: true,
                setup_complete: setupComplete,
                message: setupComplete ? 'Setup already complete' : 'Setup required'
            };

        } catch (error) {
            logger.error('Error checking setup status', { error: error.message });
            // If there's an error, assume setup is not complete
            return {
                success: true,
                setup_complete: false,
                message: 'Setup required'
            };
        }
    }

    /**
     * Create initial admin user
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async createInitialAdmin(username, email, password) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Create admin_users table if it doesn't exist
            await connection.query(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'super_admin',
                    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                    two_factor_enabled BOOLEAN DEFAULT FALSE,
                    two_factor_secret VARCHAR(255) DEFAULT NULL,
                    two_factor_backup_codes TEXT DEFAULT NULL,
                    two_factor_enabled_at DATETIME DEFAULT NULL,
                    last_login DATETIME DEFAULT NULL,
                    last_login_ip VARCHAR(45) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_email (email),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Check if admin already exists
            const [existing] = await connection.query(
                'SELECT id FROM admin_users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Admin user already exists'
                };
            }

            // Hash password with bcrypt (10 rounds)
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert admin user
            await connection.query(
                `INSERT INTO admin_users 
                (username, password, email, role, status) 
                VALUES (?, ?, ?, 'super_admin', 'active')`,
                [username, hashedPassword, email]
            );

            // Create other necessary tables
            await this.createSystemTables(connection);

            await connection.commit();

            logger.info('Initial admin created successfully', { username, email });

            return {
                success: true,
                message: 'Admin account created successfully',
                data: {
                    username,
                    email,
                    role: 'super_admin'
                }
            };

        } catch (error) {
            await connection.rollback();
            logger.error('Error creating initial admin', { error: error.message });
            
            return {
                success: false,
                message: 'Failed to create admin account: ' + error.message
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Create all necessary system tables
     * @param {Object} connection 
     */
    async createSystemTables(connection) {
        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                full_name VARCHAR(100),
                phone VARCHAR(20),
                status ENUM('active', 'inactive', 'suspended', 'expired') DEFAULT 'active',
                max_devices INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Subscriptions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                plan_id INT,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                status ENUM('active', 'expired', 'suspended', 'cancelled') DEFAULT 'active',
                auto_renew BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_end_date (end_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Plans table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS plans (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                duration_days INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                max_devices INT DEFAULT 1,
                features JSON,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Categories table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                name_ar VARCHAR(100),
                icon VARCHAR(255),
                sort_order INT DEFAULT 0,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_sort_order (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Channels table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS channels (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                category_id INT,
                stream_url TEXT NOT NULL,
                logo_url VARCHAR(255),
                epg_id VARCHAR(100),
                status ENUM('active', 'inactive') DEFAULT 'active',
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                INDEX idx_category_id (category_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // User devices table
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

        // Subscription codes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS subscription_codes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                plan_id INT,
                duration_days INT NOT NULL,
                status ENUM('unused', 'used', 'expired') DEFAULT 'unused',
                used_by INT DEFAULT NULL,
                used_at DATETIME DEFAULT NULL,
                expires_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_code (code),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Activity logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_type ENUM('admin', 'user') NOT NULL,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_type_id (user_type, user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // System settings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_setting_key (setting_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Admin sessions table
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

        // Notifications table
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

        logger.info('System tables created successfully');
    }
}

module.exports = new SetupService();
