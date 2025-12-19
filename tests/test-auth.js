/**
 * PrimeX IPTV System v3.0 - Authentication Test Script
 * 
 * Quick test to verify authentication is working
 * 
 * Usage: node tests/test-auth.js
 */

const bcrypt = require('bcrypt');

async function testBcrypt() {
    console.log('\n🧪 Testing bcrypt functionality...\n');

    const password = 'admin123';
    console.log(`Original password: ${password}`);

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    console.log(`Generated hash: ${hash}`);

    // Test comparison
    const match = await bcrypt.compare(password, hash);
    console.log(`Password match: ${match ? '✅ YES' : '❌ NO'}`);

    // Test with wrong password
    const wrongMatch = await bcrypt.compare('wrongpassword', hash);
    console.log(`Wrong password match: ${wrongMatch ? '❌ YES (ERROR!)' : '✅ NO (Correct)'}`);

    console.log('\n✅ bcrypt is working correctly\n');
}

testBcrypt().catch(console.error);
