import { getConnection } from "../database/database.js";
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

    // Query para contar total de registros (optimizado sin SUM ni GROUP BY)
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
        ORDER BY n.fecha DESC, c.num_comprobante DESC
        LIMIT ? OFFSET ?
      )
      SELECT 
        np.*,
        ROUND(IFNULL(SUM(dn.total),0),2) AS total_nota
      FROM NotasPaginadas np
        LEFT JOIN detalle_nota dn ON np.id = dn.id_nota AND dn.id_tenant = ?
      GROUP BY np.id
      ORDER BY np.fecha DESC, np.documento DESC
    `;

    const queryParams = [...params, parseInt(limit), parseInt(offset), id_tenant];
    const [ingresosResult] = await connection.query(cabecerasQuery, queryParams);

    if (!ingresosResult.length) {
      return res.json({ code: 1, data: [] });
    }

    // Obtener todos los detalles en un solo query (evita N+1)
    const ids = ingresosResult.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
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
        dn.total
      FROM detalle_nota dn
        INNER JOIN producto p ON p.id_producto = dn.id_producto
        INNER JOIN marca m ON p.id_marca = m.id_marca
        INNER JOIN sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
      WHERE dn.id_nota IN (${placeholders}) AND dn.id_tenant = ?;
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
        precio: d.precio,
        total: d.total
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
          SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal, usa.usua AS usuario
          FROM almacen a 
          LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
          LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
          INNER JOIN vendedor ve ON ve.dni=s.dni
          INNER JOIN usuario usa ON usa.id_usuario=ve.id_usuario
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
      query = `
        SELECT 
          p.id_producto AS codigo, 
          p.descripcion AS descripcion, 
          m.nom_marca AS marca, 
          COALESCE(i.stock, 0) AS stock,
          p.cod_barras as cod_barras 
        FROM producto p 
        INNER JOIN marca m ON p.id_marca = m.id_marca 
        INNER JOIN inventario i ON p.id_producto = i.id_producto AND i.id_almacen = ?
        WHERE i.stock > 0 AND p.id_tenant = ?
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

      query += ' GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock LIMIT ?';
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
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?)`,
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
          id_tenant
        ]
      );
    } else {
      [notaResult] = await connection.query(
        `INSERT INTO nota 
        (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario, estado_espera, id_tenant) 
        VALUES (null, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?)`,
        [
          almacenD,
          destinatario,
          id_comprobante,
          glosa,
          fecha,
          nota,
          observacion,
          usuarioResult[0]?.id_usuario,
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

    // Preparar datos para batch insert de detalles
    const detalleValues = [];
    const detalleParams = [];

    // Asumimos que id_tonalidad y id_talla vienen en el body (o son null/undefined)
    const tonalidades = req.body.tonalidad || [];
    const tallas = req.body.talla || [];

    for (let i = 0; i < producto.length; i++) {
      const id_producto = producto[i];
      const cantidadProducto = cantidad[i];
      const precio = preciosMap.get(id_producto);
      const totalProducto = cantidadProducto * precio;
      const id_ton = tonalidades[i] || null;
      const id_tal = tallas[i] || null;

      detalleValues.push('(?, ?, ?, ?, ?, ?, ?, ?)');
      detalleParams.push(id_producto, id_nota, cantidadProducto, precio, totalProducto, id_tenant, id_ton, id_tal);
    }

    // Batch insert de detalles
    const [detalleResult] = await connection.query(
      `INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total, id_tenant, id_tonalidad, id_talla) VALUES ${detalleValues.join(', ')}`,
      detalleParams
    );

    // Obtener IDs de detalles insertados
    const firstDetalleId = detalleResult.insertId;

    // Procesar inventario y bitácora si hay almacén destino
    if (almacenD) {
      // Necesitamos verificar stock especifico por producto+variant
      // La query anterior agrupada por producto ya no es suficiente si hay variantes.
      // Haremos consultas especificas o un mapa compuesto.
      // Para optimizar, traemos todo el inventario de estos productos en este almacén 
      // y luego filtramos en memoria (o construimos claves compuestas).

      const [stocksResult] = await connection.query(
        `SELECT id_producto, id_tonalidad, id_talla, stock 
         FROM inventario 
         WHERE id_producto IN (${productosPlaceholders}) 
         AND id_almacen = ? 
         AND id_tenant = ?`,
        [...producto, almacenD, id_tenant]
      );

      // Usar clave compuesta para el mapa: "prodId-tonId-talId"
      const getVariantKey = (p, t, s) => `${p}-${t || 'null'}-${s || 'null'}`;
      const stocksMap = new Map();
      stocksResult.forEach(row => {
        stocksMap.set(getVariantKey(row.id_producto, row.id_tonalidad, row.id_talla), row.stock);
      });

      // Preparar batch operations
      const updateInventarioPromises = [];
      const insertInventarioValues = [];
      const insertInventarioParams = [];
      const bitacoraValues = [];
      const bitacoraParams = [];

      for (let i = 0; i < producto.length; i++) {
        const id_producto = producto[i];
        const cantidadProducto = cantidad[i];
        const id_detalle = firstDetalleId + i;
        const id_ton = tonalidades[i] || null;
        const id_tal = tallas[i] || null;
        const variantKey = getVariantKey(id_producto, id_ton, id_tal);

        const stockAnterior = stocksMap.get(variantKey) || 0;
        const totalStock = Number(cantidadProducto) + Number(stockAnterior); // Ensure numbers

        if (stocksMap.has(variantKey)) {
          // Actualizar stock existente
          // IMPORTANTE: Manejar id_tonalidad/id_talla NULL en SQL requiere "IS NULL" o COALESCE, 
          // pero aqui al pasar parametros, si es null, "id_tonalidad = ?" funcionará si el driver convierte a NULL 
          // pero la igualdad SQL "field = NULL" siempre es false. Necesitamos <=> (null-safe equality) o query dinamica.
          // MySQL stardard operator <=>

          updateInventarioPromises.push(
            connection.query(
              `UPDATE inventario SET stock = stock + ? 
               WHERE id_producto = ? 
               AND id_almacen = ? 
               AND (id_tonalidad <=> ?) 
               AND (id_talla <=> ?)
               AND id_tenant = ?`,
              [cantidadProducto, id_producto, almacenD, id_ton, id_tal, id_tenant]
            )
          );
        } else {
          // Insertar nuevo stock
          insertInventarioValues.push('(?, ?, ?, ?, ?, ?)');
          insertInventarioParams.push(id_producto, almacenD, cantidadProducto, id_tenant, id_ton, id_tal);
        }

        // Preparar bitácora
        bitacoraValues.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        bitacoraParams.push(id_nota, id_producto, almacenD, id_detalle, cantidadProducto, stockAnterior, totalStock, fecha, id_tenant, id_ton, id_tal);
      }

      // Ejecutar batch updates en paralelo
      if (updateInventarioPromises.length > 0) {
        await Promise.all(updateInventarioPromises);
      }

      // Batch insert de nuevos inventarios
      if (insertInventarioValues.length > 0) {
        await connection.query(
          `INSERT INTO inventario (id_producto, id_almacen, stock, id_tenant, id_tonalidad, id_talla) VALUES ${insertInventarioValues.join(', ')}`,
          insertInventarioParams
        );
      }

      // Batch insert de bitácora
      if (bitacoraValues.length > 0) {
        await connection.query(
          `INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, entra, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla) VALUES ${bitacoraValues.join(', ')}`,
          bitacoraParams
        );
      }
    }

    await connection.commit();

    // Limpiar caché relacionado
    queryCache.clear();

    // Registrar log de creación de nota de ingreso
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (usuarioResult[0]?.id_usuario && id_tenant) {
      await logInventario.notaIngreso(id_nota, usuarioResult[0].id_usuario, ip, id_tenant);
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
      "SELECT id_producto, cantidad FROM detalle_nota WHERE id_nota = ? AND id_tenant = ?",
      [notaId, id_tenant]
    );

    await Promise.all(
      detalleResult.map(async ({ id_producto, cantidad }) => {
        if (id_almacenD) {
          const [stockResult] = await connection.query(
            "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = ? AND id_tenant = ?",
            [id_producto, id_almacenD, id_tenant]
          );

          if (!stockResult.length || stockResult[0].stock < cantidad) {
            throw new Error(`Stock insuficiente para producto ID ${id_producto}.`);
          }

          const stockAnterior = stockResult[0].stock;
          await connection.query(
            "UPDATE inventario SET stock = stock - ? WHERE id_producto = ? AND id_almacen = ? AND id_tenant = ? AND stock >= ?",
            [cantidad, id_producto, id_almacenD, id_tenant, cantidad]
          );

          const [detalleIdResult] = await connection.query(
            "SELECT id_detalle_nota FROM detalle_nota WHERE id_nota = ? AND id_producto = ? AND id_tenant = ?",
            [notaId, id_producto, id_tenant]
          );

          if (!detalleIdResult.length) {
            throw new Error(`Detalle de venta no encontrado para producto ID ${id_producto}.`);
          }

          const detalleId = detalleIdResult[0].id_detalle_nota;

          const [fechaResult] = await connection.query(
            "SELECT fecha FROM nota WHERE id_nota = ? AND id_tenant = ?",
            [notaId, id_tenant]
          );

          if (!fechaResult.length) {
            throw new Error(`Fecha no encontrada para la nota ID ${notaId}.`);
          }

          const fechaNota = fechaResult[0].fecha;

          await connection.query(
            "INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, sale, stock_anterior, stock_actual, fecha, id_tenant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [notaId, id_producto, id_almacenD, detalleId, cantidad, stockAnterior, stockAnterior - cantidad, fechaNota, id_tenant]
          );
        }
      })
    );

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