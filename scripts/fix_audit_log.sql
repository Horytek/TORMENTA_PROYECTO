-- Fix audit_log table: Add all missing columns
-- Compatible with MySQL 5.7+ (without IF NOT EXISTS for ALTER TABLE)

-- First, check your current table structure:
-- DESCRIBE audit_log;

-- Option 1: If the columns don't exist, add them one by one
-- (If you get "Duplicate column name" error, that column already exists - that's OK)

-- Add actor_role column
ALTER TABLE audit_log ADD COLUMN actor_role VARCHAR(100) NULL AFTER actor_user_id;

-- Add id_tenant_target column  
ALTER TABLE audit_log ADD COLUMN id_tenant_target INT NULL AFTER actor_role;

-- Option 2: If you prefer to recreate the table (BACKUP FIRST!)
-- DROP TABLE IF EXISTS audit_log;
-- CREATE TABLE audit_log (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     actor_user_id INT NULL,
--     actor_role VARCHAR(100) NULL,
--     id_tenant_target INT NULL,
--     entity_type VARCHAR(100) NOT NULL,
--     entity_id VARCHAR(255) NULL,
--     action VARCHAR(50) NOT NULL,
--     details JSON NULL,
--     ip_address VARCHAR(45) NULL,
--     user_agent TEXT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     INDEX idx_actor_user (actor_user_id),
--     INDEX idx_entity (entity_type, entity_id),
--     INDEX idx_created (created_at)
-- );

-- Verify the table structure after running:
-- DESCRIBE audit_log;
