const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeSecurityTables() {
    try {
        // Check if security_events table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'security_events'");
        
        if (tables.length === 0) {
            console.log('🔐 Initializing security monitoring tables...');
            
            const migrationPath = path.join(__dirname, '../migrations/011_security_events.sql');
            const sql = fs.readFileSync(migrationPath, 'utf8');
            
            await db.query(sql);
            
            console.log('✅ Security monitoring tables created successfully');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Failed to initialize security tables:', error.message);
        // Don't throw - allow server to start even if security tables fail
        return false;
    }
}

module.exports = { initializeSecurityTables };
