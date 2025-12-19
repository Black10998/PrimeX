/**
 * PrimeX IPTV System - Automatic Initialization
 * 
 * Runs on every server startup to ensure system is ready:
 * - Creates admin user if admin_users table is empty
 * - Uses environment variables for credentials
 * - No manual intervention required
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const logger = require('./logger');

/**
 * Initialize admin user if needed
 */
async function initializeAdmin() {
    try {
        console.log('🔍 Checking admin user...');
        
        // Check if admin_users table exists
        try {
            await pool.query('SELECT 1 FROM admin_users LIMIT 1');
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('⚠️  admin_users table does not exist');
                console.log('   Run: npm run init-db to create database schema');
                return false;
            }
            throw error;
        }
        
        // Check if any admin exists
        const [admins] = await pool.query('SELECT COUNT(*) as count FROM admin_users');
        
        if (admins[0].count > 0) {
            console.log('✅ Admin user exists');
            return true;
        }
        
        // No admin exists - create one automatically
        console.log('📝 No admin user found - creating automatically...');
        
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const email = process.env.ADMIN_EMAIL || 'info@paxdes.com';
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, bcryptRounds);
        
        // Insert admin user (let auto-increment handle ID)
        try {
            await pool.query(
                `INSERT INTO admin_users (username, password, email, role, status, created_at) 
                 VALUES (?, ?, ?, 'super_admin', 'active', NOW())`,
                [username, hashedPassword, email]
            );
            
            console.log('✅ Admin user created successfully');
            console.log(`   Username: ${username}`);
            console.log(`   Email: ${email}`);
            console.log('   Password: (from ADMIN_PASSWORD env variable)');
            
            logger.info('Admin user auto-created', { username, email });
            
            return true;
        } catch (insertError) {
            if (insertError.code === 'ER_DUP_ENTRY') {
                console.log('✅ Admin user already exists (duplicate entry)');
                return true;
            }
            throw insertError;
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize admin user:', error.message);
        logger.error('Admin initialization failed', { error: error.message });
        return false;
    }
}

/**
 * Run all automatic initialization tasks
 */
async function autoInitialize() {
    try {
        console.log('\n🔧 Running automatic initialization...\n');
        
        await initializeAdmin();
        
        console.log('');
        return true;
        
    } catch (error) {
        console.error('❌ Auto-initialization failed:', error.message);
        logger.error('Auto-initialization failed', { error: error.message });
        return false;
    }
}

module.exports = { autoInitialize, initializeAdmin };
