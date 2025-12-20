const db = require('../config/database');

class SecurityMonitor {
    constructor() {
        this.rateLimitMap = new Map();
        this.suspiciousIPs = new Set();
        this.blockedIPs = new Set();
        this.initialized = false;
        
        // Clean up old rate limit data every 5 minutes
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            await this.loadBlockedIPs();
            this.initialized = true;
        } catch (error) {
            console.error('Security monitor initialization failed:', error.message);
        }
    }

    async loadBlockedIPs() {
        try {
            // Check if db.query is available
            if (!db || typeof db.query !== 'function') {
                console.warn('Database not ready, skipping blocked IPs load');
                return;
            }
            
            const [rows] = await db.query(`
                SELECT ip_address FROM blocked_ips 
                WHERE is_permanent = 1 OR expires_at > NOW()
            `);
            rows.forEach(row => this.blockedIPs.add(row.ip_address));
        } catch (error) {
            // Silently fail if table doesn't exist yet
            if (!error.message.includes("doesn't exist")) {
                console.error('Failed to load blocked IPs:', error.message);
            }
        }
    }

    async logSecurityEvent(eventData) {
        const {
            event_type,
            severity = 'medium',
            ip_address,
            user_agent = null,
            endpoint = null,
            username = null,
            description = null,
            metadata = null
        } = eventData;

        try {
            await db.query(`
                INSERT INTO security_events 
                (event_type, severity, ip_address, user_agent, endpoint, username, description, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                event_type,
                severity,
                ip_address,
                user_agent,
                endpoint,
                username,
                description,
                metadata ? JSON.stringify(metadata) : null
            ]);

            // Auto-block IP if too many critical events
            if (severity === 'critical') {
                await this.checkAndBlockIP(ip_address);
            }
        } catch (error) {
            console.error('Failed to log security event:', error.message);
        }
    }

    async checkAndBlockIP(ip_address) {
        try {
            // Count critical events from this IP in last hour
            const [rows] = await db.query(`
                SELECT COUNT(*) as count FROM security_events
                WHERE ip_address = ? 
                AND severity = 'critical'
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `, [ip_address]);

            if (rows[0].count >= 5) {
                await this.blockIP(ip_address, 'Automatic block: Multiple critical security events', 3600);
            }
        } catch (error) {
            console.error('Failed to check IP for blocking:', error.message);
        }
    }

    async blockIP(ip_address, reason, duration_seconds = null) {
        try {
            const expires_at = duration_seconds 
                ? new Date(Date.now() + duration_seconds * 1000)
                : null;

            await db.query(`
                INSERT INTO blocked_ips (ip_address, reason, expires_at, is_permanent)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    reason = VALUES(reason),
                    expires_at = VALUES(expires_at),
                    blocked_at = CURRENT_TIMESTAMP
            `, [ip_address, reason, expires_at, !duration_seconds]);

            this.blockedIPs.add(ip_address);

            await this.logSecurityEvent({
                event_type: 'blocked_ip',
                severity: 'high',
                ip_address,
                description: reason
            });
        } catch (error) {
            console.error('Failed to block IP:', error.message);
        }
    }

    isIPBlocked(ip_address) {
        return this.blockedIPs.has(ip_address);
    }

    checkRateLimit(ip_address, endpoint, limit = 100, window = 60000) {
        const key = `${ip_address}:${endpoint}`;
        const now = Date.now();
        
        if (!this.rateLimitMap.has(key)) {
            this.rateLimitMap.set(key, { count: 1, resetTime: now + window });
            return { allowed: true, remaining: limit - 1 };
        }

        const data = this.rateLimitMap.get(key);
        
        if (now > data.resetTime) {
            this.rateLimitMap.set(key, { count: 1, resetTime: now + window });
            return { allowed: true, remaining: limit - 1 };
        }

        data.count++;
        
        if (data.count > limit) {
            this.logSecurityEvent({
                event_type: 'rate_limit_exceeded',
                severity: 'medium',
                ip_address,
                endpoint,
                description: `Rate limit exceeded: ${data.count} requests in ${window}ms`
            });
            return { allowed: false, remaining: 0 };
        }

        return { allowed: true, remaining: limit - data.count };
    }

    cleanupRateLimits() {
        const now = Date.now();
        for (const [key, data] of this.rateLimitMap.entries()) {
            if (now > data.resetTime) {
                this.rateLimitMap.delete(key);
            }
        }
    }

    detectSuspiciousActivity(req) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';
        const suspicious = [];

        // Check for missing or suspicious user agent
        if (!userAgent || userAgent.length < 10) {
            suspicious.push('Missing or invalid user agent');
        }

        // Check for SQL injection patterns
        const sqlPatterns = /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i;
        const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
        if (sqlPatterns.test(queryString)) {
            suspicious.push('Potential SQL injection attempt');
        }

        // Check for XSS patterns
        const xssPatterns = /<script|javascript:|onerror=|onload=/i;
        if (xssPatterns.test(queryString)) {
            suspicious.push('Potential XSS attempt');
        }

        // Check for path traversal
        if (req.path.includes('..') || req.path.includes('~')) {
            suspicious.push('Path traversal attempt');
        }

        if (suspicious.length > 0) {
            this.logSecurityEvent({
                event_type: 'malformed_request',
                severity: 'high',
                ip_address: ip,
                user_agent: userAgent,
                endpoint: req.path,
                description: suspicious.join(', '),
                metadata: {
                    method: req.method,
                    query: req.query,
                    body: req.body
                }
            });
        }

        return suspicious.length > 0;
    }
}

// Singleton instance
const securityMonitor = new SecurityMonitor();

// Middleware to check blocked IPs
const blockIPMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (securityMonitor.isIPBlocked(ip)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Your IP has been blocked'
        });
    }
    
    next();
};

// Middleware to detect suspicious activity
const detectSuspiciousMiddleware = (req, res, next) => {
    securityMonitor.detectSuspiciousActivity(req);
    next();
};

// Middleware for rate limiting
const rateLimitMiddleware = (limit = 100, window = 60000) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const endpoint = req.path;
        
        const result = securityMonitor.checkRateLimit(ip, endpoint, limit, window);
        
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        
        if (!result.allowed) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }
        
        next();
    };
};

module.exports = {
    securityMonitor,
    blockIPMiddleware,
    detectSuspiciousMiddleware,
    rateLimitMiddleware
};
