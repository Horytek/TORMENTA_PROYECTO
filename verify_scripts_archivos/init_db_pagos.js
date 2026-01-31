import { getConnection } from "../src/database/database.js";

const createTable = async () => {
    let connection;
    try {
        connection = await getConnection();
        //console.log("Creating table pago_vendedor...");
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pago_vendedor (
        id_pago INT UNSIGNED NOT NULL AUTO_INCREMENT,
        dni_vendedor CHAR(8) NOT NULL,
        id_tenant INT UNSIGNED NOT NULL,
        
        tipo_pago ENUM('SUELDO', 'BONO', 'COMISION', 'OTRO') NOT NULL DEFAULT 'SUELDO',

        monto_neto DECIMAL(10,2) NOT NULL COMMENT 'Lo que recibe el vendedor',
        monto_aportes DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Aportes de la empresa (ESSALUD, etc.)',
        monto_beneficios DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Bonos/gratificaciones prorrateadas si aplica',

        costo_total DECIMAL(10,2) AS (monto_neto + monto_aportes + monto_beneficios) STORED,

        fecha_programada DATE NOT NULL COMMENT 'Fecha en la que se debería pagar',
        fecha_pagada DATE NULL COMMENT 'Fecha efectiva en la que se pagó (si aplica)',

        estado_pago ENUM('PENDIENTE','PAGADO','ATRASADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',

        es_recurrente TINYINT(1) NOT NULL DEFAULT 0,
        frecuencia ENUM('UNICO','MENSUAL','QUINCENAL','SEMANAL','ANUAL') NOT NULL DEFAULT 'UNICO',
        dia_habitual_pago TINYINT UNSIGNED NULL COMMENT 'Día típico del pago (1-31) cuando es recurrente',

        observacion VARCHAR(255) NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (id_pago),
        KEY idx_pago_vendedor_dni_tenant (dni_vendedor, id_tenant),
        CONSTRAINT fk_pago_vendedor_vendedor FOREIGN KEY (dni_vendedor) REFERENCES vendedor (dni) ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
        //console.log("Table pago_vendedor created successfully.");
    } catch (error) {
        //console.error("Error creating table:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

createTable();
