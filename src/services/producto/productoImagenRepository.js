/**
 * Galería de imágenes de producto. Única puerta a `producto_imagen`.
 *
 * `es_principal` único por producto se garantiza a nivel de aplicación (no
 * hay índice único parcial en MySQL): `marcarPrincipal` es el único punto
 * que lo toca, siempre unset-all → set-one dentro de la misma transacción
 * del llamador.
 */

// ─────────────────────────────── Lectura ───────────────────────────────

export const listarPorProducto = async (cx, { id_tenant, id_producto }) => {
  const [filas] = await cx.query(
    `SELECT id_imagen, url, file_id, es_principal, orden
     FROM producto_imagen
     WHERE id_tenant = ? AND id_producto = ?
     UNION
     SELECT id_producto AS id_imagen, imagen_url AS url, SUBSTRING_INDEX(imagen_url, '/', -1) AS file_id, 1 AS es_principal, 0 AS orden
     FROM producto
     WHERE id_tenant = ? AND id_producto = ? AND imagen_url IS NOT NULL AND TRIM(imagen_url) != ''
     ORDER BY es_principal DESC, orden ASC`,
    [id_tenant, id_producto, id_tenant, id_producto]
  );

  // Eliminar duplicados de URL si existen
  const vists = new Set();
  const unicas = [];
  for (const f of filas) {
    if (!vists.has(f.url)) {
      vists.add(f.url);
      unicas.push({ ...f, es_principal: Boolean(f.es_principal) });
    }
  }
  return unicas;
};

export const listarTodasDelTenant = async (cx, { id_tenant }) => {
  const [filas] = await cx.query(
    `SELECT pi.id_imagen, pi.id_producto, pi.url, pi.file_id, pi.es_principal, pi.orden,
            p.descripcion AS nom_producto, p.cod_barras AS cod_producto
     FROM producto_imagen pi
     INNER JOIN producto p ON p.id_producto = pi.id_producto AND p.id_tenant = pi.id_tenant
     WHERE pi.id_tenant = ?
     UNION
     SELECT p.id_producto AS id_imagen, p.id_producto, p.imagen_url AS url, 
            SUBSTRING_INDEX(p.imagen_url, '/', -1) AS file_id, 1 AS es_principal, 0 AS orden,
            p.descripcion AS nom_producto, p.cod_barras AS cod_producto
     FROM producto p
     WHERE p.id_tenant = ? AND p.imagen_url IS NOT NULL AND TRIM(p.imagen_url) != ''
     ORDER BY nom_producto ASC, es_principal DESC, orden ASC`,
    [id_tenant, id_tenant]
  );

  // Eliminar duplicados de URL por producto
  const vists = new Set();
  const unicas = [];
  for (const f of filas) {
    const key = `${f.id_producto}:${f.url}`;
    if (!vists.has(key)) {
      vists.add(key);
      unicas.push({ ...f, es_principal: Boolean(f.es_principal) });
    }
  }
  return unicas;
};

/**
 * Imágenes de varios productos a la vez, para no hacer N+1 en el catálogo.
 * @returns {Promise<Map<number, string[]>>} id_producto → urls (principal primero)
 */
export const listarPorProductos = async (cx, { id_tenant, ids_producto }) => {
  if (!Array.isArray(ids_producto) || ids_producto.length === 0) return new Map();

  const [filas] = await cx.query(
    `SELECT id_producto, url
     FROM producto_imagen
     WHERE id_tenant = ? AND id_producto IN (${ids_producto.map(() => "?").join(",")})
     ORDER BY es_principal DESC, orden ASC`,
    [id_tenant, ...ids_producto]
  );

  const mapa = new Map();
  for (const f of filas) {
    const lista = mapa.get(f.id_producto) ?? [];
    lista.push(f.url);
    mapa.set(f.id_producto, lista);
  }
  return mapa;
};

export const contarImagenes = async (cx, { id_tenant, id_producto }) => {
  const [[fila]] = await cx.query(
    `SELECT COUNT(*) AS total FROM producto_imagen WHERE id_tenant = ? AND id_producto = ?`,
    [id_tenant, id_producto]
  );
  return Number(fila.total);
};

// ─────────────────────────────── Escritura ───────────────────────────────

export const insertarImagen = async (cx, { id_tenant, id_producto, url, file_id, orden }) => {
  const [resultado] = await cx.query(
    `INSERT INTO producto_imagen (id_tenant, id_producto, url, file_id, orden) VALUES (?, ?, ?, ?, ?)`,
    [id_tenant, id_producto, url, file_id, orden]
  );
  return resultado.insertId;
};

/**
 * Borra una imagen (fila + devuelve sus datos, incluido si era la principal,
 * para que el controlador decida a quién promover). `null` si no existía o
 * era de otro tenant/producto.
 */
export const eliminarImagen = async (cx, { id_tenant, id_producto, id_imagen }) => {
  // Limpiar imagen_url en la tabla producto
  await cx.query(`UPDATE producto SET imagen_url = NULL WHERE id_tenant = ? AND id_producto = ?`, [id_tenant, id_producto]);

  const [[fila]] = await cx.query(
    `SELECT id_imagen, file_id, es_principal FROM producto_imagen
     WHERE id_tenant = ? AND id_producto = ? AND id_imagen = ? FOR UPDATE`,
    [id_tenant, id_producto, id_imagen]
  );
  if (fila) {
    await cx.query(`DELETE FROM producto_imagen WHERE id_tenant = ? AND id_imagen = ?`, [id_tenant, id_imagen]);
  }
  return fila ? { ...fila, es_principal: Boolean(fila.es_principal) } : { file_id: `legacy_${id_producto}`, es_principal: true };
};

/** La siguiente imagen candidata a principal tras borrar la actual (o null si no queda ninguna). */
export const obtenerSiguientePrincipal = async (cx, { id_tenant, id_producto }) => {
  const [[fila]] = await cx.query(
    `SELECT id_imagen, url FROM producto_imagen
     WHERE id_tenant = ? AND id_producto = ? ORDER BY orden ASC LIMIT 1 FOR UPDATE`,
    [id_tenant, id_producto]
  );
  return fila ?? null;
};

/**
 * Reordena en bloque. Valida que TODOS los `id_imagen` pertenezcan al
 * producto antes de aplicar nada — evita reordenar filas de otro producto
 * si el cliente mandó un id suelto por error.
 */
export const reordenar = async (cx, { id_tenant, id_producto, orden }) => {
  const idsImagen = orden.map((o) => Number(o.id_imagen));
  const [[fila]] = await cx.query(
    `SELECT COUNT(*) AS total FROM producto_imagen
     WHERE id_tenant = ? AND id_producto = ? AND id_imagen IN (${idsImagen.map(() => "?").join(",")})`,
    [id_tenant, id_producto, ...idsImagen]
  );
  if (Number(fila.total) !== idsImagen.length) {
    throw new Error("Alguna imagen no pertenece a este producto.");
  }

  for (const item of orden) {
    await cx.query(
      `UPDATE producto_imagen SET orden = ? WHERE id_tenant = ? AND id_producto = ? AND id_imagen = ?`,
      [Number(item.orden), id_tenant, id_producto, Number(item.id_imagen)]
    );
  }
};

/** Marca una imagen como principal (unset-all → set-one). `null` si no matcheó. */
export const marcarPrincipal = async (cx, { id_tenant, id_producto, id_imagen }) => {
  await cx.query(
    `UPDATE producto_imagen SET es_principal = 0 WHERE id_tenant = ? AND id_producto = ?`,
    [id_tenant, id_producto]
  );
  const [resultado] = await cx.query(
    `UPDATE producto_imagen SET es_principal = 1 WHERE id_tenant = ? AND id_producto = ? AND id_imagen = ?`,
    [id_tenant, id_producto, id_imagen]
  );
  if (resultado.affectedRows === 0) return null;

  const [[fila]] = await cx.query(
    `SELECT url FROM producto_imagen WHERE id_tenant = ? AND id_imagen = ?`,
    [id_tenant, id_imagen]
  );
  return fila?.url ?? null;
};

/** Único punto que toca `producto.imagen_url` — mantiene el "cover" en sincronía con la principal. */
export const sincronizarImagenUrlProducto = async (cx, { id_tenant, id_producto, url }) => {
  await cx.query(
    `UPDATE producto SET imagen_url = ? WHERE id_tenant = ? AND id_producto = ?`,
    [url, id_tenant, id_producto]
  );
};

export default {
  listarPorProducto,
  listarPorProductos,
  contarImagenes,
  insertarImagen,
  eliminarImagen,
  obtenerSiguientePrincipal,
  reordenar,
  marcarPrincipal,
  sincronizarImagenUrlProducto,
};
