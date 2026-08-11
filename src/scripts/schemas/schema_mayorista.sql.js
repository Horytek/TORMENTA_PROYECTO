/**
 * Schema Mayorista (db_mayorista).
 * Job: pedidos B2B con listas de precio por volumen. Portal cerrado.
 */
export const MAYORISTA_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS mayorista_tienda (
  id_tienda INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  whatsapp VARCHAR(32) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mayorista_slug (slug),
  KEY idx_mayorista_tienda_tenant (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mayorista_lista_precio (
  id_lista INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_tienda INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'PEN',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mayorista_lista_tenant (id_tenant),
  CONSTRAINT fk_mayorista_lista_tienda FOREIGN KEY (id_tienda) REFERENCES mayorista_tienda(id_tienda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mayorista_lista_item (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_lista INT NOT NULL,
  id_tenant INT NOT NULL,
  sku VARCHAR(64) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  min_cantidad DECIMAL(12,2) NOT NULL DEFAULT 1,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_mayorista_item (id_lista, sku),
  KEY idx_mayorista_item_tenant (id_tenant),
  CONSTRAINT fk_mayorista_item_lista FOREIGN KEY (id_lista) REFERENCES mayorista_lista_precio(id_lista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mayorista_comprador (
  id_comprador INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_tienda INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  razon_social VARCHAR(200) NOT NULL,
  ruc VARCHAR(20) NULL,
  id_lista INT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mayorista_comprador_email (id_tienda, email),
  KEY idx_mayorista_comprador_tenant (id_tenant),
  CONSTRAINT fk_mayorista_comprador_tienda FOREIGN KEY (id_tienda) REFERENCES mayorista_tienda(id_tienda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mayorista_pedido (
  id_pedido BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_tienda INT NOT NULL,
  id_comprador INT NOT NULL,
  estado ENUM('borrador','enviado','confirmado','rechazado','despachado') NOT NULL DEFAULT 'enviado',
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  notas VARCHAR(500) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mayorista_pedido_tenant (id_tenant, creado_en),
  CONSTRAINT fk_mayorista_pedido_comprador FOREIGN KEY (id_comprador) REFERENCES mayorista_comprador(id_comprador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mayorista_pedido_item (
  id_detalle BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_pedido BIGINT NOT NULL,
  id_tenant INT NOT NULL,
  sku VARCHAR(64) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL,
  precio_unit DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_mayorista_pedido_item FOREIGN KEY (id_pedido) REFERENCES mayorista_pedido(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mayorista_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
