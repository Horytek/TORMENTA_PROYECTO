import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `bitacora_nota.id_sku` — de qué variante salió (o a cuál entró) cada unidad.
 *
 * Hoy la bitácora guarda `id_producto` + `id_tonalidad`/`id_talla`, que servían
 * cuando el stock vivía en `inventario` con esa misma clave. Con el stock en
 * `inventario_stock` la coordenada es el SKU, y sin ella una anulación no puede
 * devolver las unidades a su sitio: si una venta de 5 se repartió entre dos
 * variantes, al anular hay que saber cuántas volvían a cada una.
 *
 * Se agrega acá y no en `detalle_venta` a propósito: una línea de detalle es una
 * línea del comprobante, y partirla cambiaría el número de líneas del CPE que ya
 * se declaró a SUNAT. La bitácora es el libro de movimientos y sí admite varias
 * filas por línea.
 *
 * Aditiva y NULLable: los movimientos históricos se quedan sin SKU y las
 * lecturas siguen agrupando por `id_producto`, que está en ambos.
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
    const [col] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bitacora_nota' AND COLUMN_NAME = 'id_sku'`,
      [DATABASE]
    );

    if (col.length === 0) {
      await cx.query(
        `ALTER TABLE bitacora_nota ADD COLUMN id_sku INT NULL
         COMMENT 'SKU del que salió/al que entró la unidad. NULL = movimiento anterior a la convergencia'
         AFTER id_producto`
      );
      console.log("[creado]   bitacora_nota.id_sku");
    } else {
      console.log("[omitido]  bitacora_nota.id_sku ya existe.");
    }

    const [idx] = await cx.query(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bitacora_nota' AND INDEX_NAME = 'idx_bitacora_sku'`,
      [DATABASE]
    );
    if (idx.length === 0) {
      // (tenant, sku) es como lo consulta la anulación y el kardex por variante.
      await cx.query("CREATE INDEX idx_bitacora_sku ON bitacora_nota (id_tenant, id_sku)");
      console.log("[creado]   índice idx_bitacora_sku");
    } else {
      console.log("[omitido]  índice idx_bitacora_sku ya existe.");
    }

    const [[r]] = await cx.query(
      "SELECT COUNT(*) total, SUM(id_sku IS NOT NULL) con_sku FROM bitacora_nota"
    );
    console.log(`\n  Movimientos: ${r.total} | con SKU: ${r.con_sku ?? 0}`);
    console.log("  Los históricos quedan sin SKU a propósito: el kardex agrupa por producto,");
    console.log("  que sigue presente, así que no hay discontinuidad visible.");
  } finally {
    await cx.end();
  }
};

main().catch((e) => { console.error("Error en la migración:", e.message); process.exit(1); });
