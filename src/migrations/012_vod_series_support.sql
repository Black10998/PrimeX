-- VOD and Series Support Migration
-- Adds support for Movies, Series, and Episodes

-- VOD Categories Table
CREATE TABLE IF NOT EXISTS vod_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    icon VARCHAR(255),
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movies Table
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category_id INT,
    description_en TEXT,
    description_ar TEXT,
    poster VARCHAR(500),
    backdrop VARCHAR(500),
    stream_url VARCHAR(1000) NOT NULL,
    trailer_url VARCHAR(1000),
    duration INT COMMENT 'Duration in minutes',
    release_year INT,
    rating DECIMAL(3,1) DEFAULT 0.0,
    imdb_id VARCHAR(20),
    tmdb_id INT,
    director VARCHAR(255),
    cast TEXT COMMENT 'JSON array of cast members',
    genres TEXT COMMENT 'JSON array of genres',
    quality VARCHAR(20) COMMENT 'HD, FHD, 4K, etc',
    audio_languages TEXT COMMENT 'JSON array of audio languages',
    subtitle_languages TEXT COMMENT 'JSON array of subtitle languages',
    views INT DEFAULT 0,
    status ENUM('active', 'inactive', 'coming_soon') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES vod_categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    INDEX idx_release_year (release_year),
    INDEX idx_views (views),
    FULLTEXT idx_search (name_en, name_ar, description_en, description_ar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Series Table
CREATE TABLE IF NOT EXISTS series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category_id INT,
    description_en TEXT,
    description_ar TEXT,
    poster VARCHAR(500),
    backdrop VARCHAR(500),
    trailer_url VARCHAR(1000),
    release_year INT,
    rating DECIMAL(3,1) DEFAULT 0.0,
    imdb_id VARCHAR(20),
    tmdb_id INT,
    director VARCHAR(255),
    cast TEXT COMMENT 'JSON array of cast members',
    genres TEXT COMMENT 'JSON array of genres',
    total_seasons INT DEFAULT 0,
    total_episodes INT DEFAULT 0,
    views INT DEFAULT 0,
    status ENUM('active', 'inactive', 'ongoing', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES vod_categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    INDEX idx_release_year (release_year),
    INDEX idx_views (views),
    FULLTEXT idx_search (name_en, name_ar, description_en, description_ar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seasons Table
CREATE TABLE IF NOT EXISTS seasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    series_id INT NOT NULL,
    season_number INT NOT NULL,
    name_en VARCHAR(255),
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    poster VARCHAR(500),
    release_year INT,
    episode_count INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
    UNIQUE KEY unique_series_season (series_id, season_number),
    INDEX idx_series (series_id),
    INDEX idx_season_number (season_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Episodes Table
CREATE TABLE IF NOT EXISTS episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    series_id INT NOT NULL,
    season_id INT NOT NULL,
    episode_number INT NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    thumbnail VARCHAR(500),
    stream_url VARCHAR(1000) NOT NULL,
    duration INT COMMENT 'Duration in minutes',
    release_date DATE,
    quality VARCHAR(20) COMMENT 'HD, FHD, 4K, etc',
    audio_languages TEXT COMMENT 'JSON array of audio languages',
    subtitle_languages TEXT COMMENT 'JSON array of subtitle languages',
    views INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_season_episode (season_id, episode_number),
    INDEX idx_series (series_id),
    INDEX idx_season (season_id),
    INDEX idx_episode_number (episode_number),
    INDEX idx_status (status),
    INDEX idx_views (views)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User VOD Watch History
CREATE TABLE IF NOT EXISTS user_vod_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_type ENUM('movie', 'episode') NOT NULL,
    content_id INT NOT NULL COMMENT 'movie_id or episode_id',
    watch_progress INT DEFAULT 0 COMMENT 'Progress in seconds',
    watch_duration INT DEFAULT 0 COMMENT 'Total duration in seconds',
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_content (content_type, content_id),
    INDEX idx_last_watched (last_watched_at),
    UNIQUE KEY unique_user_content (user_id, content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_type ENUM('movie', 'series') NOT NULL,
    content_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_content (content_type, content_id),
    UNIQUE KEY unique_user_favorite (user_id, content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default VOD categories
INSERT IGNORE INTO vod_categories (name_en, name_ar, slug, sort_order, status) VALUES
('Action', 'أكشن', 'action', 1, 'active'),
('Comedy', 'كوميديا', 'comedy', 2, 'active'),
('Drama', 'دراما', 'drama', 3, 'active'),
('Horror', 'رعب', 'horror', 4, 'active'),
('Thriller', 'إثارة', 'thriller', 5, 'active'),
('Romance', 'رومانسي', 'romance', 6, 'active'),
('Sci-Fi', 'خيال علمي', 'sci-fi', 7, 'active'),
('Documentary', 'وثائقي', 'documentary', 8, 'active'),
('Animation', 'رسوم متحركة', 'animation', 9, 'active'),
('Family', 'عائلي', 'family', 10, 'active');
