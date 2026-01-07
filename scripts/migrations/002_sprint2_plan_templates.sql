-- Migration: 002_sprint2_plan_templates
-- Description: Creates tables for Plan Templates and Entitlements (Sprint 2 goal).

-- 1. plan_template_version
-- Stores versions of plan configurations.
-- status: 'DRAFT' (editing), 'PUBLISHED' (active), 'ARCHIVED' (old)
CREATE TABLE IF NOT EXISTS plan_template_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_plan INT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME NULL,
    created_by INT NULL, -- user id
    INDEX idx_ptv_plan (id_plan),
    INDEX idx_ptv_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. plan_entitlement_modulo
-- Modules linked to a specific template version
CREATE TABLE IF NOT EXISTS plan_entitlement_modulo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_version_id BIGINT NOT NULL,
    id_modulo INT NOT NULL,
    INDEX idx_pem_version (template_version_id),
    CONSTRAINT fk_pem_version FOREIGN KEY (template_version_id) 
        REFERENCES plan_template_version(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. plan_entitlement_submodulo
-- Submodules linked to a specific template version
CREATE TABLE IF NOT EXISTS plan_entitlement_submodulo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_version_id BIGINT NOT NULL,
    id_submodulo INT NOT NULL,
    INDEX idx_pes_version (template_version_id),
    CONSTRAINT fk_pes_version FOREIGN KEY (template_version_id) 
        REFERENCES plan_template_version(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
