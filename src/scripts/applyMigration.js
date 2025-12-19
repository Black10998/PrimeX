/**
 * Apply database migration for user content assignment
 */

const { initEnv } = require('../config/env');
initEnv();

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function applyMigration() {
    try {
        logger.info('Applying user content assignment migration...');

        const migrationPath = path.join(__dirname, '../../database/migrations/add_user_content_assignment.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            try {
                await pool.query(statement);
                logger.info('Executed statement successfully');
            } catch (error) {
                // Ignore "table already exists" errors
                if (!error.message.includes('already exists')) {
                    throw error;
                }
                logger.info('Table already exists, skipping...');
            }
        }

        logger.info('Migration applied successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Migration failed:', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

applyMigration();
