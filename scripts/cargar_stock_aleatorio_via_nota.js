import fs from "fs";
import { getConnection } from "../src/database/database.js";
import { methods as NotaIngresoController } from "../src/controllers/notaingreso.controller.js";

const cliArgs = process.argv.slice(2);

const parseArg = (name, fallback) => {
  const raw = cliArgs.find((arg) => arg.startsWith(`--${name}=`));
  if (!raw) return fallback;
  const [, value] = raw.split("=");
  return value;
};

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const tenantId = toInt(parseArg("tenant", "1"), 1);
const minQty = toInt(parseArg("min", "1"), 1);
const maxQty = toInt(parseArg("max", "25"), 25);
const chunkSize = toInt(parseArg("chunk", "50"), 50);
const dryRun = parseArg("dryRun", "false") === "true";

let forcedAlmacenId = parseArg("almacen", "");
forcedAlmacenId = forcedAlmacenId ? toInt(forcedAlmacenId, null) : null;

let forcedDestinatarioId = parseArg("destinatario", "");
forcedDestinatarioId = forcedDestinatarioId ? toInt(forcedDestinatarioId, null) : null;

let forcedUsuario = parseArg("usuario", "");
forcedUsuario = forcedUsuario ? forcedUsuario.trim() : null;

if (minQty <= 0 || maxQty <= 0 || minQty > maxQty) {
  console.error("Rango invalido: min y max deben ser positivos y min <= max");
  process.exit(1);
}

if (chunkSize <= 0) {
  console.error("Chunk invalido: debe ser mayor a 0");
  process.exit(1);
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const toMysqlDateTime = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const toCsv = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const nextComprobanteNotaIngreso = async (connection, idTenant) => {
  const [rows] = await connection.query(
    `
      SELECT num_comprobante
      FROM comprobante
      WHERE id_tipocomprobante = 6 AND id_tenant = ?
      ORDER BY num_comprobante DESC
      LIMIT 1
    `,
    [idTenant]
  );

  if (!rows.length) return "I400-00000001";

  const last = rows[0].num_comprobante || "I400-00000000";
  const [serieRaw, numberRaw] = String(last).split("-");

  const serieNumber = Number.parseInt(String(serieRaw || "I400").replace(/^I/i, ""), 10) || 400;
  const number = Number.parseInt(numberRaw, 10) || 0;

  let nextSerie = serieNumber;
  let nextNumber = number + 1;

  if (nextNumber > 99999999) {
    nextSerie += 1;
    nextNumber = 1;
  }

  return `I${String(nextSerie).padStart(3, "0")}-${String(nextNumber).padStart(8, "0")}`;
};

const findDefaults = async (connection, idTenant) => {
  const [almacenes] = await connection.query(
    `SELECT id_almacen, nom_almacen FROM almacen WHERE id_tenant = ? ORDER BY id_almacen`,
    [idTenant]
  );

  if (!almacenes.length) {
    throw new Error(`No hay almacenes para tenant ${idTenant}`);
  }

  const [destinatarios] = await connection.query(
    `SELECT id_destinatario FROM destinatario WHERE id_tenant = ? ORDER BY id_destinatario`,
    [idTenant]
  );

  if (!destinatarios.length) {
    throw new Error(`No hay destinatarios para tenant ${idTenant}`);
  }

  const [usuarios] = await connection.query(
    `SELECT usua FROM usuario WHERE id_tenant = ? ORDER BY id_usuario`,
    [idTenant]
  );

  if (!usuarios.length) {
    throw new Error(`No hay usuarios para tenant ${idTenant}`);
  }

  const selectedAlmacen = forcedAlmacenId
    ? almacenes.find((a) => Number(a.id_almacen) === forcedAlmacenId)
    : almacenes[0];

  if (!selectedAlmacen) {
    throw new Error(`Almacen ${forcedAlmacenId} no existe para tenant ${idTenant}`);
  }

  const selectedDestinatario = forcedDestinatarioId
    ? destinatarios.find((d) => Number(d.id_destinatario) === forcedDestinatarioId)
    : destinatarios[0];

  if (!selectedDestinatario) {
    throw new Error(`Destinatario ${forcedDestinatarioId} no existe para tenant ${idTenant}`);
  }

  const selectedUsuario = forcedUsuario
    ? usuarios.find((u) => String(u.usua) === forcedUsuario)
    : usuarios[0];

  if (!selectedUsuario) {
    throw new Error(`Usuario ${forcedUsuario} no existe para tenant ${idTenant}`);
  }

  return {
    almacenId: Number(selectedAlmacen.id_almacen),
    almacenNombre: selectedAlmacen.nom_almacen,
    destinatarioId: Number(selectedDestinatario.id_destinatario),
    usuario: String(selectedUsuario.usua)
  };
};

const loadVariantsWithToneAndSize = async (connection, idTenant, almacenId) => {
  const [rows] = await connection.query(
    `
      WITH sku_values AS (
        SELECT
          sku.id_sku,
          sku.sku AS sku_label,
          sku.id_producto,
          sku.id_tenant,
          MAX(CASE WHEN LOWER(a.codigo) = 'color' THEN av.valor END) AS tonalidad,
          MAX(CASE WHEN LOWER(a.codigo) = 'talla' THEN av.valor END) AS talla,
          MAX(CASE WHEN LOWER(a.codigo) = 'color' THEN ton.id_tonalidad END) AS id_tonalidad,
          MAX(CASE WHEN LOWER(a.codigo) = 'talla' THEN tal.id_talla END) AS id_talla
        FROM producto_sku sku
        JOIN sku_atributo_valor sav ON sav.id_sku = sku.id_sku
        JOIN atributo a ON a.id_atributo = sav.id_atributo
        JOIN atributo_valor av ON av.id_valor = sav.id_valor
        LEFT JOIN tonalidad ton
          ON LOWER(TRIM(ton.nombre)) = LOWER(TRIM(av.valor))
         AND ton.id_tenant = sku.id_tenant
        LEFT JOIN talla tal
          ON LOWER(TRIM(tal.nombre)) = LOWER(TRIM(av.valor))
         AND tal.id_tenant = sku.id_tenant
        WHERE sku.id_tenant = ?
        GROUP BY sku.id_sku, sku.sku, sku.id_producto, sku.id_tenant
        HAVING tonalidad IS NOT NULL AND talla IS NOT NULL
      )
      SELECT
        p.id_producto,
        p.descripcion,
        sv.id_sku,
        sv.sku_label,
        sv.tonalidad,
        sv.talla,
        sv.id_tonalidad,
        sv.id_talla,
        ROUND(COALESCE(SUM(i.stock), 0), 2) AS stock_actual
      FROM sku_values sv
      JOIN producto p ON p.id_producto = sv.id_producto
      LEFT JOIN inventario_stock i
        ON i.id_sku = sv.id_sku
       AND i.id_tenant = ?
       AND i.id_almacen = ?
      GROUP BY
        p.id_producto,
        p.descripcion,
        sv.id_sku,
        sv.sku_label,
        sv.tonalidad,
        sv.talla,
        sv.id_tonalidad,
        sv.id_talla
      ORDER BY p.descripcion, sv.tonalidad, sv.talla
    `,
    [idTenant, idTenant, almacenId]
  );

  return rows;
};

const invokeInsertNota = async (req) => {
  return new Promise((resolve, reject) => {
    const res = {
      status: (statusCode) => ({
        json: (payload) => {
          if (statusCode >= 400) {
            reject(new Error(`HTTP ${statusCode}: ${JSON.stringify(payload)}`));
            return;
          }
          resolve({ statusCode, payload });
        }
      }),
      json: (payload) => resolve({ statusCode: 200, payload })
    };

    NotaIngresoController.insertNotaAndDetalle(req, res).catch(reject);
  });
};

const getNotaIdByComprobante = async (connection, idTenant, numComprobante) => {
  const [rows] = await connection.query(
    `
      SELECT n.id_nota
      FROM nota n
      JOIN comprobante c ON c.id_comprobante = n.id_comprobante
      WHERE c.id_tenant = ? AND c.num_comprobante = ?
      ORDER BY n.id_nota DESC
      LIMIT 1
    `,
    [idTenant, numComprobante]
  );

  return rows.length ? Number(rows[0].id_nota) : null;
};

const main = async () => {
  let connection;

  try {
    connection = await getConnection();

    const defaults = await findDefaults(connection, tenantId);
    const variants = await loadVariantsWithToneAndSize(connection, tenantId, defaults.almacenId);

    if (!variants.length) {
      console.log("No se encontraron variantes con tonalidad y talla para procesar.");
      return;
    }

    const withRandomQty = variants.map((row) => ({
      ...row,
      cantidad_aleatoria_sugerida: randInt(minQty, maxQty)
    }));

    fs.writeFileSync("tmp/stock_aleatorio_aplicar_input.csv", toCsv(withRandomQty));
    fs.writeFileSync("tmp/stock_aleatorio_aplicar_input.json", JSON.stringify(withRandomQty, null, 2));

    const missingTone = withRandomQty.filter((r) => !r.id_tonalidad).length;
    const missingSize = withRandomQty.filter((r) => !r.id_talla).length;

    const chunks = chunk(withRandomQty, chunkSize);
    const executionLog = [];

    console.log(`Tenant: ${tenantId}`);
    console.log(`Usuario ERP: ${defaults.usuario}`);
    console.log(`Almacen destino: ${defaults.almacenId} - ${defaults.almacenNombre}`);
    console.log(`Destinatario: ${defaults.destinatarioId}`);
    console.log(`Variantes a procesar: ${withRandomQty.length}`);
    console.log(`Productos unicos: ${new Set(withRandomQty.map((r) => r.id_producto)).size}`);
    console.log(`Lotes de notas: ${chunks.length} (chunk=${chunkSize})`);
    console.log(`Variantes sin id_tonalidad mapeado: ${missingTone}`);
    console.log(`Variantes sin id_talla mapeado: ${missingSize}`);

    if (dryRun) {
      console.log("dryRun=true: no se crearon notas ni se modifico stock");
      return;
    }

    for (let i = 0; i < chunks.length; i++) {
      const currentChunk = chunks[i];
      const numComprobante = await nextComprobanteNotaIngreso(connection, tenantId);

      const req = {
        id_tenant: tenantId,
        ip: "127.0.0.1",
        connection: {
          remoteAddress: "127.0.0.1",
          socket: { remoteAddress: "127.0.0.1" }
        },
        socket: { remoteAddress: "127.0.0.1" },
        user: {
          username: defaults.usuario
        },
        body: {
          almacenD: defaults.almacenId,
          destinatario: defaults.destinatarioId,
          glosa: `Carga aleatoria automatizada ${i + 1}/${chunks.length}`,
          nota: "Ingreso aleatorio automatizado",
          fecha: toMysqlDateTime(),
          producto: currentChunk.map((r) => Number(r.id_producto)),
          numComprobante,
          cantidad: currentChunk.map((r) => Number(r.cantidad_aleatoria_sugerida)),
          observacion: `Script ERP stock aleatorio tenant ${tenantId}`,
          usuario: defaults.usuario,
          tonalidad: currentChunk.map((r) => (r.id_tonalidad ? Number(r.id_tonalidad) : null)),
          talla: currentChunk.map((r) => (r.id_talla ? Number(r.id_talla) : null)),
          skus: currentChunk.map((r) => Number(r.id_sku)),
          estado_espera: 0
        }
      };

      const response = await invokeInsertNota(req);
      const notaId = await getNotaIdByComprobante(connection, tenantId, numComprobante);

      executionLog.push({
        lote: i + 1,
        total_lotes: chunks.length,
        filas: currentChunk.length,
        num_comprobante: numComprobante,
        id_nota: notaId,
        respuesta: response.payload
      });

      console.log(
        `Lote ${i + 1}/${chunks.length} aplicado: comprobante ${numComprobante} | nota ${notaId ?? "N/A"} | filas ${currentChunk.length}`
      );
    }

    fs.writeFileSync("tmp/stock_aleatorio_aplicado_resultado.json", JSON.stringify(executionLog, null, 2));

    const executionLogCsv = executionLog.map((row) => ({
      lote: row.lote,
      total_lotes: row.total_lotes,
      filas: row.filas,
      num_comprobante: row.num_comprobante,
      id_nota: row.id_nota,
      respuesta_code: row.respuesta?.code ?? "",
      respuesta_message: row.respuesta?.message ?? ""
    }));

    fs.writeFileSync("tmp/stock_aleatorio_aplicado_resultado.csv", toCsv(executionLogCsv));

    const [summaryRows] = await connection.query(
      `
        SELECT
          COUNT(*) AS total_variantes,
          ROUND(SUM(stock), 2) AS stock_total
        FROM inventario_stock
        WHERE id_tenant = ? AND id_almacen = ?
      `,
      [tenantId, defaults.almacenId]
    );

    console.log("Proceso completado.");
    console.log("Archivos de salida:");
    console.log("- tmp/stock_aleatorio_aplicar_input.csv");
    console.log("- tmp/stock_aleatorio_aplicar_input.json");
    console.log("- tmp/stock_aleatorio_aplicado_resultado.csv");
    console.log("- tmp/stock_aleatorio_aplicado_resultado.json");
    console.log("Resumen almacen destino:", summaryRows[0]);
  } finally {
    if (connection) connection.release();
  }
};

main().catch((error) => {
  console.error("Error en carga aleatoria por Nota de Ingreso:", error.message);
  process.exit(1);
});
