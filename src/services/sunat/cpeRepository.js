/**
 * Acceso a datos de los comprobantes electrónicos.
 *
 * Reglas de la casa que se respetan en TODAS las consultas:
 *  - SQL parametrizado (nunca concatenar input).
 *  - `id_tenant` SIEMPRE en el WHERE, incluidas las descargas: el `id` de la URL
 *    no basta para autorizar (Regla de Oro Nº1).
 *  - Los blobs (XML/CDR) solo se leen desde `obtenerArchivos`, jamás en listados.
 */

/** Lee la venta con todo lo que el comprobante necesita. */
export const SQL_VENTA_PARA_CPE = `
  SELECT
    v.id_venta, v.id_sucursal, v.id_cliente, v.estado_venta, v.estado_sunat,
    v.f_venta, v.fecha_iso, v.hora_creacion, v.igv, v.id_tenant,
    com.num_comprobante, tp.nom_tipocomp,
    cl.dni, cl.ruc, cl.razon_social, cl.nombres, cl.apellidos
  FROM venta v
  INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
  INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
  LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente AND cl.id_tenant = v.id_tenant
  WHERE v.id_venta = ? AND v.id_tenant = ?
  LIMIT 1
`;

const SQL_DETALLES_PARA_CPE = `
  SELECT dv.id_detalle, dv.id_producto, dv.cantidad, dv.precio, dv.descuento, dv.total,
         p.descripcion AS nombre, p.undm
  FROM detalle_venta dv
  INNER JOIN producto p ON p.id_producto = dv.id_producto
  WHERE dv.id_venta = ? AND dv.id_tenant = ?
  ORDER BY dv.id_detalle
`;

const SQL_EMPRESA_EMISOR = `
  SELECT id_empresa, id_tenant, ruc, razonSocial, nombreComercial,
         direccion, distrito, provincia, departamento, ubigueo
  FROM empresa
  WHERE id_empresa = ? AND id_tenant = ?
  LIMIT 1
`;

export const obtenerDatosVenta = async (cx, { id_venta, id_tenant, id_empresa }) => {
  const [[venta]] = await cx.query(SQL_VENTA_PARA_CPE, [id_venta, id_tenant]);
  if (!venta) return null;

  const [detalles] = await cx.query(SQL_DETALLES_PARA_CPE, [id_venta, id_tenant]);
  const [[empresa]] = await cx.query(SQL_EMPRESA_EMISOR, [id_empresa, id_tenant]);

  return {
    venta,
    detalles,
    empresa,
    cliente: {
      dni: venta.dni,
      ruc: venta.ruc,
      razon_social: venta.razon_social,
      nombres: venta.nombres,
      apellidos: venta.apellidos,
    },
  };
};

export const obtenerCpePorVenta = async (cx, { id_tenant, id_venta }) => {
  const [[fila]] = await cx.query(
    `SELECT * FROM comprobante_electronico WHERE id_tenant = ? AND id_venta = ? LIMIT 1`,
    [id_tenant, id_venta]
  );
  return fila || null;
};

export const obtenerCpePorId = async (cx, { id_tenant, id_cpe }) => {
  const [[fila]] = await cx.query(
    `SELECT * FROM comprobante_electronico WHERE id_tenant = ? AND id_cpe = ? LIMIT 1`,
    [id_tenant, id_cpe]
  );
  return fila || null;
};

/**
 * Crea la cabecera si no existe. `ON DUPLICATE KEY UPDATE ... LAST_INSERT_ID`
 * devuelve el id existente sin insertar: dos peticiones simultáneas convergen
 * en la misma fila en vez de chocar.
 */
export const crearCpePendiente = async (cx, datos) => {
  const [resultado] = await cx.query(
    `
      INSERT INTO comprobante_electronico
        (id_tenant, id_empresa, id_venta, id_sucursal, tipo_doc, serie, correlativo,
         ruc_emisor, nombre_archivo, fecha_emision, moneda,
         mto_oper_gravadas, mto_igv, mto_imp_venta,
         tipo_doc_cliente, num_doc_cliente, nombre_cliente,
         estado, sunat_env, origen, idempotency_key, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id_cpe = LAST_INSERT_ID(id_cpe)
    `,
    [
      datos.id_tenant, datos.id_empresa, datos.id_venta, datos.id_sucursal ?? null,
      datos.tipo_doc, datos.serie, datos.correlativo,
      datos.ruc_emisor, datos.nombre_archivo, datos.fecha_emision, datos.moneda ?? "PEN",
      datos.mto_oper_gravadas, datos.mto_igv, datos.mto_imp_venta,
      datos.tipo_doc_cliente ?? null, datos.num_doc_cliente ?? null, datos.nombre_cliente ?? null,
      datos.sunat_env ?? "beta", datos.origen ?? "SERVIDOR",
      datos.idempotency_key ?? null, datos.creado_por ?? null,
    ]
  );
  return resultado.insertId;
};

/**
 * Claim atómico del documento para enviarlo. Es lo que impide que dos clics
 * simultáneos emitan dos veces: solo UNA petición consigue `affectedRows === 1`.
 * El lock expira solo, así un proceso caído no bloquea el documento para siempre.
 */
export const reclamarCpeParaEnvio = async (cx, { id_cpe, id_tenant, lockToken, minutosLock = 5 }) => {
  const [resultado] = await cx.query(
    `
      UPDATE comprobante_electronico
      SET estado = 'ENVIANDO',
          lock_token = ?,
          lock_expira_en = DATE_ADD(NOW(), INTERVAL ? MINUTE),
          intentos = intentos + 1,
          enviado_en = NOW()
      WHERE id_cpe = ? AND id_tenant = ?
        AND estado IN ('PENDIENTE', 'ERROR_ENVIO', 'ERROR_CONFIG')
        AND (lock_expira_en IS NULL OR lock_expira_en < NOW())
    `,
    [lockToken, minutosLock, id_cpe, id_tenant]
  );
  return resultado.affectedRows === 1;
};

export const guardarXmlFirmado = async (cx, { id_cpe, id_tenant, xml, sha256, hashCpe }) => {
  await cx.query(
    `
      INSERT INTO comprobante_electronico_archivo (id_cpe, id_tenant, xml_firmado, xml_sha256)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE xml_firmado = VALUES(xml_firmado), xml_sha256 = VALUES(xml_sha256)
    `,
    [id_cpe, id_tenant, xml, sha256]
  );
  if (hashCpe) {
    await cx.query(
      `UPDATE comprobante_electronico SET hash_cpe = ? WHERE id_cpe = ? AND id_tenant = ?`,
      [hashCpe, id_cpe, id_tenant]
    );
  }
};

export const guardarCdr = async (cx, { id_cpe, id_tenant, cdrZip, cdrXml, sha256 }) => {
  await cx.query(
    `
      INSERT INTO comprobante_electronico_archivo (id_cpe, id_tenant, cdr_zip, cdr_xml, cdr_sha256)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE cdr_zip = VALUES(cdr_zip), cdr_xml = VALUES(cdr_xml), cdr_sha256 = VALUES(cdr_sha256)
    `,
    [id_cpe, id_tenant, cdrZip ?? null, cdrXml ?? null, sha256 ?? null]
  );
};

/** Persiste el desenlace del envío y libera el lock. */
export const registrarResultadoEnvio = async (
  cx,
  { id_cpe, id_tenant, estado, responseCode = null, descripcion = null, notas = null, error = null, categoriaError = null }
) => {
  await cx.query(
    `
      UPDATE comprobante_electronico
      SET estado = ?,
          sunat_response_code = ?,
          sunat_descripcion = ?,
          sunat_notas_json = ?,
          ultimo_error = ?,
          ultimo_error_categoria = ?,
          respondido_en = NOW(),
          lock_token = NULL,
          lock_expira_en = NULL
      WHERE id_cpe = ? AND id_tenant = ?
    `,
    [
      estado,
      responseCode,
      descripcion ? String(descripcion).slice(0, 500) : null,
      notas && notas.length ? JSON.stringify(notas) : null,
      error ? String(error).slice(0, 500) : null,
      categoriaError,
      id_cpe,
      id_tenant,
    ]
  );
};

export const registrarIntento = async (
  cx,
  { id_cpe, id_tenant, intento, operacion, resultado, responseCode = null, mensaje = null, duracionMs = null, id_usuario = null, ip = null }
) => {
  await cx.query(
    `
      INSERT INTO comprobante_electronico_envio
        (id_cpe, id_tenant, intento, operacion, resultado, sunat_response_code, mensaje, duracion_ms, id_usuario, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [id_cpe, id_tenant, intento ?? 1, operacion, resultado, responseCode, mensaje ? String(mensaje).slice(0, 1000) : null, duracionMs, id_usuario, ip]
  );
};

/**
 * Espejo para el cliente legacy: `venta.estado_sunat` sigue existiendo, pero
 * ahora se DERIVA del estado real del comprobante en vez de fijarlo el front.
 */
export const sincronizarEstadoVenta = async (cx, { id_venta, id_tenant, aceptado }) => {
  await cx.query(
    `UPDATE venta SET estado_sunat = ? WHERE id_venta = ? AND id_tenant = ?`,
    [aceptado ? 1 : 0, id_venta, id_tenant]
  );
};

export const liberarLock = async (cx, { id_cpe, id_tenant }) => {
  await cx.query(
    `UPDATE comprobante_electronico SET lock_token = NULL, lock_expira_en = NULL WHERE id_cpe = ? AND id_tenant = ?`,
    [id_cpe, id_tenant]
  );
};

/** Listado paginado. Nunca selecciona blobs. */
export const listarCpe = async (cx, { id_tenant, estado, tipo_doc, desde, hasta, q, limit = 25, offset = 0 }) => {
  const where = ["c.id_tenant = ?"];
  const params = [id_tenant];

  if (estado) { where.push("c.estado = ?"); params.push(estado); }
  if (tipo_doc) { where.push("c.tipo_doc = ?"); params.push(tipo_doc); }
  if (desde) { where.push("c.fecha_emision >= ?"); params.push(desde); }
  if (hasta) { where.push("c.fecha_emision <= ?"); params.push(hasta); }
  if (q) {
    where.push("(CONCAT(c.serie, '-', c.correlativo) LIKE ? OR c.num_doc_cliente LIKE ? OR c.nombre_cliente LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const sqlWhere = where.join(" AND ");

  const [items] = await cx.query(
    `
      SELECT c.id_cpe, c.id_venta, c.tipo_doc, c.serie, c.correlativo, c.nombre_archivo,
             c.fecha_emision, c.moneda, c.mto_oper_gravadas, c.mto_igv, c.mto_imp_venta,
             c.tipo_doc_cliente, c.num_doc_cliente, c.nombre_cliente,
             c.estado, c.sunat_response_code, c.sunat_descripcion, c.sunat_env,
             c.origen, c.sin_respaldo, c.intentos, c.ultimo_error, c.ultimo_error_categoria,
             c.creado_en, c.respondido_en
      FROM comprobante_electronico c
      WHERE ${sqlWhere}
      ORDER BY c.fecha_emision DESC, c.id_cpe DESC
      LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  const [[conteo]] = await cx.query(
    `SELECT COUNT(*) AS total FROM comprobante_electronico c WHERE ${sqlWhere}`,
    params
  );

  return { items, total: conteo.total };
};

/** KPIs de la cabecera de la página. */
export const obtenerResumen = async (cx, { id_tenant, desde, hasta }) => {
  const where = ["id_tenant = ?"];
  const params = [id_tenant];
  if (desde) { where.push("fecha_emision >= ?"); params.push(desde); }
  if (hasta) { where.push("fecha_emision <= ?"); params.push(hasta); }

  const [[fila]] = await cx.query(
    `
      SELECT
        COUNT(*) AS total,
        SUM(estado IN ('ACEPTADO','ACEPTADO_SIN_RESPALDO')) AS aceptados,
        SUM(estado = 'ACEPTADO_CON_OBS') AS con_observaciones,
        SUM(estado = 'RECHAZADO') AS rechazados,
        SUM(estado IN ('PENDIENTE','ENVIANDO')) AS pendientes,
        SUM(estado IN ('ERROR_ENVIO','ERROR_CONFIG')) AS con_error,
        SUM(estado = 'INCIERTO') AS inciertos
      FROM comprobante_electronico
      WHERE ${where.join(" AND ")}
    `,
    params
  );
  return fila;
};

/** Ventas electrónicas (Factura/Boleta) que todavía no tienen comprobante. */
export const listarVentasSinCpe = async (cx, { id_tenant, desde, hasta, limit = 50 }) => {
  const where = [
    "v.id_tenant = ?",
    "v.estado_venta = 1",
    "tp.nom_tipocomp IN ('Factura','Boleta')",
    "c.id_cpe IS NULL",
  ];
  const params = [id_tenant];
  if (desde) { where.push("v.f_venta >= ?"); params.push(desde); }
  if (hasta) { where.push("v.f_venta <= ?"); params.push(hasta); }

  const [filas] = await cx.query(
    `
      SELECT v.id_venta, v.f_venta, com.num_comprobante, tp.nom_tipocomp
      FROM venta v
      INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
      INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
      LEFT JOIN comprobante_electronico c ON c.id_venta = v.id_venta AND c.id_tenant = v.id_tenant
      WHERE ${where.join(" AND ")}
      ORDER BY v.f_venta DESC, v.id_venta DESC
      LIMIT ?
    `,
    [...params, Number(limit)]
  );
  return filas;
};

export const listarIntentos = async (cx, { id_tenant, id_cpe }) => {
  const [filas] = await cx.query(
    `
      SELECT intento, operacion, resultado, sunat_response_code, mensaje, duracion_ms, id_usuario, creado_en
      FROM comprobante_electronico_envio
      WHERE id_cpe = ? AND id_tenant = ?
      ORDER BY id_envio ASC
    `,
    [id_cpe, id_tenant]
  );
  return filas;
};

/** Única función que lee blobs. Se usa solo en las descargas. */
export const obtenerArchivos = async (cx, { id_tenant, id_cpe }) => {
  const [[fila]] = await cx.query(
    `SELECT xml_firmado, xml_sha256, cdr_zip, cdr_xml, cdr_sha256 FROM comprobante_electronico_archivo WHERE id_cpe = ? AND id_tenant = ? LIMIT 1`,
    [id_cpe, id_tenant]
  );
  return fila || null;
};

export default {
  obtenerDatosVenta,
  obtenerCpePorVenta,
  obtenerCpePorId,
  crearCpePendiente,
  reclamarCpeParaEnvio,
  guardarXmlFirmado,
  guardarCdr,
  registrarResultadoEnvio,
  registrarIntento,
  sincronizarEstadoVenta,
  liberarLock,
  listarCpe,
  obtenerResumen,
  listarVentasSinCpe,
  listarIntentos,
  obtenerArchivos,
};
