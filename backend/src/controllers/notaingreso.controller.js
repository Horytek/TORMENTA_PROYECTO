import { getConnection } from "../database/database";


const getIngresoxs = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
                SELECT n.fecha AS fecha, n.nom_nota AS documento, CONCAT(d.apellidos, ' ', d.nombres, ' ', d.razon_social) AS proveedor, n.glosa AS concepto, 
                n.estado_nota AS estado
                FROM nota n
                LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
                WHERE id_nota = 1;
            `);
        res.json({code:1, data: result, message: "Ingresos listados"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};
const getIngresos = async (req, res) => {
    try {
      const connection = await getConnection();
  
      const [ingresosResult] = await connection.query(
        `
          SELECT n.fecha AS fecha, n.nom_nota AS documento, CONCAT(d.apellidos, ' ', d.nombres, ' ', d.razon_social) AS proveedor, n.glosa AS concepto, 
                n.estado_nota AS estado
                FROM nota n
                LEFT JOIN destinatario d ON n.id_destinatario = d.id_destinatario
                WHERE id_nota = 1;
        `
      );
  
      // Obtener los detalles de venta correspondientes
      const ingresos = await Promise.all(
        ingresosResult.map(async (venta) => {
          const [detallesResult] = await connection.query(
            `
            SELECT dv.id_detalle AS codigo, pr.descripcion AS nombre, dv.cantidad AS cantidad, dv.precio AS precio, dv.descuento AS descuento, dv.total AS subtotal
            FROM detalle_venta dv
            INNER JOIN producto pr ON pr.id_producto = dv.id_producto
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
  
      res.json({ code: 1, data: ingresos, totalVentas });
    } catch (error) {
      res.status(500).send(error.message);
    }
  };
export const methods = {
    getIngresos

};

