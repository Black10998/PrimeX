-- PrimeX IPTV System Database Schema
-- Developer: PAX
-- Support: info@paxdes.com

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    subscription_start DATETIME,
    subscription_end DATETIME,
    plan_id INT,
    max_devices INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    notes TEXT,
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_subscription_end (subscription_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription plans
CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10,2),
    max_devices INT DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    features JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription codes
CREATE TABLE subscription_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    source_name VARCHAR(100),
    duration_days INT NOT NULL,
    max_uses INT DEFAULT 1,
    used_count INT DEFAULT 0,
    status ENUM('active', 'used', 'expired', 'disabled') DEFAULT 'active',
    plan_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_by INT,
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Code usage history
CREATE TABLE code_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_id INT NOT NULL,
    user_id INT NOT NULL,
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (code_id) REFERENCES subscription_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device binding
CREATE TABLE user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id VARCHAR(255),
    mac_address VARCHAR(17),
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_device (user_id, device_id),
    INDEX idx_mac (mac_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    icon VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Channels
CREATE TABLE channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    logo VARCHAR(255),
    stream_url VARCHAR(500),
    backup_stream_url VARCHAR(500),
    epg_id VARCHAR(100),
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan channel access
CREATE TABLE plan_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    channel_id INT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_channel (plan_id, channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Streaming servers
CREATE TABLE streaming_servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    type ENUM('primary', 'backup') DEFAULT 'primary',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    priority INT DEFAULT 0,
    max_connections INT DEFAULT 1000,
    current_connections INT DEFAULT 0,
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VOD Movies
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    category_id INT NOT NULL,
    poster VARCHAR(255),
    backdrop VARCHAR(255),
    stream_url VARCHAR(500),
    backup_stream_url VARCHAR(500),
    duration INT,
    year INT,
    rating DECIMAL(3,1),
    genre VARCHAR(255),
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Series
CREATE TABLE series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    category_id INT NOT NULL,
    poster VARCHAR(255),
    backdrop VARCHAR(255),
    year INT,
    rating DECIMAL(3,1),
    genre VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Series episodes
CREATE TABLE episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    series_id INT NOT NULL,
    season_number INT NOT NULL,
    episode_number INT NOT NULL,
    title_en VARCHAR(255),
    title_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    stream_url VARCHAR(500),
    backup_stream_url VARCHAR(500),
    duration INT,
    thumbnail VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
    INDEX idx_series (series_id),
    INDEX idx_season (series_id, season_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User activity logs
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_id VARCHAR(255),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) DEFAULT NULL,
    two_factor_backup_codes JSON DEFAULT NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- EPG data
CREATE TABLE epg_programs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    title_en VARCHAR(255),
    title_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    INDEX idx_channel_time (channel_id, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subscription plans
INSERT INTO subscription_plans (name_en, name_ar, duration_days, price, max_devices, features) VALUES
('Weekly Plan', 'خطة أسبوعية', 7, 9.99, 1, '{"channels": "all", "vod": true}'),
('Monthly Plan', 'خطة شهرية', 30, 29.99, 2, '{"channels": "all", "vod": true, "epg": true}'),
('Yearly Plan', 'خطة سنوية', 365, 299.99, 3, '{"channels": "all", "vod": true, "epg": true, "priority_support": true}');

-- Insert default categories
INSERT INTO categories (name_en, name_ar, slug, sort_order) VALUES
('Arabic Channels', 'القنوات العربية', 'arabic-channels', 1),
('Gulf Channels', 'قنوات الخليج', 'gulf-channels', 2),
('UAE Channels', 'قنوات الإمارات', 'uae-channels', 3),
('Syrian Channels', 'القنوات السورية', 'syrian-channels', 4),
('Sports Channels', 'القنوات الرياضية', 'sports-channels', 5),
('Live Matches', 'المباريات المباشرة', 'live-matches', 6),
('Series', 'المسلسلات', 'series', 7),
('Movies', 'الأفلام', 'movies', 8),
('Latest Content', 'أحدث المحتوى', 'latest-content', 9),
('Classic Content', 'المحتوى الكلاسيكي', 'classic-content', 10);

-- Default admin is created by initDatabase.js script
-- DO NOT insert default admin here - password must be properly hashed

-- Plan to category mapping
CREATE TABLE plan_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_plan_category (plan_id, category_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User to category mapping
CREATE TABLE user_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category (user_id, category_id),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User to channel mapping
CREATE TABLE user_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    channel_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_channel (user_id, channel_id),
    INDEX idx_user_id (user_id),
    INDEX idx_channel_id (channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title_en VARCHAR(255),
    title_ar VARCHAR(255),
    message_en TEXT,
    message_ar TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System branding for Xtream API
CREATE TABLE system_branding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    value_en TEXT,
    value_ar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default branding values
INSERT INTO system_branding (setting_key, value_en, value_ar) VALUES
('service_name', 'PrimeX IPTV', 'برايم إكس تي في'),
('developer_name', 'PAX', 'PAX'),
('support_email', 'info@paxdes.com', 'info@paxdes.com'),
('support_phone', '', ''),
('support_message', 'Contact us for assistance', 'اتصل بنا للمساعدة');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name_en', 'PrimeX TV', 'string', 'Site name in English'),
('site_name_ar', 'برايم إكس تي في', 'string', 'Site name in Arabic'),
('support_email', 'info@paxdes.com', 'string', 'Support email address'),
('default_language', 'en', 'string', 'Default system language'),
('max_login_attempts', '5', 'integer', 'Maximum login attempts before lockout'),
('session_timeout', '3600', 'integer', 'Session timeout in seconds'),
('enable_device_binding', '1', 'boolean', 'Enable device binding'),
('enable_epg', '1', 'boolean', 'Enable EPG functionality'),
('payment_methods', '["credit_card", "bank_transfer", "paypal"]', 'json', 'Available payment methods');
