const db = require('../config/database');
const { securityMonitor } = require('../middleware/securityMonitor');

class SecurityController {
    // Get current security status
    async getSecurityStatus(req, res) {
        try {
            // Get counts for last 24 hours
            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_events,
                    SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_events,
                    SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_events,
                    SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_events,
                    SUM(CASE WHEN event_type = 'failed_login' THEN 1 ELSE 0 END) as failed_logins,
                    SUM(CASE WHEN event_type = 'brute_force' THEN 1 ELSE 0 END) as brute_force_attempts,
                    SUM(CASE WHEN event_type = 'rate_limit_exceeded' THEN 1 ELSE 0 END) as rate_limit_violations,
                    SUM(CASE WHEN event_type = 'malformed_request' THEN 1 ELSE 0 END) as malformed_requests
                FROM security_events
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);

            // Get blocked IPs count
            const [blockedCount] = await db.query(`
                SELECT COUNT(*) as count FROM blocked_ips
                WHERE is_permanent = 1 OR expires_at > NOW()
            `);

            // Get recent events from last hour
            const [recentEvents] = await db.query(`
                SELECT COUNT(*) as count FROM security_events
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `);

            const statusData = stats[0];
            const criticalCount = parseInt(statusData.critical_events) || 0;
            const highCount = parseInt(statusData.high_events) || 0;
            const recentCount = parseInt(recentEvents[0].count) || 0;

            // Determine overall status
            let status = 'secure';
            let statusColor = 'green';
            
            if (criticalCount > 0 || recentCount > 50) {
                status = 'threat';
                statusColor = 'red';
            } else if (highCount > 5 || recentCount > 20) {
                status = 'warning';
                statusColor = 'yellow';
            }

            res.json({
                success: true,
                data: {
                    status,
                    statusColor,
                    stats: {
                        total_events: parseInt(statusData.total_events) || 0,
                        critical_events: criticalCount,
                        high_events: highCount,
                        medium_events: parseInt(statusData.medium_events) || 0,
                        low_events: parseInt(statusData.low_events) || 0,
                        failed_logins: parseInt(statusData.failed_logins) || 0,
                        brute_force_attempts: parseInt(statusData.brute_force_attempts) || 0,
                        rate_limit_violations: parseInt(statusData.rate_limit_violations) || 0,
                        malformed_requests: parseInt(statusData.malformed_requests) || 0,
                        blocked_ips: parseInt(blockedCount[0].count) || 0,
                        recent_events_1h: recentCount
                    }
                }
            });
        } catch (error) {
            console.error('Get security status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch security status'
            });
        }
    }

    // Get recent security events
    async getRecentEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            const [events] = await db.query(`
                SELECT 
                    id,
                    event_type,
                    severity,
                    ip_address,
                    endpoint,
                    username,
                    description,
                    created_at
                FROM security_events
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const [total] = await db.query(`
                SELECT COUNT(*) as count FROM security_events
            `);

            res.json({
                success: true,
                data: {
                    events,
                    total: total[0].count,
                    limit,
                    offset
                }
            });
        } catch (error) {
            console.error('Get recent events error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch recent events'
            });
        }
    }

    // Get events by type
    async getEventsByType(req, res) {
        try {
            const { type } = req.params;
            const limit = parseInt(req.query.limit) || 20;

            const [events] = await db.query(`
                SELECT 
                    id,
                    event_type,
                    severity,
                    ip_address,
                    endpoint,
                    username,
                    description,
                    created_at
                FROM security_events
                WHERE event_type = ?
                ORDER BY created_at DESC
                LIMIT ?
            `, [type, limit]);

            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            console.error('Get events by type error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch events'
            });
        }
    }

    // Get blocked IPs
    async getBlockedIPs(req, res) {
        try {
            const [ips] = await db.query(`
                SELECT 
                    id,
                    ip_address,
                    reason,
                    blocked_at,
                    expires_at,
                    is_permanent
                FROM blocked_ips
                WHERE is_permanent = 1 OR expires_at > NOW()
                ORDER BY blocked_at DESC
            `);

            res.json({
                success: true,
                data: ips
            });
        } catch (error) {
            console.error('Get blocked IPs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch blocked IPs'
            });
        }
    }

    // Unblock IP
    async unblockIP(req, res) {
        try {
            const { ip_address } = req.body;

            if (!ip_address) {
                return res.status(400).json({
                    success: false,
                    message: 'IP address is required'
                });
            }

            await db.query(`
                DELETE FROM blocked_ips WHERE ip_address = ?
            `, [ip_address]);

            // Remove from in-memory set
            securityMonitor.blockedIPs.delete(ip_address);

            res.json({
                success: true,
                message: 'IP unblocked successfully'
            });
        } catch (error) {
            console.error('Unblock IP error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unblock IP'
            });
        }
    }

    // Block IP manually
    async blockIP(req, res) {
        try {
            const { ip_address, reason, duration_hours } = req.body;

            if (!ip_address) {
                return res.status(400).json({
                    success: false,
                    message: 'IP address is required'
                });
            }

            const duration_seconds = duration_hours ? duration_hours * 3600 : null;
            await securityMonitor.blockIP(ip_address, reason || 'Manually blocked', duration_seconds);

            res.json({
                success: true,
                message: 'IP blocked successfully'
            });
        } catch (error) {
            console.error('Block IP error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to block IP'
            });
        }
    }

    // Get security statistics for dashboard
    async getSecurityStats(req, res) {
        try {
            const period = req.query.period || '24h';
            let interval = '24 HOUR';
            
            if (period === '7d') interval = '7 DAY';
            else if (period === '30d') interval = '30 DAY';

            const [eventsByType] = await db.query(`
                SELECT 
                    event_type,
                    COUNT(*) as count,
                    MAX(created_at) as last_occurrence
                FROM security_events
                WHERE created_at > DATE_SUB(NOW(), INTERVAL ${interval})
                GROUP BY event_type
                ORDER BY count DESC
            `);

            const [topIPs] = await db.query(`
                SELECT 
                    ip_address,
                    COUNT(*) as event_count,
                    MAX(severity) as max_severity
                FROM security_events
                WHERE created_at > DATE_SUB(NOW(), INTERVAL ${interval})
                GROUP BY ip_address
                ORDER BY event_count DESC
                LIMIT 10
            `);

            const [timeline] = await db.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                    COUNT(*) as count,
                    severity
                FROM security_events
                WHERE created_at > DATE_SUB(NOW(), INTERVAL ${interval})
                GROUP BY hour, severity
                ORDER BY hour ASC
            `);

            res.json({
                success: true,
                data: {
                    eventsByType,
                    topIPs,
                    timeline
                }
            });
        } catch (error) {
            console.error('Get security stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch security statistics'
            });
        }
    }
}

module.exports = new SecurityController();
