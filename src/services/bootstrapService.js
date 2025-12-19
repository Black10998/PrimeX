/**
 * Bootstrap Service
 * Automatically seeds the system with legal public IPTV channels on first run
 * 
 * This runs ONCE on fresh installation to populate the system with:
 * - Legal public channels from iptv-org GitHub
 * - Automatic category creation
 * - Ready-to-use content for testing and production
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class BootstrapService {
    constructor() {
        // Default legal playlists to import on first run
        this.defaultPlaylists = [
            {
                name: 'Arabic Channels (Language)',
                url: 'https://iptv-org.github.io/iptv/languages/ara.m3u',
                description: 'Arabic language channels from iptv-org',
                priority: 1
            },
            {
                name: 'Arabic Region',
                url: 'https://iptv-org.github.io/iptv/regions/arab.m3u',
                description: 'Channels from Arab region',
                priority: 2
            }
        ];
    }

    /**
     * Check if bootstrap has been completed
     */
    async isBootstrapCompleted() {
        try {
            const [rows] = await pool.query(
                'SELECT setting_value FROM system_settings WHERE setting_key = ?',
                ['bootstrap_completed']
            );

            if (rows.length === 0) {
                return false;
            }

            return rows[0].setting_value === 'true';
        } catch (error) {
            logger.error('Error checking bootstrap status:', { error: error.message });
            // If table doesn't exist, bootstrap hasn't run
            return false;
        }
    }

    /**
     * Mark bootstrap as completed
     */
    async markBootstrapCompleted() {
        try {
            await pool.query(
                'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
                ['true', 'bootstrap_completed']
            );

            await pool.query(
                'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
                [new Date().toISOString(), 'bootstrap_timestamp']
            );

            logger.info('Bootstrap marked as completed');
        } catch (error) {
            logger.error('Error marking bootstrap as completed:', { error: error.message });
        }
    }

    /**
     * Parse M3U content
     */
    parseM3U(content) {
        const channels = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        let currentChannel = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#EXTINF:')) {
                currentChannel = {};
                
                // Extract tvg-logo
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) {
                    currentChannel.logo = logoMatch[1];
                }
                
                // Extract group-title
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }
                
                // Extract channel name
                const nameMatch = line.match(/,(.+)$/);
                if (nameMatch) {
                    currentChannel.name = nameMatch[1].trim();
                }
                
            } else if (line.startsWith('http://') || line.startsWith('https://')) {
                if (currentChannel.name) {
                    currentChannel.url = line;
                    channels.push({ ...currentChannel });
                    currentChannel = {};
                }
            }
        }
        
        return channels;
    }

    /**
     * Import a single M3U playlist
     */
    async importPlaylist(playlistUrl, connection) {
        try {
            logger.info('Fetching playlist:', { url: playlistUrl });

            const fetch = (await import('node-fetch')).default;
            const response = await fetch(playlistUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            }

            const m3uContent = await response.text();
            const channels = this.parseM3U(m3uContent);
            
            logger.info('Parsed channels from playlist:', { count: channels.length, url: playlistUrl });

            if (channels.length === 0) {
                return { imported: 0, skipped: 0, errors: 0 };
            }

            // Get or create categories
            const categoryMap = new Map();
            const uniqueGroups = [...new Set(channels.map(ch => ch.group).filter(Boolean))];
            
            for (const groupName of uniqueGroups) {
                const slug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
                const [existing] = await connection.query(
                    'SELECT id FROM categories WHERE slug = ?',
                    [slug]
                );
                
                if (existing.length > 0) {
                    categoryMap.set(groupName, existing[0].id);
                } else {
                    const [result] = await connection.query(
                        'INSERT INTO categories (name_en, name_ar, slug, status) VALUES (?, ?, ?, ?)',
                        [groupName, groupName, slug, 'active']
                    );
                    categoryMap.set(groupName, result.insertId);
                }
            }

            // Import channels
            let imported = 0;
            let skipped = 0;
            let errors = 0;

            for (const channel of channels) {
                try {
                    // Determine category
                    let categoryId = null;
                    if (channel.group && categoryMap.has(channel.group)) {
                        categoryId = categoryMap.get(channel.group);
                    }

                    if (!categoryId) {
                        // Create default category
                        const [defaultCat] = await connection.query(
                            'SELECT id FROM categories WHERE slug = ?',
                            ['imported']
                        );
                        
                        if (defaultCat.length > 0) {
                            categoryId = defaultCat[0].id;
                        } else {
                            const [result] = await connection.query(
                                'INSERT INTO categories (name_en, name_ar, slug, status) VALUES (?, ?, ?, ?)',
                                ['Imported', 'مستورد', 'imported', 'active']
                            );
                            categoryId = result.insertId;
                        }
                    }

                    // Check if channel exists
                    const [existingChannel] = await connection.query(
                        'SELECT id FROM channels WHERE stream_url = ?',
                        [channel.url]
                    );

                    if (existingChannel.length > 0) {
                        skipped++;
                        continue;
                    }

                    // Insert channel
                    await connection.query(
                        'INSERT INTO channels (name_en, name_ar, category_id, logo, stream_url, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [channel.name, channel.name, categoryId, channel.logo || null, channel.url, 'active']
                    );

                    imported++;
                } catch (error) {
                    logger.error('Error importing channel:', { channel: channel.name, error: error.message });
                    errors++;
                }
            }

            return { imported, skipped, errors, total: channels.length };
        } catch (error) {
            logger.error('Error importing playlist:', { url: playlistUrl, error: error.message });
            throw error;
        }
    }

    /**
     * Run bootstrap process
     */
    async runBootstrap() {
        const connection = await pool.getConnection();
        
        try {
            logger.info('Starting bootstrap process...');

            // Check if already completed
            const completed = await this.isBootstrapCompleted();
            if (completed) {
                logger.info('Bootstrap already completed, skipping');
                return {
                    success: true,
                    message: 'Bootstrap already completed',
                    alreadyCompleted: true
                };
            }

            await connection.beginTransaction();

            let totalImported = 0;
            let totalSkipped = 0;
            let totalErrors = 0;
            const results = [];

            // Import each playlist
            for (const playlist of this.defaultPlaylists) {
                try {
                    logger.info('Importing playlist:', { name: playlist.name, url: playlist.url });
                    
                    const result = await this.importPlaylist(playlist.url, connection);
                    
                    totalImported += result.imported;
                    totalSkipped += result.skipped;
                    totalErrors += result.errors;
                    
                    results.push({
                        name: playlist.name,
                        ...result
                    });

                    logger.info('Playlist imported:', { 
                        name: playlist.name, 
                        imported: result.imported,
                        skipped: result.skipped,
                        errors: result.errors
                    });
                } catch (error) {
                    logger.error('Failed to import playlist:', { 
                        name: playlist.name, 
                        error: error.message 
                    });
                    // Continue with other playlists even if one fails
                }
            }

            // Mark bootstrap as completed
            await this.markBootstrapCompleted();

            await connection.commit();

            logger.info('Bootstrap completed successfully', {
                totalImported,
                totalSkipped,
                totalErrors,
                playlists: results.length
            });

            return {
                success: true,
                message: 'Bootstrap completed successfully',
                totalImported,
                totalSkipped,
                totalErrors,
                playlists: results
            };

        } catch (error) {
            await connection.rollback();
            logger.error('Bootstrap failed:', { error: error.message, stack: error.stack });
            
            return {
                success: false,
                message: 'Bootstrap failed',
                error: error.message
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Reset bootstrap (for testing/development)
     */
    async resetBootstrap() {
        try {
            await pool.query(
                'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
                ['false', 'bootstrap_completed']
            );
            
            logger.info('Bootstrap reset - will run again on next startup');
            return { success: true, message: 'Bootstrap reset successfully' };
        } catch (error) {
            logger.error('Error resetting bootstrap:', { error: error.message });
            return { success: false, error: error.message };
        }
    }
}

module.exports = new BootstrapService();
