/**
 * PrimeX IPTV System v11.0 - PM2 Configuration
 * 
 * Production-ready process management
 * Auto-configured for zero-downtime deployment
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart primex-iptv
 *   pm2 stop primex-iptv
 *   pm2 logs primex-iptv
 *   pm2 monit
 * 
 * Developer: PAX | info@paxdes.com
 */

module.exports = {
  apps: [{
    // Application name
    name: 'primex-iptv',
    
    // Script to run
    script: './src/server.js',
    
    // Instances (1 for single instance, 'max' for cluster mode)
    instances: 1,
    
    // Execution mode
    exec_mode: 'fork',
    
    // Watch for file changes (disabled in production)
    watch: false,
    
    // Maximum memory restart (auto-restart if exceeds)
    max_memory_restart: '500M',
    
    // Environment variables
    env: {
      NODE_ENV: 'production'
    },
    
    // Logging configuration
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    combine_logs: true,
    merge_logs: true,
    
    // Auto-restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Source map support
    source_map_support: true,
    
    // Time zone
    time: true,
    
    // Cron restart (optional - restart daily at 3 AM)
    // cron_restart: '0 3 * * *',
    
    // Instance variables
    instance_var: 'INSTANCE_ID',
    
    // Post-deployment actions
    post_update: ['npm install --production'],
    
    // Error handling
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Node.js arguments
    node_args: '--max-old-space-size=512'
  }]
};
