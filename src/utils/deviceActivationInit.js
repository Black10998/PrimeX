const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeDeviceActivationTables() {
    try {
        // Check if device_activations table exists with correct schema
        const [tables] = await db.query("SHOW TABLES LIKE 'device_activations'");
        
        if (tables.length === 0) {
            console.log('📱 Initializing 4K Player-style device activation tables...');
            
            const migrationPath = path.join(__dirname, '../migrations/013_device_activation_4k_style.sql');
            const sql = fs.readFileSync(migrationPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = sql.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await db.query(statement);
                }
            }
            
            console.log('✅ Device activation tables created successfully');
            console.log('   - device_activations (4K Player style)');
            console.log('   - device_activation_history');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Failed to initialize device activation tables:', error.message);
        return false;
    }
}

module.exports = { initializeDeviceActivationTables };
