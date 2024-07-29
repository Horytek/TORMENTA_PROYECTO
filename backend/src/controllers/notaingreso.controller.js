import { getConnection } from "../database/database";



const getIngresos = async (req, res) => {
  const { fecha_i = '2022-01-01', fecha_e = '2027-12-27', razon_social = '' , almacen= 2 } = req.query;

    try {
      const connection = await getConnection();
  
      const [ingresosResult] = await connection.query(
        `
                SELECT n.id_nota AS id,
                DATE_FORMAT(n.fecha, '%Y-%m-%d') AS fecha,
                n.nom_nota AS documento,
                n.id_almacenO AS almacen_O,
                n.id_almacenD AS almacen_D,
                CONCAT(d.nombres, ' ', d.apellidos) AS proveedor_n, 
                d.razon_social AS proveedor_r,
                n.glosa AS concepto,
                n.estado_nota AS estado
                FROM nota n
                LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
                WHERE n.id_nota = 1
                AND DATE_FORMAT(n.fecha, '%Y-%m-%d') >= ?
                AND DATE_FORMAT(n.fecha, '%Y-%m-%d') <= ?
                AND ( d.razon_social LIKE ? OR CONCAT(d.nombres, ' ', d.apellidos) LIKE ? )
                AND n.id_almacenD = ?
                GROUP BY id, fecha, documento,almacen_O,almacen_D, proveedor_n, proveedor_r, concepto ,estado
                ORDER BY n.fecha;

        `,
        [fecha_i,fecha_e, razon_social+'%', razon_social+'%', parseInt(almacen)]
      );
  
      // Obtener los detalles de venta correspondientes
      const ingresos = await Promise.all(
        ingresosResult.map(async (ingreso) => {
          const [detallesResult] = await connection.query(
            `
            SELECT dn.id_detalle_nota AS codigo, m.nom_marca AS marca , sc.nom_subcat AS categoria, p.descripcion AS descripcion, 
            dn.cantidad AS cantidad , p.undm AS unidad , dn.precio AS precio, dn.total AS total
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

export const methods = {
    getIngresos,
    getAlmacen

};

