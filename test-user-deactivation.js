/**
 * Test User Deactivation Flow
 * 
 * Verifies that deactivating a user immediately revokes access
 * 
 * Test Steps:
 * 1. Create test user
 * 2. Login and get token
 * 3. Verify access works
 * 4. Deactivate user
 * 5. Verify access is blocked (401/403)
 * 6. Cleanup
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let adminToken = '';
let testUserId = null;
let testUserToken = '';

async function log(message, data = null) {
    console.log(`\n[TEST] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

async function loginAdmin() {
    try {
        log('Step 1: Admin login...');
        const response = await axios.post(`${API_BASE}/auth/admin/login`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });
        
        if (response.data.success) {
            adminToken = response.data.data.token;
            log('✓ Admin logged in successfully');
            return true;
        }
        log('✗ Admin login failed', response.data);
        return false;
    } catch (error) {
        log('✗ Admin login error', error.response?.data || error.message);
        return false;
    }
}

async function createTestUser() {
    try {
        log('Step 2: Creating test user...');
        const response = await axios.post(
            `${API_BASE}/users`,
            {
                username: `test_deactivation_${Date.now()}`,
                password: 'test123',
                email: `test${Date.now()}@example.com`,
                status: 'active',
                subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                max_devices: 2
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        
        if (response.data.success) {
            testUserId = response.data.data.id;
            log('✓ Test user created', { userId: testUserId });
            return true;
        }
        log('✗ User creation failed', response.data);
        return false;
    } catch (error) {
        log('✗ User creation error', error.response?.data || error.message);
        return false;
    }
}

async function loginTestUser() {
    try {
        log('Step 3: Test user login...');
        const [users] = await require('./src/config/database').pool.query(
            'SELECT username FROM users WHERE id = ?',
            [testUserId]
        );
        
        if (users.length === 0) {
            log('✗ Test user not found');
            return false;
        }
        
        const response = await axios.post(`${API_BASE}/auth/user/login`, {
            username: users[0].username,
            password: 'test123'
        });
        
        if (response.data.success) {
            testUserToken = response.data.data.token;
            log('✓ Test user logged in successfully');
            return true;
        }
        log('✗ Test user login failed', response.data);
        return false;
    } catch (error) {
        log('✗ Test user login error', error.response?.data || error.message);
        return false;
    }
}

async function verifyAccessWorks() {
    try {
        log('Step 4: Verifying test user has access...');
        const response = await axios.get(
            `${API_BASE}/channels`,
            {
                headers: { Authorization: `Bearer ${testUserToken}` }
            }
        );
        
        if (response.status === 200) {
            log('✓ Test user has access (as expected)');
            return true;
        }
        log('✗ Unexpected response', { status: response.status });
        return false;
    } catch (error) {
        log('✗ Access verification error', error.response?.data || error.message);
        return false;
    }
}

async function deactivateUser() {
    try {
        log('Step 5: Deactivating test user...');
        const response = await axios.put(
            `${API_BASE}/users/${testUserId}`,
            { status: 'inactive' },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        
        if (response.data.success) {
            log('✓ Test user deactivated');
            return true;
        }
        log('✗ Deactivation failed', response.data);
        return false;
    } catch (error) {
        log('✗ Deactivation error', error.response?.data || error.message);
        return false;
    }
}

async function verifyAccessBlocked() {
    try {
        log('Step 6: Verifying test user access is BLOCKED...');
        const response = await axios.get(
            `${API_BASE}/channels`,
            {
                headers: { Authorization: `Bearer ${testUserToken}` }
            }
        );
        
        log('✗ SECURITY ISSUE: User still has access!', { status: response.status });
        return false;
    } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            log('✓ Access correctly blocked', { 
                status: error.response.status,
                message: error.response.data.message 
            });
            return true;
        }
        log('✗ Unexpected error', error.response?.data || error.message);
        return false;
    }
}

async function cleanup() {
    try {
        if (testUserId) {
            log('Step 7: Cleaning up test user...');
            await axios.delete(
                `${API_BASE}/users/${testUserId}`,
                {
                    headers: { Authorization: `Bearer ${adminToken}` }
                }
            );
            log('✓ Test user deleted');
        }
    } catch (error) {
        log('⚠ Cleanup error (non-critical)', error.message);
    }
}

async function runTest() {
    console.log('\n========================================');
    console.log('USER DEACTIVATION SECURITY TEST');
    console.log('========================================');
    
    try {
        if (!await loginAdmin()) return;
        if (!await createTestUser()) return;
        if (!await loginTestUser()) return;
        if (!await verifyAccessWorks()) return;
        if (!await deactivateUser()) return;
        
        // Wait a moment for session invalidation to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!await verifyAccessBlocked()) {
            console.log('\n❌ TEST FAILED: User access not blocked after deactivation!');
            await cleanup();
            process.exit(1);
        }
        
        await cleanup();
        
        console.log('\n========================================');
        console.log('✅ ALL TESTS PASSED');
        console.log('User deactivation correctly blocks access');
        console.log('========================================\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ TEST ERROR:', error.message);
        await cleanup();
        process.exit(1);
    }
}

runTest();
