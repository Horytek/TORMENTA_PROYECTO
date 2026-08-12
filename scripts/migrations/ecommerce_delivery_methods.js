import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Métodos de entrega: config, zonas GeoJSON, destinos provincia, agencias, columnas orden.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-delivery
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

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  const columnExists = async (tabla, columna) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, columna]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_entrega_config"))) {
      await cx.query(`
        CREATE TABLE ecom_entrega_config (
          id_tienda INT NOT NULL,
          retiro_activo TINYINT(1) NOT NULL DEFAULT 1,
          delivery_activo TINYINT(1) NOT NULL DEFAULT 0,
          provincia_activo TINYINT(1) NOT NULL DEFAULT 0,
          retiro_prep_minutos INT NULL DEFAULT 60,
          retiro_instrucciones TEXT NULL,
          delivery_modelo ENUM('fija','zona','base_recargo') NOT NULL DEFAULT 'zona',
          delivery_costo_base DECIMAL(10,2) NOT NULL DEFAULT 0,
          delivery_recargo DECIMAL(10,2) NOT NULL DEFAULT 0,
          delivery_pedido_min DECIMAL(10,2) NULL,
          delivery_gratis_desde DECIMAL(10,2) NULL,
          delivery_tiempo_texto VARCHAR(120) NULL,
          provincia_pedido_min DECIMAL(10,2) NULL,
          provincia_condiciones TEXT NULL,
          provincia_requiere_agencia TINYINT(1) NOT NULL DEFAULT 0,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tienda),
          CONSTRAINT fk_ecom_entrega_config_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_entrega_config");
    } else {
      console.log("[omitido] ecom_entrega_config");
    }

    // Seed config para tiendas existentes
    await cx.query(`
      INSERT IGNORE INTO ecom_entrega_config (id_tienda, retiro_activo)
      SELECT id_tienda, 1 FROM tienda
    `);

    if (!(await tableExists("ecom_delivery_zona"))) {
      await cx.query(`
        CREATE TABLE ecom_delivery_zona (
          id_zona INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_sucursal INT NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          costo DECIMAL(10,2) NOT NULL DEFAULT 0,
          tiempo_estimado VARCHAR(80) NULL,
          pedido_min DECIMAL(10,2) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          orden INT NOT NULL DEFAULT 0,
          geojson JSON NOT NULL,
          distritos_json JSON NULL,
          observaciones VARCHAR(500) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_zona),
          KEY idx_ecom_zona_tienda (id_tienda, activo),
          CONSTRAINT fk_ecom_zona_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_zona_sucursal
            FOREIGN KEY (id_sucursal) REFERENCES ecom_sucursal (id_sucursal) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_delivery_zona");
    } else {
      console.log("[omitido] ecom_delivery_zona");
    }

    if (!(await tableExists("ecom_envio_destino"))) {
      await cx.query(`
        CREATE TABLE ecom_envio_destino (
          id_destino INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          departamento VARCHAR(80) NOT NULL,
          provincia VARCHAR(80) NULL,
          costo DECIMAL(10,2) NOT NULL DEFAULT 0,
          tiempo_estimado VARCHAR(80) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_destino),
          UNIQUE KEY uq_ecom_destino (id_tienda, departamento, provincia),
          KEY idx_ecom_destino_tienda (id_tienda, activo),
          CONSTRAINT fk_ecom_destino_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_envio_destino");
    } else {
      console.log("[omitido] ecom_envio_destino");
    }

    if (!(await tableExists("ecom_envio_agencia"))) {
      await cx.query(`
        CREATE TABLE ecom_envio_agencia (
          id_agencia INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          telefono VARCHAR(40) NULL,
          direccion VARCHAR(500) NULL,
          cobertura_texto VARCHAR(255) NULL,
          observaciones VARCHAR(500) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_agencia),
          KEY idx_ecom_agencia_tienda (id_tienda, activo),
          CONSTRAINT fk_ecom_agencia_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_envio_agencia");
    } else {
      console.log("[omitido] ecom_envio_agencia");
    }

    const ordenCols = [
      ["costo_envio", "DECIMAL(10,2) NOT NULL DEFAULT 0"],
      ["id_zona", "INT NULL"],
      ["id_destino", "INT NULL"],
      ["id_agencia", "INT NULL"],
      ["entrega_json", "JSON NULL"],
      [
        "estado_entrega",
        "ENUM('pendiente','preparando','listo','en_camino','entregado','cancelado') NULL",
      ],
    ];

    for (const [col, def] of ordenCols) {
      if (!(await columnExists("orden", col))) {
        await cx.query(`ALTER TABLE orden ADD COLUMN ${col} ${def}`);
        console.log(`[alter] orden.${col}`);
      } else {
        console.log(`[omitido] orden.${col}`);
      }
    }

    // Ampliar ENUM estado_fulfillment con en_camino
    if (await columnExists("orden", "estado_fulfillment")) {
      const [cols] = await cx.query(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orden' AND COLUMN_NAME = 'estado_fulfillment'`,
        [ECOMMERCE_DATABASE]
      );
      const colType = String(cols[0]?.COLUMN_TYPE || "");
      if (!colType.includes("en_camino")) {
        await cx.query(`
          ALTER TABLE orden
          MODIFY COLUMN estado_fulfillment
          ENUM(
            'pendiente_confirmacion','pago_pendiente','pago_confirmado','preparando',
            'listo_recoger','en_camino','entregado','cancelado'
          ) NOT NULL DEFAULT 'pago_pendiente'
        `);
        console.log("[alter] orden.estado_fulfillment +en_camino");
      } else {
        console.log("[omitido] orden.estado_fulfillment en_camino");
      }
    }

    console.log("Migración ecommerce_delivery_methods OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
