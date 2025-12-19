/**
 * Test Setup Service
 * 
 * Quick test to verify setup service works correctly
 */

require('dotenv').config();

async function testSetup() {
    console.log('🧪 Testing Setup Service...\n');

    try {
        // Test 1: Check if setup service loads
        console.log('1️⃣ Loading setup service...');
        const setupService = require('./src/services/setup.service');
        console.log('✅ Setup service loaded\n');

        // Test 2: Check setup status
        console.log('2️⃣ Checking setup status...');
        const status = await setupService.checkSetupStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        console.log('✅ Setup status check works\n');

        // Test 3: Verify bcrypt is available
        console.log('3️⃣ Testing bcrypt...');
        const bcrypt = require('bcrypt');
        const testPassword = 'TestPassword123!';
        const hash = await bcrypt.hash(testPassword, 10);
        const match = await bcrypt.compare(testPassword, hash);
        console.log('Hash generated:', hash.substring(0, 20) + '...');
        console.log('Password match:', match);
        console.log('✅ Bcrypt works correctly\n');

        // Test 4: Check database connection
        console.log('4️⃣ Testing database connection...');
        const { pool } = require('./src/config/database');
        const [result] = await pool.query('SELECT 1 as test');
        console.log('Database query result:', result);
        console.log('✅ Database connection works\n');

        console.log('🎉 All tests passed!\n');
        console.log('📋 Summary:');
        console.log('   - Setup service: ✅');
        console.log('   - Status check: ✅');
        console.log('   - Bcrypt hashing: ✅');
        console.log('   - Database connection: ✅');
        console.log('\n✨ Ready for deployment!\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

testSetup();
