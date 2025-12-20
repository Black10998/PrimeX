-- PrimeX IPTV - Device Activation System
-- Industry-standard device activation (4Kmatic-style)

USE primex_db;

-- Device Activations Table
CREATE TABLE IF NOT EXISTS device_activations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_key VARCHAR(50) UNIQUE NOT NULL COMMENT 'Device key from TV/app (e.g., K-DEVICE-123456)',
    qr_code_data TEXT COMMENT 'QR code data for scanning',
    user_id INT DEFAULT NULL COMMENT 'Linked user account',
    username VARCHAR(50) DEFAULT NULL COMMENT 'Auto-generated or custom username',
    password VARCHAR(255) DEFAULT NULL COMMENT 'Auto-generated password (hashed)',
    plain_password VARCHAR(100) DEFAULT NULL COMMENT 'Plain password for display (temporary)',
    plan_id INT DEFAULT NULL COMMENT 'Assigned subscription plan',
    status ENUM('pending', 'activated', 'expired', 'deactivated') DEFAULT 'pending',
    device_info JSON COMMENT 'Device details (model, OS, app, etc.)',
    server_url VARCHAR(255) COMMENT 'Xtream server URL',
    activated_by INT COMMENT 'Admin who activated',
    activated_at DATETIME DEFAULT NULL,
    expires_at DATETIME NOT NULL COMMENT 'Device key expiration (15 min default)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device_key (device_key),
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (activated_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supported IPTV Applications Table
CREATE TABLE IF NOT EXISTS supported_apps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'App name (e.g., IPTV Smarters Pro)',
    slug VARCHAR(100) UNIQUE NOT NULL COMMENT 'URL-friendly identifier',
    platform ENUM('tv', 'mobile', 'desktop', 'stb') NOT NULL COMMENT 'Device platform',
    os VARCHAR(50) COMMENT 'Operating system (Android TV, iOS, Windows, etc.)',
    icon_url VARCHAR(255) COMMENT 'App icon URL',
    supports_device_code BOOLEAN DEFAULT FALSE COMMENT 'Supports device key activation',
    supports_xtream BOOLEAN DEFAULT TRUE COMMENT 'Supports Xtream Codes API',
    supports_m3u BOOLEAN DEFAULT TRUE COMMENT 'Supports M3U playlists',
    download_url VARCHAR(255) COMMENT 'Official download link',
    instructions TEXT COMMENT 'Setup instructions',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Tested and verified',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Show in catalog',
    display_order INT DEFAULT 0 COMMENT 'Sort order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_platform (platform),
    INDEX idx_slug (slug),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Supported Apps
INSERT INTO supported_apps (name, slug, platform, os, supports_device_code, supports_xtream, supports_m3u, is_verified, display_order) VALUES
-- TV Apps
('4Kmatic-style Apps', '4kmatic', 'tv', 'Android TV', TRUE, TRUE, FALSE, TRUE, 1),
('IPTV Smarters Pro', 'iptv-smarters-pro-tv', 'tv', 'Android TV', FALSE, TRUE, TRUE, TRUE, 2),
('TiviMate', 'tivimate', 'tv', 'Android TV', FALSE, TRUE, TRUE, TRUE, 3),
('SmartOne IPTV', 'smartone-iptv', 'tv', 'Android TV', FALSE, TRUE, TRUE, TRUE, 4),
('XCIPTV', 'xciptv-tv', 'tv', 'Android TV', FALSE, TRUE, TRUE, TRUE, 5),
('OTT Navigator', 'ott-navigator', 'tv', 'Android TV', FALSE, TRUE, TRUE, TRUE, 6),
('SET IPTV', 'set-iptv', 'tv', 'Samsung Tizen', FALSE, TRUE, TRUE, TRUE, 7),
('Flix IPTV', 'flix-iptv', 'tv', 'Samsung Tizen', FALSE, TRUE, TRUE, TRUE, 8),
('IBO Player', 'ibo-player', 'tv', 'Samsung Tizen', FALSE, TRUE, TRUE, TRUE, 9),
('NET IPTV', 'net-iptv', 'tv', 'LG webOS', FALSE, TRUE, TRUE, TRUE, 10),
('SS IPTV', 'ss-iptv', 'tv', 'LG webOS', FALSE, TRUE, TRUE, TRUE, 11),

-- Mobile Apps
('IPTV Smarters', 'iptv-smarters-mobile', 'mobile', 'Android/iOS', FALSE, TRUE, TRUE, TRUE, 20),
('XCIPTV', 'xciptv-mobile', 'mobile', 'Android/iOS', FALSE, TRUE, TRUE, TRUE, 21),
('GSE Smart IPTV', 'gse-smart-iptv', 'mobile', 'Android/iOS', FALSE, TRUE, TRUE, TRUE, 22),
('iPlayTV', 'iplaytv', 'mobile', 'iOS', FALSE, TRUE, TRUE, TRUE, 23),
('Flex IPTV', 'flex-iptv', 'mobile', 'Android/iOS', FALSE, TRUE, TRUE, TRUE, 24),

-- Desktop Apps
('IPTV Smarters Desktop', 'iptv-smarters-desktop', 'desktop', 'Windows/macOS', FALSE, TRUE, TRUE, TRUE, 30),
('VLC Media Player', 'vlc', 'desktop', 'Windows/macOS/Linux', FALSE, FALSE, TRUE, TRUE, 31),
('MyIPTV Player', 'myiptv-player', 'desktop', 'Windows/macOS', FALSE, TRUE, TRUE, TRUE, 32),
('Kodi (PVR IPTV Simple)', 'kodi-pvr', 'desktop', 'Windows/macOS/Linux', FALSE, TRUE, TRUE, TRUE, 33),

-- STB Apps
('MAG / Stalker Portal', 'mag-stalker', 'stb', 'MAG Box', FALSE, TRUE, FALSE, TRUE, 40),
('Enigma2', 'enigma2', 'stb', 'Enigma2', FALSE, TRUE, TRUE, TRUE, 41),
('Formuler', 'formuler', 'stb', 'Formuler', FALSE, TRUE, TRUE, TRUE, 42);

SELECT 'Device activation tables created successfully' AS status;
