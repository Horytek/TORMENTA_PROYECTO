import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";
import { METODOS, parsearFormaDePago } from "../../src/services/pagos/formaDePago.js";

/**
 * Normaliza la forma de pago: de un `varchar` libre a catálogo + tabla de pagos.
 *
 * Hoy `venta.metodo_pago` y `venta_boucher.formadepago` son texto libre que
 * acumuló cuatro formatos: "EFECTIVO", "EFECTIVO, PLIN", "EFECTIVO:80.00" y
 * "EFECTIVO:100.00|YAPE:20.00". Es decir, una relación uno-a-muchos —una venta
 * puede tener varios pagos, cada uno con su importe— metida en un campo de
 * texto. Mientras siga así no se puede cuadrar una caja: para saber cuánto
 * efectivo debería haber en el cajón hay que separar el efectivo del resto, y
 * eso en SQL sobre texto libre no es confiable.
 *
 * Qué crea:
 *  1. `metodo_pago` — catálogo con la marca `es_efectivo`, que es la que separa
 *     lo que se cuenta a mano de lo que llega por otra vía.
 *  2. `venta_pago` — un renglón por pago, con método e importe.
 *
 * NO borra ni modifica las columnas de texto: quedan como están para no romper
 * el código que hoy las lee. La migración de datos es aditiva y reversible.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeTabla = async (cx, tabla) => {
  const [f] = await cx.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?`,
    [DATABASE, tabla]
  );
  return f.length > 0;
};

const crearCatalogo = async (cx) => {
  if (await existeTabla(cx, "metodo_pago")) {
    console.log("[omitido]  tabla metodo_pago ya existe.");
  } else {
    await cx.query(`
      CREATE TABLE metodo_pago (
        id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(30) NOT NULL,
        nombre VARCHAR(60) NOT NULL,
        es_efectivo TINYINT(1) NOT NULL DEFAULT 0
          COMMENT 'Solo lo marcado acá se cuenta físicamente al cerrar caja',
        orden INT NOT NULL DEFAULT 0,
        estado TINYINT(1) NOT NULL DEFAULT 1,
        UNIQUE KEY uq_metodo_pago_codigo (codigo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        COMMENT='Catálogo global de medios de pago'
    `);
    console.log("[creado]   tabla metodo_pago");
  }

  // El catálogo es global (no por tenant): "efectivo" significa lo mismo para
  // todos, y un catálogo por tenant obligaría a sembrarlo en cada alta.
  const orden = ["EFECTIVO", "YAPE", "PLIN", "TARJETA", "TRANSFERENCIA", "OTRO"];
  for (const [i, codigo] of orden.entries()) {
    const m = METODOS[codigo];
    await cx.query(
      `INSERT INTO metodo_pago (codigo, nombre, es_efectivo, orden)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), es_efectivo = VALUES(es_efectivo), orden = VALUES(orden)`,
      [m.codigo, m.nombre, m.efectivo ? 1 : 0, i]
    );
  }
  console.log(`[sembrado] ${orden.length} métodos en el catálogo`);
};

const crearVentaPago = async (cx) => {
  if (await existeTabla(cx, "venta_pago")) {
    console.log("[omitido]  tabla venta_pago ya existe.");
    return;
  }
  await cx.query(`
    CREATE TABLE venta_pago (
      id_venta_pago INT AUTO_INCREMENT PRIMARY KEY,
      id_tenant INT UNSIGNED NOT NULL,
      id_venta INT NULL COMMENT 'Venta del flujo principal',
      id_venta_boucher INT NULL COMMENT 'Venta del flujo boucher, mientras convivan los dos',
      id_metodo_pago INT NOT NULL,
      monto DECIMAL(12,2) NOT NULL,
      monto_inferido TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = el importe no venía en el dato original y se repartió: sirve para cuadrar, no es un hecho',
      origen_texto VARCHAR(250) NULL COMMENT 'Texto libre del que se dedujo, para poder auditar la migración',
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_venta_pago_tenant_venta (id_tenant, id_venta),
      KEY idx_venta_pago_tenant_boucher (id_tenant, id_venta_boucher),
      KEY idx_venta_pago_metodo (id_metodo_pago),
      CONSTRAINT fk_venta_pago_metodo FOREIGN KEY (id_metodo_pago)
        REFERENCES metodo_pago (id_metodo_pago)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      COMMENT='Un renglón por pago. Una venta puede tener varios.'
  `);
  console.log("[creado]   tabla venta_pago");
};

/**
 * Traduce el texto libre existente a renglones de `venta_pago`.
 * Idempotente: no reprocesa lo ya migrado.
 */
const migrarDatos = async (cx) => {
  const [metodos] = await cx.query("SELECT id_metodo_pago, codigo FROM metodo_pago");
  const idPorCodigo = new Map(metodos.map((m) => [m.codigo, m.id_metodo_pago]));

  const [bouchers] = await cx.query(`
    SELECT vb.id_venta_boucher, vb.id_tenant, vb.formadepago, vb.total_t
    FROM venta_boucher vb
    LEFT JOIN venta_pago vp ON vp.id_venta_boucher = vb.id_venta_boucher
    WHERE vp.id_venta_pago IS NULL AND vb.formadepago IS NOT NULL AND vb.formadepago <> ''
      AND vb.id_tenant IS NOT NULL
  `);

  // Hay bouchers sin `id_tenant` (la columna lo permite). No se migran ni se
  // les asigna uno por deducción: una venta sin dueño es un problema de datos
  // que debe resolver quien conoce el negocio, no una migración automática.
  const [[huerfanos]] = await cx.query(
    "SELECT COUNT(*) n FROM venta_boucher WHERE id_tenant IS NULL AND formadepago IS NOT NULL AND formadepago <> ''"
  );

  let renglones = 0;
  let inferidos = 0;
  let sinReconocer = 0;

  for (const b of bouchers) {
    const { pagos, montosInferidos } = parsearFormaDePago(b.formadepago, b.total_t);
    if (pagos.length === 0) { sinReconocer++; continue; }

    for (const p of pagos) {
      const idMetodo = idPorCodigo.get(p.metodo);
      if (!idMetodo || p.monto === null) continue;
      await cx.query(
        `INSERT INTO venta_pago (id_tenant, id_venta_boucher, id_metodo_pago, monto, monto_inferido, origen_texto)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [b.id_tenant, b.id_venta_boucher, idMetodo, p.monto, montosInferidos ? 1 : 0, b.formadepago]
      );
      renglones++;
      if (montosInferidos) inferidos++;
    }
  }

  console.log(`[migrado]  ${bouchers.length} bouchers → ${renglones} pagos (${inferidos} con importe repartido)`);
  if (sinReconocer > 0) console.log(`[aviso]    ${sinReconocer} sin forma de pago reconocible`);
  if (huerfanos.n > 0) {
    console.log(`[OMITIDO]  ${huerfanos.n} bouchers SIN id_tenant — no se migran a propósito.`);
    console.log(`           Son ventas que no pertenecen a ningún negocio. Hay que decidir`);
    console.log(`           a quién corresponden antes de poder cuadrarlas en una caja.`);
  }
};

const verificar = async (cx) => {
  console.log("\n── Verificación ──");
  const [resumen] = await cx.query(`
    SELECT mp.nombre, mp.es_efectivo, COUNT(*) pagos, ROUND(SUM(vp.monto), 2) total
    FROM venta_pago vp INNER JOIN metodo_pago mp ON mp.id_metodo_pago = vp.id_metodo_pago
    GROUP BY mp.id_metodo_pago ORDER BY total DESC
  `);
  resumen.forEach((r) =>
    console.log(`  ${String(r.nombre).padEnd(16)} ${String(r.pagos).padStart(4)} pagos  S/ ${String(r.total).padStart(10)}${r.es_efectivo ? "  ← al cajón" : ""}`)
  );

  const [[efectivo]] = await cx.query(`
    SELECT ROUND(COALESCE(SUM(vp.monto), 0), 2) total FROM venta_pago vp
    INNER JOIN metodo_pago mp ON mp.id_metodo_pago = vp.id_metodo_pago WHERE mp.es_efectivo = 1
  `);
  console.log(`\n  Efectivo total (lo que un cierre de caja debería contar): S/ ${efectivo.total}`);
  console.log("  Las columnas de texto quedan intactas: nada del código actual se rompe.");
};

const main = async () => {
  if (!esHostLocal(HOST)) {
    console.error(`Abortado: HOST="${HOST}" no es local.`);
    process.exit(1);
  }
  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });
  try {
    console.log(`Normalizando métodos de pago en ${DATABASE}@${HOST}\n`);
    await crearCatalogo(cx);
    await crearVentaPago(cx);
    await migrarDatos(cx);
    await verificar(cx);
  } finally {
    await cx.end();
  }
};

main().catch((e) => { console.error("Error en la migración:", e.message); process.exit(1); });
