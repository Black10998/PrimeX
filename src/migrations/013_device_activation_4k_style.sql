-- 4K Player-Style Device Activation System
-- Implements industry-standard device activation flow

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS device_activations;

-- Device Activations Table (4K Player Style)
CREATE TABLE device_activations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Device Identification
    device_key VARCHAR(20) UNIQUE NOT NULL COMMENT 'Short numeric code displayed on TV (e.g., 61324637)',
    mac_address VARCHAR(17) NOT NULL COMMENT 'Device MAC address',
    device_info JSON COMMENT 'Device details (model, OS, app version, etc.)',
    
    -- Activation Status
    status ENUM('pending', 'active', 'expired', 'suspended') DEFAULT 'pending',
    
    -- Subscription Details (set during activation)
    subscription_plan_id INT NULL COMMENT 'Linked subscription plan',
    activated_by INT NULL COMMENT 'Admin user who activated',
    activated_at DATETIME NULL,
    expires_at DATETIME NULL COMMENT 'Subscription expiry date',
    
    -- Device Limits & Permissions
    max_connections INT DEFAULT 1 COMMENT 'Concurrent connections allowed',
    current_connections INT DEFAULT 0,
    
    -- Content Access
    allowed_channels JSON COMMENT 'Channel IDs accessible to this device',
    allowed_vod JSON COMMENT 'VOD category IDs accessible',
    
    -- Tracking
    last_check_at DATETIME NULL COMMENT 'Last time device checked status',
    last_ip VARCHAR(45) NULL,
    check_count INT DEFAULT 0 COMMENT 'Number of status checks',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_device_key (device_key),
    INDEX idx_mac_address (mac_address),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_device (device_key, mac_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Activation History (audit trail)
CREATE TABLE IF NOT EXISTS device_activation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_activation_id INT NOT NULL,
    action ENUM('registered', 'activated', 'renewed', 'suspended', 'expired') NOT NULL,
    performed_by INT NULL COMMENT 'Admin user ID',
    details JSON COMMENT 'Action details',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (device_activation_id) REFERENCES device_activations(id) ON DELETE CASCADE,
    INDEX idx_device (device_activation_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
