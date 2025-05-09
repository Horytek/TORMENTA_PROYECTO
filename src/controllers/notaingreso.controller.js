import { getConnection } from "../database/database";



const getIngresos = async (req, res) => {
  const { fecha_i = '2022-01-01', fecha_e = '2038-12-27', razon_social = '', almacen = '%', usuario = '', documento = '', estado = '%' } = req.query;
  let connection;
  try {
      connection = await getConnection();

      const [ingresosResult] = await connection.query(
        `
        SELECT 
            n.id_nota AS id,
            DATE_FORMAT(n.fecha, '%Y-%m-%d') AS fecha,
            c.num_comprobante AS documento,
            ao.nom_almacen AS almacen_O,
            COALESCE(ad.nom_almacen,'Almacen externo') AS almacen_D,
            COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor,
            n.glosa AS concepto,
            n.estado_nota AS estado,
            ROUND(IFNULL(SUM(dn.total), 0), 2) AS total_nota,
            COALESCE(u.usua, '') as usuario,
            n.observacion AS observacion
        FROM 
            nota n
        LEFT JOIN 
            destinatario d ON n.id_destinatario = d.id_destinatario
        LEFT JOIN comprobante c ON n.id_comprobante = c.id_comprobante
        LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen
        LEFT JOIN almacen ad ON n.id_almacenD= ad.id_almacen
        LEFT JOIN 
            detalle_nota dn ON n.id_nota = dn.id_nota
        LEFT JOIN
            usuario u ON n.id_usuario = u.id_usuario
        WHERE 
            n.id_tiponota = 1
            AND c.num_comprobante LIKE ?
            AND DATE_FORMAT(n.fecha, '%Y-%m-%d') >= ?
            AND DATE_FORMAT(n.fecha, '%Y-%m-%d') <= ?
            AND (d.razon_social LIKE ? OR CONCAT(d.nombres, ' ', d.apellidos) LIKE ?)
            ${almacen !== '%' ? 'AND n.id_almacenD = ?' : ''}
            ${estado !== '%' ? 'AND n.estado_nota LIKE ?' : ''}
            ${usuario ? 'AND (u.usua LIKE ? OR u.usua IS NULL)' : ''}
        GROUP BY 
            id, n.fecha, documento, almacen_O, almacen_D, proveedor, concepto, estado
        ORDER BY 
            n.fecha DESC, documento DESC;
        `,
          [            `%${documento}%`,
            fecha_i,
            fecha_e,
            `%${razon_social}%`,
            `%${razon_social}%`,
            ...(almacen !== '%' ? [almacen] : []),
            ...(estado !== '%' ? [`%${estado}%`] : []),
            ...(usuario ? [`%${usuario}%`] : [])]
      );

      // Obtener los detalles de venta correspondientes
      const ingresos = await Promise.all(
          ingresosResult.map(async (ingreso) => {
              const [detallesResult] = await connection.query(
                  `
                  SELECT p.id_producto AS codigo, m.nom_marca AS marca, sc.nom_subcat AS categoria, p.descripcion AS descripcion, 
                  dn.cantidad AS cantidad, p.undm AS unidad, dn.precio AS precio, dn.total AS total
                  FROM producto p INNER JOIN marca m ON p.id_marca=m.id_marca
                  INNER JOIN sub_categoria sc ON p.id_subcategoria=sc.id_subcategoria
                  INNER JOIN detalle_nota dn ON p.id_producto=dn.id_producto
                  WHERE dn.id_nota= ?
                  `,
                  [ingreso.id]
              );

              return {
                  ...ingreso,
                  detalles: detallesResult,
              };
          })
      );

      res.json({ code: 1, data: ingresos });
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const getAlmacen = async (req, res) => {
  let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal 
            FROM almacen a 
            LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
            LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
            WHERE a.estado_almacen = 1;
        `);
        res.json({ code: 1, data: result, message: "Almacenes listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
      if (connection) {
          connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
      }
  }
};


const getProductos = async (req, res) => {
  let connection;
  const { descripcion = '', almacen = 1, cod_barras = '' } = req.query;

  //console.log('Filtros recibidos:', { descripcion, almacen, cod_barras });

  try {
    connection = await getConnection();

    let query = '';
    const queryParams = [];

    // Si el almacen tiene valor, buscar productos con stock en ese almacen
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
        WHERE i.stock > 0
      `;
      queryParams.push(almacen);

      if (descripcion) {
        query += ' AND p.descripcion LIKE ?';
        queryParams.push(`%${descripcion}%`);
      }

      if (cod_barras) {
        query += ' AND p.cod_barras LIKE ?';
        queryParams.push(`%${cod_barras}%`);
      }

      query += ' GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock';
    } else {
      // Si el almacen no tiene valor, buscar productos sin stock
      query = `
        SELECT 
          p.id_producto AS codigo, 
          p.descripcion AS descripcion, 
          m.nom_marca AS marca,
          p.cod_barras AS cod_barras
        FROM producto p 
        INNER JOIN marca m ON p.id_marca = m.id_marca
        WHERE p.descripcion LIKE ? AND p.cod_barras LIKE ?
      `;
      queryParams.push(`%${descripcion}%`, `%${cod_barras}%`);
    }

    const [productosResult] = await connection.query(query, queryParams);

    //console.log('Productos encontrados:', productosResult);

    res.json({ code: 1, data: productosResult });
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};

  
//OBTENER PRODUCTOS
const getProductos_SinStock = async (req, res) => {
  let connection;
  const { descripcion = '', codbarras = '' } = req.query;

  //console.log('Filtros recibidos:', { descripcion, codbarras });

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
              p.cod_barras LIKE ?
          `,
          [`%${descripcion}%`, `%${codbarras}%`]
      );

      //console.log('Productos encontrados:', productosResult);

      res.json({ code: 1, data: productosResult });
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};



  const getNuevoDocumento = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT CONCAT('I400-', LPAD(COALESCE(SUBSTRING(MAX(num_comprobante), 6) + 1, 1), 8, '0')) AS nuevo_numero_de_nota
            FROM comprobante
            WHERE id_tipocomprobante = 6;
        `);
        res.json({ code: 1, data: result, message: "Nuevo numero de nota" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
      if (connection) {
          connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
      }
  }
};

const getDestinatario = async (req, res) => {
  let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_destinatario AS id,COALESCE(ruc, dni) AS documento ,COALESCE(razon_social, CONCAT(nombres, ' ', apellidos)) AS destinatario 
            FROM destinatario;

        `);
        res.json({ code: 1, data: result, message: "Destinatarios listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
      if (connection) {
          connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
      }
  }
};

const insertNotaAndDetalle = async (req, res) => {
  const {
    almacenO = null,
    almacenD ,
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

  //console.log("Datos recibidos:", req.body); // Log para verificar los datos recibidos

  // Validar los datos recibidos (almacenO y almacenD ya no son obligatorios)
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
    /*console.log("Error en los datos:", {
      almacenO,
      almacenD,
      destinatario,
      glosa,
      nota,
      fecha,
      producto,
      numComprobante,
      cantidad,
    });*/ // Log para verificar los datos faltantes
    return res
      .status(400)
      .json({ message: "Bad Request. Please fill all fields correctly." });
  }

  let connection;
  try {
    connection = await getConnection();

    // Iniciar la transacción
    await connection.beginTransaction();

    const [usuarioResult] = await connection.query(
      "SELECT id_usuario FROM usuario WHERE usua = ?",
      [usuario]
    );

    // Insertar el nuevo comprobante
    const [comprobanteResult] = await connection.query(
      "INSERT INTO comprobante (id_tipocomprobante, num_comprobante) VALUES (6, ?)",
      [numComprobante]
    );

    const id_comprobante = comprobanteResult.insertId;
   
    let notaResult;

if (almacenO) {
  [notaResult] = await connection.query(
    `INSERT INTO nota 
    (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario) 
    VALUES (?, ?, 1, ?, ?, ?, ?, ?, 0, ? , ?)`,
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
    ]
  );
} else {
  [notaResult] = await connection.query(
    `INSERT INTO nota 
    (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario) 
    VALUES (null, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      almacenD,
      destinatario,
      id_comprobante,
      glosa,
      fecha,
      nota,
      observacion,
      usuarioResult[0]?.id_usuario,
    ]
  );
}

const id_nota = notaResult.insertId;
  

    // Insertar el detalle de la nota
    for (let i = 0; i < producto.length; i++) {
      const id_producto = producto[i];
      const cantidadProducto = cantidad[i];

      // Obtener el precio del producto
      const [precioResult] = await connection.query(
        "SELECT precio FROM producto WHERE id_producto = ?",
        [id_producto]
      );

      if (precioResult.length === 0) {
        throw new Error`(El producto con ID ${id_producto} no existe.)`;
      }

      const precio = precioResult[0].precio;
      const totalProducto = cantidadProducto * precio;

      const [detalleResult] = await connection.query(
        "INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)",
        [id_producto, id_nota, cantidadProducto, precio, totalProducto]
      );

      const id_detalle = detalleResult.insertId;

      // Verificar y actualizar el stock (solo si almacenD no es null)
      if (almacenD) {
        const [stockResult] = await connection.query(
          "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = ?",
          [id_producto, almacenD]
        );

        let totalStock;

        if (stockResult.length > 0) {
          totalStock = cantidadProducto + stockResult[0].stock;

          await connection.query(
            "UPDATE inventario SET stock = ? WHERE id_producto = ? AND id_almacen = ?",
            [totalStock, id_producto, almacenD]
          );
        } else {
          totalStock = cantidadProducto;

          // Insertar nuevo inventario si el producto no existe en el almacén
          await connection.query(
            "INSERT INTO inventario (id_producto, id_almacen, stock) VALUES (?, ?, ?)",
            [id_producto, almacenD, cantidadProducto]
          );
        }

        // Insertar en bitacora_nota
        await connection.query(
          "INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, entra, stock_anterior, stock_actual, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            id_nota,
            id_producto,
            almacenD,
            id_detalle,
            cantidadProducto,
            stockResult[0]?.stock || 0,
            totalStock,
            fecha,
          ]
        );
      }
    }

    // Confirmar la transacción
    await connection.commit();

    res.json({ code: 1, message: "Nota y detalle insertados correctamente" });
  } catch (error) {
    console.error("Error en el backend:", error.message); // Log para verificar errores
    if (connection) {
      // Revertir la transacción en caso de error
      await connection.rollback();
    }
    res.status(500).send({ code: 0, message: error.message });
  } finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const anularNota = async (req, res) => {
  const { notaId } = req.body;

  if (!notaId) {
    return res.status(400).json({ message: "El ID de la nota es necesario." });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Obtener detalles de la nota
    const [notaResult] = await connection.query(
      "SELECT id_almacenO, id_almacenD, id_comprobante FROM nota WHERE id_nota = ? AND estado_nota = 0",
      [notaId]
    );

    if (notaResult.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Nota no encontrada o ya anulada." });
    }

    const { id_almacenO, id_almacenD } = notaResult[0];

    // Obtener productos de la nota
    const [detalleResult] = await connection.query(
      "SELECT id_producto, cantidad FROM detalle_nota WHERE id_nota = ?",
      [notaId]
    );

    // Procesar cada producto en paralelo
    await Promise.all(
      detalleResult.map(async ({ id_producto, cantidad }) => {
        if (id_almacenD) {
          // Verificar stock antes de actualizar
          const [stockResult] = await connection.query(
            "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = ?",
            [id_producto, id_almacenD]
          );

          if (!stockResult.length || stockResult[0].stock < cantidad) {
            throw new Error(`Stock insuficiente para producto ID ${id_producto}.`);
          }

          // Actualizar stock
          const stockAnterior = stockResult[0].stock;
          await connection.query(
            "UPDATE inventario SET stock = stock - ? WHERE id_producto = ? AND id_almacen = ? AND stock >= ?",
            [cantidad, id_producto, id_almacenD, cantidad]
          );

          // Obtener detalle de venta asociado
          const [detalleIdResult] = await connection.query(
            "SELECT id_detalle_nota FROM detalle_nota WHERE id_nota = ? AND id_producto = ?",
            [notaId, id_producto]
          );

          if (!detalleIdResult.length) {
            throw new Error(`Detalle de venta no encontrado para producto ID ${id_producto}.`);
          }

          const detalleId = detalleIdResult[0].id_detalle_nota;

          // Obtener la fecha de la nota
          const [fechaResult] = await connection.query(
            "SELECT fecha FROM nota WHERE id_nota = ?",
            [notaId]
          );

          if (!fechaResult.length) {
            throw new Error(`Fecha no encontrada para la nota ID ${notaId}.`);
          }

          const fechaNota = fechaResult[0].fecha;

          // Insertar en bitácora
          await connection.query(
            "INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, sale, stock_anterior, stock_actual, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [notaId, id_producto, id_almacenD, detalleId, cantidad, stockAnterior, stockAnterior - cantidad, fechaNota]
          );
        }
      })
    );

    // Anular la nota
    await connection.query(
      "UPDATE nota SET estado_nota = 1 WHERE id_nota = ?",
      [notaId]
    );

    await connection.commit();
    res.json({ code: 1, message: "Nota anulada correctamente" });

  } catch (error) {
    console.error("Error en el backend:", error.message);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al hacer rollback:", rollbackError.message);
      }
    }
    res.status(500).json({ code: 0, message: error.message });
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

