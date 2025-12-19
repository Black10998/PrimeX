/**
 * Fix Notifications Table Schema
 * Adds title and message columns, migrates data from bilingual columns
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixNotificationsSchema() {
    console.log('🔧 Fixing notifications table schema...\n');

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database\n');

        // Check current schema
        console.log('1️⃣ Checking current notifications table schema...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
        `, [process.env.DB_NAME]);

        const columnNames = columns.map(c => c.COLUMN_NAME);
        console.log('   Current columns:', columnNames.join(', '));

        const hasTitle = columnNames.includes('title');
        const hasMessage = columnNames.includes('message');
        const hasTitleEn = columnNames.includes('title_en');
        const hasMessageEn = columnNames.includes('message_en');

        if (hasTitle && hasMessage) {
            console.log('   ✅ Table already has title and message columns\n');
            return;
        }

        // Add new columns if they don't exist
        if (!hasTitle) {
            console.log('\n2️⃣ Adding title column...');
            await connection.query(`
                ALTER TABLE notifications 
                ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER type
            `);
            console.log('   ✅ Added title column');
        }

        if (!hasMessage) {
            console.log('\n3️⃣ Adding message column...');
            await connection.query(`
                ALTER TABLE notifications 
                ADD COLUMN message TEXT DEFAULT NULL AFTER title
            `);
            console.log('   ✅ Added message column');
        }

        // Migrate data from old columns if they exist
        if (hasTitleEn && hasMessageEn) {
            console.log('\n4️⃣ Migrating data from bilingual columns...');
            
            // Copy English versions to new columns
            await connection.query(`
                UPDATE notifications 
                SET title = title_en, message = message_en 
                WHERE title IS NULL OR message IS NULL
            `);
            console.log('   ✅ Migrated data from title_en and message_en');

            // Optional: Drop old columns (commented out for safety)
            // console.log('\n5️⃣ Dropping old bilingual columns...');
            // await connection.query('ALTER TABLE notifications DROP COLUMN title_en');
            // await connection.query('ALTER TABLE notifications DROP COLUMN title_ar');
            // await connection.query('ALTER TABLE notifications DROP COLUMN message_en');
            // await connection.query('ALTER TABLE notifications DROP COLUMN message_ar');
            // console.log('   ✅ Dropped old columns');
        }

        // Make columns NOT NULL after migration
        console.log('\n5️⃣ Setting columns to NOT NULL...');
        await connection.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN title VARCHAR(255) NOT NULL
        `);
        await connection.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN message TEXT NOT NULL
        `);
        console.log('   ✅ Columns set to NOT NULL');

        // Verify final schema
        console.log('\n6️⃣ Verifying final schema...');
        const [finalColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);

        console.log('\n   Final schema:');
        finalColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        console.log('\n🎉 Notifications table schema fixed successfully!\n');

    } catch (error) {
        console.error('❌ Schema fix failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixNotificationsSchema();
