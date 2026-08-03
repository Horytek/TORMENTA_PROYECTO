import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Comisión por vendedor real.
 *
 * `venta.dni_vendedor` — quién atendió la venta (resuelto por `id_usuario` al
 * crearla), distinto del "cajero" que hoy se deriva de la sucursal. NULL en
 * ventas históricas — no se puede atribuir retroactivamente.
 *
 * `vendedor.porcentaje_comision` — % sobre sus ventas; NULL = sin comisión
 * configurada (no se le calcula nada, no rompe nada existente).
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    const [colVenta] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'venta' AND COLUMN_NAME = 'dni_vendedor'`,
      [DATABASE]
    );
    if (colVenta.length === 0) {
      await cx.query(
        `ALTER TABLE venta ADD COLUMN dni_vendedor VARCHAR(15) NULL DEFAULT NULL
         COMMENT 'Vendedor que atendió (dni); NULL en ventas anteriores a esta migración'`
      );
      console.log("[creado]   venta.dni_vendedor");
    } else {
      console.log("[omitido]  venta.dni_vendedor ya existe.");
    }

    const [colVendedor] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vendedor' AND COLUMN_NAME = 'porcentaje_comision'`,
      [DATABASE]
    );
    if (colVendedor.length === 0) {
      await cx.query(
        `ALTER TABLE vendedor ADD COLUMN porcentaje_comision DECIMAL(5,2) NULL DEFAULT NULL
         COMMENT '% de comisión sobre sus ventas; NULL = sin comisión configurada'`
      );
      console.log("[creado]   vendedor.porcentaje_comision");
    } else {
      console.log("[omitido]  vendedor.porcentaje_comision ya existe.");
    }
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
