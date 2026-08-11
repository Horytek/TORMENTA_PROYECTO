/**
 * Schema Atelier — marketplace de dibujos por encargo (MVP).
 */
export const ATELIER_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS atelier_user (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('cliente','creador','admin') NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_atelier_user_email (email),
  KEY idx_atelier_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_client_profile (
  id_user INT NOT NULL PRIMARY KEY,
  avatar_url VARCHAR(500) NULL,
  bio VARCHAR(500) NULL,
  intereses VARCHAR(500) NULL,
  CONSTRAINT fk_atelier_client_user FOREIGN KEY (id_user) REFERENCES atelier_user(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_creator_profile (
  id_user INT NOT NULL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  nombre_artistico VARCHAR(120) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  bio TEXT NULL,
  estilos VARCHAR(500) NULL,
  onboarding_step TINYINT NOT NULL DEFAULT 1,
  publicado TINYINT(1) NOT NULL DEFAULT 0,
  disponible TINYINT(1) NOT NULL DEFAULT 1,
  precio_desde DECIMAL(12,2) NULL,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  pedidos_completados INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_atelier_creator_slug (slug),
  CONSTRAINT fk_atelier_creator_user FOREIGN KEY (id_user) REFERENCES atelier_user(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_category (
  id_category INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  parent_id INT NULL,
  UNIQUE KEY uq_atelier_cat_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_tag (
  id_tag INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_atelier_tag (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_portfolio_item (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_creator INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  descripcion VARCHAR(500) NULL,
  image_url VARCHAR(500) NOT NULL,
  id_category INT NULL,
  tags VARCHAR(300) NULL,
  destacado TINYINT(1) NOT NULL DEFAULT 0,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atelier_portfolio_creator (id_creator),
  CONSTRAINT fk_atelier_portfolio_creator FOREIGN KEY (id_creator) REFERENCES atelier_creator_profile(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_service (
  id_service INT AUTO_INCREMENT PRIMARY KEY,
  id_creator INT NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NULL,
  cover_url VARCHAR(500) NULL,
  id_category INT NULL,
  tags VARCHAR(300) NULL,
  precio_base DECIMAL(12,2) NOT NULL,
  dias_entrega INT NOT NULL DEFAULT 3,
  revisiones_incluidas INT NOT NULL DEFAULT 2,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atelier_service_creator (id_creator),
  CONSTRAINT fk_atelier_service_creator FOREIGN KEY (id_creator) REFERENCES atelier_creator_profile(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_service_extra (
  id_extra INT AUTO_INCREMENT PRIMARY KEY,
  id_service INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_atelier_extra_service FOREIGN KEY (id_service) REFERENCES atelier_service(id_service) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_commission_rule (
  id_rule INT AUTO_INCREMENT PRIMARY KEY,
  scope ENUM('global','creator','category') NOT NULL DEFAULT 'global',
  id_creator INT NULL,
  id_category INT NULL,
  percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  min_fee DECIMAL(12,2) NULL,
  max_fee DECIMAL(12,2) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_request (
  id_request INT AUTO_INCREMENT PRIMARY KEY,
  id_client INT NOT NULL,
  id_creator INT NOT NULL,
  id_service INT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  refs_json JSON NULL,
  presupuesto DECIMAL(12,2) NULL,
  fecha_limite DATE NULL,
  estado ENUM(
    'draft','submitted','quote_sent','accepted','payment_pending','paid',
    'in_progress','preview','revision','final_delivery','completed',
    'rejected','cancelled','disputed','refunded','expired'
  ) NOT NULL DEFAULT 'draft',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atelier_req_client (id_client),
  KEY idx_atelier_req_creator (id_creator),
  CONSTRAINT fk_atelier_req_client FOREIGN KEY (id_client) REFERENCES atelier_user(id_user),
  CONSTRAINT fk_atelier_req_creator FOREIGN KEY (id_creator) REFERENCES atelier_creator_profile(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_quote (
  id_quote INT AUTO_INCREMENT PRIMARY KEY,
  id_request INT NOT NULL,
  precio_base DECIMAL(12,2) NOT NULL,
  extras_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  creator_net DECIMAL(12,2) NOT NULL,
  dias_entrega INT NOT NULL,
  revisiones INT NOT NULL DEFAULT 2,
  condiciones TEXT NULL,
  expira_en DATETIME NULL,
  estado ENUM('sent','accepted','rejected','expired') NOT NULL DEFAULT 'sent',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_atelier_quote_req FOREIGN KEY (id_request) REFERENCES atelier_request(id_request)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_quote_item (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_quote INT NOT NULL,
  label VARCHAR(160) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_atelier_qi_quote FOREIGN KEY (id_quote) REFERENCES atelier_quote(id_quote) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_order (
  id_order INT AUTO_INCREMENT PRIMARY KEY,
  id_request INT NOT NULL,
  id_quote INT NOT NULL,
  id_client INT NOT NULL,
  id_creator INT NOT NULL,
  estado ENUM(
    'payment_pending','paid','in_progress','preview','revision',
    'final_delivery','completed','cancelled','disputed','refunded'
  ) NOT NULL DEFAULT 'payment_pending',
  gross_amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  creator_net DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'PEN',
  revisiones_usadas INT NOT NULL DEFAULT 0,
  revisiones_incluidas INT NOT NULL DEFAULT 2,
  fecha_limite DATE NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_en DATETIME NULL,
  UNIQUE KEY uq_atelier_order_request (id_request),
  KEY idx_atelier_order_client (id_client),
  KEY idx_atelier_order_creator (id_creator),
  CONSTRAINT fk_atelier_order_req FOREIGN KEY (id_request) REFERENCES atelier_request(id_request),
  CONSTRAINT fk_atelier_order_quote FOREIGN KEY (id_quote) REFERENCES atelier_quote(id_quote)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_order_event (
  id_event INT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NOT NULL,
  tipo VARCHAR(64) NOT NULL,
  mensaje VARCHAR(500) NULL,
  id_actor INT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atelier_oe_order (id_order),
  CONSTRAINT fk_atelier_oe_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_revision (
  id_revision INT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NOT NULL,
  numero INT NOT NULL,
  comentario TEXT NOT NULL,
  id_client INT NOT NULL,
  estado ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_atelier_rev_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_message (
  id_message INT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NOT NULL,
  id_sender INT NOT NULL,
  body TEXT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atelier_msg_order (id_order),
  CONSTRAINT fk_atelier_msg_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_attachment (
  id_attachment INT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NOT NULL,
  id_uploader INT NOT NULL,
  kind ENUM('reference','sketch','preview','final','other') NOT NULL DEFAULT 'other',
  url VARCHAR(500) NOT NULL,
  filename VARCHAR(200) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_atelier_att_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_payment (
  id_payment INT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NOT NULL,
  provider VARCHAR(32) NOT NULL DEFAULT 'mercadopago',
  provider_payment_id VARCHAR(120) NULL,
  preference_id VARCHAR(120) NULL,
  amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  creator_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'PEN',
  status ENUM('pending','approved','rejected','refunded') NOT NULL DEFAULT 'pending',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  UNIQUE KEY uq_atelier_pay_order (id_order),
  KEY idx_atelier_pay_pref (preference_id),
  CONSTRAINT fk_atelier_pay_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_ledger_entry (
  id_entry BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NULL,
  id_creator INT NULL,
  tipo VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'PEN',
  meta_json JSON NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atelier_ledger_order (id_order),
  KEY idx_atelier_ledger_creator (id_creator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_wallet (
  id_creator INT NOT NULL PRIMARY KEY,
  pending DECIMAL(12,2) NOT NULL DEFAULT 0,
  available DECIMAL(12,2) NOT NULL DEFAULT 0,
  withdrawn DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_atelier_wallet_creator FOREIGN KEY (id_creator) REFERENCES atelier_creator_profile(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_review (
  id_review INT AUTO_INCREMENT PRIMARY KEY,
  id_order INT NOT NULL,
  id_client INT NOT NULL,
  id_creator INT NOT NULL,
  calidad TINYINT NOT NULL,
  comunicacion TINYINT NOT NULL,
  cumplimiento TINYINT NOT NULL,
  tiempo TINYINT NOT NULL,
  estrellas DECIMAL(2,1) NOT NULL,
  comentario VARCHAR(1000) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_atelier_review_order (id_order),
  CONSTRAINT fk_atelier_review_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS atelier_favorite (
  id_favorite INT AUTO_INCREMENT PRIMARY KEY,
  id_client INT NOT NULL,
  kind ENUM('creator','service','portfolio') NOT NULL,
  target_id INT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_atelier_fav (id_client, kind, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
