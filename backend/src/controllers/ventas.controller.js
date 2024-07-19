import { getConnection } from "./../database/database";

const getVentas = async (req, res) => {
    const { page = 0, limit = 10 } = req.query;
    const offset = page * limit;
  
    try {
      const connection = await getConnection();
  
      // Obtener el número total de ventas
      const [totalResult] = await connection.query('SELECT COUNT(*) as total FROM venta');
      const totalVentas = totalResult[0].total;
  
      // Obtener las ventas con paginación
      const [ventasResult] = await connection.query(`
        SELECT v.id_venta AS id, SUBSTRING(com.num_comprobante, 2, 3) AS serieNum, SUBSTRING(com.num_comprobante, 6, 8) AS num,
        tp.nom_tipocomp AS tipoComprobante, CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_n, cl.razon_social AS cliente_r,
        cl.dni AS dni, cl.ruc AS ruc, DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha, v.igv AS igv, SUM(dv.total) AS total, CONCAT(ve.nombres, ' ', ve.apellidos) AS cajero,
        ve.dni AS cajeroId, v.estado_venta AS estado
        FROM venta v
        INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
        INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
        INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
        INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
        INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
        INNER JOIN vendedor ve ON ve.dni = s.dni
        GROUP BY id, serieNum, num, tipoComprobante, cliente_n, cliente_r, dni, ruc, fecha, igv, cajero, cajeroId, estado
        LIMIT ? OFFSET ?
      `, [parseInt(limit), parseInt(offset)]);
  
      // Obtener los detalles de venta correspondientes
      const ventas = await Promise.all(ventasResult.map(async (venta) => {
        const [detallesResult] = await connection.query(`
          SELECT dv.id_detalle AS codigo, pr.descripcion AS nombre, dv.cantidad AS cantidad, dv.precio AS precio, dv.descuento AS descuento, dv.total AS subtotal
          FROM detalle_venta dv
          INNER JOIN producto pr ON pr.id_producto = dv.id_producto
          WHERE dv.id_venta = ?
        `, [venta.id]);
        
        return {
          ...venta,
          detalles: detallesResult
        };
      }));
  
      res.json({ code: 1, data: ventas, totalVentas });
    } catch (error) {
      res.status(500).send(error.message);
    }
  };


  const getProductosVentas = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
                SELECT PR.id_producto AS codigo, PR.descripcion AS nombre, 
                CAST(PR.precio AS DECIMAL(10, 2)) AS precio, inv.stock as stock, CA.nom_subcat AS categoria_p
                FROM producto PR
                INNER JOIN marca MA ON MA.id_marca = PR.id_marca
                INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
                INNER JOIN inventario inv ON inv.id_producto=PR.id_producto
				INNER JOIN almacen al ON al.id_almacen=inv.id_almacen
            `);
        res.json({code:1, data: result, message: "Productos listados"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const getClienteVentas = async (req, res) => {
  try {
      const connection = await getConnection();
      const [result] = await connection.query(`
              SELECT 
    COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS cliente_t
    FROM 
    cliente
    WHERE 
    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
    OR
    (razon_social IS NOT NULL AND razon_social <> '')
          `);
      res.json({code:1, data: result, message: "Productos listados"});
  } catch (error) {
      res.status(500);
      res.send(error.message);
  }
};
  
const addVenta = async (req, res) => {
  const connection = await getConnection();

  try {
    const { usuario, id_comprobante, id_cliente, estado_venta, f_venta, igv, detalles } = req.body;

    console.log("Datos recibidos:", req.body); // Log para verificar los datos recibidos

    if (
      usuario === undefined || 
      id_comprobante === undefined || 
      id_cliente === undefined || 
      estado_venta === undefined || 
      f_venta === undefined || 
      igv === undefined || 
      !Array.isArray(detalles) || 
      detalles.length === 0
    ) {
      console.log("Error en los datos:", {
        usuario, id_comprobante, id_cliente, estado_venta, f_venta, igv, detalles
      }); // Log para verificar los datos faltantes
      return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
    }

    await connection.beginTransaction();

    // Obtener id_sucursal basado en el usuario
    const [sucursalResult] = await connection.query(
      "SELECT id_sucursal FROM sucursal su INNER JOIN vendedor ve ON ve.dni=su.dni INNER JOIN usuario u ON u.id_usuario=ve.id_usuario WHERE u.usua=?",
      [usuario]
    );

    console.log("Resultado de sucursal:", sucursalResult); // Log para verificar el resultado de la consulta de sucursal

    if (sucursalResult.length === 0) {
      throw new Error("Sucursal not found for the given user.");
    }

    const id_sucursal = sucursalResult[0].id_sucursal;

    // Obtener id_tipocomprobante basado en el nombre del comprobante
    const [comprobanteResult] = await connection.query(
      "SELECT id_tipocomprobante FROM tipo_comprobante WHERE nom_tipocomp=?",
      [id_comprobante]
    );

    console.log("Resultado de comprobante:", comprobanteResult); // Log para verificar el resultado de la consulta de comprobante

    if (comprobanteResult.length === 0) {
      throw new Error("Comprobante type not found.");
    }

    const id_tipocomprobante = comprobanteResult[0].id_tipocomprobante;

    // Obtener el último número de comprobante y generar el siguiente
    const [ultimoComprobanteResult] = await connection.query(
      "SELECT num_comprobante FROM comprobante WHERE id_tipocomprobante = ? ORDER BY num_comprobante DESC LIMIT 1",
      [id_tipocomprobante]
    );

    console.log("Resultado del último comprobante:", ultimoComprobanteResult); // Log para verificar el resultado del último comprobante

    let nuevoNumComprobante;
    if (ultimoComprobanteResult.length > 0) {
      const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
      const partes = ultimoNumComprobante.split('-');
      const numero = parseInt(partes[1], 10) + 1;

      // Verificar si el número actual supera el límite
      if (numero > 99999999) {
        // Cambiar de serie si el límite es alcanzado
        const nuevoPrefijo = `B${parseInt(partes[0].substring(1)) + 1}`.padStart(3, '0');
        nuevoNumComprobante = `${nuevoPrefijo}-00000001`;
      } else {
        nuevoNumComprobante = `${partes[0]}-${numero.toString().padStart(8, '0')}`;
      }
    } else {
      // Si no hay comprobantes, comenzar con la primera serie
      nuevoNumComprobante = 'B001-00000001';
    }

    console.log("Nuevo número de comprobante:", nuevoNumComprobante); // Log para verificar el nuevo número de comprobante

    // Insertar el nuevo comprobante y obtener su id_comprobante
    const [nuevoComprobanteResult] = await connection.query(
      "INSERT INTO comprobante (id_tipocomprobante, num_comprobante) VALUES (?, ?)",
      [id_tipocomprobante, nuevoNumComprobante]
    );

    console.log("Resultado de nuevo comprobante:", nuevoComprobanteResult); // Log para verificar el resultado de la inserción del nuevo comprobante

    const id_comprobante_final = nuevoComprobanteResult.insertId;

    // Obtener id_cliente basado en el nombre completo o razón social
    const [clienteResult] = await connection.query(
      "SELECT id_cliente FROM cliente WHERE CONCAT(nombres, ' ', apellidos) = ? OR razon_social = ?",
      [id_cliente, id_cliente]
    );

    console.log("Resultado del cliente:", clienteResult); // Log para verificar el resultado de la consulta de cliente

    if (clienteResult.length === 0) {
      throw new Error("Cliente not found.");
    }

    const id_cliente_final = clienteResult[0].id_cliente;

    // Insertar venta
    const venta = { id_sucursal, id_comprobante: id_comprobante_final, id_cliente: id_cliente_final, estado_venta, f_venta, igv };
    const [ventaResult] = await connection.query("INSERT INTO venta SET ?", venta);

    console.log("Resultado de la venta:", ventaResult); // Log para verificar el resultado de la inserción de la venta

    const id_venta = ventaResult.insertId;

    // Insertar detalles de la venta y actualizar el stock
    for (const detalle of detalles) {
      const { id_producto, cantidad, precio, descuento, total } = detalle;

      // Verificar y descontar stock
      const [inventarioResult] = await connection.query(
        "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = (SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal = ? LIMIT 1)",
        [id_producto, id_sucursal]
      );

      console.log("Resultado del inventario para producto ID", id_producto, ":", inventarioResult); // Log para verificar el resultado de la consulta de inventario

      if (inventarioResult.length === 0) {
        throw new Error(`No stock found for product ID ${id_producto} in the current store.`);
      }

      const stockActual = inventarioResult[0].stock;

      if (stockActual < cantidad) {
        throw new Error(`Not enough stock for product ID ${id_producto}.`);
      }

      const stockNuevo = stockActual - cantidad;

      // Actualizar el stock en la tabla inventario
      await connection.query(
        "UPDATE inventario SET stock = ? WHERE id_producto = ? AND id_almacen = (SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal = ? LIMIT 1)",
        [stockNuevo, id_producto, id_sucursal]
      );

      // Insertar detalle de la venta
      await connection.query(
        'INSERT INTO detalle_venta (id_producto, id_venta, cantidad, precio, descuento, total) VALUES (?, ?, ?, ?, ?, ?)',
        [id_producto, id_venta, cantidad, precio, descuento, total]
      );
    }

    await connection.commit();

    res.json({ message: "Venta y detalles añadidos" });
  } catch (error) {
    console.error('Error en el backend:', error.message); // Log para verificar errores
    await connection.rollback();
    res.status(500).send(error.message);
  } finally {
    await connection.release();
  }
};



export const methods = {
    getVentas,
    getProductosVentas,
    addVenta,
    getClienteVentas
};