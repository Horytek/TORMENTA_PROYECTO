import { getConnection } from "./../database/database.js";
import { getTesisConnection } from "./../database/database_tesis.js";
import { logVentas } from "../utils/logActions.js";

// Cache para datos que no cambian frecuentemente
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// --- INTERNAL HELPER FUNCTIONS ---

const annulVentaInternal = async (connection, id_venta, id_usuario, id_tenant, ip, comprobante, estadoSunat) => {
  // 1) Obtener detalles sin usar id_tenant en detalle_venta (usa JOIN con venta)
  const [detallesResult] = await connection.query(
    `
    SELECT dv.id_producto, dv.cantidad
    FROM detalle_venta dv
    INNER JOIN venta v ON v.id_venta = dv.id_venta
    WHERE dv.id_venta = ? AND v.id_tenant = ?
    `,
    [id_venta, id_tenant]
  );

  if (detallesResult.length === 0) {
    throw new Error("No hay detalles para la venta o no pertenece a este tenant");
  }

  // 2) Obtener sucursal y fecha
  const [ventaResult] = await connection.query(
    `
    SELECT id_sucursal, f_venta
    FROM venta
    WHERE id_venta = ? AND id_tenant = ?
    `,
    [id_venta, id_tenant]
  );
  if (ventaResult.length === 0) {
    throw new Error("Venta no encontrada");
  }
  const id_sucursal = ventaResult[0].id_sucursal;
  const f_venta = ventaResult[0].f_venta;

  // 3) Almacén de la sucursal
  const [almacenResult] = await connection.query(
    `SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal = ?`,
    [id_sucursal]
  );
  if (almacenResult.length === 0) {
    throw new Error("No se encontró almacén para la sucursal");
  }
  const id_almacen = almacenResult[0].id_almacen;

  // 4) Restaurar stock para cada detalle
  for (const detalle of detallesResult) {
    const { id_producto, cantidad } = detalle;

    // Stock actual del inventario del producto en el almacén de la venta
    const [[stockRow]] = await connection.query(
      `
      SELECT I.stock AS stockActual
      FROM inventario I
      WHERE I.id_producto = ? 
        AND I.id_almacen = ?
      `,
      [id_producto, id_almacen]
    );

    const stockActual = Number(stockRow?.stockActual ?? 0);

    await connection.query(
      `
      UPDATE inventario
      SET stock = ?
      WHERE id_producto = ?
        AND id_almacen = ?
      `,
      [stockActual + cantidad, id_producto, id_almacen]
    );

    // Bitácora de entrada
    await connection.query(
      `
      INSERT INTO bitacora_nota (id_producto, id_almacen, entra, stock_anterior, stock_actual, fecha, id_venta, id_tenant)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [id_producto, id_almacen, cantidad, stockActual, stockActual + cantidad, f_venta, id_venta, id_tenant]
    );
  }

  // 5) Anular venta
  await connection.query(
    `
    UPDATE venta
    SET estado_venta = ?, u_modifica = ?, fecha_anulacion = NOW()
    WHERE id_venta = ? AND id_tenant = ?
    `,
    [0, id_usuario, id_venta, id_tenant]
  );

  // Registrar log de anulación de venta
  const motivoAnulacion = `Anulación solicitada por usuario. Estado SUNAT: ${estadoSunat}, Comprobante: ${comprobante}`;
  await logVentas.anular(id_venta, id_usuario, ip, id_tenant, motivoAnulacion);
};

const createVentaInternal = async (connection, saleData, id_tenant, ip) => {
  const {
    id_sucursal, id_almacen, id_comprobante, id_cliente, estado_venta,
    f_venta, igv, detalles, fecha_iso, metodo_pago, fecha,
    nombre_cliente, documento_cliente, direccion_cliente, igv_b, total_t,
    comprobante_pago, totalImporte_venta, descuento_venta, vuelto, recibido,
    formadepago, detalles_b, observacion, estado_sunat, id_usuario
  } = saleData;

  // 1. Generar Correlativo
  const [comprobanteResult] = await connection.query(
    "SELECT id_tipocomprobante, nom_tipocomp FROM tipo_comprobante WHERE nom_tipocomp=?",
    [id_comprobante] // id_comprobante aquí es el NOMBRE del tipo (e.g. 'Boleta')
  );
  if (comprobanteResult.length === 0) throw new Error("Tipo de comprobante no encontrado.");
  const { id_tipocomprobante, nom_tipocomp } = comprobanteResult[0];
  const prefijoBase = nom_tipocomp.charAt(0);

  let nuevoNumComprobante;
  // Lógica simplificada de correlativo (asumiendo que siempre genera uno nuevo para intercambio/nueva venta)
  // Reutilizamos la lógica de "último comprobante"
  let ultimoComprobanteQuery = `
    SELECT num_comprobante 
    FROM comprobante c 
    INNER JOIN tipo_comprobante tp ON c.id_tipocomprobante=tp.id_tipocomprobante 
    INNER JOIN sucursal s ON s.id_sucursal = ?
    WHERE tp.nom_tipocomp = ? AND num_comprobante LIKE ?`;
  let ultimoComprobanteParams = [id_sucursal, id_comprobante, `${prefijoBase}${id_sucursal}%`];
  if (id_tenant) {
    ultimoComprobanteQuery += " AND s.id_tenant = ?";
    ultimoComprobanteParams.push(id_tenant);
  }
  ultimoComprobanteQuery += " ORDER BY num_comprobante DESC LIMIT 1";
  const [ultimoComprobanteResult] = await connection.query(ultimoComprobanteQuery, ultimoComprobanteParams);

  if (ultimoComprobanteResult.length > 0) {
    const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
    const partes = ultimoNumComprobante.split("-");
    const serie = partes[0].substring(1);
    const numero = parseInt(partes[1], 10) + 1;
    if (numero > 99999999) {
      const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
      nuevoNumComprobante = `${prefijoBase}${nuevaSerie}-00000001`;
    } else {
      nuevoNumComprobante = `${prefijoBase}${serie}-${numero.toString().padStart(8, "0")}`;
    }
  } else {
    nuevoNumComprobante = `${prefijoBase}${id_sucursal}00-00000001`;
  }

  // 2. Insertar Comprobante
  const [nuevoComprobanteResult] = await connection.query(
    "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES (?, ?, ?)",
    [id_tipocomprobante, nuevoNumComprobante, id_tenant]
  );
  const id_comprobante_final = nuevoComprobanteResult.insertId;

  // 3. Insertar Venta
  // id_anular / id_anular_b removed/ignored.
  const [ventaResult] = await connection.query(
    "INSERT INTO venta (id_comprobante, id_cliente, id_sucursal, estado_venta, f_venta, igv, fecha_iso, metodo_pago, observacion, estado_sunat, id_tenant, recibido, vuelto, descuento_global) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id_comprobante_final, id_cliente, id_sucursal, estado_venta, f_venta, igv, fecha_iso, metodo_pago, observacion, estado_sunat, id_tenant, recibido, vuelto, descuento_venta]
  );
  const id_venta = ventaResult.insertId;

  // 4. Insertar Detalles y Actualizar Stock
  const detalleVentaValues = [];
  const detalleVentaParams = [];
  const bitacoraValues = [];
  const bitacoraParams = [];

  for (const detalle of detalles) {
    const { id_producto, cantidad, precio, descuento, total } = detalle;

    // Verificar Stock
    const [inventarioResult] = await connection.query(
      "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = ?",
      [id_producto, id_almacen]
    );
    if (inventarioResult.length === 0) throw new Error(`No stock found for product ID ${id_producto}.`);
    const stockActual = Number(inventarioResult[0].stock);
    if (stockActual < cantidad) throw new Error(`Not enough stock for product ID ${id_producto}.`);

    const stockNuevo = stockActual - cantidad;

    // Update Stock
    await connection.query(
      "UPDATE inventario SET stock = ? WHERE id_producto = ? AND id_almacen = ?",
      [stockNuevo, id_producto, id_almacen]
    );

    detalleVentaValues.push('(?, ?, ?, ?, ?, ?)');
    detalleVentaParams.push(id_producto, id_venta, cantidad, precio, descuento, total);

    bitacoraValues.push('(?, ?, ?, ?, ?, ?, ?, ?)');
    bitacoraParams.push(id_producto, id_almacen, cantidad, stockActual, stockNuevo, fecha, id_venta, id_tenant);
  }

  if (detalleVentaValues.length > 0) {
    await connection.query(
      `INSERT INTO detalle_venta (id_producto, id_venta, cantidad, precio, descuento, total) VALUES ${detalleVentaValues.join(', ')}`,
      detalleVentaParams
    );
  }

  if (bitacoraValues.length > 0) {
    await connection.query(
      `INSERT INTO bitacora_nota (id_producto, id_almacen, sale, stock_anterior, stock_actual, fecha, id_venta, id_tenant) VALUES ${bitacoraValues.join(', ')}`,
      bitacoraParams
    );
  }

  // 5. (Removed) Insertar Venta Boucher & Update
  // 6. (Removed) Insertar Detalles Boucher

  // 7. Log
  if (id_usuario) {
    await logVentas.crear(id_venta, id_usuario, ip, id_tenant, parseFloat(total_t || 0));
  }

  return id_venta;
};


const getVentas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    // Paginación y tenant
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 100), 500);
    const offset = (page - 1) * limit;
    const id_tenant = req.id_tenant;

    let where = [];
    let params = [];

    if (id_tenant) {
      where.push("s.id_tenant = ?");
      params.push(id_tenant);
    }

    // Solo ventas activas (trae todas, los filtros se aplican en frontend)
    let whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Consulta principal con detalles agregados
    const ventasQuery = `
      SELECT
        v.id_venta AS id,
        SUBSTRING(com.num_comprobante, 2, 3) AS serieNum,
        SUBSTRING(com.num_comprobante, 6, 8) AS num,
        CASE WHEN tp.nom_tipocomp = 'Nota de venta' THEN 'Nota' ELSE tp.nom_tipocomp END AS tipoComprobante,
        CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_n,
        cl.razon_social AS cliente_r,
        cl.dni AS dni,
        cl.ruc AS ruc,
        DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha,
        v.igv AS igv,
        SUM(dv.total) AS total,
        CONCAT(ve.nombres, ' ', ve.apellidos) AS cajero,
        ve.dni AS cajeroId,
        v.estado_venta AS estado,
        s.nombre_sucursal,
        s.id_sucursal,
        s.ubicacion,
        cl.direccion,
        v.fecha_iso,
        v.metodo_pago,
        v.recibido,
        v.vuelto,
        v.descuento_global as descuento,
        v.estado_sunat,
        usu.usua,
        v.observacion,
        v.hora_creacion,
        v.fecha_anulacion,
        (SELECT usu.usua FROM usuario usu WHERE usu.id_usuario = v.u_modifica) AS u_modifica,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'codigo', dv.id_detalle,
            'nombre', pr.descripcion,
            'cantidad', dv.cantidad,
            'precio', dv.precio,
            'descuento', dv.descuento,
            'subtotal', dv.total,
            'undm', pr.undm,
            'marca', m.nom_marca
          )
        ) AS detalles
      FROM venta v
        INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
        INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
        INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
        INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
        INNER JOIN producto pr ON pr.id_producto = dv.id_producto
        INNER JOIN marca m ON m.id_marca = pr.id_marca
        INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
        INNER JOIN vendedor ve ON ve.dni = s.dni
        INNER JOIN usuario usu ON usu.id_usuario = ve.id_usuario
      ${whereClause}
      GROUP BY v.id_venta
      ORDER BY v.id_venta DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, limit, offset];
    const [ventasResult] = await connection.query(ventasQuery, finalParams);

    // Parsear detalles JSON
    const ventas = ventasResult.map(venta => ({
      ...venta,
      detalles: Array.isArray(venta.detalles)
        ? venta.detalles
        : JSON.parse(venta.detalles || "[]")
    }));

    res.json({ code: 1, data: ventas });
  } catch (error) {
    console.error('Error en getVentas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};


const generarComprobante = async (req, res) => {
  let connection;
  try {
    const { id_comprobante, usuario } = req.query;
    const id_tenant = req.id_tenant;

    connection = await getConnection();

    // Obtener id_sucursal basado en el usuario y el tenant
    let sucursalQuery = `
      SELECT su.id_sucursal 
      FROM sucursal su 
      INNER JOIN vendedor ve ON ve.dni = su.dni 
      INNER JOIN usuario u ON u.id_usuario = ve.id_usuario 
      WHERE u.usua =? `;
    let sucursalParams = [usuario];
    if (id_tenant) {
      sucursalQuery += " AND su.id_tenant = ?";
      sucursalParams.push(id_tenant);
    }
    const [sucursalResult] = await connection.query(sucursalQuery, sucursalParams);

    if (sucursalResult.length === 0) {
      throw new Error("Sucursal not found for the given user.");
    }

    const id_sucursal = sucursalResult[0].id_sucursal;

    // Obtener id_tipocomprobante y nom_tipocomp basado en el nombre del comprobante
    const [comprobanteResult] = await connection.query(
      "SELECT id_tipocomprobante, nom_tipocomp FROM tipo_comprobante WHERE nom_tipocomp=?",
      [id_comprobante]
    );

    if (comprobanteResult.length === 0) {
      throw new Error("Comprobante type not found.");
    }

    const { nom_tipocomp } = comprobanteResult[0];
    const prefijoBase = nom_tipocomp.charAt(0);

    // Obtener la última venta para verificar el estado (filtrando por tenant si existe)
    let ultimaVentaQuery = `
      SELECT num_comprobante, estado_venta, estado_sunat 
      FROM venta v 
      INNER JOIN comprobante c ON c.id_comprobante = v.id_comprobante 
      INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = c.id_tipocomprobante 
      INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
      WHERE tp.nom_tipocomp = ? AND v.id_sucursal = ? `;
    let ultimaVentaParams = [id_comprobante, id_sucursal];
    if (id_tenant) {
      ultimaVentaQuery += " AND s.id_tenant = ?";
      ultimaVentaParams.push(id_tenant);
    }
    ultimaVentaQuery += " ORDER BY v.id_venta DESC LIMIT 1";
    const [ultimaVentaResult] = await connection.query(ultimaVentaQuery, ultimaVentaParams);

    let nuevoNumComprobante;

    if (ultimaVentaResult.length > 0) {
      const ultimaVenta = ultimaVentaResult[0];
      if (ultimaVenta.estado_venta === 0 && ultimaVenta.estado_sunat != 1) {
        // Usar el mismo comprobante si el estado es 0
        nuevoNumComprobante = ultimaVenta.num_comprobante;
      } else {
        // Obtener el último número de comprobante y generar el siguiente (filtrando por tenant si existe)
        let ultimoComprobanteQuery = `
          SELECT num_comprobante 
          FROM comprobante c 
          INNER JOIN tipo_comprobante tp ON c.id_tipocomprobante = tp.id_tipocomprobante 
          INNER JOIN sucursal s ON s.id_sucursal = ?
      WHERE tp.nom_tipocomp = ? AND num_comprobante LIKE ? `;
        let ultimoComprobanteParams = [id_sucursal, id_comprobante, `${prefijoBase}${id_sucursal}%`];
        if (id_tenant) {
          ultimoComprobanteQuery += " AND s.id_tenant = ?";
          ultimoComprobanteParams.push(id_tenant);
        }
        ultimoComprobanteQuery += " ORDER BY num_comprobante DESC LIMIT 1";
        const [ultimoComprobanteResult] = await connection.query(ultimoComprobanteQuery, ultimoComprobanteParams);

        if (ultimoComprobanteResult.length > 0) {
          const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
          const partes = ultimoNumComprobante.split("-");
          const serie = partes[0].substring(1);
          const numero = parseInt(partes[1], 10) + 1;

          if (numero > 99999999) {
            const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
            nuevoNumComprobante = `${prefijoBase}${nuevaSerie}-00000001`;
          } else {
            nuevoNumComprobante = `${prefijoBase}${serie}-${numero.toString().padStart(8, "0")}`;
          }
        } else {
          nuevoNumComprobante = `${prefijoBase}${id_sucursal}00-00000001`;
        }
      }
    } else {
      nuevoNumComprobante = `${prefijoBase}${id_sucursal}00-00000001`;
    }

    res.json({ nuevoNumComprobante });
  } catch (error) {
    console.error('Error en generarComprobante:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getProductosVentas = async (req, res) => {
  let connection;
  try {
    const { id_sucursal } = req.query;
    const id_tenant = req.id_tenant;
    connection = await getConnection();

    let userCondition = 'AND us.usua=?';
    let queryParams = [req.query.usua || req.user?.username || '', id_tenant]; // Default params

    if (id_sucursal) {
      userCondition = 'AND su.id_sucursal=?';
      queryParams = [id_sucursal, id_tenant];
    } else {
      // Si no hay id_sucursal, usamos el usuario de la request (token)
      // Nota: req.user.username debe estar disponible desde el middleware auth
      // Si el frontend manda 'id_sucursal' como nombre de usuario (como estaba antes), 
      // mantenemos la compatibilidad revisando si es numérico o string, 
      // pero la lógica anterior asignaba req.query.id_sucursal a us.usua.
      // Para ser más robustos:
      const param = id_sucursal || req.user?.username;
      // Pero el frontend actual manda { id_sucursal: nombre } en el caso legacy.
      // Vamos a asumir que si recibimos un id_sucursal numérico es ID, si no, es usuario?
      // Mejor: El frontend mandará explícitamente id_sucursal cuando sea ID.
      // Si el frontend manda el nombre en el campo id_sucursal (como hacía antes), lo manejamos.

      // Lógica anterior: AND us.usua=? con [id_sucursal]
      // Nueva lógica: Si id_sucursal es un número, usamos su.id_sucursal. Si es string, us.usua.

      if (!isNaN(id_sucursal)) {
        userCondition = 'AND su.id_sucursal=?';
        queryParams = [id_sucursal, id_tenant];
      } else {
        userCondition = 'AND us.usua=?';
        queryParams = [id_sucursal, id_tenant];
      }
    }

    const [result] = await connection.query(
      `
      SELECT PR.id_producto AS codigo, PR.descripcion AS nombre,
      CAST(PR.precio AS DECIMAL(10, 2)) AS precio, inv.stock as stock, PR.undm, MA.nom_marca, CA.nom_subcat AS categoria_p, PR.cod_barras as codigo_barras
      FROM producto PR
        INNER JOIN marca MA ON MA.id_marca = PR.id_marca
        INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
        INNER JOIN inventario inv ON inv.id_producto = PR.id_producto
        INNER JOIN almacen al ON al.id_almacen = inv.id_almacen 
        INNER JOIN sucursal_almacen sa ON sa.id_almacen = al.id_almacen
        INNER JOIN sucursal su ON su.id_sucursal = sa.id_sucursal
        INNER JOIN vendedor ven ON ven.dni = su.dni
        INNER JOIN usuario us ON us.id_usuario = ven.id_usuario
      WHERE PR.estado_producto = 1 
        AND inv.stock > 0 
        ${userCondition}
        AND PR.id_tenant = ?
      `,
      queryParams
    );
    res.json({ code: 1, data: result, message: "Productos listados" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getEstado = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { id_venta } = req.body;
    const id_tenant = req.id_tenant;

    await connection.beginTransaction();

    // Actualizar estado solo si coincide el id_tenant
    await connection.query(
      "UPDATE venta SET estado_venta=1, estado_sunat=1 WHERE id_venta=? AND id_tenant=?",
      [id_venta, id_tenant]
    );

    await connection.commit();
    res.json({ message: "Ventas actualizada correctamente" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getComprobante = async (req, res) => {
  const id_tenant = req.id_tenant;
  const cacheKey = `comprobantes_${id_tenant} `;

  // Verificar caché
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ code: 1, data: cached.data, message: "Comprobantes listados (caché)" });
    }
    queryCache.delete(cacheKey);
  }

  let connection;
  try {
    connection = await getConnection();
    let query = `
      SELECT id_tipocomprobante AS id,
      CASE WHEN nom_tipocomp = 'Nota de venta' THEN 'Nota' ELSE nom_tipocomp END as nombre 
      FROM tipo_comprobante 
      WHERE nom_tipocomp NOT LIKE 'Guia de remision' 
        AND nom_tipocomp NOT LIKE 'Nota de credito' 
        AND nom_tipocomp NOT LIKE 'Nota de ingreso' 
        AND nom_tipocomp NOT LIKE 'Nota de Salida'
    `;
    let params = [];
    if (id_tenant) {
      query += " AND id_tenant = ?";
      params.push(id_tenant);
    }
    query += " ORDER BY nom_tipocomp";

    const [result] = await connection.query(query, params);

    // Guardar en caché
    queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({ code: 1, data: result, message: "Comprobantes listados" });
  } catch (error) {
    console.error('Error en getComprobante:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getLastVenta = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    let query = `SELECT id_venta + 1 as id FROM venta`;
    let params = [];
    if (id_tenant) {
      query += ` WHERE id_tenant = ? `;
      params.push(id_tenant);
    }
    query += ` ORDER BY id_venta DESC LIMIT 1`;
    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Comprobante listados" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getSucursal = async (req, res) => {
  const id_tenant = req.id_tenant;
  const cacheKey = `sucursales_ventas_${id_tenant} `;

  // Verificar caché
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ code: 1, data: cached.data, message: "Sucursales listadas (caché)" });
    }
    queryCache.delete(cacheKey);
  }

  let connection;
  try {
    connection = await getConnection();
    let query = `
      SELECT su.id_sucursal AS id, su.nombre_sucursal AS nombre, su.ubicacion AS ubicacion, usu.usua As usuario, ro.nom_rol AS rol
      FROM sucursal su
      INNER JOIN vendedor ven ON ven.dni = su.dni
      INNER JOIN usuario usu ON usu.id_usuario = ven.id_usuario
      INNER JOIN rol ro ON ro.id_rol = usu.id_rol
      WHERE su.estado_sucursal != 0
        AND su.id_sucursal = (
      SELECT MIN(s2.id_sucursal)
          FROM sucursal s2
          WHERE s2.nombre_sucursal = su.nombre_sucursal
        )
`;
    let params = [];
    if (id_tenant) {
      query += ` AND su.id_tenant = ? `;
      params.push(id_tenant);
    }
    query += " ORDER BY su.nombre_sucursal";

    const [result] = await connection.query(query, params);

    // Guardar en caché
    queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({ code: 1, data: result, message: "Sucursales listadas" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getClienteVentas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    let query = `
      SELECT 
        id_cliente AS id,
  COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS cliente_t,
    COALESCE(NULLIF(dni, ''), ruc) AS documento_t,
      direccion AS direccion_t
FROM
cliente
WHERE
  (
    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
OR
  (razon_social IS NOT NULL AND razon_social <> '')
        )
`;
    let params = [];
    if (id_tenant) {
      query += ` AND id_tenant = ? `;
      params.push(id_tenant);
    }
    query += `
      ORDER BY
  (CASE 
            WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
            ELSE 1 
         END),
  cliente_t
    `;
    const [result] = await connection.query(query, params);

    // Guardar en caché
    queryCache.set(`clientes_ventas_${id_tenant} `, {
      data: result,
      timestamp: Date.now()
    });

    res.json({ code: 1, data: result, message: "Clientes listados" });
  } catch (error) {
    console.error('Error en getClienteVentas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const addVenta = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const body = req.body;
    const id_tenant = req.id_tenant;
    const { usuario, id_comprobante, id_cliente, detalles } = body;

    if (!usuario || !id_comprobante || !id_cliente || !detalles || detalles.length === 0) {
      return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    await connection.beginTransaction();

    // Obtener datos de sucursal y cliente para preparar saleData
    // Sucursal
    let sucursalQuery = "SELECT id_sucursal, u.id_usuario FROM sucursal su INNER JOIN vendedor ve ON ve.dni=su.dni INNER JOIN usuario u ON u.id_usuario=ve.id_usuario WHERE u.usua=?";
    let sucursalParams = [usuario];
    if (id_tenant) {
      sucursalQuery += " AND su.id_tenant = ?";
      sucursalParams.push(id_tenant);
    }
    const [sucursalResult] = await connection.query(sucursalQuery, sucursalParams);
    if (sucursalResult.length === 0) throw new Error("Sucursal not found.");
    const { id_sucursal, id_usuario } = sucursalResult[0];

    // Almacen
    const [almacenResult] = await connection.query("SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal =?", [id_sucursal]);
    const id_almacen = almacenResult[0].id_almacen;

    // Cliente
    // Cliente
    let clienteQuery = `SELECT id_cliente FROM cliente WHERE(id_cliente = ? OR CONCAT(nombres, ' ', apellidos) = ? OR razon_social = ?)`;
    let clienteParams = [id_cliente, id_cliente, id_cliente];
    if (id_tenant) {
      clienteQuery += " AND id_tenant = ?";
      clienteParams.push(id_tenant);
    }
    const [clienteResult] = await connection.query(clienteQuery, clienteParams);
    if (clienteResult.length === 0) throw new Error("Cliente not found.");
    const id_cliente_final = clienteResult[0].id_cliente;

    const ip = req.ip || req.connection.remoteAddress;

    // Preparar saleData
    const saleData = {
      ...body,
      id_sucursal,
      id_almacen,
      id_cliente: id_cliente_final,
      id_usuario // Para el log
    };

    const id_venta = await createVentaInternal(connection, saleData, id_tenant, ip);

    await connection.commit();
    queryCache.clear();
    res.json({ code: 1, message: "Venta añadida", id_venta });

  } catch (error) {
    console.error('Error en addVenta:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ code: 0, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const addCliente = async (req, res) => {
  let connection;

  try {
    connection = await getConnection();
    const { dniOrRuc, tipo_cliente, nombreCompleto, direccion } = req.body;
    const id_tenant = req.id_tenant;

    if (
      !dniOrRuc ||
      !tipo_cliente ||
      !nombreCompleto ||
      (tipo_cliente === "Jurídico" && !direccion)
    ) {
      return res
        .status(400)
        .json({ message: "Bad Request. Please fill all fields correctly." });
    }

    let nombres = "";
    let apellidos = "";
    let razon_social = "";

    if (tipo_cliente === "Natural") {
      // Separar nombre completo en nombres y apellidos
      const partesNombre = nombreCompleto.split(" ");
      if (partesNombre.length > 1) {
        nombres = partesNombre.slice(0, -2).join(" ");
        apellidos = partesNombre.slice(-2).join(" ");
      } else {
        nombres = nombreCompleto;
      }

      // Insertar cliente natural con id_tenant
      await connection.query(
        "INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente, id_tenant) VALUES (?, '', ?, ?, '', '', 0, ?)",
        [dniOrRuc, nombres, apellidos, id_tenant]
      );
    } else {
      razon_social = nombreCompleto;
      // Insertar cliente jurídico con id_tenant
      await connection.query(
        "INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente, id_tenant) VALUES ('', ?, '', '', ?, ?, 0, ?)",
        [dniOrRuc, razon_social, direccion, id_tenant]
      );
    }

    res.json({ message: "Cliente añadido correctamente" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


const updateVenta = async (req, res) => {
  let connection;

  try {
    connection = await getConnection();
    let { id_venta, comprobante, estado_sunat, usua } = req.body;
    const id_tenant = req.id_tenant;

    if (!id_venta) {
      return res.status(400).json({ message: "id_venta requerido" });
    }

    // Normalizar
    comprobante = String(comprobante || "").trim();
    const estadoSunat = Number(estado_sunat) || 0;

    await connection.beginTransaction();

    // Obtener id_usuario si se pasó el nombre de usuario (usua)
    let id_usuario = null;
    if (usua) {
      const [userResult] = await connection.query("SELECT id_usuario FROM usuario WHERE usua = ?", [usua]);
      if (userResult.length > 0) {
        id_usuario = userResult[0].id_usuario;
      }
    }

    // Usar annulVentaInternal para la lógica de anulación
    // Si el frontend manda estado_venta = 0, es anulación.
    const { estado_venta, skip_stock } = req.body;

    // Si es anulación (0) y NO se indica que se omita el stock
    if ((estado_venta === 0 || estado_venta === '0') && !skip_stock) {
      const ip = req.ip || req.connection.remoteAddress;
      // Necesitamos id_usuario para el log y u_modifica. Si no vino usua, intentar sacarlo de la sesión o error?
      // Por ahora usaremos id_usuario si existe, sino null (aunque annulVentaInternal lo usa).
      if (!id_usuario) {
        // Fallback: intentar obtenerlo del token si está disponible en req.user
        if (req.user && req.user.id) id_usuario = req.user.id;
      }
      await annulVentaInternal(connection, id_venta, id_usuario, id_tenant, ip, comprobante, estadoSunat);
    } else {
      // Actualización estándar (no anulación o anulación sin stock check)
      // Fix: estado_venta || 1 falla si es 0. Usar operador ternario.
      const nuevoEstado = (estado_venta !== undefined && estado_venta !== null) ? estado_venta : 1;

      await connection.query(
        `UPDATE venta SET estado_venta = ?, estado_sunat = ?, u_modifica = ? WHERE id_venta = ? AND id_tenant = ? `,
        [nuevoEstado, estadoSunat, id_usuario, id_venta, id_tenant]
      );
    }

    await connection.commit();

    // Limpiar caché después de anular venta
    queryCache.clear();

    res.json({ code: 1, message: "Venta estado actualizado y stock restaurado." });
  } catch (error) {
    console.error('Error en updateVenta:', error);
    if (connection) {
      try { await connection.rollback(); } catch { }
    }
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getVentaById = async (req, res) => {
  let connection;

  const { id_venta, id_venta_boucher } = req.query;
  const idTarget = id_venta || id_venta_boucher; // Support both for transition
  const id_tenant = req.id_tenant;

  if (!idTarget) {
    return res.status(400).json({ message: "ID de venta no proporcionado" });
  }

  try {
    connection = await getConnection();
    // Consulta para obtener los datos de la venta (filtrando por id_tenant)
    // Mapeamos a la estructura que espera el frontend (similar a venta_boucher antigua)
    const [venta] = await connection.query(
      `SELECT 
          v.id_venta as id_venta_boucher, -- Mantener alias para compatibilidad frontend
          v.id_venta,
          v.fecha_iso as fecha,
          CONCAT(cl.nombres, ' ', cl.apellidos) as nombre_cliente,
          COALESCE(NULLIF(cl.dni, ''), cl.ruc) as documento_cliente,
          cl.direccion as direccion_cliente,
          v.igv,
          -- v.total_t as total_t, -- REMOVED: Column does not exist
          CASE WHEN tp.nom_tipocomp = 'Nota de venta' THEN 'Recibo' ELSE tp.nom_tipocomp END as comprobante_pago,
          -- v.total_t as totalImporte_venta, -- REMOVED
          v.descuento_global as descuento_venta,
          v.vuelto,
          v.recibido,
          v.metodo_pago as formadepago,
          com.num_comprobante,
          v.estado_venta AS estado_venta
       FROM venta v 
       INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
       INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
       LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente
       WHERE v.id_venta = ? AND v.id_tenant = ? `,
      [idTarget, id_tenant]
    );

    if (venta.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Consulta para obtener los detalles de la venta
    const [detalles] = await connection.query(
      `SELECT 
        dv.id_detalle,
        dv.id_producto,
        p.descripcion as nombre,
        dv.cantidad,
        dv.precio,
        dv.descuento,
        dv.total as sub_total
       FROM detalle_venta dv
       INNER JOIN producto p ON p.id_producto = dv.id_producto
       WHERE dv.id_venta = ?`,
      [idTarget]
    );

    // Convertir los valores de los detalles a números
    const detallesProcesados = detalles.map(detalle => ({
      ...detalle,
      id_producto: parseInt(detalle.id_producto, 10),
      precio: parseFloat(detalle.precio),
      descuento: parseFloat(detalle.descuento),
      sub_total: parseFloat(detalle.sub_total),
    }));

    // Calcular total basado en detalles
    const calculatedTotal = detallesProcesados.reduce((acc, item) => acc + item.sub_total, 0);

    // Convertir los valores de la venta a números
    const convertVentaToNumbers = (venta) => {
      return {
        ...venta,
        fecha: new Date(venta.fecha).toISOString().slice(0, 10),
        igv: parseFloat(venta.igv || 0),
        total_t: calculatedTotal, // Inserted calculated total
        totalImporte_venta: calculatedTotal, // Inserted calculated total
        descuento_venta: parseFloat(venta.descuento_venta || 0),
        vuelto: parseFloat(venta.vuelto || 0),
        recibido: parseFloat(venta.recibido || 0),
      };
    };

    // Construir el objeto de respuesta
    const datosVentaComprobante = {
      ...convertVentaToNumbers(venta[0]), // Los datos principales de la venta
      detalles: detallesProcesados, // Los detalles de la venta
    };

    res.json({ code: 1, data: datosVentaComprobante, message: "Datos comprobante listados" });
  } catch (error) {
    console.error('Error en getVentaById:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



const exchangeProducto = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { id_venta, id_detalle, id_producto_nuevo, cantidad, id_sucursal, usuario } = req.body;
    const id_tenant = req.id_tenant;
    const ip = req.ip || req.connection.remoteAddress;

    if (!id_venta || !id_detalle || !id_producto_nuevo || !cantidad || !usuario) {
      return res.status(400).json({ code: 0, message: "Faltan datos requeridos" });
    }

    await connection.beginTransaction();

    // 1. Obtener datos de la venta original incluyendo num_comprobante
    const [ventaOriginal] = await connection.query(
      "SELECT v.*, tc.nom_tipocomp, c.num_comprobante FROM venta v INNER JOIN comprobante c ON v.id_comprobante = c.id_comprobante INNER JOIN tipo_comprobante tc ON c.id_tipocomprobante = tc.id_tipocomprobante WHERE v.id_venta = ? AND v.id_tenant = ?",
      [id_venta, id_tenant]
    );
    if (ventaOriginal.length === 0) throw new Error("Venta original no encontrada");
    const oldSale = ventaOriginal[0];

    // 2. Obtener usuario (quien realiza el cambio)
    const [userResult] = await connection.query("SELECT id_usuario FROM usuario WHERE usua = ?", [usuario]);
    if (userResult.length === 0) throw new Error("Usuario no encontrado");
    const id_usuario = userResult[0].id_usuario;

    // 3. Anular la venta original (usando helper)
    await annulVentaInternal(connection, id_venta, id_usuario, id_tenant, ip, oldSale.nom_tipocomp, oldSale.estado_sunat);

    // 4. Preparar datos para la nueva venta
    // Necesitamos los detalles originales, reemplazar el producto cambiado, y recalcular totales.
    const [detallesOriginales] = await connection.query(
      "SELECT * FROM detalle_venta WHERE id_venta = ?",
      [id_venta]
    );

    // Obtener info del nuevo producto
    const [nuevoProd] = await connection.query(
      "SELECT * FROM producto WHERE id_producto = ? AND id_tenant = ?",
      [id_producto_nuevo, id_tenant]
    );
    if (nuevoProd.length === 0) throw new Error("Nuevo producto no encontrado");
    const newProductData = nuevoProd[0];
    const precioNuevo = Number(newProductData.precio);

    let nuevosDetalles = [];
    let totalNuevo = 0;
    let igvNuevo = 0;
    let diferenciaTexto = "";

    // Convertir id_detalle a número para comparación segura
    const targetIdDetalle = Number(id_detalle);

    for (const det of detallesOriginales) {
      // Usar comparación flexible O estricta con casting. id_detalle es PK de detalle_venta.
      if (det.id_detalle === targetIdDetalle) {
        // Este es el item a cambiar
        const subtotalNuevo = precioNuevo * cantidad;
        nuevosDetalles.push({
          id_producto: id_producto_nuevo,
          cantidad: cantidad,
          precio: precioNuevo,
          descuento: 0,
          total: subtotalNuevo
        });
        totalNuevo += subtotalNuevo;

        // Info para observación
        diferenciaTexto = `Cambio: Prod ID ${det.id_producto} -> ID ${id_producto_nuevo}.`;
      } else {
        // Mantener item original
        nuevosDetalles.push({
          id_producto: det.id_producto,
          cantidad: det.cantidad,
          precio: det.precio,
          descuento: det.descuento,
          total: det.total
        });
        totalNuevo += Number(det.total);
      }
    }

    // Recalcular IGV
    igvNuevo = totalNuevo - (totalNuevo / 1.18);

    // Datos de la nueva venta
    const newSaleData = {
      id_sucursal: oldSale.id_sucursal,
      id_almacen: (await connection.query("SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal=?", [oldSale.id_sucursal]))[0][0].id_almacen,
      id_comprobante: oldSale.nom_tipocomp,
      id_cliente: oldSale.id_cliente,
      estado_venta: 1, // Aceptada
      f_venta: new Date().toISOString().split('T')[0],
      igv: igvNuevo,
      detalles: nuevosDetalles,
      fecha_iso: new Date().toISOString(),
      metodo_pago: oldSale.metodo_pago,
      fecha: new Date().toISOString().split('T')[0],
      // Datos cliente para boucher
      nombre_cliente: (await connection.query("SELECT COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) as n FROM cliente WHERE id_cliente=?", [oldSale.id_cliente]))[0][0].n,
      documento_cliente: (await connection.query("SELECT COALESCE(NULLIF(dni, ''), ruc) as d FROM cliente WHERE id_cliente=?", [oldSale.id_cliente]))[0][0].d,
      direccion_cliente: (await connection.query("SELECT direccion FROM cliente WHERE id_cliente=?", [oldSale.id_cliente]))[0][0].direccion,
      igv_b: igvNuevo,
      total_t: totalNuevo,
      comprobante_pago: "Recibo",
      totalImporte_venta: totalNuevo,
      descuento_venta: 0,
      vuelto: 0,
      recibido: totalNuevo,
      formadepago: oldSale.metodo_pago,
      detalles_b: [],
      observacion: `Intercambio realizado.Venta anterior: ${oldSale.num_comprobante}. ${diferenciaTexto} `,
      estado_sunat: 0,
      id_usuario: id_usuario
    };

    const newVentaId = await createVentaInternal(connection, newSaleData, id_tenant, ip);

    // Preparar datos para SUNAT (Si es Boleta o Factura)
    let sunatData = null;
    if (newSaleData.id_comprobante === 'Boleta' || newSaleData.id_comprobante === 'Factura') {
      // Necesitamos recuperar el número de comprobante generado
      const [ventaGenerada] = await connection.query("SELECT v.id_venta, c.num_comprobante FROM venta v INNER JOIN comprobante c ON v.id_comprobante=c.id_comprobante WHERE v.id_venta=?", [newVentaId]);
      const numComp = ventaGenerada[0].num_comprobante.split('-');

      sunatData = {
        detalles: nuevosDetalles.map(d => {
          // Necesitamos nombre y undm. Los tenemos en data? No en nuevosDetalles.
          // Hay que sacarlos de `detallesOriginales` o `newProductData`.
          let prodInfo;
          if (d.id_producto === id_producto_nuevo) {
            prodInfo = newProductData; // Del query anterior
          } else {
            // Buscar en detallesOriginales (pero ojo, detallesOriginales es detalle_venta row, no tiene descripción/undm si no hicimos join antes)
            // ERROR POTENCIAL: detallesOriginales query original era 'SELECT * FROM detalle_venta'. No tiene nombre/undm.
            // Solución: Necesitamos hacer un query extra o mejorar el previo.
            // Vamos a hacer map rápido abajo con queries o mejoramos el query original de detalles.
            return d; // Placeholder, see fix below
          }
          // ...
          // Re-pensando: Mejor hacer un query final de la nueva venta con todos los joins para armar el objeto limpio.
          return d;
        }),
        // ...
      };

      // MEJOR APROXIMACIÓN:
      // Reutilizar getVentaById lógica o similar para devolver la estructura completa que espera el frontend.
      // El frontend espera: detalles (con nombre, undm, precio...), tipoComprobante, num, serieNum, ruc, cliente, fecha_iso...

      // Vamos a construirlo manualmente con los datos que ya tenemos + queries auxiliares.
      // 1. Obtener detalles completos de la NUEVA venta (con joins a producto)
      const [detallesFull] = await connection.query(`
            SELECT dv.*, p.descripcion as nombre, p.undm 
            FROM detalle_venta dv 
            INNER JOIN producto p ON dv.id_producto = p.id_producto 
            WHERE dv.id_venta = ? `,
        [newVentaId]
      );

      sunatData = {
        detalles: detallesFull.map(d => ({
          codigo: d.id_producto,
          cantidad: d.cantidad,
          precio: Number(d.precio),
          descuento: Number(d.descuento),
          subtotal: d.total, // OJO: el frontend a veces usa total o subtotal
          nombre: d.nombre,
          undm: d.undm
        })),
        tipoComprobante: newSaleData.id_comprobante,
        num: numComp[1],
        serieNum: numComp[0], // B001
        ruc: newSaleData.documento_cliente,
        cliente: newSaleData.nombre_cliente,
        fecha_iso: newSaleData.fecha_iso
      };
    }

    await connection.commit();
    res.json({ code: 1, message: "Intercambio realizado con éxito", data: { id_venta_nueva: newVentaId, sunatData } });

  } catch (error) {
    console.error("Error en exchangeProducto:", error);
    if (connection) await connection.rollback();
    res.status(500).json({ code: 0, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};



// ========== VENTAS ONLINE (tesis_db) ==========
const getVentasOnline = async (req, res) => {
  let connection;
  try {
    connection = await getTesisConnection();
    const id_tenant = req.id_tenant;

    // Paginación
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 100), 500);
    const offset = (page - 1) * limit;

    // Query principal sin cross-database JOIN para evitar problemas
    const comprasQuery = `
      SELECT
        c.id_compra AS id,
        c.fecha_compra AS fechaEmision,
        c.fecha_verificacion AS fechaVerificacion,
        c.total,
        c.medio_pago AS metodo_pago,
        CASE c.estado_compra 
          WHEN 1 THEN 'Aceptada' 
          WHEN 0 THEN 'Anulada'
          ELSE 'En proceso' 
        END AS estado,
        c.observaciones AS observacion,
        c.id_transaccion AS transaccion,
        c.estado_verificacion,
        c.id_almacen,
        cl.id_cliente,
        CONCAT(COALESCE(cl.nombres, ''), ' ', COALESCE(cl.apellidos, '')) AS cliente,
        cl.dni,
        cl.email,
        cl.telefono,
        cl.direccion
      FROM compra c
      LEFT JOIN cliente cl ON cl.id_cliente = c.id_cliente
      WHERE c.id_tenant = ?
      ORDER BY c.id_compra DESC
      LIMIT ? OFFSET ?
    `;

    const [comprasResult] = await connection.query(comprasQuery, [id_tenant, limit, offset]);

    // Obtener detalles para cada compra (si hay compras)
    let detallesMap = {};

    if (comprasResult.length > 0) {
      const comprasIds = comprasResult.map(c => c.id);

      try {
        // Usar placeholders individuales para el IN clause
        const placeholders = comprasIds.map(() => '?').join(',');
        const [detallesResult] = await connection.query(`
          SELECT 
            dc.id_compra,
            dc.id_detalle_compra AS codigo,
            COALESCE(p.descripcion, 'Producto') AS nombre,
            dc.cantidad,
            dc.precio_unitario AS precio,
            (dc.cantidad * dc.precio_unitario) AS subtotal,
            COALESCE(p.undm, 'UND') AS undm
          FROM detalle_compra dc
          LEFT JOIN producto p ON p.id_producto = dc.id_producto
          WHERE dc.id_compra IN (${placeholders})
        `, comprasIds);

        // Agrupar detalles por id_compra
        detallesResult.forEach(d => {
          if (!detallesMap[d.id_compra]) {
            detallesMap[d.id_compra] = [];
          }
          detallesMap[d.id_compra].push(d);
        });
      } catch (detalleError) {
        console.warn('Error al obtener detalles de compra:', detalleError.message);
        // Continuar sin detalles
      }
    }

    // Combinar compras con sus detalles
    const compras = comprasResult.map(compra => ({
      ...compra,
      cliente: compra.cliente?.trim() || 'Cliente Online',
      origen: 'online',
      tipoComprobante: 'Online',
      serieNum: 'ONL',
      num: String(compra.id).padStart(8, '0'),
      cajero: 'Sistema Online',
      almacen: compra.id_almacen ? `Almacén ${compra.id_almacen}` : '-',
      igv: parseFloat((parseFloat(compra.total || 0) * 0.18 / 1.18).toFixed(2)),
      detalles: detallesMap[compra.id] || []
    }));

    // Calcular totales para KPIs
    const [totalesResult] = await connection.query(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as totalVentas
      FROM compra 
      WHERE id_tenant = ? AND estado_compra = 1
    `, [id_tenant]);

    const totales = totalesResult[0] || { cantidad: 0, totalVentas: 0 };

    res.json({
      code: 1,
      data: compras,
      totalOnline: parseFloat(totales.totalVentas || 0).toFixed(2),
      cantidadOnline: parseInt(totales.cantidad || 0)
    });
  } catch (error) {
    console.error('Error en getVentasOnline:', error.message, error.code);
    res.status(500).json({
      code: 0,
      message: "Error al obtener ventas online",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getVentas,
  getProductosVentas,
  addVenta,
  getClienteVentas,
  addCliente,
  getComprobante,
  getSucursal,
  updateVenta,
  generarComprobante,
  getEstado,
  getVentaById,
  getLastVenta,
  exchangeProducto,
  getVentasOnline,
};
