const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeVODTables() {
    try {
        // Check if vod_categories table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'vod_categories'");
        
        if (tables.length === 0) {
            console.log('🎬 Initializing VOD/Series tables...');
            
            const migrationPath = path.join(__dirname, '../migrations/012_vod_series_support.sql');
            const sql = fs.readFileSync(migrationPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = sql.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await db.query(statement);
                }
            }
            
            console.log('✅ VOD/Series tables created successfully');
            console.log('   - vod_categories');
            console.log('   - movies');
            console.log('   - series');
            console.log('   - seasons');
            console.log('   - episodes');
            console.log('   - user_vod_history');
            console.log('   - user_favorites');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Failed to initialize VOD tables:', error.message);
        // Don't throw - allow server to start even if VOD tables fail
        return false;
    }
}

module.exports = { initializeVODTables };
