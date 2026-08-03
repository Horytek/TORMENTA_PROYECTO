import { getConnection } from "../database/database.js";
import { aplicarIngresoAlCosto } from "../services/costos/costoRepository.js";
import { resolverOrigenDeLinea } from "../services/costos/origenCosto.js";
import { sumarStockSku, restarStockSku } from "../services/inventario/stockRepository.js";
import { resolveSku } from "../utils/skuHelper.js";
import { logInventario } from "../utils/logActions.js";

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

const getIngresos = async (req, res) => {
  // Parámetros con defaults y paginación
  const {
    page = 0,
    limit = 10,
    fecha_i = '2022-01-01',
    fecha_e = '2038-12-27',
    razon_social = '',
    almacen = '%',
    usuario = '',
    documento = '',
    estado = '%'
  } = req.query;

  const id_tenant = req.id_tenant;
  const offset = page * limit;

  let connection;
  try {
    connection = await getConnection();

    // Filtros dinámicos (evitar funciones sobre columnas para usar índices)
    const where = [
      'n.id_tiponota = 1',
      'n.id_tenant = ?',
      'c.num_comprobante LIKE ?',
      'n.fecha >= ?',
      'n.fecha <= ?',
      '(d.razon_social LIKE ? OR CONCAT(d.nombres," ",d.apellidos) LIKE ?)'
    ];
    const params = [
      id_tenant,
      `%${documento}%`,
      fecha_i,
      fecha_e,
      `%${razon_social}%`,
      `%${razon_social}%`
    ];

    if (almacen && almacen !== '%') {
      where.push('(n.id_almacenD = ? OR n.id_almacenO = ?)');
      params.push(almacen, almacen);
    }
    if (estado && estado !== '%') {
      where.push('n.estado_nota LIKE ?');
      params.push(`%${estado}%`);
    }
    if (usuario) {
      where.push('(u.usua LIKE ? OR u.usua IS NULL)');
      params.push(`%${usuario}%`);
    }

    const loteWhere = [
      'l.estado < 2',
      'l.id_tenant = ?',
      // Rango sobre la columna desnuda: `fecha_creacion` es TIMESTAMP y envolverla
      // en DATE() impedía usar cualquier índice. `< fecha_e + 1 día` cubre el mismo
      // conjunto que `DATE(fecha_creacion) <= fecha_e`.
      'l.fecha_creacion >= ?',
      'l.fecha_creacion < DATE_ADD(?, INTERVAL 1 DAY)',
      '(l.descripcion LIKE ? OR CONCAT("LOTE-", l.id_lote) LIKE ?)'
    ];
    const loteParams = [id_tenant, fecha_i, fecha_e, `%${razon_social}%`, `%${razon_social}%`];

    if (almacen && almacen !== '%') loteWhere.push('1=0');
    if (estado && estado !== '%') loteWhere.push('1=0');
    if (usuario) {
      loteWhere.push('(u.usua LIKE ? OR u.usua IS NULL)');
      loteParams.push(`%${usuario}%`);
    }

    // Query para contar total de registros (optimizado sin SUM ni GROUP BY)
    const countQuery = `
      SELECT SUM(t) as total FROM (
        SELECT COUNT(DISTINCT n.id_nota) as t
        FROM nota n
         LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
         LEFT JOIN comprobante c ON n.id_comprobante = c.id_comprobante
         LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen
         LEFT JOIN almacen ad ON n.id_almacenD = ad.id_almacen
         LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
        WHERE ${where.join(' AND ')}
        UNION ALL
        SELECT COUNT(DISTINCT l.id_lote) as t
        FROM lote_inventario l
         LEFT JOIN usuario u ON l.id_usuario_crea = u.id_usuario
        WHERE ${loteWhere.join(' AND ')}
      ) combined
    `;

    const countParams = [...params, ...loteParams];
    const [totalResult] = await connection.query(countQuery, countParams);
    const totalNotas = totalResult[0].total || 0;

    // Si no hay notas, retornar temprano
    if (totalNotas === 0) {
      return res.json({ code: 1, data: [], totalNotas: 0 });
    }

    // Query principal con paginación optimizada usando CTE
    const cabecerasQuery = `
      WITH NotasPaginadas AS (
        SELECT 
          n.id_nota AS id,
          DATE_FORMAT(n.fecha,'%Y-%m-%d') AS fecha,
          c.num_comprobante AS documento,
          ao.nom_almacen AS almacen_O,
          COALESCE(ad.nom_almacen,'Almacen externo') AS almacen_D,
          COALESCE(d.razon_social, CONCAT(d.nombres,' ',d.apellidos)) AS proveedor,
          n.glosa AS concepto,
          n.estado_nota AS estado,
          n.estado_espera AS estado_espera,
          COALESCE(u.usua,'') AS usuario,
          n.observacion,
          n.hora_creacion,
          n.fecha_anulacion,
          n.u_modifica,
          n.nom_nota
        FROM nota n
          LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
          LEFT JOIN comprobante c ON n.id_comprobante = c.id_comprobante
          LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen
          LEFT JOIN almacen ad ON n.id_almacenD = ad.id_almacen
          LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
        WHERE ${where.join(' AND ')}
        
        UNION ALL
        
        SELECT 
          l.id_lote * -1 AS id,
          DATE_FORMAT(l.fecha_creacion,'%Y-%m-%d') AS fecha,
          CONCAT('LOTE-', l.id_lote) AS documento,
          '--' AS almacen_O,
          '--' AS almacen_D,
          'LOTE PENDIENTE' AS proveedor,
          l.descripcion AS concepto,
          0 AS estado,
          1 AS estado_espera,
          COALESCE(u.usua,'') AS usuario,
          'Pendiente de verificación/aprobación' AS observacion,
          DATE_FORMAT(l.fecha_creacion,'%H:%i:%s') AS hora_creacion,
          NULL AS fecha_anulacion,
          NULL AS u_modifica,
          'Nota Lote' AS nom_nota
        FROM lote_inventario l
          LEFT JOIN usuario u ON l.id_usuario_crea = u.id_usuario
        WHERE ${loteWhere.join(' AND ')}
        
        ORDER BY fecha DESC, documento DESC
        LIMIT ? OFFSET ?
      )
      SELECT 
        np.*,
        (SELECT ROUND(IFNULL(SUM(dn.total),0),2) FROM detalle_nota dn WHERE dn.id_nota = np.id AND np.id > 0 AND dn.id_tenant = ?) AS total_nota
      FROM NotasPaginadas np
      ORDER BY np.fecha DESC, np.documento DESC
    `;

    const queryParams = [...params, ...loteParams, parseInt(limit), parseInt(offset), id_tenant];
    const [ingresosResult] = await connection.query(cabecerasQuery, queryParams);

    if (!ingresosResult.length) {
      return res.json({ code: 1, data: [] });
    }
    // Obtener todos los detalles en un solo query (evita N+1)
    const validIds = ingresosResult.filter(r => r.id > 0).map(r => r.id);
    const loteIds = ingresosResult.filter(r => r.id < 0).map(r => Math.abs(r.id));
    
    let detallesResult = [];
    if (validIds.length > 0) {
      const placeholders = validIds.map(() => '?').join(',');
      const detallesQuery = `
        SELECT 
          dn.id_nota,
          p.id_producto AS codigo,
          m.nom_marca AS marca,
          sc.nom_subcat AS categoria,
          p.descripcion,
          dn.cantidad,
          p.undm AS unidad,
          dn.precio,
          dn.total,
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
        WHERE dn.id_nota IN (${placeholders}) AND dn.id_tenant = ?;
      `;
      const [res] = await connection.query(detallesQuery, [...validIds, id_tenant]);
      detallesResult = res;
    }

    if (loteIds.length > 0) {
      const lotePlaceholders = loteIds.map(() => '?').join(',');
      const detallesLoteQuery = `
        SELECT 
          d.id_lote * -1 AS id_nota,
          p.id_producto AS codigo,
          m.nom_marca AS marca,
          sc.nom_subcat AS categoria,
          p.descripcion,
          d.cantidad,
          p.undm AS unidad,
          0 AS precio,
          0 AS total,
          t.nombre AS nombre_tonalidad,
          ta.nombre AS nombre_talla,
          sku.sku AS sku_label,
          sku.attributes_json AS attributes
        FROM detalle_lote_inventario d
          INNER JOIN producto p ON p.id_producto = d.id_producto
          INNER JOIN marca m ON p.id_marca = m.id_marca
          INNER JOIN sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
          LEFT JOIN tonalidad t ON d.id_tonalidad = t.id_tonalidad
          LEFT JOIN talla ta ON d.id_talla = ta.id_talla
          LEFT JOIN producto_sku sku ON d.id_sku = sku.id_sku
        WHERE d.id_lote IN (${lotePlaceholders}) AND d.id_tenant = ?
      `;
      const [loteRes] = await connection.query(detallesLoteQuery, [...loteIds, id_tenant]);
      detallesResult = detallesResult.concat(loteRes);
    }

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
        precio: d.precio,
        total: d.total,
        nombre_tonalidad: d.nombre_tonalidad || '-',
        nombre_talla: d.nombre_talla || '-',
        sku_label: d.sku_label,
        attributes: d.attributes
      });
    }

    const respuesta = ingresosResult.map(n => ({
      ...n,
      detalles: detallesMap[n.id] || []
    }));

    return res.json({ code: 1, data: respuesta, totalNotas });
  } catch (error) {
    console.error('Error en getIngresos:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getAlmacen = async (req, res) => {
  let connection;
  const id_tenant = req.id_tenant;

  // Usar caché
  const cacheKey = `almacenes_${id_tenant}`;
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

    let query = '';
    const queryParams = [];

    if (almacen && almacen !== '0') {
      // El stock sale de `inventario_stock` vía SKU. Contra `inventario`, que
      // está vacía desde la migración, este INNER JOIN + `stock > 0` dejaba el
      // buscador de productos sin resultados.
      query = `
        SELECT
          p.id_producto AS codigo,
          p.descripcion AS descripcion,
          m.nom_marca AS marca,
          SUM(COALESCE(s.stock, 0)) AS stock,
          p.cod_barras as cod_barras
        FROM producto p
        INNER JOIN marca m ON p.id_marca = m.id_marca
        INNER JOIN producto_sku ps ON ps.id_producto = p.id_producto AND ps.id_tenant = p.id_tenant
        INNER JOIN inventario_stock s ON s.id_sku = ps.id_sku AND s.id_tenant = ps.id_tenant AND s.id_almacen = ?
        WHERE s.stock > 0 AND p.id_tenant = ?
      `;
      queryParams.push(almacen, id_tenant);

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
    } else {
      query = `
        SELECT 
          p.id_producto AS codigo, 
          p.descripcion AS descripcion, 
          m.nom_marca AS marca,
          p.cod_barras AS cod_barras
        FROM producto p 
        INNER JOIN marca m ON p.id_marca = m.id_marca
        WHERE p.descripcion LIKE ? AND p.cod_barras LIKE ? AND p.id_tenant = ?
        LIMIT ?
      `;
      queryParams.push(`%${descripcion}%`, `%${cod_barras}%`, id_tenant, parseInt(limit));
    }

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

const getProductos_SinStock = async (req, res) => {
  let connection;
  const { descripcion = '', codbarras = '', limit = 50 } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    const [productosResult] = await connection.query(
      `
          SELECT 
              p.id_producto AS codigo, 
              p.descripcion AS descripcion, 
              m.nom_marca AS marca,
              p.cod_barras AS codbarras
          FROM 
              producto p 
          INNER JOIN 
              marca m ON p.id_marca = m.id_marca
          WHERE 
              p.descripcion LIKE ? AND
              p.cod_barras LIKE ? AND
              p.id_tenant = ?
          LIMIT ?
          `,
      [`%${descripcion}%`, `%${codbarras}%`, id_tenant, parseInt(limit)]
    );

    res.json({ code: 1, data: productosResult });
  } catch (error) {
    console.error('Error en getProductos_SinStock:', error);
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

    // Buscar el último comprobante de nota de ingreso (id_tipocomprobante = 6)
    const [ultimoComprobanteResult] = await connection.query(`
      SELECT num_comprobante 
      FROM comprobante 
      WHERE id_tipocomprobante = 6 AND id_tenant = ?
      ORDER BY num_comprobante DESC 
      LIMIT 1
    `, [id_tenant]);

    let nuevoNumComprobante;
    if (ultimoComprobanteResult.length > 0) {
      const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
      const partes = ultimoNumComprobante.split("-");
      const serie = partes[0].substring(1); // Quita la "I"
      const numero = parseInt(partes[1], 10) + 1;

      if (numero > 99999999) {
        const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
        nuevoNumComprobante = `I${nuevaSerie}-00000001`;
      } else {
        nuevoNumComprobante = `I${serie}-${numero.toString().padStart(8, "0")}`;
      }
    } else {
      nuevoNumComprobante = "I400-00000001";
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
  const cacheKey = `destinatarios_${id_tenant}`;
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

// Núcleo del ingreso (sin abrir/cerrar transacción ni responder HTTP): lo usa
// tanto `insertNotaAndDetalle` (ingreso solo) como `insertTransferencia` (ver
// transferenciaAlmacen.controller.js), que corre salida+ingreso en una sola
// transacción para que el modo "Conjunto" del frontend deje de ser dos
// llamadas HTTP independientes sin rollback compartido.
const crearIngresoCore = async (connection, {
  almacenO = null, almacenD, destinatario, glosa, nota, fecha, producto, numComprobante, cantidad, observacion, usuario,
  tonalidad, talla, estado_espera = 0, costos = [], origen_costo = null, sku, skus: skusInput, atributos: atributosInput, id_tenant, id_empresa,
}) => {
    const [usuarioResult] = await connection.query(
      "SELECT id_usuario FROM usuario WHERE usua = ? AND id_tenant = ?",
      [usuario, id_tenant]
    );

    // Insertar el nuevo comprobante
    const [comprobanteResult] = await connection.query(
      "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES (6, ?, ?)",
      [numComprobante, id_tenant]
    );

    const id_comprobante = comprobanteResult.insertId;

    let notaResult;

    if (almacenO) {
      [notaResult] = await connection.query(
        `INSERT INTO nota 
        (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario, estado_espera, id_tenant) 
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [
          almacenO,
          almacenD,
          destinatario,
          id_comprobante,
          glosa,
          fecha,
          nota,
          observacion,
          usuarioResult[0]?.id_usuario,
          estado_espera,
          id_tenant
        ]
      );
    } else {
      [notaResult] = await connection.query(
        `INSERT INTO nota 
        (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario, estado_espera, id_tenant) 
        VALUES (null, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [
          almacenD,
          destinatario,
          id_comprobante,
          glosa,
          fecha,
          nota,
          observacion,
          usuarioResult[0]?.id_usuario,
          estado_espera,
          id_tenant
        ]
      );
    }

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

    // Origen de la mercadería: la empresa fija el caso dominante y solo un
    // negocio MIXTO puede elegirlo por línea (ver services/costos/origenCosto.js).
    const [[empresaCfg]] = await connection.query(
      "SELECT origen_productos FROM empresa WHERE id_empresa = ? AND id_tenant = ? LIMIT 1",
      [id_empresa, id_tenant]
    );
    const origenLinea = resolverOrigenDeLinea(empresaCfg?.origen_productos, origen_costo);

    // Preparar datos para batch insert de detalles
    const detalleValues = [];
    const detalleParams = [];

    const tonalidades = tonalidad || [];
    const tallas = talla || [];
    const skus = skusInput || sku || []; // Support both new 'skus' and legacy 'sku'
    // New: Dynamic attributes support
    const atributos = atributosInput || [];

    for (let i = 0; i < producto.length; i++) {
      const id_producto = producto[i];
      const cantidadProducto = cantidad[i];
      const precio = preciosMap.get(id_producto);
      const totalProducto = cantidadProducto * precio;
      const id_ton = tonalidades[i] || null;
      const id_tal = tallas[i] || null;
      const id_sku_val = skus[i] || null; // Capture SKU

      // Stringify if object, or null
      // const attrJson = atributos[i] ? JSON.stringify(atributos[i]) : null;

      // Insert into detalle_nota. Assuming we added id_sku column in migration.
      // We need to verify if the column exists in the database. 
      // Based on previous user session, we are assuming it exists or was added.
      // Using "id_sku" as column name.

      // `precio` es el precio de VENTA del producto (así estaba y así se sigue
      // guardando); `costo_unitario` es lo que costó de verdad. Son distintos y
      // por eso no se reusa la columna existente.
      const costoLinea = Number(costos[i]);
      const costoValido = Number.isFinite(costoLinea) && costoLinea >= 0 ? costoLinea : null;

      detalleValues.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      detalleParams.push(
        id_producto, id_nota, cantidadProducto, precio, totalProducto, id_tenant,
        id_ton, id_tal, id_sku_val, costoValido, costoValido === null ? null : origenLinea
      );
    }

    // Batch insert de detalles
    const [detalleResult] = await connection.query(
      `INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total, id_tenant, id_tonalidad, id_talla, id_sku, costo_unitario, origen_costo) VALUES ${detalleValues.join(', ')}`,
      detalleParams
    );

    // Obtener IDs de detalles insertados
    const firstDetalleId = detalleResult.insertId;

    // Procesar inventario y bitácora si hay almacén destino
    if (almacenD) {
      for (let i = 0; i < producto.length; i++) {
        const id_producto = producto[i];
        const cantidadProducto = cantidad[i];
        // MySQL guarantees sequential IDs for batch inserts
        const id_detalle = firstDetalleId + i;
        const id_ton = tonalidades[i] || null;
        const id_tal = tallas[i] || null;

        // El SKU ya viene del formulario en el 100% de los casos actuales; el
        // fallback existe porque este ES un flujo de entrada, y crear la
        // variante al recibir mercadería es legítimo (a diferencia de vender,
        // donde crear un SKU sería vender algo que no existe).
        let id_sku_mov = skus[i] || null;
        if (!id_sku_mov) {
          id_sku_mov = await resolveSku(connection, id_producto, id_ton, id_tal, id_tenant);
        }

        // El costo se aplica ANTES de mover el stock: el promedio ponderado se
        // calcula contra las existencias PREVIAS. Invertir el orden contaría dos
        // veces la cantidad entrante y hundiría el costo (ver el docstring de
        // aplicarIngresoAlCosto).
        const costoLinea = Number(costos[i]);
        if (Number.isFinite(costoLinea) && costoLinea >= 0) {
          await aplicarIngresoAlCosto(connection, {
            id_tenant,
            id_sku: id_sku_mov,
            cantidad: cantidadProducto,
            costoUnitario: costoLinea,
          });
        }

        const movimiento = await sumarStockSku(connection, {
          id_tenant,
          id_sku: id_sku_mov,
          id_almacen: almacenD,
          cantidad: cantidadProducto,
        });

        // Bitácora — entrada de stock. `id_sku` es lo que permite que una
        // anulación devuelva las unidades exactamente a la variante de la que
        // entraron.
        await connection.query(
          `INSERT INTO bitacora_nota (id_nota, id_producto, id_sku, id_almacen, id_detalle_nota, entra, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_nota, id_producto, id_sku_mov, almacenD, id_detalle, cantidadProducto,
           movimiento.stockAnterior, movimiento.stockActual, fecha, id_tenant, id_ton, id_tal]
        );
      }
    }

    return { id_nota, id_usuario: usuarioResult[0]?.id_usuario };
};

const insertNotaAndDetalle = async (req, res) => {
  const {
    almacenO = null,
    almacenD,
    destinatario,
    glosa,
    nota,
    fecha,
    producto,
    numComprobante,
    cantidad,
    observacion,
    usuario,
    tonalidad,
    talla,
    estado_espera = 0,
    costos = [],          // costo unitario por línea; opcional
    origen_costo = null   // solo se respeta si la empresa es MIXTO
  } = req.body;
  const id_tenant = req.id_tenant;

  if (
    !almacenD ||
    !destinatario ||
    !glosa ||
    !nota ||
    !fecha ||
    !producto ||
    !numComprobante ||
    !cantidad ||
    !usuario
  ) {
    return res
      .status(400)
      .json({ message: "Bad Request. Please fill all fields correctly." });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const { id_nota, id_usuario } = await crearIngresoCore(connection, {
      almacenO, almacenD, destinatario, glosa, nota, fecha, producto, numComprobante, cantidad, observacion, usuario,
      tonalidad, talla, estado_espera, costos, origen_costo,
      sku: req.body.sku, skus: req.body.skus, atributos: req.body.atributos,
      id_tenant, id_empresa: req.id_empresa,
    });

    await connection.commit();

    // Limpiar caché relacionado
    queryCache.clear();

    // Registrar log de creación de nota de ingreso
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (id_usuario && id_tenant) {
      await logInventario.notaIngreso(id_nota, id_usuario, ip, id_tenant);
    }

    res.json({ code: 1, message: "Nota y detalle insertados correctamente" });
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

    // Obtener detalles de la nota
    const [notaResult] = await connection.query(
      "SELECT id_almacenO, id_almacenD, id_comprobante FROM nota WHERE id_nota = ? AND estado_nota = 0 AND id_tenant = ?",
      [notaId, id_tenant]
    );

    if (notaResult.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Nota no encontrada o ya anulada." });
    }

    const { id_almacenD } = notaResult[0];

    // Obtener productos de la nota
    const [detalleResult] = await connection.query(
      "SELECT id_producto, cantidad, id_tonalidad, id_talla, id_detalle_nota, id_sku FROM detalle_nota WHERE id_nota = ? AND id_tenant = ?",
      [notaId, id_tenant]
    );

    if (id_almacenD) {
      const [fechaResult] = await connection.query(
        "SELECT fecha FROM nota WHERE id_nota = ? AND id_tenant = ?",
        [notaId, id_tenant]
      );
      if (!fechaResult.length) {
        throw new Error(`Fecha no encontrada para la nota ID ${notaId}.`);
      }
      const fechaNota = fechaResult[0].fecha;

      // Se revierte leyendo la BITÁCORA, no el detalle: ahí quedó registrado a
      // qué SKU entró cada unidad, así que la anulación las quita de la misma
      // variante. Reconstruirlo desde `detalle_nota` daría el SKU declarado en
      // el formulario, que puede no ser el que finalmente se movió.
      const [entradas] = await connection.query(
        `SELECT id_producto, id_sku, id_detalle_nota, id_tonalidad, id_talla, SUM(entra) AS unidades
         FROM bitacora_nota
         WHERE id_nota = ? AND id_tenant = ? AND entra > 0
         GROUP BY id_producto, id_sku, id_detalle_nota, id_tonalidad, id_talla`,
        [notaId, id_tenant]
      );

      // Notas anteriores a la convergencia no tienen `id_sku` en la bitácora:
      // se cae al SKU declarado en el detalle, que en los datos actuales está
      // poblado en el 100% de las filas.
      const skuPorDetalle = new Map(
        detalleResult.map((d) => [d.id_detalle_nota, d.id_sku ?? null])
      );

      // Secuencial y no Promise.all: comparten una sola conexión dentro de una
      // transacción, y lanzarlas en paralelo intercala sentencias sobre el mismo
      // socket.
      for (const e of entradas) {
        const unidades = Number(e.unidades);
        if (!Number.isFinite(unidades) || unidades <= 0) continue;

        const id_sku_mov = e.id_sku ?? skuPorDetalle.get(e.id_detalle_nota) ?? null;
        if (!id_sku_mov) {
          throw new Error(
            `No se puede anular: el movimiento del producto ${e.id_producto} no tiene SKU asociado.`
          );
        }

        // `restarStockSku` falla si no alcanza, en vez de dejar stock negativo:
        // la mercadería de esta nota pudo haberse vendido ya.
        const movimiento = await restarStockSku(connection, {
          id_tenant,
          id_sku: id_sku_mov,
          id_almacen: id_almacenD,
          cantidad: unidades,
        });

        await connection.query(
          "INSERT INTO bitacora_nota (id_nota, id_producto, id_sku, id_almacen, id_detalle_nota, sale, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [notaId, e.id_producto, id_sku_mov, id_almacenD, e.id_detalle_nota, unidades,
           movimiento.stockAnterior, movimiento.stockActual, fechaNota, id_tenant, e.id_tonalidad, e.id_talla]
        );
      }
    }

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
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    console.error('Error en anularNota:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      if (typeof connection.release === "function") {
        connection.release();
      } else if (typeof connection.end === "function") {
        connection.end();
      }
    }
  }
};

export { crearIngresoCore };

export const methods = {
  getIngresos,
  getAlmacen,
  getProductos,
  getProductos_SinStock,
  getNuevoDocumento,
  getDestinatario,
  insertNotaAndDetalle,
  anularNota
};