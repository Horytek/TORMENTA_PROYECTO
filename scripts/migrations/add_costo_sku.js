import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Modelo de costo por SKU.
 *
 * Hoy el sistema no sabe cuánto cuesta una prenda: en 88 tablas la única
 * columna de costo es `pago_vendedor.costo_total`, que es de comisiones. Sin
 * costo no hay margen, no hay valor de inventario y no se puede decidir cuándo
 * rebajar — que es la decisión central del negocio de la ropa.
 *
 * Qué agrega:
 *  1. `producto_sku.costo_promedio` — promedio ponderado vigente (NIC 2).
 *  2. `detalle_nota.costo_unitario` — el costo entra cuando entra la mercadería.
 *  3. `detalle_venta.costo_unitario` — FOTO del costo al momento de vender.
 *
 * El punto 3 es el que no se puede posponer: si el margen se calculara contra
 * el costo actual del SKU, cada cambio de costo reescribiría el margen de todas
 * las ventas pasadas y los informes del mes anterior dejarían de cuadrar.
 *
 * `detalle_nota.precio` NO se reutiliza: se verificó que en las 1750 filas es
 * idéntico al precio de venta del SKU, o sea que copia el precio de venta y no
 * el costo. Cambiarle el significado rompería lo que ya lo muestra.
 *
 * El origen del costo (taller, proveedor, producción propia) queda como
 * metadato en `origen_costo`: cada tenant tiene su procedimiento y el cálculo
 * del promedio es el mismo para todos.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const columnaExiste = async (cx, tabla, columna) => {
  const [filas] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const agregarColumna = async (cx, tabla, columna, definicion) => {
  if (await columnaExiste(cx, tabla, columna)) {
    console.log(`[omitido]  ${tabla}.${columna} ya existe.`);
    return false;
  }
  await cx.query(`ALTER TABLE \`${tabla}\` ADD COLUMN ${definicion}`);
  console.log(`[creado]   ${tabla}.${columna}`);
  return true;
};

const migrar = async (cx) => {
  // ── 1. Costo vigente del SKU ───────────────────────────────────────────
  // DECIMAL(14,6): más decimales que el precio porque el promedio ponderado
  // arrastra fracciones que, redondeadas a céntimos en cada ingreso, desvían
  // el valor del inventario con el tiempo.
  await agregarColumna(cx, "producto_sku", "costo_promedio",
    "costo_promedio DECIMAL(14,6) NULL COMMENT 'Costo promedio ponderado vigente. NULL = nunca se registró costo' AFTER precio");
  await agregarColumna(cx, "producto_sku", "costo_ultimo",
    "costo_ultimo DECIMAL(14,6) NULL COMMENT 'Costo del último ingreso, para comparar contra el promedio' AFTER costo_promedio");
  await agregarColumna(cx, "producto_sku", "costo_estimado",
    "costo_estimado TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = el promedio se apoya en stock cuyo costo real se desconoce' AFTER costo_ultimo");
  await agregarColumna(cx, "producto_sku", "costo_actualizado_en",
    "costo_actualizado_en DATETIME NULL COMMENT 'Último recálculo del costo promedio' AFTER costo_estimado");

  // ── 2. Costo de entrada ────────────────────────────────────────────────
  await agregarColumna(cx, "detalle_nota", "costo_unitario",
    "costo_unitario DECIMAL(14,6) NULL COMMENT 'Costo unitario real de este ingreso. NO confundir con `precio`, que copia el precio de venta' AFTER total");
  await agregarColumna(cx, "detalle_nota", "origen_costo",
    "origen_costo VARCHAR(30) NULL COMMENT 'De dónde sale el costo: TALLER, PROVEEDOR, PRODUCCION, MANUAL… varía por tenant' AFTER costo_unitario");

  // ── 3. Foto del costo al vender ────────────────────────────────────────
  await agregarColumna(cx, "detalle_venta", "costo_unitario",
    "costo_unitario DECIMAL(14,6) NULL COMMENT 'Costo promedio del SKU AL MOMENTO de esta venta. NULL = se vendió sin costo conocido' AFTER total");

  // ── 4. Índice para los informes de margen ──────────────────────────────
  const [indices] = await cx.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'detalle_venta' AND INDEX_NAME = 'idx_detalle_venta_tenant_sku_costo'`,
    [DATABASE]
  );
  if (indices.length === 0) {
    // (tenant, sku) filtra; costo_unitario permite resolver "líneas sin costo"
    // sin ir a la tabla — es la consulta de la pantalla de margen.
    await cx.query(
      "CREATE INDEX idx_detalle_venta_tenant_sku_costo ON detalle_venta (id_tenant, id_sku, costo_unitario)"
    );
    console.log("[creado]   índice idx_detalle_venta_tenant_sku_costo");
  } else {
    console.log("[omitido]  índice idx_detalle_venta_tenant_sku_costo ya existe.");
  }
};

const verificar = async (cx) => {
  console.log("\n── Estado tras la migración ──");
  const [[sku]] = await cx.query(
    `SELECT COUNT(*) total, SUM(costo_promedio IS NOT NULL) con_costo FROM producto_sku`
  );
  console.log(`  SKUs: ${sku.total} | con costo: ${sku.con_costo} | sin costo: ${sku.total - sku.con_costo}`);

  const [[dv]] = await cx.query(
    `SELECT COUNT(*) total, SUM(costo_unitario IS NOT NULL) con_costo FROM detalle_venta`
  );
  console.log(`  Líneas vendidas: ${dv.total} | con costo: ${dv.con_costo}`);

  const [[stock]] = await cx.query(
    `SELECT COUNT(*) registros, COALESCE(SUM(s.stock),0) unidades
     FROM inventario_stock s WHERE s.stock > 0`
  );
  console.log(`  Stock: ${stock.registros} registros, ${stock.unidades} unidades — hoy sin valorizar`);

  console.log("\n  Ningún dato existente se modificó: las columnas nacen en NULL.");
  console.log("  El costo se empieza a poblar con el próximo ingreso de mercadería.");
};

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    console.log(`Migrando costo por SKU en ${DATABASE}@${HOST}\n`);
    await migrar(cx);
    await verificar(cx);
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
