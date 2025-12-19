/**
 * PrimeX IPTV System - PM2 Configuration
 * 
 * Production process management configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart primex-iptv
 *   pm2 stop primex-iptv
 *   pm2 logs primex-iptv
 *   pm2 monit
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

module.exports = {
  apps: [{
    // Application name
    name: 'primex-iptv',
    
    // Script to run
    script: './src/server.js',
    
    // Instances (use 'max' for cluster mode, or 1 for single instance)
    instances: 1,
    
    // Execution mode
    exec_mode: 'fork',
    
    // Watch for file changes (disable in production)
    watch: false,
    
    // Maximum memory restart
    max_memory_restart: '500M',
    
    // Environment variables
    env: {
      NODE_ENV: 'production'
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Restart behavior
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Source map support
    source_map_support: true,
    
    // Merge logs
    merge_logs: true,
    
    // Time zone
    time: true
  }]
};
