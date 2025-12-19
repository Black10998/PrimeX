-- Add Two-Factor Authentication (2FA) support for admin users
-- This migration adds TOTP 2FA fields to admin_users table

ALTER TABLE admin_users 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE AFTER password,
ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_enabled,
ADD COLUMN two_factor_backup_codes TEXT DEFAULT NULL AFTER two_factor_secret,
ADD COLUMN two_factor_enabled_at TIMESTAMP NULL AFTER two_factor_backup_codes,
ADD INDEX idx_two_factor_enabled (two_factor_enabled);

-- Add activity log for 2FA events
-- (activity_logs table should already exist)
