/**
 * PrimeX IPTV System - Database Configuration
 * 
 * ARCHITECTURE DECISION:
 * - Single database connection pool (mysql2/promise)
 * - NO hardcoded defaults - fails if env vars missing
 * - Connection pool shared across entire application
 * - utf8mb4 charset for proper Arabic support
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const mysql = require('mysql2/promise');

// Validate required environment variables
function validateEnv() {
    const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Database environment variables validated');
}

// Create connection pool
function createPool() {
    validateEnv();
    
    const config = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        charset: 'utf8mb4',
        timezone: '+00:00'
    };
    
    console.log(`📊 Creating database pool: ${config.user}@${config.host}:${config.port}/${config.database}`);
    
    const pool = mysql.createPool(config);
    
    // Log new connections (debug only)
    pool.on('connection', (connection) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔗 New database connection established');
        }
    });
    
    // Log pool errors
    pool.on('error', (err) => {
        console.error('❌ Database pool error:', err.message);
    });
    
    return pool;
}

// Test database connection
async function testConnection(pool) {
    try {
        console.log('🔄 Testing database connection...');
        const connection = await pool.getConnection();
        
        // Test query
        await connection.query('SELECT 1');
        
        console.log('✅ Database connection successful');
        console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   User: ${process.env.DB_USER}`);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Check your .env file and ensure MySQL is running');
        return false;
    }
}

// Initialize and export pool
let pool;

try {
    pool = createPool();
} catch (error) {
    console.error('❌ Failed to create database pool:', error.message);
    process.exit(1);
}

module.exports = { pool, testConnection };
