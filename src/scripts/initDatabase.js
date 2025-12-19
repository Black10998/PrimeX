#!/usr/bin/env node

/**
 * PrimeX IPTV System - Database Initialization Script
 * 
 * ARCHITECTURE:
 * - Creates database if not exists
 * - Runs schema.sql to create tables
 * - Inserts default data (plans, categories, admin)
 * - Uses environment variables (NO hardcoded values)
 * 
 * Usage: npm run init-db
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Load environment
const { initEnv } = require('../config/env');
initEnv();

async function initDatabase() {
    let connection;
    
    try {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                                                        ║');
        console.log('║         PrimeX IPTV - Database Initialization         ║');
        console.log('║                                                        ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        // Connect to MySQL (without database selection)
        console.log('🔄 Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true,
            charset: 'utf8mb4'
        });

        console.log('✅ Connected to MySQL server');
        console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`   User: ${process.env.DB_USER}\n`);

        // Create database
        console.log(`🔄 Creating database '${process.env.DB_NAME}'...`);
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✅ Database '${process.env.DB_NAME}' ready\n`);

        // Use database
        await connection.query(`USE ${process.env.DB_NAME}`);

        console.log('🔄 Loading database schema...\n');

        // Verify schema file exists
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        if (!schema || schema.trim().length === 0) {
            throw new Error('Schema file is empty');
        }

        console.log(`✅ Schema file loaded: ${schemaPath}`);
        console.log(`   File size: ${schema.length} bytes\n`);

        console.log('🔄 Executing database schema...\n');

        // Execute entire schema file using multipleStatements
        // This is the CORRECT way - let MySQL handle the parsing
        try {
            await connection.query(schema);
            console.log('✅ Database schema executed successfully\n');
        } catch (error) {
            // If error is about existing tables, that's OK
            if (!error.message.includes('already exists')) {
                console.error('❌ Schema execution error:', error.message);
                throw error;
            }
            console.log('✅ Database schema executed (some tables already exist)\n');
        }

        // CRITICAL: Verify admin_users table exists before attempting insert
        console.log('🔄 Verifying admin_users table exists...');
        
        try {
            await connection.query('DESCRIBE admin_users');
            console.log('✅ admin_users table verified\n');
        } catch (error) {
            console.error('❌ FATAL: admin_users table does not exist after schema execution');
            console.error('   This indicates a problem with schema.sql execution');
            throw error;
        }

        // Now safe to create admin user
        console.log('🔄 Creating admin user...');

        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await connection.query(
            'INSERT IGNORE INTO admin_users (id, username, password, email, role) VALUES (1, ?, ?, ?, ?)',
            [
                process.env.ADMIN_USERNAME || 'admin',
                hashedPassword,
                process.env.ADMIN_EMAIL || 'info@paxdes.com',
                'super_admin'
            ]
        );

        console.log('✅ Super admin account created/verified');
        console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');

        const [planCount] = await connection.query('SELECT COUNT(*) as count FROM subscription_plans');
        
        if (planCount[0].count === 0) {
            await connection.query(`
                INSERT INTO subscription_plans (name_en, name_ar, duration_days, price, max_devices, features) VALUES
                ('Weekly Plan', 'خطة أسبوعية', 7, 9.99, 1, '{"channels": "all", "vod": true}'),
                ('Monthly Plan', 'خطة شهرية', 30, 29.99, 2, '{"channels": "all", "vod": true, "epg": true}'),
                ('Yearly Plan', 'خطة سنوية', 365, 299.99, 3, '{"channels": "all", "vod": true, "epg": true, "priority_support": true}')
            `);
            console.log('✅ Default subscription plans created');
        }

        const [categoryCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
        
        if (categoryCount[0].count === 0) {
            await connection.query(`
                INSERT INTO categories (name_en, name_ar, slug, sort_order) VALUES
                ('Arabic Channels', 'القنوات العربية', 'arabic-channels', 1),
                ('Gulf Channels', 'قنوات الخليج', 'gulf-channels', 2),
                ('UAE Channels', 'قنوات الإمارات', 'uae-channels', 3),
                ('Syrian Channels', 'القنوات السورية', 'syrian-channels', 4),
                ('Sports Channels', 'القنوات الرياضية', 'sports-channels', 5),
                ('Live Matches', 'المباريات المباشرة', 'live-matches', 6),
                ('Series', 'المسلسلات', 'series', 7),
                ('Movies', 'الأفلام', 'movies', 8),
                ('Latest Content', 'أحدث المحتوى', 'latest-content', 9),
                ('Classic Content', 'المحتوى الكلاسيكي', 'classic-content', 10)
            `);
            console.log('✅ Default categories created');
        }

        const [settingsCount] = await connection.query('SELECT COUNT(*) as count FROM system_settings');
        
        if (settingsCount[0].count === 0) {
            await connection.query(`
                INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
                ('site_name_en', 'PrimeX TV', 'string', 'Site name in English'),
                ('site_name_ar', 'برايم إكس تي في', 'string', 'Site name in Arabic'),
                ('support_email', 'info@paxdes.com', 'string', 'Support email address'),
                ('default_language', 'en', 'string', 'Default system language'),
                ('max_login_attempts', '5', 'integer', 'Maximum login attempts before lockout'),
                ('session_timeout', '3600', 'integer', 'Session timeout in seconds'),
                ('enable_device_binding', '1', 'boolean', 'Enable device binding'),
                ('enable_epg', '1', 'boolean', 'Enable EPG functionality'),
                ('payment_methods', '["credit_card", "bank_transfer", "paypal"]', 'json', 'Available payment methods')
            `);
            console.log('✅ System settings initialized');
        }

        // Final verification
        console.log('🔄 Running final verification...\n');

        const requiredTables = [
            'users', 'admin_users', 'subscription_plans', 'subscription_codes',
            'categories', 'channels', 'streaming_servers', 'activity_logs'
        ];

        let allTablesExist = true;
        for (const table of requiredTables) {
            try {
                await connection.query(`DESCRIBE ${table}`);
                console.log(`   ✅ ${table}`);
            } catch (error) {
                console.error(`   ❌ ${table} - MISSING!`);
                allTablesExist = false;
            }
        }

        if (!allTablesExist) {
            throw new Error('Some required tables are missing. Database initialization incomplete.');
        }

        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                                                        ║');
        console.log('║        ✅ Database Initialization Complete! ✅         ║');
        console.log('║                                                        ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log('Next steps:');
        console.log('1. Run: npm run generate-codes (to create 200 subscription codes)');
        console.log('2. Run: npm start (to start the server)');
        console.log('3. Access admin panel and change the default password\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
