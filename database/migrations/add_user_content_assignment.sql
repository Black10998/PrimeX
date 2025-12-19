-- Migration: Add user-specific content assignment and notifications
-- This enables automatic category/channel assignment on user creation
-- and removes server dependency for content visibility

-- Plan categories (link plans to categories)
CREATE TABLE IF NOT EXISTS plan_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_category (plan_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User categories (assigned at user creation)
CREATE TABLE IF NOT EXISTS user_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, category_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User channels (assigned at user creation)
CREATE TABLE IF NOT EXISTS user_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    channel_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_channel (user_id, channel_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('account_activated', 'subscription_expiring', 'subscription_expired', 'plan_upgraded', 'device_limit_reached', 'general') DEFAULT 'general',
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    message_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings for branding/support info
CREATE TABLE IF NOT EXISTS system_branding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    value_en TEXT,
    value_ar TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default branding values
INSERT INTO system_branding (setting_key, value_en, value_ar) VALUES
('service_name', 'PrimeX IPTV', 'PrimeX IPTV'),
('developer_name', 'PAX', 'PAX'),
('support_email', 'info@paxdes.com', 'info@paxdes.com'),
('support_phone', '+1234567890', '+1234567890'),
('support_message', 'Contact us for any assistance', 'اتصل بنا للحصول على أي مساعدة')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
