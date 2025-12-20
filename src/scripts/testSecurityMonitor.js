/**
 * Test script for Security Monitor
 * Simulates various security events
 */

const { securityMonitor } = require('../middleware/securityMonitor');

async function simulateSecurityEvents() {
    console.log('🔐 Simulating security events...\n');

    // Simulate failed login attempts
    console.log('1. Simulating failed login attempts...');
    await securityMonitor.logSecurityEvent({
        event_type: 'failed_login',
        severity: 'medium',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        endpoint: '/api/v1/auth/admin/login',
        username: 'admin',
        description: 'Invalid password'
    });

    await securityMonitor.logSecurityEvent({
        event_type: 'failed_login',
        severity: 'medium',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        endpoint: '/api/v1/auth/admin/login',
        username: 'admin',
        description: 'Invalid password'
    });

    // Simulate brute force attempt
    console.log('2. Simulating brute force attempt...');
    await securityMonitor.logSecurityEvent({
        event_type: 'brute_force',
        severity: 'high',
        ip_address: '10.0.0.50',
        user_agent: 'Python-requests/2.28.0',
        endpoint: '/api/v1/auth/admin/login',
        description: 'Multiple failed login attempts detected'
    });

    // Simulate rate limit violation
    console.log('3. Simulating rate limit violation...');
    await securityMonitor.logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        severity: 'medium',
        ip_address: '172.16.0.25',
        endpoint: '/api/v1/channels',
        description: 'Rate limit exceeded: 150 requests in 60s'
    });

    // Simulate malformed request
    console.log('4. Simulating malformed request...');
    await securityMonitor.logSecurityEvent({
        event_type: 'malformed_request',
        severity: 'high',
        ip_address: '203.0.113.42',
        user_agent: 'curl/7.68.0',
        endpoint: '/api/v1/users',
        description: 'Potential SQL injection attempt',
        metadata: {
            query: "' OR '1'='1"
        }
    });

    // Simulate suspicious IP activity
    console.log('5. Simulating suspicious IP activity...');
    await securityMonitor.logSecurityEvent({
        event_type: 'suspicious_ip',
        severity: 'high',
        ip_address: '198.51.100.88',
        description: 'IP from known malicious network'
    });

    // Simulate critical events for auto-blocking
    console.log('6. Simulating critical events (should trigger auto-block)...');
    const criticalIP = '203.0.113.99';
    for (let i = 0; i < 5; i++) {
        await securityMonitor.logSecurityEvent({
            event_type: 'unauthorized_access',
            severity: 'critical',
            ip_address: criticalIP,
            endpoint: '/api/v1/admin/users',
            description: 'Unauthorized access attempt'
        });
    }

    // Simulate API abuse
    console.log('7. Simulating API abuse...');
    await securityMonitor.logSecurityEvent({
        event_type: 'api_abuse',
        severity: 'high',
        ip_address: '192.0.2.15',
        endpoint: '/api/v1/channels',
        description: 'Excessive API calls detected'
    });

    console.log('\n✅ Security events simulation completed!');
    console.log('\nYou can now:');
    console.log('1. Open the admin panel');
    console.log('2. Click the security shield icon in the header');
    console.log('3. View the simulated security events');
    
    process.exit(0);
}

// Run simulation
simulateSecurityEvents().catch(error => {
    console.error('❌ Error simulating events:', error);
    process.exit(1);
});
