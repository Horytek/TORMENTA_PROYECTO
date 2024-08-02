import { getConnection } from "./../database/database";

const getVentas = async (req, res) => {
  const { page = 0, limit = 10, nom_tipocomp = '', razon_social = '', nombre_sucursal = '', fecha_i = '2022-01-01', fecha_e = '2027-12-27' } = req.query;
  const offset = page * limit;

  try {
    const connection = await getConnection();

    // Obtener el número total de ventas
    const [totalResult] = await connection.query(
      "SELECT COUNT(*) as total FROM venta"
    );
    const totalVentas = totalResult[0].total;

    // Obtener las ventas con paginación
    const [ventasResult] = await connection.query(
      `
        SELECT v.id_venta AS id, SUBSTRING(com.num_comprobante, 2, 3) AS serieNum, SUBSTRING(com.num_comprobante, 6, 8) AS num,
        case when tp.nom_tipocomp='Nota de venta' then 'Nota' else tp.nom_tipocomp end as tipoComprobante, CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_n, cl.razon_social AS cliente_r,
        cl.dni AS dni, cl.ruc AS ruc, DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha, v.igv AS igv, SUM(dv.total) AS total, CONCAT(ve.nombres, ' ', ve.apellidos) AS cajero,
        ve.dni AS cajeroId, v.estado_venta AS estado, s.nombre_sucursal, cl.direccion, v.fecha_iso
        FROM venta v
        INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
        INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
        INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
        INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
        INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
        INNER JOIN vendedor ve ON ve.dni = s.dni
      	WHERE tp.nom_tipocomp LIKE ? AND ( cl.razon_social LIKE ? OR CONCAT(cl.nombres, ' ', cl.apellidos) LIKE ? ) AND s.nombre_sucursal LIKE ?  AND DATE_FORMAT(v.f_venta, '%Y-%m-%d')>=? AND DATE_FORMAT(v.f_venta, '%Y-%m-%d')<=?
        GROUP BY id, serieNum, num, tipoComprobante, cliente_n, cliente_r, dni, ruc, fecha, igv, cajero, cajeroId, estado
        ORDER BY v.f_venta
        LIMIT ? OFFSET ?
      `,
      [nom_tipocomp+'%',razon_social+'%',razon_social+'%',nombre_sucursal+'%',fecha_i,fecha_e,parseInt(limit), parseInt(offset)]
    );

    // Obtener los detalles de venta correspondientes
    const ventas = await Promise.all(
      ventasResult.map(async (venta) => {
        const [detallesResult] = await connection.query(
          `
			SELECT dv.id_detalle AS codigo, pr.descripcion AS nombre, dv.cantidad AS cantidad, dv.precio AS precio, dv.descuento AS descuento, dv.total AS subtotal, pr.undm as undm, m.nom_marca AS marca
          FROM detalle_venta dv
          INNER JOIN producto pr ON pr.id_producto = dv.id_producto
          INNER JOIN marca m ON m.id_marca=pr.id_marca
          WHERE dv.id_venta = ?
        `,
          [venta.id]
        );

        return {
          ...venta,
          detalles: detallesResult,
        };
      })
    );

    res.json({ code: 1, data: ventas, totalVentas });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const generarComprobante = async (req, res) => {
  try {
    const { id_comprobante } = req.query; // Cambiar a req.query

    const connection = await getConnection();

    // Obtener id_tipocomprobante y nom_tipocomp basado en el nombre del comprobante
    const [comprobanteResult] = await connection.query(
      "SELECT id_tipocomprobante, nom_tipocomp FROM tipo_comprobante WHERE nom_tipocomp=?",
      [id_comprobante]
    );

    console.log("Resultado de comprobante:", comprobanteResult); // Log para verificar el resultado de la consulta de comprobante

    if (comprobanteResult.length === 0) {
      return res.status(404).json({ message: "Comprobante type not found." });
    }

    const { id_tipocomprobante, nom_tipocomp } = comprobanteResult[0];
    const prefijoBase = nom_tipocomp.charAt(0); // Usa nom_tipocomp como prefijo

    // Obtener el último número de comprobante y generar el siguiente
    const [ultimoComprobanteResult] = await connection.query(
      "SELECT num_comprobante FROM comprobante WHERE id_tipocomprobante = ? ORDER BY num_comprobante DESC LIMIT 1",
      [id_tipocomprobante]
    );

    console.log("Resultado del último comprobante:", ultimoComprobanteResult); // Log para verificar el resultado del último comprobante

    let nuevoNumComprobante;
    if (ultimoComprobanteResult.length > 0) {
      const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
      const partes = ultimoNumComprobante.split("-");
      const serie = partes[0].substring(1); // Obtener la serie numérica actual
      const numero = parseInt(partes[1], 10) + 1;

      // Verificar si el número actual supera el límite
      if (numero > 99999999) {
        // Cambiar de serie si el límite es alcanzado
        const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
        nuevoNumComprobante = `${prefijoBase}${nuevaSerie}-00000001`;
      } else {
        nuevoNumComprobante = `${prefijoBase}${serie}-${numero.toString().padStart(8, "0")}`;
      }
    } else {
      // Si no hay comprobantes, comenzar con la primera serie
      nuevoNumComprobante = `${prefijoBase}001-00000001`;
    }

    console.log("Nuevo número de comprobante:", nuevoNumComprobante); // Log para verificar el nuevo número de comprobante

    res.json({ nuevoNumComprobante });
  } catch (error) {
    console.error('Error en la función generarComprobante:', error.message); // Log para depuración
    res.status(500).send(error.message);
  }
};



const getProductosVentas = async (req, res) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.query(`
                SELECT PR.id_producto AS codigo, PR.descripcion AS nombre, 
                CAST(PR.precio AS DECIMAL(10, 2)) AS precio, inv.stock as stock,PR.undm, MA.nom_marca, CA.nom_subcat AS categoria_p, PR.cod_barras as codigo_barras
                FROM producto PR
                INNER JOIN marca MA ON MA.id_marca = PR.id_marca
                INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
                INNER JOIN inventario inv ON inv.id_producto=PR.id_producto
				INNER JOIN almacen al ON al.id_almacen=inv.id_almacen
            `);
    res.json({ code: 1, data: result, message: "Productos listados" });
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const getEstado = async (req, res) => {
  const connection = await getConnection();
  try {
    const {
      id_venta,
    } = req.body;

    console.log("Datos recibidos:", req.body); // Log para verificar los datos recibidos
    await connection.beginTransaction();

    // Obtener id_sucursal basado en el usuario
    await connection.query(
      "UPDATE venta set estado_venta=1 where id_venta=?",
      [id_venta]
    );
    res.json({ message: "Ventas actualizada correctamente" });
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const getComprobante = async (req, res) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.query(`
      	SELECT id_tipocomprobante AS id, case when nom_tipocomp='Nota de venta' then 'Nota' else nom_tipocomp end as nombre 
			FROM tipo_comprobante WHERE nom_tipocomp NOT LIKE'Guia de remision' AND nom_tipocomp NOT LIKE'Nota de credito' 
			AND nom_tipocomp NOT LIKE'Nota de ingreso'
            `);
    res.json({ code: 1, data: result, message: "Comprobante listados" });
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const getSucursal = async (req, res) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.query(`SELECT id_sucursal AS id, nombre_sucursal AS nombre FROM sucursal`);
    res.json({ code: 1, data: result, message: "Sucursal listados" });
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
    id_cliente AS id,
    COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS cliente_t,
    COALESCE(NULLIF(dni, ''), ruc) AS documento_t, 
    direccion AS direccion_t
FROM 
    cliente
WHERE 
    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
    OR
    (razon_social IS NOT NULL AND razon_social <> '')
ORDER BY 
    (CASE 
        WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
        ELSE 1 
     END),
    cliente_t;
          `);
    res.json({ code: 1, data: result, message: "Productos listados" });
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const addVenta = async (req, res) => {
  const connection = await getConnection();

  try {
    const {
      usuario,
      id_comprobante,
      id_cliente,
      estado_venta,
      f_venta,
      igv,
      detalles,
      fecha_iso,
    } = req.body;

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
        usuario,
        id_comprobante,
        id_cliente,
        estado_venta,
        f_venta,
        igv,
        detalles,
      }); // Log para verificar los datos faltantes
      return res
        .status(400)
        .json({ message: "Bad Request. Please fill all fields correctly." });
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

    // Obtener id_tipocomprobante y nom_tipocomp basado en el nombre del comprobante
    const [comprobanteResult] = await connection.query(
      "SELECT id_tipocomprobante, nom_tipocomp FROM tipo_comprobante WHERE nom_tipocomp=?",
      [id_comprobante]
    );

    console.log("Resultado de comprobante:", comprobanteResult); // Log para verificar el resultado de la consulta de comprobante

    if (comprobanteResult.length === 0) {
      throw new Error("Comprobante type not found.");
    }

    const { id_tipocomprobante, nom_tipocomp } = comprobanteResult[0];
    const prefijoBase = nom_tipocomp.charAt(0); // Usa nom_tipocomp como prefijo

    // Obtener el último número de comprobante y generar el siguiente
    const [ultimoComprobanteResult] = await connection.query(
      "SELECT num_comprobante FROM comprobante WHERE id_tipocomprobante = ? ORDER BY num_comprobante DESC LIMIT 1",
      [id_tipocomprobante]
    );

    console.log("Resultado del último comprobante:", ultimoComprobanteResult); // Log para verificar el resultado del último comprobante

    let nuevoNumComprobante;
    if (ultimoComprobanteResult.length > 0) {
      const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
      const partes = ultimoNumComprobante.split("-");
      const serie = partes[0].substring(1); // Obtener la serie numérica actual
      const numero = parseInt(partes[1], 10) + 1;
    
      // Verificar si el número actual supera el límite
      if (numero > 99999999) {
        // Cambiar de serie si el límite es alcanzado
        const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
        nuevoNumComprobante = `${prefijoBase}${nuevaSerie}-00000001`;
      } else {
        nuevoNumComprobante = `${prefijoBase}${serie}-${numero.toString().padStart(8, "0")}`;
      }
    } else {
      // Si no hay comprobantes, comenzar con la primera serie
      nuevoNumComprobante = `${prefijoBase}001-00000001`;
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
      "SELECT id_cliente, COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS cliente_t FROM cliente WHERE CONCAT(nombres, ' ', apellidos) = ? OR razon_social = ? ORDER BY (CASE WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 ELSE 1 END), cliente_t;",
      [id_cliente, id_cliente]
    );

    console.log("Resultado del cliente:", clienteResult); // Log para verificar el resultado de la consulta de cliente

    if (clienteResult.length === 0) {
      throw new Error("Cliente not found.");
    }

    const id_cliente_final = clienteResult[0].id_cliente;

    // Insertar venta
    const venta = {
      id_sucursal,
      id_comprobante: id_comprobante_final,
      id_cliente: id_cliente_final,
      estado_venta,
      f_venta,
      igv,
      fecha_iso,
    };
    const [ventaResult] = await connection.query(
      "INSERT INTO venta SET ?",
      venta
    );

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

      console.log(
        "Resultado del inventario para producto ID",
        id_producto,
        ":",
        inventarioResult
      ); // Log para verificar el resultado de la consulta de inventario

      if (inventarioResult.length === 0) {
        throw new Error(
          `No stock found for product ID ${id_producto} in the current store.`
        );
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
        "INSERT INTO detalle_venta (id_producto, id_venta, cantidad, precio, descuento, total) VALUES (?, ?, ?, ?, ?, ?)",
        [id_producto, id_venta, cantidad, precio, descuento, total]
      );
    }

    await connection.commit();

    res.json({ message: "Venta y detalles añadidos" });
  } catch (error) {
    console.error("Error en el backend:", error.message); // Log para verificar errores
    await connection.rollback();
    res.status(500).send(error.message);
  }
};





const addCliente = async (req, res) => {
  const connection = await getConnection();

  try {
    const { dniOrRuc, tipo_cliente, nombreCompleto, direccion } = req.body;

    console.log("Datos recibidos:", req.body); // Log para verificar los datos recibidos

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
        // Considerar que el primer nombre puede tener múltiples partes
        nombres = partesNombre.slice(0, -2).join(" ");
        apellidos = partesNombre.slice(-2).join(" ");
      } else {
        nombres = nombreCompleto; // Asumir que es un nombre único si no se puede dividir
      }

      // Insertar cliente natural
      await connection.query(
        "INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente) VALUES (?, '', ?, ?, '', '', 0)",
        [dniOrRuc, nombres, apellidos]
      );
    } else {
      razon_social = nombreCompleto;
      // Insertar cliente jurídico
      await connection.query(
        "INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente) VALUES ('', ?, '', '', ?, ?, 0)",
        [dniOrRuc, razon_social, direccion]
      );
    }

    res.json({ message: "Cliente añadido correctamente" });
  } catch (error) {
    console.error("Error en el backend:", error.message); // Log para verificar errores
    res.status(500).send(error.message);
  }
};

const getTotalProductosVendidos = async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [result] = await connection.query(`
      SELECT SUM(dv.cantidad) AS total_productos_vendidos
      FROM detalle_venta dv
    `);
    
    const totalProductosVendidos = result[0].total_productos_vendidos || 0;

    res.json({ code: 1, totalProductosVendidos, message: "Total de productos vendidos obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const updateVenta = async (req, res) => {
  const connection = await getConnection();

  try {
    const { id_venta } = req.body;

    if (!id_venta ) {
      return res
        .status(400)
        .json({ message: "Bad Request. Please provide id_venta and nuevo_estado." });
    }

    await connection.beginTransaction();

    // Obtener los detalles de la venta
    const [detallesResult] = await connection.query(
      `
      SELECT id_producto, cantidad
      FROM detalle_venta
      WHERE id_venta = ?
      `,
      [id_venta]
    );

    if (detallesResult.length === 0) {
      throw new Error("No details found for the given sale.");
    }

    // Restaurar el stock de los productos
    for (const detalle of detallesResult) {
      const { id_producto, cantidad } = detalle;

      // Obtener el stock actual del producto
      const [inventarioResult] = await connection.query(
        `
        SELECT stock
        FROM inventario
        WHERE id_producto = ? AND id_almacen = (
          SELECT id_almacen
          FROM sucursal_almacen
          WHERE id_sucursal = (
            SELECT id_sucursal
            FROM venta
            WHERE id_venta = ?
          )
          LIMIT 1
        )
        `,
        [id_producto, id_venta]
      );

      if (inventarioResult.length === 0) {
        throw new Error(`No stock found for product ID ${id_producto}.`);
      }

      const stockActual = inventarioResult[0].stock;

      // Actualizar el stock en la tabla inventario
      await connection.query(
        `
        UPDATE inventario
        SET stock = ?
        WHERE id_producto = ? AND id_almacen = (
          SELECT id_almacen
          FROM sucursal_almacen
          WHERE id_sucursal = (
            SELECT id_sucursal
            FROM venta
            WHERE id_venta = ?
          )
          LIMIT 1
        )
        `,
        [stockActual + cantidad, id_producto, id_venta]
      );
    }

    // Cambiar el estado de la venta
    await connection.query(
      `
      UPDATE venta
      SET estado_venta = ?
      WHERE id_venta = ?
      `,
      [0, id_venta]
    );

    await connection.commit();

    res.json({ message: "Venta estado actualizado y stock restaurado." });
  } catch (error) {
    console.error("Error en el backend:", error.message); // Log para verificar errores
    await connection.rollback();
    res.status(500).send(error.message);
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
  getTotalProductosVendidos,
};
