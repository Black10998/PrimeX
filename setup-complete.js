#!/usr/bin/env node

/**
 * PrimeX IPTV - Complete Setup Script
 * Handles database connection, admin creation, and verification
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupComplete() {
    log('\n========================================', 'blue');
    log('  PrimeX IPTV - Complete Setup', 'blue');
    log('========================================\n', 'blue');

    let connection;

    try {
        // Step 1: Check .env file
        log('[1/6] Checking .env configuration...', 'yellow');
        
        if (!fs.existsSync('.env')) {
            log('❌ .env file not found!', 'red');
            log('Creating .env from .env.example...', 'yellow');
            
            // Copy .env.example to .env
            fs.copyFileSync('.env.example', '.env');
            
            // Generate JWT secrets
            const jwtSecret = crypto.randomBytes(64).toString('hex');
            const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
            
            // Read .env
            let envContent = fs.readFileSync('.env', 'utf8');
            
            // Replace placeholders
            envContent = envContent.replace('YOUR_DATABASE_HOST', 'localhost');
            envContent = envContent.replace('CHANGE_THIS_PASSWORD', crypto.randomBytes(16).toString('hex'));
            envContent = envContent.replace('GENERATE_64_CHAR_SECRET_HERE', jwtSecret);
            envContent = envContent.replace('GENERATE_ANOTHER_64_CHAR_SECRET_HERE', jwtRefreshSecret);
            envContent = envContent.replace('CHANGE_THIS_IMMEDIATELY', 'PAX430550!!!');
            
            // Write back
            fs.writeFileSync('.env', envContent);
            
            log('✅ .env file created with default values', 'green');
            log('⚠️  Please update DB_HOST, DB_USER, and DB_PASSWORD in .env', 'yellow');
            
            // Reload environment
            require('dotenv').config();
        }

        // Verify required env vars
        const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
        const missing = required.filter(key => !process.env[key] || process.env[key].includes('CHANGE') || process.env[key].includes('GENERATE'));
        
        if (missing.length > 0) {
            log(`❌ Missing or invalid environment variables: ${missing.join(', ')}`, 'red');
            log('Please update .env file with correct values', 'yellow');
            process.exit(1);
        }

        log('✅ Environment configuration valid', 'green');

        // Step 2: Test database connection
        log('\n[2/6] Testing database connection...', 'yellow');
        
        try {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });

            await connection.ping();
            log('✅ Database connection successful', 'green');
        } catch (error) {
            log('❌ Database connection failed:', 'red');
            log(`   Error: ${error.message}`, 'red');
            log('\nPlease verify:', 'yellow');
            log(`   - DB_HOST: ${process.env.DB_HOST}`, 'yellow');
            log(`   - DB_USER: ${process.env.DB_USER}`, 'yellow');
            log(`   - DB_NAME: ${process.env.DB_NAME}`, 'yellow');
            log('   - DB_PASSWORD is correct', 'yellow');
            process.exit(1);
        }

        // Step 3: Check if admins table exists
        log('\n[3/6] Checking database schema...', 'yellow');
        
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'admins'"
        );

        if (tables.length === 0) {
            log('⚠️  Admins table not found. Creating...', 'yellow');
            
            await connection.query(`
                CREATE TABLE IF NOT EXISTS admins (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100),
                    role VARCHAR(50) DEFAULT 'admin',
                    status VARCHAR(20) DEFAULT 'active',
                    two_factor_secret VARCHAR(255),
                    two_factor_enabled BOOLEAN DEFAULT FALSE,
                    last_login DATETIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            log('✅ Admins table created', 'green');
        } else {
            log('✅ Admins table exists', 'green');
        }

        // Step 4: Remove existing admin
        log('\n[4/6] Cleaning up existing admin...', 'yellow');
        
        await connection.query('DELETE FROM admins WHERE username = ?', [process.env.ADMIN_USERNAME]);
        log('✅ Existing admin removed', 'green');

        // Step 5: Create new admin
        log('\n[5/6] Creating admin user...', 'yellow');
        
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;
        const email = process.env.ADMIN_EMAIL || 'info@paxdes.com';
        
        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        await connection.query(
            'INSERT INTO admins (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, 'super_admin', 'active']
        );
        
        log('✅ Admin user created successfully', 'green');

        // Step 6: Verify admin can be authenticated
        log('\n[6/6] Verifying admin authentication...', 'yellow');
        
        const [admins] = await connection.query(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        if (admins.length === 0) {
            log('❌ Admin verification failed - user not found', 'red');
            process.exit(1);
        }

        const admin = admins[0];
        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (!passwordMatch) {
            log('❌ Admin verification failed - password mismatch', 'red');
            process.exit(1);
        }

        log('✅ Admin authentication verified', 'green');

        // Success summary
        log('\n========================================', 'green');
        log('  ✅ Setup Complete!', 'green');
        log('========================================\n', 'green');

        log('Admin Credentials:', 'blue');
        log(`  Username: ${username}`, 'blue');
        log(`  Password: ${password}`, 'blue');
        log(`  Email: ${email}`, 'blue');
        log('');
        log('Database:', 'blue');
        log(`  Host: ${process.env.DB_HOST}`, 'blue');
        log(`  Database: ${process.env.DB_NAME}`, 'blue');
        log(`  User: ${process.env.DB_USER}`, 'blue');
        log('');
        log('Next Steps:', 'yellow');
        log('  1. Start the server: pm2 restart primex-iptv', 'yellow');
        log('  2. Access: https://prime-x.live/admin/login.html', 'yellow');
        log('  3. Login with the credentials above', 'yellow');
        log('');

    } catch (error) {
        log('\n❌ Setup failed:', 'red');
        log(`   ${error.message}`, 'red');
        if (error.stack) {
            log(`\n${error.stack}`, 'red');
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
setupComplete().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
