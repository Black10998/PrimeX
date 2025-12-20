#!/usr/bin/env node

/**
 * Test Database Interface
 * Verifies that both db.query() and pool.query() work correctly
 */

const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testDatabaseInterface() {
    console.log('🧪 Testing Database Interface\n');
    
    try {
        // Test 1: Import db (default export)
        console.log('[1/4] Testing default export (db)...');
        const db = require('../src/config/database');
        
        if (typeof db.query !== 'function') {
            throw new Error('❌ db.query is not a function');
        }
        console.log('✅ db.query is a function');
        
        // Test 2: Import pool (named export)
        console.log('\n[2/4] Testing named export (pool)...');
        const { pool } = require('../src/config/database');
        
        if (typeof pool.query !== 'function') {
            throw new Error('❌ pool.query is not a function');
        }
        console.log('✅ pool.query is a function');
        
        // Test 3: Execute query with db
        console.log('\n[3/4] Testing db.query() execution...');
        const [rows1] = await db.query('SELECT 1 as test');
        
        if (rows1[0].test !== 1) {
            throw new Error('❌ db.query() returned unexpected result');
        }
        console.log('✅ db.query() works correctly');
        
        // Test 4: Execute query with pool
        console.log('\n[4/4] Testing pool.query() execution...');
        const [rows2] = await pool.query('SELECT 2 as test');
        
        if (rows2[0].test !== 2) {
            throw new Error('❌ pool.query() returned unexpected result');
        }
        console.log('✅ pool.query() works correctly');
        
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                                                        ║');
        console.log('║            ✅ All Tests Passed ✅                      ║');
        console.log('║                                                        ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('\nDatabase interface is working correctly!');
        console.log('Both db.query() and pool.query() are functional.\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

testDatabaseInterface();
