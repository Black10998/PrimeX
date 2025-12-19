-- Add server_id to subscription_plans table
-- This allows each plan to be associated with a specific streaming server

ALTER TABLE subscription_plans 
ADD COLUMN server_id INT DEFAULT NULL AFTER max_devices,
ADD INDEX idx_server_id (server_id);

-- Set default server for existing plans (use first active server)
UPDATE subscription_plans sp
SET sp.server_id = (
    SELECT id FROM streaming_servers 
    WHERE status = 'active' 
    ORDER BY priority DESC, id ASC 
    LIMIT 1
)
WHERE sp.server_id IS NULL;
