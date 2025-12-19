#!/usr/bin/env node

/**
 * PrimeX IPTV - Quick Admin Fix
 * Fixes admin user with correct credentials
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function fixAdmin() {
    console.log('\n🔧 Fixing admin user...\n');

    let connection;

    try {
        // Connect to database
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // Admin credentials
        const username = 'admin';
        const password = 'PAX430550!!!';
        const email = 'info@paxdes.com';

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Delete existing admin
        console.log('Removing existing admin...');
        await connection.query('DELETE FROM admins WHERE username = ?', [username]);

        // Create new admin
        console.log('Creating new admin...');
        await connection.query(
            'INSERT INTO admins (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, 'super_admin', 'active']
        );

        // Verify
        console.log('Verifying admin...');
        const [admins] = await connection.query('SELECT * FROM admins WHERE username = ?', [username]);
        
        if (admins.length === 0) {
            throw new Error('Admin not found after creation');
        }

        const passwordMatch = await bcrypt.compare(password, admins[0].password);
        if (!passwordMatch) {
            throw new Error('Password verification failed');
        }

        console.log('\n✅ Admin fixed successfully!\n');
        console.log('=================================');
        console.log('Admin Credentials:');
        console.log('  Username: admin');
        console.log('  Password: PAX430550!!!');
        console.log('=================================\n');
        console.log('Now restart PM2:');
        console.log('  pm2 restart primex-iptv\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPlease check:');
        console.error('  - Database credentials in .env');
        console.error('  - Database is running');
        console.error('  - Admins table exists\n');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixAdmin();
