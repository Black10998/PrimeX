-- Enhance device tracking with IP address and user agent
-- This migration adds fields needed for comprehensive device management

ALTER TABLE user_devices 
ADD COLUMN ip_address VARCHAR(45) AFTER device_type,
ADD COLUMN user_agent TEXT AFTER ip_address,
ADD INDEX idx_last_seen (last_seen),
ADD INDEX idx_status (status);

-- Create sessions table for active user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE SET NULL,
    INDEX idx_user_session (user_id, token_hash),
    INDEX idx_expires (expires_at),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add server_id to users table (for tracking which server user is assigned to)
-- Note: This may fail if column already exists, which is fine
ALTER TABLE users ADD COLUMN server_id INT AFTER plan_id;
ALTER TABLE users ADD INDEX idx_server_id (server_id);
