import { getConnection } from "../database/database";



const getSalidas = async (req, res) => {
  const { fecha_i = '2022-01-01', fecha_e = '2027-12-27', razon_social = '', almacen = '%' } = req.query;

  try {
      const connection = await getConnection();

      const [ingresosResult] = await connection.query(
          `
          SELECT 
              n.id_nota AS id,
              DATE_FORMAT(n.fecha, '%Y-%m-%d') AS fecha,
              n.nom_nota AS documento,
              ao.nom_almacen AS almacen_O,
              ad.nom_almacen AS almacen_D,
              COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor,
              n.glosa AS concepto,
              n.estado_nota AS estado,
              IFNULL(SUM(dn.total), 0) AS total_nota
          FROM 
              nota n
          LEFT JOIN 
              destinatario d ON n.id_destinatario = d.id_destinatario
          LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen
          LEFT JOIN almacen ad ON n.id_almacenD= ad.id_almacen
          LEFT JOIN 
              detalle_nota dn ON n.id_nota = dn.id_nota
          WHERE 
              n.id_tiponota = 2
              AND DATE_FORMAT(n.fecha, '%Y-%m-%d') >= ?
              AND DATE_FORMAT(n.fecha, '%Y-%m-%d') <= ?
              AND (d.razon_social LIKE ? OR CONCAT(d.nombres, ' ', d.apellidos) LIKE ?)
              AND (? = '%' OR n.id_almacenD = ?)
          GROUP BY 
              id, fecha, documento, almacen_O, almacen_D, proveedor, concepto, estado
          ORDER BY 
              n.fecha;
          `,
          [fecha_i, fecha_e, `%${razon_social}%`, `%${razon_social}%`, almacen, almacen]
      );

      // Obtener los detalles de venta correspondientes
      const ingresos = await Promise.all(
          ingresosResult.map(async (ingreso) => {
              const [detallesResult] = await connection.query(
                  `
                  SELECT dn.id_detalle_nota AS codigo, m.nom_marca AS marca, sc.nom_subcat AS categoria, p.descripcion AS descripcion, 
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
  }
};
const getAlmacen = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT a.id_almacen AS id, a.nom_almacen AS almacen, s.nombre_sucursal AS sucursal 
            FROM almacen a 
            INNER JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
            INNER JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
            WHERE a.estado_almacen = 0
        `);
        res.json({ code: 1, data: result, message: "Almacenes listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};
const getProductos = async (req, res) => {
    const { descripcion = '', almacen = 1 } = req.query;
  
    console.log('Filtros recibidos:', { descripcion, almacen });
  
    try {
      const connection = await getConnection();
  
      const [productosResult] = await connection.query(
        `
        SELECT p.id_producto AS codigo, p.descripcion AS descripcion, m.nom_marca AS marca, i.stock AS stock 
        FROM producto p 
        INNER JOIN marca m ON p.id_marca= m.id_marca 
        INNER JOIN inventario i ON p.id_producto = i.id_producto
        INNER JOIN detalle_nota dn ON p.id_producto = dn.id_producto
        INNER JOIN nota n ON dn.id_nota = n.id_nota 
        WHERE n.id_tiponota = 2
        AND p.descripcion LIKE ?
        AND i.id_almacen = ?
        GROUP BY codigo, descripcion, marca, stock;
        `,
        [`${descripcion}%`, almacen]
      );
  
      console.log('Productos encontrados:', productosResult);
  
      res.json({ code: 1, data: productosResult });
    } catch (error) {
      res.status(500).send(error.message);
    }
  };
  
  const getNuevoDocumento = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT CONCAT('400-', LPAD(SUBSTRING(MAX(nom_nota), 5) + 1, 8, '0')) AS nuevo_numero_de_nota
            FROM nota;
        `);
        res.json({ code: 1, data: result, message: "Nuevo numero de nota" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};
const getDestinatario = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_destinatario AS id,COALESCE(ruc, dni) AS documento ,COALESCE(razon_social, CONCAT(nombres, ' ', apellidos)) AS destinatario 
            FROM destinatario;

        `);
        res.json({ code: 1, data: result, message: "Destinatarios listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};
const insertNotaAndDetalle = async (req, res) => {
    const { almacenO, almacenD, destinatario, comprobante, glosa, fecha, producto, nota, cantidad } = req.body;
  
    try {
      const connection = await getConnection();
  
      // Iniciar la transacción
      await connection.beginTransaction();
  
      // Insertar la nota
      const [notaResult] = await connection.query(
        `
        INSERT INTO nota (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, glosa, fecha, nom_nota, estado_nota) 
        VALUES (?, ?, 1, ?, ?, ?, ?, 0);
        `,
        [almacenO, almacenD, 2, destinatario, comprobante, glosa, fecha, nota]
      );
  
      const id_nota = notaResult.insertId;
  
      // Insertar el detalle de la nota
      await connection.query(
        `
        INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total) 
        VALUES (?, ?, ?, 0, 0);
        `,
        [producto, id_nota, cantidad]
      );
  
      // Verificar si el producto existe en el almacén
      const [productoExistente] = await connection.query(
        `
        SELECT 1 FROM producto WHERE id_producto = ?;
        `,
        [producto]
      );
  
      if (productoExistente.length > 0) {
        // Actualizar el inventario si el producto existe en el almacén
        await connection.query(
          `
          UPDATE inventario 
          SET stock = stock - ? 
          WHERE id_producto = ? 
          AND id_almacen = ?;
          `,
          [cantidad, producto, almacenD]
        );
      } else {
        // Insertar nuevo inventario si el producto no existe en el almacén
        await connection.query(
          `
          INSERT INTO inventario (id_producto, id_almacen, stock) 
          VALUES (?, ?, ?);
          `,
          [producto, almacenD, cantidad]
        );
      }
  
      // Confirmar la transacción
      await connection.commit();
  
      res.json({ code: 1, message: 'Nota y detalle insertados correctamente' });
    } catch (error) {
      // Revertir la transacción en caso de error
      await connection.rollback();
      res.status(500).send(error.message);
    } finally {
      connection.release();
    }
  };

export const methods = {
    getSalidas,
    getAlmacen,
    getProductos,
    getNuevoDocumento,
    getDestinatario,
    insertNotaAndDetalle
};

