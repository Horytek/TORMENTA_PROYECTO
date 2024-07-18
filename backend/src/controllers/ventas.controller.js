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
  

export const methods = {
    getVentas,
    getProductosVentas
};