const { pool } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class DashboardController {
    async getStats(req, res) {
        try {
            const [userStats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
                    SUM(CASE 
                        WHEN status = 'active' AND (subscription_end IS NULL OR subscription_end > NOW()) 
                        THEN 1 
                        ELSE 0 
                    END) as active_subscriptions,
                    SUM(CASE 
                        WHEN status = 'active' AND subscription_end IS NULL 
                        THEN 1 
                        ELSE 0 
                    END) as unlimited_subscriptions,
                    SUM(CASE 
                        WHEN status = 'active' AND subscription_end IS NOT NULL 
                        AND subscription_end BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
                        THEN 1 
                        ELSE 0 
                    END) as expiring_soon,
                    SUM(CASE 
                        WHEN status = 'active' AND subscription_end IS NOT NULL AND subscription_end < NOW() 
                        THEN 1 
                        ELSE 0 
                    END) as expired_subscriptions
                FROM users
            `);

            const [channelStats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_channels,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_channels,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_channels
                FROM channels
            `);

            const [categoryStats] = await pool.query(`
                SELECT COUNT(*) as total_categories FROM categories WHERE status = 'active'
            `);

            const [serverStats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_servers,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_servers,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_servers,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_servers,
                    SUM(current_connections) as total_connections
                FROM streaming_servers
            `);

            const [codeStats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_codes,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_codes,
                    SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_codes
                FROM subscription_codes
            `);

            const [recentUsers] = await pool.query(`
                SELECT username, email, created_at, subscription_end 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 10
            `);

            const [recentActivity] = await pool.query(`
                SELECT al.*, u.username 
                FROM activity_logs al 
                LEFT JOIN users u ON al.user_id = u.id 
                ORDER BY al.created_at DESC 
                LIMIT 20
            `);

            const [subscriptionTrend] = await pool.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            return res.json(formatResponse(true, {
                users: userStats[0],
                channels: channelStats[0],
                categories: categoryStats[0],
                servers: serverStats[0],
                codes: codeStats[0],
                recent_users: recentUsers,
                recent_activity: recentActivity,
                subscription_trend: subscriptionTrend,
                last_updated: new Date().toISOString()
            }));
        } catch (error) {
            logger.error('Dashboard stats error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch dashboard statistics'));
        }
    }

    async getSystemHealth(req, res) {
        try {
            const [dbStatus] = await pool.query('SELECT 1 as status');
            
            const [expiringSoon] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE subscription_end BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
                AND status = 'active'
            `);

            const [inactiveServers] = await pool.query(`
                SELECT COUNT(*) as count FROM streaming_servers WHERE status != 'active'
            `);

            const health = {
                database: dbStatus.length > 0 ? 'connected' : 'disconnected',
                expiring_subscriptions: expiringSoon[0].count,
                inactive_servers: inactiveServers[0].count,
                memory: {
                    heapUsed: process.memoryUsage().heapUsed,
                    heapTotal: process.memoryUsage().heapTotal
                },
                uptime: process.uptime(),
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
            };

            return res.json(formatResponse(true, health));
        } catch (error) {
            logger.error('System health error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch system health'));
        }
    }

    async getRevenueStats(req, res) {
        try {
            const [planRevenue] = await pool.query(`
                SELECT 
                    sp.name_en,
                    sp.price,
                    COUNT(u.id) as user_count,
                    (sp.price * COUNT(u.id)) as total_revenue
                FROM subscription_plans sp
                LEFT JOIN users u ON sp.id = u.plan_id AND u.status = 'active'
                GROUP BY sp.id
            `);

            const [monthlyRevenue] = await pool.query(`
                SELECT 
                    DATE_FORMAT(u.created_at, '%Y-%m') as month,
                    COUNT(*) as subscriptions,
                    SUM(sp.price) as revenue
                FROM users u
                JOIN subscription_plans sp ON u.plan_id = sp.id
                WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(u.created_at, '%Y-%m')
                ORDER BY month ASC
            `);

            return res.json(formatResponse(true, {
                by_plan: planRevenue,
                monthly: monthlyRevenue
            }));
        } catch (error) {
            logger.error('Revenue stats error:', { error: error.message });
            return res.status(500).json(formatResponse(false, null, 'Failed to fetch revenue statistics'));
        }
    }
}

module.exports = new DashboardController();
