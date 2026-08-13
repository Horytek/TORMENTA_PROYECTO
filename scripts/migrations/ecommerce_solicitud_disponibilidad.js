import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Solicitudes de confirmación de disponibilidad (≠ pedido / reserva / venta).
 * También sincroniza permisos solicitudes.* en roles sistema (operador_tienda, etc.).
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-solicitud-disp
 */

const NUEVOS_PERMISOS = [
  ["solicitudes.ver", "Solicitudes", "ver"],
  ["solicitudes.verificar", "Solicitudes", "verificar"],
  ["solicitudes.aprobar", "Solicitudes", "aprobar"],
  ["solicitudes.rechazar", "Solicitudes", "rechazar"],
  ["solicitudes.cancelar", "Solicitudes", "cancelar"],
];

const ROLES_SOLICITUDES = {
  administrador: "ALL",
  gerente: NUEVOS_PERMISOS.map((p) => p[0]),
  encargado_sucursal: [
    "solicitudes.ver",
    "solicitudes.verificar",
    "solicitudes.aprobar",
    "solicitudes.rechazar",
    "solicitudes.cancelar",
  ],
  operador_tienda: [
    "solicitudes.ver",
    "solicitudes.verificar",
    "solicitudes.aprobar",
    "solicitudes.rechazar",
    "solicitudes.cancelar",
  ],
};

const ejecutar = async () => {
  if (!HOST || !USER) {
    throw new Error("Falta configurar DB_HOST / DB_USERNAME en .env.");
  }
  if (
    !process.env.ALLOW_REMOTE_MIGRATE &&
    !["localhost", "127.0.0.1", "::1"].includes(String(HOST))
  ) {
    throw new Error(
      "Migración remota cancelada. Usa ALLOW_REMOTE_MIGRATE=1 (Railway / proxy)."
    );
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 15000,
    multipleStatements: true,
  });

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  const columnExists = async (tabla, col) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, col]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_solicitud_disponibilidad"))) {
      await cx.query(`
        CREATE TABLE ecom_solicitud_disponibilidad (
          id_solicitud INT NOT NULL AUTO_INCREMENT,
          codigo VARCHAR(32) NOT NULL,
          id_tienda INT NOT NULL,
          id_usuario INT NULL,
          nombre_cliente VARCHAR(160) NULL,
          telefono_cliente VARCHAR(40) NULL,
          email_cliente VARCHAR(160) NULL,
          id_producto INT NOT NULL,
          id_variante INT NULL,
          sku VARCHAR(80) NULL,
          attrs_json JSON NULL,
          cantidad_solicitada INT NOT NULL DEFAULT 1,
          cantidad_aprobada INT NULL,
          id_sucursal INT NOT NULL,
          precio_unitario_snapshot DECIMAL(12,2) NULL,
          congelar_precio TINYINT(1) NOT NULL DEFAULT 0,
          estado ENUM('pendiente','en_revision','aprobada','rechazada','expirada','cancelada')
            NOT NULL DEFAULT 'pendiente',
          expires_at DATETIME NULL,
          id_usuario_staff INT NULL,
          respondido_at DATETIME NULL,
          motivo_rechazo VARCHAR(80) NULL,
          comentario_cliente VARCHAR(500) NULL,
          stock_sistema INT NULL,
          stock_fisico INT NULL,
          observacion_stock VARCHAR(500) NULL,
          id_reserva INT NULL,
          alternativa_json JSON NULL,
          cancelado_por ENUM('cliente','staff','sistema') NULL,
          cancelado_at DATETIME NULL,
          motivo_cancelacion VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_solicitud),
          UNIQUE KEY uq_ecom_sol_codigo_tienda (id_tienda, codigo),
          KEY idx_ecom_sol_tienda_estado (id_tienda, estado),
          KEY idx_ecom_sol_usuario (id_tienda, id_usuario, estado),
          KEY idx_ecom_sol_producto (id_tienda, id_producto, id_sucursal, estado),
          KEY idx_ecom_sol_expira (expires_at),
          CONSTRAINT fk_ecom_sol_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_solicitud_disponibilidad");
    } else {
      console.log("[omitido] ecom_solicitud_disponibilidad");
    }

    if (!(await tableExists("ecom_solicitud_evento"))) {
      await cx.query(`
        CREATE TABLE ecom_solicitud_evento (
          id_evento INT NOT NULL AUTO_INCREMENT,
          id_solicitud INT NOT NULL,
          id_tienda INT NOT NULL,
          actor_tipo ENUM('cliente','staff','sistema') NOT NULL DEFAULT 'sistema',
          actor_id INT NULL,
          estado_anterior VARCHAR(32) NULL,
          estado_nuevo VARCHAR(32) NULL,
          payload_json JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_evento),
          KEY idx_ecom_sol_ev_sol (id_solicitud),
          KEY idx_ecom_sol_ev_tienda (id_tienda, created_at),
          CONSTRAINT fk_ecom_sol_ev_sol FOREIGN KEY (id_solicitud)
            REFERENCES ecom_solicitud_disponibilidad (id_solicitud) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_sol_ev_tienda FOREIGN KEY (id_tienda)
            REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_solicitud_evento");
    } else {
      console.log("[omitido] ecom_solicitud_evento");
    }

    if (!(await tableExists("ecom_reserva_disponibilidad"))) {
      await cx.query(`
        CREATE TABLE ecom_reserva_disponibilidad (
          id_reserva INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          id_variante INT NULL,
          id_sucursal INT NOT NULL,
          cantidad INT NOT NULL DEFAULT 1,
          estado ENUM('pendiente','activa','expirada','convertida','cancelada') NOT NULL DEFAULT 'pendiente',
          expires_at DATETIME NULL,
          id_usuario_staff INT NULL,
          id_consulta INT NULL,
          id_solicitud INT NULL,
          notas VARCHAR(500) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_reserva),
          KEY idx_ecom_res_tienda_estado (id_tienda, estado),
          KEY idx_ecom_res_expira (expires_at),
          CONSTRAINT fk_ecom_res_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_reserva_disponibilidad");
    } else if (!(await columnExists("ecom_reserva_disponibilidad", "id_solicitud"))) {
      await cx.query(
        `ALTER TABLE ecom_reserva_disponibilidad ADD COLUMN id_solicitud INT NULL AFTER id_consulta`
      );
      console.log("[columna] ecom_reserva_disponibilidad.id_solicitud");
    }

    if (await tableExists("ecom_sucursal")) {
      if (!(await columnExists("ecom_sucursal", "requiere_confirmacion"))) {
        await cx.query(
          `ALTER TABLE ecom_sucursal ADD COLUMN requiere_confirmacion TINYINT(1) NOT NULL DEFAULT 0`
        );
        console.log("[columna] ecom_sucursal.requiere_confirmacion");
      }
    }

    if (await tableExists("ecom_permiso") && (await tableExists("ecom_rol"))) {
      for (const [codigo, modulo, accion] of NUEVOS_PERMISOS) {
        await cx.query(
          `INSERT IGNORE INTO ecom_permiso (codigo, modulo, accion) VALUES (?, ?, ?)`,
          [codigo, modulo, accion]
        );
      }
      console.log("[permisos] solicitudes.* upsert");

      const [roles] = await cx.query(
        `SELECT id_rol, id_tienda, codigo FROM ecom_rol WHERE es_sistema = 1 AND codigo IN (?)`,
        [Object.keys(ROLES_SOLICITUDES)]
      );
      for (const role of roles) {
        const want = ROLES_SOLICITUDES[role.codigo];
        if (!want) continue;
        let codes;
        if (want === "ALL") {
          const [all] = await cx.query(`SELECT codigo FROM ecom_permiso`);
          codes = all.map((r) => r.codigo);
        } else {
          codes = want;
        }
        for (const codigo of codes) {
          const [[perm]] = await cx.query(
            `SELECT id_permiso FROM ecom_permiso WHERE codigo = ? LIMIT 1`,
            [codigo]
          );
          if (!perm) continue;
          await cx.query(
            `INSERT IGNORE INTO ecom_rol_permiso (id_rol, id_permiso) VALUES (?, ?)`,
            [role.id_rol, perm.id_permiso]
          );
        }
        console.log(`[rol] ${role.codigo} tienda=${role.id_tienda} +solicitudes`);
      }
    }

    console.log("Migración ecommerce_solicitud_disponibilidad OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
