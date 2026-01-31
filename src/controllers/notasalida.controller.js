import { getConnection } from "../database/database.js";
import { logInventario } from "../utils/logActions.js";
import { resolveSku } from "../utils/skuHelper.js";

// Cache para queries repetitivas
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar caché periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      queryCache.delete(key);
    }
  }
}, CACHE_TTL * 2);

const getSalidas = async (req, res) => {
  let connection;
  const {
    page = 0,
    limit = 10,
    fecha_i = '2012-01-01',
    fecha_e = '2057-12-27',
    razon_social = '',
    almacen = '%',
    usuario = '',
    documento = '',
    estado = '%'
  } = req.query;
  const id_tenant = req.id_tenant;
  const offset = page * limit;

  try {
    connection = await getConnection();

    // Construir WHERE clause dinámico
    const where = [
      'n.id_tiponota = 2',
      'n.id_tenant = ?',
      'c.num_comprobante LIKE ?',
      'n.fecha >= ?',
      'n.fecha <= ?',
      '(d.razon_social LIKE ? OR CONCAT(d.nombres, " ", d.apellidos) LIKE ?)'
    ];

    const params = [
      id_tenant,
      `%${documento}%`,
      fecha_i,
      fecha_e,
      `%${razon_social}%`,
      `%${razon_social}%`
    ];

    if (almacen !== '%') {
      where.push('n.id_almacenO = ?');
      params.push(almacen);
    }
    if (estado !== '%') {
      where.push('n.estado_nota LIKE ?');
      params.push(`%${estado}%`);
    }
    if (usuario) {
      where.push('(u.usua LIKE ? OR u.usua IS NULL)');
      params.push(`%${usuario}%`);
    }

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(DISTINCT n.id_nota) as total
      FROM nota n
        LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
        LEFT JOIN comprobante c ON n.id_comprobante = c.id_comprobante
        LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen
        LEFT JOIN almacen ad ON n.id_almacenD = ad.id_almacen
        LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
      WHERE ${where.join(' AND ')}
    `;

    const [totalResult] = await connection.query(countQuery, params);
    const totalNotas = totalResult[0].total;

    // Si no hay notas, retornar temprano
    if (totalNotas === 0) {
      return res.json({ code: 1, data: [], totalNotas: 0 });
    }

    // Query principal con paginación optimizada
    const cabecerasQuery = `
      WITH NotasPaginadas AS (
        SELECT 
          n.id_nota AS id,
          DATE_FORMAT(n.fecha, '%Y-%m-%d') AS fecha,
          c.num_comprobante AS documento,
          ao.nom_almacen AS almacen_O,
          COALESCE(ad.nom_almacen,'Almacen externo') AS almacen_D,
          COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor,
          n.glosa AS concepto,
          n.estado_nota AS estado,
          COALESCE(u.usua, '') as usuario,
          n.observacion AS observacion,
          n.hora_creacion,
          n.fecha_anulacion,
          n.u_modifica AS u_modifica,
          n.nom_nota
        FROM nota n
          LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
          LEFT JOIN comprobante c ON n.id_comprobante = c.id_comprobante
          LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen
          LEFT JOIN almacen ad ON n.id_almacenD = ad.id_almacen
          LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
        WHERE ${where.join(' AND ')}
        ORDER BY n.fecha DESC, c.num_comprobante DESC
        LIMIT ? OFFSET ?
      )
      SELECT * FROM NotasPaginadas
    `;

    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    const [salidaResult] = await connection.query(cabecerasQuery, queryParams);

    if (!salidaResult.length) {
      return res.json({ code: 1, data: [], totalNotas: 0 });
    }

    // Obtener todos los detalles en un solo query (evita N+1)
    const ids = salidaResult.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const detallesQuery = `
      SELECT 
        dn.id_nota,
        dn.id_detalle_nota AS codigo,
        m.nom_marca AS marca,
        sc.nom_subcat AS categoria,
        p.descripcion AS descripcion,
        dn.cantidad AS cantidad,
        p.undm AS unidad,
        p.id_producto,
        t.nombre AS nombre_tonalidad,
        ta.nombre AS nombre_talla,
        ps.sku AS sku_label,
        ps.attributes_json AS attributes
      FROM detalle_nota dn
        INNER JOIN producto p ON p.id_producto = dn.id_producto
        INNER JOIN marca m ON p.id_marca = m.id_marca
        INNER JOIN sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
        LEFT JOIN tonalidad t ON dn.id_tonalidad = t.id_tonalidad
        LEFT JOIN talla ta ON dn.id_talla = ta.id_talla
        LEFT JOIN producto_sku ps ON dn.id_sku = ps.id_sku
      WHERE dn.id_nota IN (${placeholders}) AND dn.id_tenant = ?
    `;

    const [detallesResult] = await connection.query(detallesQuery, [...ids, id_tenant]);

    // Indexar detalles por id_nota
    const detallesMap = {};
    for (const d of detallesResult) {
      if (!detallesMap[d.id_nota]) detallesMap[d.id_nota] = [];
      detallesMap[d.id_nota].push({
        codigo: d.codigo,
        marca: d.marca,
        categoria: d.categoria,
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        unidad: d.unidad,
        id_producto: d.id_producto,
        nombre_tonalidad: d.nombre_tonalidad || '-',
        nombre_talla: d.nombre_talla || '-',
        sku_label: d.sku_label,
        attributes: d.attributes
      });
    }

    const salidas = salidaResult.map(n => ({
      ...n,
      detalles: detallesMap[n.id] || []
    }));

    res.json({ code: 1, data: salidas, totalNotas });
  } catch (error) {
    console.error('Error en getSalidas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getAlmacen = async (req, res) => {
  let connection;
  const id_tenant = req.id_tenant;

  // Usar caché
  const cacheKey = `almacenes_salida_${id_tenant}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ code: 1, data: cached.data, message: "Almacenes listados" });
  }

  try {
    connection = await getConnection();
    const [result] = await connection.query(`
            SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal 
            FROM almacen a 
            LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
            LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
            WHERE a.estado_almacen = 1 AND a.id_tenant = ?
        `, [id_tenant]);

    // Guardar en caché
    queryCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json({ code: 1, data: result, message: "Almacenes listados" });
  } catch (error) {
    console.error('Error en getAlmacen:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getProductos = async (req, res) => {
  let connection;
  const { descripcion = '', almacen = 1, cod_barras = '', limit = 50 } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    let query = `
      SELECT 
        p.id_producto AS codigo, 
        p.descripcion AS descripcion, 
        m.nom_marca AS marca, 
        SUM(COALESCE(i.stock, 0)) AS stock,
        p.cod_barras as cod_barras 
      FROM producto p 
      INNER JOIN marca m ON p.id_marca = m.id_marca 
      LEFT JOIN producto_sku sku ON p.id_producto = sku.id_producto
      LEFT JOIN inventario_stock i ON sku.id_sku = i.id_sku AND i.id_almacen = ?
      WHERE p.id_tenant = ?
    `;

    const queryParams = [almacen, id_tenant];

    if (descripcion) {
      query += ' AND p.descripcion LIKE ?';
      queryParams.push(`%${descripcion}%`);
    }

    if (cod_barras) {
      query += ' AND p.cod_barras LIKE ?';
      queryParams.push(`%${cod_barras}%`);
    }

    query += ' GROUP BY p.id_producto, p.descripcion, m.nom_marca, p.cod_barras LIMIT ?';
    queryParams.push(parseInt(limit));

    const [productosResult] = await connection.query(query, queryParams);

    res.json({ code: 1, data: productosResult });
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getNuevoDocumento = async (req, res) => {
  let connection;
  const id_tenant = req.id_tenant;
  try {
    connection = await getConnection();

    // Buscar el último comprobante de nota de salida (id_tipocomprobante = 7)
    const [ultimoComprobanteResult] = await connection.query(`
      SELECT num_comprobante 
      FROM comprobante 
      WHERE id_tipocomprobante = 7 AND id_tenant = ?
      ORDER BY num_comprobante DESC 
      LIMIT 1
    `, [id_tenant]);

    let nuevoNumComprobante;
    if (ultimoComprobanteResult.length > 0) {
      const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
      const partes = ultimoNumComprobante.split("-");
      const serie = partes[0].substring(1); // Quita la "S"
      const numero = parseInt(partes[1], 10) + 1;

      if (numero > 99999999) {
        const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
        nuevoNumComprobante = `S${nuevaSerie}-00000001`;
      } else {
        nuevoNumComprobante = `S${serie}-${numero.toString().padStart(8, "0")}`;
      }
    } else {
      nuevoNumComprobante = "S400-00000001";
    }

    res.json({ code: 1, data: [{ nuevo_numero_de_nota: nuevoNumComprobante }], message: "Nuevo numero de nota" });
  } catch (error) {
    console.error('Error en getNuevoDocumento:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getDestinatario = async (req, res) => {
  let connection;
  const id_tenant = req.id_tenant;

  // Usar caché
  const cacheKey = `destinatarios_salida_${id_tenant}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ code: 1, data: cached.data, message: "Destinatarios listados" });
  }

  try {
    connection = await getConnection();
    const [result] = await connection.query(`
            SELECT id_destinatario AS id, COALESCE(ruc, dni) AS documento, COALESCE(razon_social, CONCAT(nombres, ' ', apellidos)) AS destinatario 
            FROM destinatario
            WHERE id_tenant = ?
        `, [id_tenant]);

    // Guardar en caché
    queryCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json({ code: 1, data: result, message: "Destinatarios listados" });
  } catch (error) {
    console.error('Error en getDestinatario:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const insertNotaAndDetalle = async (req, res) => {
  const {
    almacenO, almacenD, destinatario, glosa, nota, fecha, producto, numComprobante, cantidad, observacion, nom_usuario
  } = req.body;
  const tonalidades = req.body.tonalidad || [];
  const tallas = req.body.talla || [];
  const skus = req.body.sku || []; // Read SKUs
  const id_tenant = req.id_tenant;

  if (
    !almacenO || !destinatario || !glosa || !nota || !fecha || !producto || !numComprobante || !cantidad || !nom_usuario
  ) {
    return res
      .status(400)
      .json({ message: "Bad Request. Please fill all fields correctly." });
  }

  let connection;
  try {
    connection = await getConnection();

    await connection.beginTransaction();

    // Insertar el comprobante
    const [comprobanteResult] = await connection.query(
      "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES (7, ?, ?)",
      [numComprobante, id_tenant]
    );

    const id_comprobante = comprobanteResult.insertId;
    const [usuarioResult] = await connection.query(
      "SELECT id_usuario FROM usuario where usua = ? AND id_tenant = ?",
      [nom_usuario, id_tenant]
    );
    const id_usuario = usuarioResult[0].id_usuario;
    // Insertar la nota
    const [notaResult] = await connection.query(
      `INSERT INTO nota 
      (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario, estado_espera, id_tenant) 
      VALUES (?, ?, 2, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?)`,
      [almacenO, almacenD || null, destinatario, id_comprobante, glosa, fecha, nota, observacion, id_usuario, id_tenant]
    );

    const id_nota = notaResult.insertId;

    // Obtener precios de todos los productos en un solo query (optimización)
    const productosPlaceholders = producto.map(() => '?').join(',');
    const [preciosResult] = await connection.query(
      `SELECT id_producto, precio FROM producto WHERE id_producto IN (${productosPlaceholders}) AND id_tenant = ?`,
      [...producto, id_tenant]
    );

    // Crear mapa de precios
    const preciosMap = new Map(preciosResult.map(p => [p.id_producto, p.precio]));

    // Validar que todos los productos existan
    for (const id_prod of producto) {
      if (!preciosMap.has(id_prod)) {
        throw new Error(`El producto con ID ${id_prod} no existe.`);
      }
    }

    // Preparar datos para batch insert de detalles
    const detalleValues = [];
    const detalleParams = [];

    for (let i = 0; i < producto.length; i++) {
      const id_producto = producto[i];
      const cantidadProducto = cantidad[i];
      const precio = preciosMap.get(id_producto);
      const totalProducto = cantidadProducto * precio;
      const id_ton = tonalidades[i] || null;
      const id_tal = tallas[i] || null;
      const id_sku_val = skus[i] || null; // Capture SKU

      detalleValues.push('(?, ?, ?, ?, ?, ?, ?, ?, ?)');
      detalleParams.push(id_producto, id_nota, cantidadProducto, precio, totalProducto, id_tenant, id_ton, id_tal, id_sku_val);
    }

    // Batch insert de detalles
    const [detalleResult] = await connection.query(
      `INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total, id_tenant, id_tonalidad, id_talla, id_sku) VALUES ${detalleValues.join(', ')}`,
      detalleParams
    );

    // Obtener IDs de detalles insertados
    const firstDetalleId = detalleResult.insertId;

    // Obtener stocks: BLOQUE ELIMINADO en favor de validación inside-loop para variantes
    // const [stocksResult] ...
    // const stocksMap ...

    // Preparar batch operations
    const updateInventarioPromises = [];
    const bitacoraValues = [];
    const bitacoraParams = [];

    // Recalcular stocksMap para variantes requiere una estrategia diferente porque 
    // stocksMap actual solo usa id_producto como key, y sobreescribiría variantes.
    // En lugar de fetch global, haremos verificación dentro del loop para ser seguros, 
    // o hacemos fetch de todo y construimos un mapa compuesto.
    // Dado que el loop de actualización es asíncrono y usamos updates directos, 
    // podemos consultar el stock ESPECIFICO en cada iteración.

    // (Optimizacion: Si son muchos productos, el fetch individual es costoso, pero seguro).
    // Reemplazaremos el bloque de "validation & update" con un loop async.

    updateInventarioPromises = []; // Reset if defined before or just create new here:
    // const updateInventarioPromises = []; is defined above

    for (let i = 0; i < producto.length; i++) {
      const id_producto = producto[i];
      const cantidadProducto = cantidad[i];
      const id_detalle = firstDetalleId + i;
      const id_ton = tonalidades[i] || null;
      const id_tal = tallas[i] || null;
      const passed_sku = skus[i] || null;

      // Consultar stock específico
      let id_sku;
      if (passed_sku) {
        id_sku = passed_sku;
      } else {
        id_sku = await resolveSku(connection, id_producto, id_ton, id_tal, id_tenant);
      }

      const [stockResult] = await connection.query(
        `SELECT stock FROM inventario_stock 
           WHERE id_sku = ? 
           AND id_almacen = ? 
           AND id_tenant = ?`,
        [id_sku, almacenO, id_tenant]
      );

      const stockAnterior = stockResult.length > 0 ? parseFloat(stockResult[0].stock) : 0;

      // Validar stock suficiente
      if (stockAnterior < cantidadProducto) {
        throw new Error(`Stock insuficiente para producto ID ${id_producto}. Disponible: ${stockAnterior}, Solicitado: ${cantidadProducto}`);
      }

      const totalStock = stockAnterior - cantidadProducto;

      // Actualizar stock
      await connection.query(
        `UPDATE inventario_stock SET stock = stock - ? 
           WHERE id_sku = ? 
           AND id_almacen = ? 
           AND id_tenant = ?`,
        [cantidadProducto, id_sku, almacenO, id_tenant]
      );

      // Preparar bitácora
      bitacoraValues.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      // id_nota, id_producto, id_almacen, id_detalle_nota, sale, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla
      bitacoraParams.push(id_nota, id_producto, almacenO, id_detalle, cantidadProducto, stockAnterior, totalStock, fecha, id_tenant, id_ton, id_tal);
    }

    // Ejecutar batch updates en paralelo
    if (updateInventarioPromises.length > 0) {
      await Promise.all(updateInventarioPromises);
    }

    // Batch insert de bitácora
    if (bitacoraValues.length > 0) {
      await connection.query(
        `INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, sale, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla) VALUES ${bitacoraValues.join(', ')}`,
        bitacoraParams
      );
    }

    await connection.commit();

    // Limpiar caché relacionado
    queryCache.clear();

    // Registrar log de creación de nota de salida
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (usuarioResult[0]?.id_usuario && id_tenant) {
      await logInventario.notaSalida(id_nota, usuarioResult[0].id_usuario, ip, id_tenant);
    }

    res.json({ code: 1, message: 'Nota y detalle insertados correctamente' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en insertNotaAndDetalle:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const anularNota = async (req, res) => {
  const { notaId, usuario } = req.body;
  const id_tenant = req.id_tenant;

  if (!notaId) {
    return res.status(400).json({ message: "El ID de la nota es necesario." });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Obtener los detalles de la nota
    const [notaResult] = await connection.query(
      "SELECT id_almacenO FROM nota WHERE id_nota = ? AND estado_nota = 0 AND id_tenant = ?",
      [notaId, id_tenant]
    );

    if (notaResult.length === 0) {
      return res.status(404).json({ message: "Nota no encontrada o ya anulada." });
    }

    const { id_almacenO } = notaResult[0];

    // Obtener los detalles de los productos de la nota
    const [detalleResult] = await connection.query(
      "SELECT id_producto, cantidad, id_tonalidad, id_talla, id_detalle_nota, id_sku FROM detalle_nota WHERE id_nota = ? AND id_tenant = ?",
      [notaId, id_tenant]
    );

    for (let i = 0; i < detalleResult.length; i++) {
      const { id_producto, cantidad, id_tonalidad, id_talla, id_detalle_nota, id_sku: storedSku } = detalleResult[i];

      // Consultar stock específico
      let id_sku;
      if (storedSku) {
        id_sku = storedSku;
      } else {
        id_sku = await resolveSku(connection, id_producto, id_tonalidad, id_talla, id_tenant);
      }

      // Verificar stock antes de actualizar (aunque al anular, es entrada, no debería haber problema "insuficiente")
      // Pero igual leemos para la bitácora
      const [stockResult] = await connection.query(
        "SELECT stock FROM inventario_stock WHERE id_sku = ? AND id_almacen = ? AND id_tenant = ?",
        [id_sku, id_almacenO, id_tenant]
      );

      const stockAnterior = stockResult.length > 0 ? parseFloat(stockResult[0].stock) : 0;

      // Actualizar stock en el almacén de origen (Devolución/Anulación -> Sumar)
      await connection.query(
        "UPDATE inventario_stock SET stock = stock + ? WHERE id_sku = ? AND id_almacen = ? AND id_tenant = ?",
        [cantidad, id_sku, id_almacenO, id_tenant]
      );

      const detalleId = id_detalle_nota;

      // Obtener la fecha de la nota
      const [fechaResult] = await connection.query(
        "SELECT fecha FROM nota WHERE id_nota = ? AND id_tenant = ?",
        [notaId, id_tenant]
      );

      if (!fechaResult.length) {
        throw new Error(`Fecha no encontrada para la nota ID ${notaId}.`);
      }

      const fechaNota = fechaResult[0].fecha;

      // Insertar en bitácora
      await connection.query(
        "INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, entra, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [notaId, id_producto, id_almacenO, detalleId, cantidad, stockAnterior, stockAnterior + cantidad, fechaNota, id_tenant, id_tonalidad, id_talla]
      );
    }

    // Actualizar el estado de la nota a 1 (anulada)
    await connection.query(
      "UPDATE nota SET estado_nota = 1, u_modifica = ? WHERE id_nota = ? AND id_tenant = ?",
      [usuario, notaId, id_tenant]
    );

    await connection.commit();

    // Limpiar caché relacionado
    queryCache.clear();

    res.json({ code: 1, message: "Nota anulada correctamente" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en anularNota:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection && typeof connection.release === "function") {
      connection.release();
    }
  }
};

export const methods = {
  getSalidas,
  getAlmacen,
  getProductos,
  getNuevoDocumento,
  getDestinatario,
  insertNotaAndDetalle,
  anularNota
};