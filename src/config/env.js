/**
 * PrimeX IPTV System - Environment Configuration Validator
 * 
 * ARCHITECTURE DECISION:
 * - Validate ALL required environment variables at startup
 * - Fail fast if configuration is invalid
 * - No silent fallbacks or defaults
 * - Clear error messages for missing configuration
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
function loadEnv() {
    const envPath = path.join(__dirname, '../../.env');
    
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log('✅ Environment file loaded:', envPath);
    } else {
        console.log('ℹ️  No .env file found, using system environment variables');
        console.log('   Expected location:', envPath);
        console.log('   Ensure environment variables are set via PM2 or shell');
    }
}

// Validate required environment variables
function validateEnv() {
    console.log('\n🔍 Validating environment configuration...\n');
    
    const required = {
        // Database (CRITICAL)
        DB_HOST: 'Database host',
        DB_PORT: 'Database port',
        DB_NAME: 'Database name (must be: primex)',
        DB_USER: 'Database user',
        DB_PASSWORD: 'Database password',
        
        // JWT (CRITICAL)
        JWT_SECRET: 'JWT secret key',
        JWT_REFRESH_SECRET: 'JWT refresh secret key',
        
        // Admin (CRITICAL)
        ADMIN_USERNAME: 'Admin username',
        ADMIN_PASSWORD: 'Admin password',
        ADMIN_EMAIL: 'Admin email'
    };
    
    // Set defaults for server configuration
    if (!process.env.PORT) {
        process.env.PORT = '3000';
        console.log('   ℹ️  PORT not set, using default: 3000');
    }
    if (!process.env.HOST) {
        process.env.HOST = '0.0.0.0';
        console.log('   ℹ️  HOST not set, using default: 0.0.0.0');
    }
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production';
        console.log('   ℹ️  NODE_ENV not set, using default: production');
    }
    
    const errors = [];
    const warnings = [];
    
    // Check required variables
    for (const [key, description] of Object.entries(required)) {
        if (!process.env[key]) {
            errors.push(`   ❌ ${key} - ${description}`);
        } else {
            console.log(`   ✅ ${key}`);
        }
    }
    
    // Validate database name
    if (process.env.DB_NAME && process.env.DB_NAME !== 'primex') {
        warnings.push(`   ⚠️  DB_NAME should be 'primex' (current: ${process.env.DB_NAME})`);
    }
    
    // Validate JWT secrets length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        warnings.push('   ⚠️  JWT_SECRET should be at least 32 characters');
    }
    
    if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
        warnings.push('   ⚠️  JWT_REFRESH_SECRET should be at least 32 characters');
    }
    
    // Check for default passwords
    if (process.env.ADMIN_PASSWORD === 'CHANGE_THIS_IMMEDIATELY' || 
        process.env.ADMIN_PASSWORD === 'admin123') {
        warnings.push('   ⚠️  ADMIN_PASSWORD is using default value - CHANGE IT!');
    }
    
    // Display results
    console.log('');
    
    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:\n');
        warnings.forEach(w => console.log(w));
        console.log('');
    }
    
    if (errors.length > 0) {
        console.error('❌ CONFIGURATION ERRORS:\n');
        errors.forEach(e => console.error(e));
        console.error('\n❌ Fix the above errors in your .env file and restart\n');
        process.exit(1);
    }
    
    console.log('✅ Environment configuration valid\n');
}

// Get configuration summary
function getConfig() {
    return {
        env: process.env.NODE_ENV || 'development',
        server: {
            host: process.env.HOST || '0.0.0.0',
            port: parseInt(process.env.PORT) || 3000
        },
        database: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            name: process.env.DB_NAME,
            user: process.env.DB_USER
        },
        admin: {
            username: process.env.ADMIN_USERNAME,
            email: process.env.ADMIN_EMAIL
        },
        security: {
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
        }
    };
}

// Initialize environment
function initEnv() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║              🎬 PrimeX IPTV System 🎬                  ║');
    console.log('║                   Developer: PAX                       ║');
    console.log('║              Support: info@paxdes.com                  ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    loadEnv();
    validateEnv();
    
    const config = getConfig();
    
    console.log('📋 Configuration Summary:');
    console.log(`   Environment: ${config.env}`);
    console.log(`   Server: ${config.server.host}:${config.server.port}`);
    console.log(`   Database: ${config.database.user}@${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`   Admin: ${config.admin.username} (${config.admin.email})`);
    console.log('');
    
    return config;
}

module.exports = { initEnv, getConfig };
