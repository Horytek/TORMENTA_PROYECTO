/**
 * Schemas SQL oleadas B–E + Recluta. Ejecutar via migrate_platform_waves_b_e.js
 */
export const WAVE_SCHEMAS = {
  db_taller: `
CREATE TABLE IF NOT EXISTS taller_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taller_ot (
  id_ot INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  estado ENUM('borrador','en_proceso','terminada','cancelada') NOT NULL DEFAULT 'borrador',
  merma_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  notas VARCHAR(500) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_taller_ot (id_tenant, codigo),
  KEY idx_taller_ot_tenant (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taller_insumo (
  id_insumo INT AUTO_INCREMENT PRIMARY KEY,
  id_ot INT NOT NULL,
  id_tenant INT NOT NULL,
  sku VARCHAR(64) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL DEFAULT 1,
  KEY idx_taller_insumo (id_tenant, id_ot),
  CONSTRAINT fk_taller_insumo_ot FOREIGN KEY (id_ot) REFERENCES taller_ot(id_ot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taller_operador (
  id_operador INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  pin VARCHAR(12) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_taller_op (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_preventa: `
CREATE TABLE IF NOT EXISTS preventa_entitlement (
  id_tienda INT NOT NULL PRIMARY KEY,
  id_tenant INT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS preventa_campania (
  id_campania INT AUTO_INCREMENT PRIMARY KEY,
  id_tienda INT NOT NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  anticipo_pct DECIMAL(5,2) NOT NULL DEFAULT 30,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_preventa_slug (slug),
  KEY idx_preventa_tienda (id_tienda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS preventa_item (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_campania INT NOT NULL,
  sku VARCHAR(64) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  cupo INT NOT NULL DEFAULT 100,
  reservados INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_preventa_item FOREIGN KEY (id_campania) REFERENCES preventa_campania(id_campania)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS preventa_reserva (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  id_campania INT NOT NULL,
  id_item INT NOT NULL,
  cliente_nombre VARCHAR(160) NOT NULL,
  cliente_email VARCHAR(160) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  monto_anticipo DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado_pago ENUM('pendiente','pagado','anulado') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_preventa_reserva (id_campania)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_crm: `
CREATE TABLE IF NOT EXISTS crm_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS crm_pipeline (
  id_pipeline INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  KEY idx_crm_pipe (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS crm_etapa (
  id_etapa INT AUTO_INCREMENT PRIMARY KEY,
  id_pipeline INT NOT NULL,
  id_tenant INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_crm_etapa FOREIGN KEY (id_pipeline) REFERENCES crm_pipeline(id_pipeline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS crm_deal (
  id_deal INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_pipeline INT NOT NULL,
  id_etapa INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  id_cliente_erp INT NULL,
  monto DECIMAL(14,2) NOT NULL DEFAULT 0,
  estado ENUM('abierto','ganado','perdido') NOT NULL DEFAULT 'abierto',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_crm_deal (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS crm_actividad (
  id_actividad INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_deal INT NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  nota VARCHAR(500) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_crm_act FOREIGN KEY (id_deal) REFERENCES crm_deal(id_deal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_envios: `
CREATE TABLE IF NOT EXISTS envios_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS envios_guia (
  id_guia INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  courier VARCHAR(80) NOT NULL DEFAULT 'manual',
  destinatario VARCHAR(160) NOT NULL,
  destino VARCHAR(200) NOT NULL,
  estado ENUM('creada','en_transito','entregada','devuelta') NOT NULL DEFAULT 'creada',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_envios_codigo (codigo),
  KEY idx_envios_tenant (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS envios_evento (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_guia INT NOT NULL,
  estado VARCHAR(40) NOT NULL,
  detalle VARCHAR(300) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_envios_ev FOREIGN KEY (id_guia) REFERENCES envios_guia(id_guia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_wms: `
CREATE TABLE IF NOT EXISTS wms_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS wms_ubicacion (
  id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_wms_ubic (id_tenant, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS wms_tarea (
  id_tarea INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  tipo ENUM('picking','packing','conteo') NOT NULL,
  sku VARCHAR(64) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL DEFAULT 1,
  id_ubicacion INT NULL,
  estado ENUM('pendiente','en_curso','hecha') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_wms_tarea (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_despacho: `
CREATE TABLE IF NOT EXISTS despacho_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS despacho_ruta (
  id_ruta INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  fecha DATE NOT NULL,
  vehiculo VARCHAR(80) NOT NULL,
  chofer VARCHAR(120) NOT NULL,
  estado ENUM('planificada','en_ruta','cerrada') NOT NULL DEFAULT 'planificada',
  KEY idx_despacho_ruta (id_tenant, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS despacho_parada (
  id_parada INT AUTO_INCREMENT PRIMARY KEY,
  id_ruta INT NOT NULL,
  id_tenant INT NOT NULL,
  secuencia INT NOT NULL DEFAULT 1,
  direccion VARCHAR(200) NOT NULL,
  cliente VARCHAR(160) NULL,
  estado ENUM('pendiente','entregada','fallida') NOT NULL DEFAULT 'pendiente',
  CONSTRAINT fk_despacho_parada FOREIGN KEY (id_ruta) REFERENCES despacho_ruta(id_ruta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS despacho_chofer (
  id_chofer INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  pin VARCHAR(12) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_taxi: `
CREATE TABLE IF NOT EXISTS taxi_entitlement (
  id_operador INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  UNIQUE KEY uq_taxi_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taxi_conductor (
  id_conductor INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(32) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taxi_pasajero (
  id_pasajero INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taxi_viaje (
  id_viaje INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  id_pasajero INT NULL,
  id_conductor INT NULL,
  origen VARCHAR(200) NOT NULL,
  destino VARCHAR(200) NOT NULL,
  estado ENUM('solicitado','asignado','en_curso','finalizado','cancelado') NOT NULL DEFAULT 'solicitado',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_taxi_viaje (id_operador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS taxi_admin (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_taxi_admin (id_operador, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_delivery: `
CREATE TABLE IF NOT EXISTS delivery_entitlement (
  id_operador INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  UNIQUE KEY uq_delivery_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS delivery_repartidor (
  id_repartidor INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(32) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS delivery_cliente (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS delivery_pedido (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  id_cliente INT NULL,
  id_repartidor INT NULL,
  recojo VARCHAR(200) NOT NULL,
  entrega VARCHAR(200) NOT NULL,
  detalle VARCHAR(300) NULL,
  estado ENUM('solicitado','asignado','en_camino','entregado','cancelado') NOT NULL DEFAULT 'solicitado',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_delivery_pedido (id_operador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS delivery_admin (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  id_operador INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_delivery_admin (id_operador, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_flotas: `
CREATE TABLE IF NOT EXISTS flotas_entitlement (
  id_empresa_flota INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  UNIQUE KEY uq_flotas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS flotas_vehiculo (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa_flota INT NOT NULL,
  placa VARCHAR(20) NOT NULL,
  marca VARCHAR(80) NULL,
  modelo VARCHAR(80) NULL,
  soat_vence DATE NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_flotas_placa (id_empresa_flota, placa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS flotas_conductor (
  id_conductor INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa_flota INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  licencia VARCHAR(40) NULL,
  password_hash VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS flotas_combustible (
  id_reg INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa_flota INT NOT NULL,
  id_vehiculo INT NOT NULL,
  litros DECIMAL(10,2) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  KEY idx_flotas_comb (id_empresa_flota)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS flotas_admin (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa_flota INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_flotas_admin (id_empresa_flota, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_campo: `
CREATE TABLE IF NOT EXISTS campo_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS campo_vendedor (
  id_vendedor INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  pin VARCHAR(12) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS campo_checkin (
  id_checkin INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_vendedor INT NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  nota VARCHAR(200) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_campo_check (id_tenant, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_academia: `
CREATE TABLE IF NOT EXISTS academia_entitlement (
  id_org INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  UNIQUE KEY uq_academia_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS academia_curso (
  id_curso INT AUTO_INCREMENT PRIMARY KEY,
  id_org INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  descripcion VARCHAR(500) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS academia_alumno (
  id_alumno INT AUTO_INCREMENT PRIMARY KEY,
  id_org INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_academia_alumno (id_org, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS academia_inscripcion (
  id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
  id_org INT NOT NULL,
  id_curso INT NOT NULL,
  id_alumno INT NOT NULL,
  progreso_pct INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_academia_insc (id_curso, id_alumno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS academia_admin (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  id_org INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_academia_admin (id_org, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_agenda: `
CREATE TABLE IF NOT EXISTS agenda_entitlement (
  id_profesional INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  UNIQUE KEY uq_agenda_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS agenda_slot (
  id_slot INT AUTO_INCREMENT PRIMARY KEY,
  id_profesional INT NOT NULL,
  inicia_en DATETIME NOT NULL,
  minutos INT NOT NULL DEFAULT 30,
  precio DECIMAL(12,2) NOT NULL DEFAULT 0,
  disponible TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS agenda_reserva (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  id_profesional INT NOT NULL,
  id_slot INT NOT NULL,
  cliente_nombre VARCHAR(120) NOT NULL,
  cliente_email VARCHAR(160) NOT NULL,
  estado_pago ENUM('pendiente','pagado','anulado') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS agenda_admin (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  id_profesional INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_agenda_admin (id_profesional, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_mantenimiento: `
CREATE TABLE IF NOT EXISTS mantto_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS mantto_activo (
  id_activo INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  ubicacion VARCHAR(120) NULL,
  UNIQUE KEY uq_mantto_activo (id_tenant, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS mantto_ot (
  id_ot INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_activo INT NOT NULL,
  tipo ENUM('preventivo','correctivo') NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  estado ENUM('abierta','en_curso','cerrada') NOT NULL DEFAULT 'abierta',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mantto_ot (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS mantto_tecnico (
  id_tecnico INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  pin VARCHAR(12) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  db_recluta: `
CREATE TABLE IF NOT EXISTS recluta_entitlement (
  id_tenant INT NOT NULL PRIMARY KEY,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  plan_flag VARCHAR(64) NULL,
  slug VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  UNIQUE KEY uq_recluta_slug (slug),
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS recluta_vacante (
  id_vacante INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  descripcion TEXT NULL,
  publicada TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_recluta_vac (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS recluta_postulacion (
  id_postulacion INT AUTO_INCREMENT PRIMARY KEY,
  id_tenant INT NOT NULL,
  id_vacante INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  telefono VARCHAR(32) NULL,
  etapa ENUM('nueva','revision','entrevista','oferta','contratada','descartada') NOT NULL DEFAULT 'nueva',
  cv_url VARCHAR(300) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_recluta_post (id_tenant, id_vacante),
  CONSTRAINT fk_recluta_post FOREIGN KEY (id_vacante) REFERENCES recluta_vacante(id_vacante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,
};
