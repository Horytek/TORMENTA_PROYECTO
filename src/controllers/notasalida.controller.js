import { getConnection } from "../database/database.js";
import { logInventario } from "../utils/logActions.js";

const getSalidas = async (req, res) => {
  let connection;
  const { fecha_i = '2012-01-01', fecha_e = '2057-12-27', razon_social = '', almacen = '%', usuario = '', documento = '', estado = '%' } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    const [salidaResult] = await connection.query(
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
              COALESCE(u.usua, '') as usuario,
              n.observacion AS observacion,
              n.hora_creacion, n.fecha_anulacion, n.u_modifica AS u_modifica,n.nom_nota
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
              n.id_tiponota = 2
              AND n.id_tenant = ?
              AND c.num_comprobante LIKE ?
              AND DATE_FORMAT(n.fecha, '%Y-%m-%d') >= ?
              AND DATE_FORMAT(n.fecha, '%Y-%m-%d') <= ?
              AND (d.razon_social LIKE ? OR CONCAT(d.nombres, ' ', d.apellidos) LIKE ?)
              ${almacen !== '%' ? 'AND n.id_almacenO = ?' : ''}
              ${estado !== '%' ? 'AND n.estado_nota LIKE ?' : ''}
              ${usuario ? 'AND (u.usua LIKE ? OR u.usua IS NULL)' : ''}
          GROUP BY 
              id, n.fecha, documento, almacen_O, almacen_D, proveedor, concepto, estado
          ORDER BY 
              n.fecha DESC, documento DESC;
          `,
      [
        id_tenant,
        `%${documento}%`,
        fecha_i,
        fecha_e,
        `%${razon_social}%`,
        `%${razon_social}%`,
        ...(almacen !== '%' ? [almacen] : []),
        ...(estado !== '%' ? [`%${estado}%`] : []),
        ...(usuario ? [`%${usuario}%`] : [])
      ]
    );

    const salidas = await Promise.all(
      salidaResult.map(async (salida) => {
        const [detallesResult] = await connection.query(
          `
                  SELECT dn.id_detalle_nota AS codigo, m.nom_marca AS marca, sc.nom_subcat AS categoria, p.descripcion AS descripcion, 
                  dn.cantidad AS cantidad, p.undm AS unidad, 
                  p.id_producto
                  FROM producto p INNER JOIN marca m ON p.id_marca=m.id_marca
                  INNER JOIN sub_categoria sc ON p.id_subcategoria=sc.id_subcategoria
                  INNER JOIN detalle_nota dn ON p.id_producto=dn.id_producto
                  WHERE dn.id_nota= ? AND dn.id_tenant = ?
                  `,
          [salida.id, id_tenant]
        );

        return {
          ...salida,
          detalles: detallesResult,
        };
      })
    );

    res.json({ code: 1, data: salidas });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
    if (connection) {
        connection.release();
    }
  }
};

const getAlmacen = async (req, res) => {
  let connection;
  const id_tenant = req.id_tenant;
  try {
    connection = await getConnection();
    const [result] = await connection.query(`
            SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal 
            FROM almacen a 
            LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
            LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
            WHERE a.estado_almacen = 1 AND a.id_tenant = ?
        `, [id_tenant]);
    res.json({ code: 1, data: result, message: "Almacenes listados" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
    if (connection) {
        connection.release();
    }
  }
};

const getProductos = async (req, res) => {
  let connection;
  const { descripcion = '', almacen = 1, cod_barras = '' } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    let query = `
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

    const queryParams = [almacen, id_tenant];

    if (descripcion) {
      query += ' AND p.descripcion LIKE ?';
      queryParams.push(`%${descripcion}%`);
    }

    if (cod_barras) {
      query += ' AND p.cod_barras LIKE ?';
      queryParams.push(`%${cod_barras}%`);
    }

    query += ' GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock';

    const [productosResult] = await connection.query(query, queryParams);

    res.json({ code: 1, data: productosResult });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
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
  try {
    connection = await getConnection();
    const [result] = await connection.query(`
            SELECT id_destinatario AS id,COALESCE(ruc, dni) AS documento ,COALESCE(razon_social, CONCAT(nombres, ' ', apellidos)) AS destinatario 
            FROM destinatario
            WHERE id_tenant = ?;
        `, [id_tenant]);
    res.json({ code: 1, data: result, message: "Destinatarios listados" });
  } catch (error) {
    res.status(500);
    res.send(error.message);
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

    for (let i = 0; i < producto.length; i++) {
      const id_producto = producto[i];
      const cantidadProducto = cantidad[i];

      // Obtener el precio del producto
      const [precioResult] = await connection.query(
        "SELECT precio FROM producto WHERE id_producto = ? AND id_tenant = ?",
        [id_producto, id_tenant]
      );

      if (precioResult.length === 0) {
        throw new Error(`El producto con ID ${id_producto} no existe.`);
      }

      const precio = precioResult[0].precio;
      const totalProducto = cantidadProducto * precio;

      // Insertar en detalle_nota
      const [detalleResult] =  await connection.query(
        "INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total, id_tenant) VALUES (?, ?, ?, ?, ?, ?)",
        [id_producto, id_nota, cantidadProducto, precio, totalProducto, id_tenant]
      );

      const id_detalle = detalleResult.insertId;

      const [stockResult] = await connection.query(
        "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = ? AND id_tenant = ?",
        [id_producto, almacenO, id_tenant]
      );

      let totalStock;
      totalStock = stockResult[0].stock - cantidadProducto;
      // Reducir stock en el almacén de origen
      await connection.query(
        "UPDATE inventario SET stock = stock - ? WHERE id_producto = ? AND id_almacen = ? AND id_tenant = ?",
        [cantidadProducto, id_producto, almacenO, id_tenant]
      );

      await connection.query(
        "INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, sale, stock_anterior, stock_actual, fecha, id_tenant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id_nota,
          id_producto,
          almacenO,
          id_detalle,
          cantidadProducto,
          stockResult[0]?.stock || 0,
          totalStock,
          fecha,
          id_tenant
        ]
      );
    }

    await connection.commit();

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
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
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
      "SELECT id_almacenO, id_almacenD, id_comprobante FROM nota WHERE id_nota = ? AND estado_nota = 0 AND id_tenant = ?",
      [notaId, id_tenant]
    );

    if (notaResult.length === 0) {
      return res.status(404).json({ message: "Nota no encontrada o ya anulada." });
    }

    const { id_almacenO, id_almacenD, id_comprobante } = notaResult[0];

    // Obtener los detalles de los productos de la nota
    const [detalleResult] = await connection.query(
      "SELECT id_producto, cantidad FROM detalle_nota WHERE id_nota = ? AND id_tenant = ?",
      [notaId, id_tenant]
    );

    for (let i = 0; i < detalleResult.length; i++) {
      const { id_producto, cantidad } = detalleResult[i];

      // Verificar stock antes de actualizar
      const [stockResult] = await connection.query(
        "SELECT stock FROM inventario WHERE id_producto = ? AND id_almacen = ? AND id_tenant = ?",
        [id_producto, id_almacenO, id_tenant]
      );

      if (!stockResult.length || stockResult[0].stock < cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para producto ID ${id_producto}.` });
      }

      // Actualizar stock en el almacén de origen
      const stockAnterior = stockResult[0].stock;
      await connection.query(
        "UPDATE inventario SET stock = stock + ? WHERE id_producto = ? AND id_almacen = ? AND id_tenant = ?",
        [cantidad, id_producto, id_almacenO, id_tenant]
      );

      // Obtener el ID del detalle de la nota
      const [detalleIdResult] = await connection.query(
        "SELECT id_detalle_nota FROM detalle_nota WHERE id_nota = ? AND id_producto = ? AND id_tenant = ?",
        [notaId, id_producto, id_tenant]
      );

      if (!detalleIdResult.length) {
        throw new Error(`Detalle de venta no encontrado para producto ID ${id_producto}.`);
      }

      const detalleId = detalleIdResult[0].id_detalle_nota;

      // Obtener la fecha de la nota
      const [fechaResult] = await connection.query(
        "SELECT fecha FROM nota WHERE id_nota = ? AND id_tenant = ?",
        [notaId, id_tenant]
      );

      if (!fechaResult.length) {
        throw new Error(`Fecha no encontrada para la nota ID ${notaId}.`);
      }

      const fechaNota = fechaResult[0].fecha;

      // Insertar en bitácora (corrigiendo el cálculo del stock actual)
      await connection.query(
        "INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, entra, stock_anterior, stock_actual, fecha, id_tenant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [notaId, id_producto, id_almacenO, detalleId, cantidad, stockAnterior, stockAnterior + cantidad, fechaNota, id_tenant]
      );
    }

    // Actualizar el estado de la nota a 1 (anulada)
    await connection.query(
      "UPDATE nota SET estado_nota = 1, u_modifica = ? WHERE id_nota = ? AND id_tenant = ?",
      [usuario, notaId, id_tenant]
    );

    await connection.commit();

    res.json({ code: 1, message: "Nota anulada correctamente" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
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