-- PrimeX IPTV - Add codes_seller role to admin_users table
-- Developer: PAX

USE primex_db;

-- Add codes_seller to role ENUM
ALTER TABLE admin_users 
MODIFY COLUMN role ENUM('super_admin', 'admin', 'moderator', 'codes_seller') 
DEFAULT 'super_admin';

-- Verify the change
DESCRIBE admin_users;

SELECT 'Migration completed: codes_seller role added successfully' AS status;
