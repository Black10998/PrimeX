-- Migration: Add system bootstrap tracking
-- Tracks whether initial data seeding has been completed

CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert bootstrap flag (default: not completed)
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('bootstrap_completed', 'false', 'Indicates whether initial data seeding has been completed')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Insert bootstrap timestamp placeholder
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('bootstrap_timestamp', NULL, 'Timestamp when bootstrap was completed')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Insert bootstrap version
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('bootstrap_version', '1.0', 'Version of bootstrap data')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
