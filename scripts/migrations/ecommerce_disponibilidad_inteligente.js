import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Disponibilidad inteligente: estados extendidos + origen + fulfillment.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-disponibilidad-inteligente
 */

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

  const columnExists = async (tabla, col) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, col]
    );
    return rows.length > 0;
  };

  const indexExists = async (tabla, nombre) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, nombre]
    );
    return rows.length > 0;
  };

  const addColumnIfMissing = async (tabla, col, ddl) => {
    if (await columnExists(tabla, col)) {
      console.log(`[omitido] ${tabla}.${col}`);
      return;
    }
    await cx.query(`ALTER TABLE ${tabla} ADD COLUMN ${ddl}`);
    console.log(`[creado]  ${tabla}.${col}`);
  };

  try {
    // Ampliar ENUM de estados (incluye aprobada por compat + nuevos)
    await cx.query(`
      ALTER TABLE ecom_solicitud_disponibilidad
      MODIFY COLUMN estado ENUM(
        'pendiente','en_revision','confirmada','en_traslado','disponible',
        'aprobada','rechazada','expirada','cancelada'
      ) NOT NULL DEFAULT 'pendiente'
    `);
    console.log("[ok]     ecom_solicitud_disponibilidad.estado ampliado");

    const [migrated] = await cx.query(
      `UPDATE ecom_solicitud_disponibilidad SET estado = 'disponible' WHERE estado = 'aprobada'`
    );
    console.log(`[ok]     migradas aprobada→disponible: ${migrated.affectedRows || 0}`);

    await addColumnIfMissing(
      "ecom_solicitud_disponibilidad",
      "id_sucursal_origen",
      "id_sucursal_origen INT NULL AFTER id_sucursal"
    );
    await addColumnIfMissing(
      "ecom_solicitud_disponibilidad",
      "fulfillment",
      "fulfillment ENUM('pickup','delivery','provincia') NULL DEFAULT 'pickup' AFTER id_sucursal_origen"
    );
    await addColumnIfMissing(
      "ecom_solicitud_disponibilidad",
      "direccion_entrega",
      "direccion_entrega VARCHAR(255) NULL AFTER fulfillment"
    );
    await addColumnIfMissing(
      "ecom_solicitud_disponibilidad",
      "id_zona",
      "id_zona INT NULL AFTER direccion_entrega"
    );
    await addColumnIfMissing(
      "ecom_solicitud_disponibilidad",
      "entrega_json",
      "entrega_json JSON NULL AFTER id_zona"
    );

    if (!(await indexExists("ecom_solicitud_disponibilidad", "idx_ecom_sol_user_estado"))) {
      await cx.query(
        `ALTER TABLE ecom_solicitud_disponibilidad
         ADD KEY idx_ecom_sol_user_estado (id_tienda, id_usuario, estado)`
      );
      console.log("[creado]  idx_ecom_sol_user_estado");
    } else {
      console.log("[omitido] idx_ecom_sol_user_estado");
    }

    // Notificaciones: nuevos tipos
    await cx.query(`
      ALTER TABLE ecom_notificacion_cliente
      MODIFY COLUMN tipo ENUM(
        'solicitud_aprobada',
        'solicitud_rechazada',
        'solicitud_expirada',
        'solicitud_en_revision',
        'solicitud_cancelada',
        'solicitud_recibida',
        'solicitud_confirmada',
        'solicitud_disponible'
      ) NOT NULL
    `);
    console.log("[ok]     ecom_notificacion_cliente.tipo ampliado");

    console.log("Migración ecommerce_disponibilidad_inteligente OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
