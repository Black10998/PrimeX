/**
 * Update Admin Password Script
 * Sets admin credentials to: admin / PAX430550!!!
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function updateAdminPassword() {
    let connection;
    
    try {
        console.log('Connecting to database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database');

        const username = 'admin';
        const password = 'PAX430550!!!';
        const email = 'info@paxdes.com';

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin exists
        const [admins] = await connection.execute(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        if (admins.length > 0) {
            // Update existing admin
            console.log('Updating existing admin...');
            await connection.execute(
                'UPDATE admins SET password = ?, email = ? WHERE username = ?',
                [hashedPassword, email, username]
            );
            console.log('✅ Admin password updated successfully');
        } else {
            // Create new admin
            console.log('Creating new admin...');
            await connection.execute(
                'INSERT INTO admins (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
                [username, hashedPassword, email, 'super_admin', 'active']
            );
            console.log('✅ Admin created successfully');
        }

        console.log('\n=================================');
        console.log('Admin Credentials:');
        console.log('Username: admin');
        console.log('Password: PAX430550!!!');
        console.log('=================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateAdminPassword();
