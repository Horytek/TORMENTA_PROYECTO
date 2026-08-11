/**
 * Schema Sync Stock (db_sync).
 * Job: unificar stock entre canales. Stock maestro sigue en ERP/Ecommerce;
 * aquí solo mapeos, colas y logs. Sin JOINs cross-DB.
 */
export const SYNC_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sync_canal (
  id_canal INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  codigo VARCHAR(32) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  config_json JSON NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sync_canal_tenant_codigo (id_tenant, codigo),
  KEY idx_sync_canal_tenant (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_mapeo_sku (
  id_mapeo INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_canal INT NOT NULL,
  sku_origen VARCHAR(64) NOT NULL,
  sku_destino VARCHAR(64) NOT NULL,
  id_producto_erp INT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sync_mapeo (id_tenant, id_canal, sku_origen),
  KEY idx_sync_mapeo_tenant (id_tenant),
  CONSTRAINT fk_sync_mapeo_canal FOREIGN KEY (id_canal) REFERENCES sync_canal(id_canal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_job (
  id_job BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_canal INT NULL,
  tipo VARCHAR(32) NOT NULL,
  estado ENUM('pending','running','ok','error') NOT NULL DEFAULT 'pending',
  mensaje VARCHAR(500) NULL,
  payload_json JSON NULL,
  iniciado_en DATETIME NULL,
  finalizado_en DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sync_job_tenant (id_tenant, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
