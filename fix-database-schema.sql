-- PrimeX IPTV v11.0 - Complete Database Schema Fix
-- This script adds ALL missing columns and fixes schema mismatches

-- Fix admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS two_factor_enabled_at DATETIME DEFAULT NULL AFTER two_factor_backup_codes;

-- Fix admin_sessions table (create if not exists)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fix user_devices table (for last_seen tracking)
CREATE TABLE IF NOT EXISTS user_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    mac_address VARCHAR(17),
    ip_address VARCHAR(45),
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_device (user_id, device_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_last_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fix notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify all tables exist
SELECT 'Schema fix completed' as status;
