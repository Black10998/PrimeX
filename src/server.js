/**
 * PrimeX IPTV System - Main Server
 * 
 * ARCHITECTURE:
 * - Express.js REST API server
 * - MySQL database (single connection pool)
 * - JWT authentication
 * - Xtream API compatibility
 * - Bilingual support (EN/AR)
 * 
 * STARTUP SEQUENCE:
 * 1. Load and validate environment
 * 2. Test database connection (MUST succeed)
 * 3. Initialize Express app
 * 4. Start HTTP server
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

// Initialize environment FIRST
const { initEnv, getConfig } = require('./config/env');
const config = initEnv();

// Import after env is loaded
const { pool, testConnection } = require('./config/database');
const logger = require('./utils/logger');
const { autoInitialize } = require('./utils/autoInit');
const apiRoutes = require('./routes/index');
const xtreamRoutes = require('./routes/xtream');
const { blockIPMiddleware, detectSuspiciousMiddleware } = require('./middleware/securityMonitor');

// Create Express app
const app = express();

// Trust proxy - Required for Cloudflare/Hostinger proxy setup
// This allows express-rate-limit to work correctly with X-Forwarded-For headers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging (development only)
if (config.env !== 'production') {
    app.use(morgan('dev'));
}

// Security monitoring middleware
app.use(blockIPMiddleware);
app.use(detectSuspiciousMiddleware);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test database
        await pool.query('SELECT 1');
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
            version: '11.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// API routes
app.use('/api/v1', apiRoutes);

// Setup page (one-time initialization)
app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/setup.html'));
});

// Admin panel routes (MUST be before Xtream routes)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/enterprise-panel.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/enterprise-panel.html'));
});

app.get('/admin/enterprise-panel.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/enterprise-panel.html'));
});

app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

// Legacy admin panels (backup)
app.get('/admin/legacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/dashboard-v2.html'));
});

app.get('/admin/old', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index-old.html'));
});

// Xtream API routes (MUST be after admin routes)
app.use('/', xtreamRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Server error:', { 
        error: err.message, 
        stack: config.env !== 'production' ? err.stack : undefined 
    });
    
    res.status(err.status || 500).json({
        success: false,
        message: config.env === 'production' ? 'Internal server error' : err.message
    });
});

// Start server
async function startServer() {
    try {
        console.log('🚀 Starting PrimeX IPTV System...\n');
        
        // CRITICAL: Test database connection
        console.log('📊 Testing database connection...');
        const dbConnected = await testConnection(pool);
        
        if (!dbConnected) {
            console.warn('\n⚠️  WARNING: Database connection failed');
            console.warn('   Server will start but database features will be unavailable');
            console.warn('   Check your .env configuration and MySQL status');
            console.warn('   Configure database and restart to enable full functionality\n');
        } else {
            // Database connected - run automatic initialization
            await autoInitialize();
            
            // Initialize security monitoring tables
            try {
                const { initializeSecurityTables } = require('./utils/securityInit');
                await initializeSecurityTables();
                
                // Initialize security monitor after tables are ready
                const { securityMonitor } = require('./middleware/securityMonitor');
                await securityMonitor.initialize();
            } catch (error) {
                logger.error('Security tables initialization failed', { error: error.message });
                console.log('⚠️  Security monitoring initialization failed - continuing startup');
            }
            
            // Initialize VOD/Series tables
            try {
                const { initializeVODTables } = require('./utils/vodInit');
                await initializeVODTables();
            } catch (error) {
                logger.error('VOD tables initialization failed', { error: error.message });
                console.log('⚠️  VOD/Series initialization failed - continuing startup');
            }
            
            // Initialize Device Activation tables (4K Player style)
            try {
                const { initializeDeviceActivationTables } = require('./utils/deviceActivationInit');
                await initializeDeviceActivationTables();
            } catch (error) {
                logger.error('Device activation tables initialization failed', { error: error.message });
                console.log('⚠️  Device activation initialization failed - continuing startup');
            }
            
            // Run migration to add missing tables (non-blocking)
            try {
                const { addMissingTables } = require('./scripts/addMissingTables');
                await addMissingTables();
            } catch (error) {
                logger.error('Migration failed but server will continue', { error: error.message });
                console.log('⚠️  Database migration failed - server continuing startup');
            }
        }
        
        // Start HTTP server
        const server = app.listen(config.server.port, config.server.host, () => {
            console.log('\n╔════════════════════════════════════════════════════════╗');
            console.log('║                                                        ║');
            console.log('║           ✅ SERVER STARTED SUCCESSFULLY ✅            ║');
            console.log('║                                                        ║');
            console.log('╚════════════════════════════════════════════════════════╝\n');
            
            console.log('🌐 Server Information:');
            console.log(`   URL: http://${config.server.host}:${config.server.port}`);
            console.log(`   Environment: ${config.env}`);
            console.log('');
            
            console.log('📡 API Endpoints:');
            console.log(`   REST API: http://${config.server.host}:${config.server.port}/api/v1`);
            console.log(`   Xtream API: http://${config.server.host}:${config.server.port}/player_api.php`);
            console.log(`   Health Check: http://${config.server.host}:${config.server.port}/health`);
            console.log('');
            
            console.log('🎛️  Admin Panel:');
            console.log(`   URL: http://${config.server.host}:${config.server.port}/`);
            console.log(`   Username: ${config.admin.username}`);
            console.log('');
            
            console.log('📝 Logs:');
            console.log(`   Application logs: ${process.env.LOG_FILE || './logs/app.log'}`);
            console.log(`   PM2 logs: pm2 logs primex-iptv`);
            console.log('');
            
            console.log('⚡ Ready to accept connections!\n');
            
            logger.info('PrimeX IPTV System started successfully', {
                port: config.server.port,
                env: config.env
            });

            // Run bootstrap on first startup (async, non-blocking)
            setImmediate(async () => {
                try {
                    const bootstrapService = require('./services/bootstrapService');
                    const result = await bootstrapService.runBootstrap();
                    
                    if (result.success && !result.alreadyCompleted) {
                        console.log('\n╔════════════════════════════════════════════════════════╗');
                        console.log('║                                                        ║');
                        console.log('║        🎉 INITIAL SETUP COMPLETED 🎉                  ║');
                        console.log('║                                                        ║');
                        console.log('╚════════════════════════════════════════════════════════╝\n');
                        console.log('📺 Bootstrap Results:');
                        console.log(`   Channels Imported: ${result.totalImported}`);
                        console.log(`   Channels Skipped: ${result.totalSkipped}`);
                        console.log(`   Playlists Processed: ${result.playlists.length}`);
                        console.log('');
                        console.log('✅ System is now ready with legal public channels!');
                        console.log('   Source: iptv-org GitHub (100% legal, public streams)\n');
                    }
                } catch (error) {
                    logger.error('Bootstrap error (non-fatal):', { error: error.message });
                    console.log('⚠️  Bootstrap failed but server is running normally');
                }
            });
        });
        
        // Graceful shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown(server));
        process.on('SIGINT', () => gracefulShutdown(server));
        
    } catch (error) {
        console.error('\n❌ FATAL: Failed to start server');
        console.error(`   Error: ${error.message}\n`);
        logger.error('Server startup failed', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

// Graceful shutdown
async function gracefulShutdown(server) {
    console.log('\n🛑 Received shutdown signal...');
    console.log('   Closing HTTP server...');
    
    server.close(async () => {
        console.log('   ✅ HTTP server closed');
        console.log('   Closing database connections...');
        
        try {
            await pool.end();
            console.log('   ✅ Database connections closed');
        } catch (error) {
            console.error('   ❌ Error closing database:', error.message);
        }
        
        console.log('   ✅ Shutdown complete\n');
        logger.info('Server shutdown complete');
        process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('   ⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('\n❌ UNCAUGHT EXCEPTION:', error.message);
    console.error(error.stack);
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ UNHANDLED REJECTION:', reason);
    logger.error('Unhandled rejection', { reason });
    process.exit(1);
});

// Start the server
startServer();
