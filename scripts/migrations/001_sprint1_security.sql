-- Migration: 001_sprint1_security
-- Description: Adds tenant_status, perm_version to empresa and creates audit_log table.

-- 1. Add columns to empresa (Tenant)
-- Check if columns exist before adding (using a stored procedure approach or just simple ALTERs that might fail if repeated, wrapped in try/catch in node script)
-- For simplicity in raw SQL, we use ALTER TABLE.

ALTER TABLE empresa 
ADD COLUMN tenant_status ENUM('ACTIVE', 'SUSPENDED', 'GRACE') NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN grace_until DATETIME NULL,
ADD COLUMN perm_version INT NOT NULL DEFAULT 1;

-- 2. Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id INT NULL,
    actor_role VARCHAR(50) NULL,
    id_tenant_target INT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'PERMISOS', 'PLAN', 'USUARIO', etc.
    entity_id VARCHAR(50) NULL,
    action VARCHAR(50) NOT NULL, -- 'UPDATE', 'CREATE', 'DELETE'
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_tenant (id_tenant_target),
    INDEX idx_audit_actor (actor_user_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
