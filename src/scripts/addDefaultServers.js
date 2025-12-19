#!/usr/bin/env node

const { pool } = require('../config/database');
const { initEnv } = require('../config/env');

initEnv();

async function addDefaultServers() {
    try {
        console.log('Adding default streaming servers...\n');

        const servers = [
            {
                name: 'Main Production Server',
                url: 'https://stream1.primex-iptv.com',
                type: 'primary',
                status: 'active',
                priority: 1,
                max_connections: 5000,
                location: 'US East',
                notes: 'Primary production server with highest capacity'
            },
            {
                name: 'Backup Server 1',
                url: 'https://stream2.primex-iptv.com',
                type: 'backup',
                status: 'active',
                priority: 2,
                max_connections: 3000,
                location: 'US West',
                notes: 'First backup server for failover'
            },
            {
                name: 'Backup Server 2',
                url: 'https://stream3.primex-iptv.com',
                type: 'backup',
                status: 'active',
                priority: 3,
                max_connections: 3000,
                location: 'EU Central',
                notes: 'Second backup server for geographic distribution'
            },
            {
                name: 'Load Balancer Server',
                url: 'https://lb.primex-iptv.com',
                type: 'primary',
                status: 'active',
                priority: 1,
                max_connections: 10000,
                location: 'Global CDN',
                notes: 'Load balanced endpoint for optimal performance'
            },
            {
                name: 'Test Server',
                url: 'https://test.primex-iptv.com',
                type: 'backup',
                status: 'maintenance',
                priority: 99,
                max_connections: 100,
                location: 'Development',
                notes: 'Testing and development server'
            }
        ];

        for (const server of servers) {
            const [existing] = await pool.query(
                'SELECT id FROM streaming_servers WHERE name = ?',
                [server.name]
            );

            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO streaming_servers 
                    (name, url, type, status, priority, max_connections, location, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        server.name,
                        server.url,
                        server.type,
                        server.status,
                        server.priority,
                        server.max_connections,
                        server.location,
                        server.notes
                    ]
                );
                console.log(`✅ Added: ${server.name}`);
            } else {
                console.log(`⏭️  Skipped: ${server.name} (already exists)`);
            }
        }

        console.log('\n✅ Default servers configuration complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding servers:', error.message);
        process.exit(1);
    }
}

addDefaultServers();
