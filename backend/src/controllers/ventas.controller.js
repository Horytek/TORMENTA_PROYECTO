import { getConnection } from "./../database/database";

const getVentas = async (req, res) => {
    try {
        const connection = await getConnection();

        // Consulta para obtener las ventas
        const [ventas] = await connection.query(`
            SELECT v.id_venta AS id, SUBSTRING(com.num_comprobante,2,3) AS serieNum, SUBSTRING(com.num_comprobante,6,8) AS  num,
tp.nom_tipocomp AS tipoComprobante, CONCAT(cl.nombres,' ', cl.apellidos) AS cliente_n, cl.razon_social AS cliente_r,
cl.dni AS dni, cl.ruc AS ruc, DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha, v.igv AS igv, SUM(dv.total) AS total, CONCAT(ve.nombres,' ', ve.apellidos) AS cajero,
ve.dni AS  cajeroId, v.estado_venta AS estado
FROM venta v INNER JOIN comprobante com ON com.id_comprobante=v.id_comprobante
INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante=com.id_tipocomprobante
INNER JOIN cliente cl ON cl.id_cliente=v.id_cliente
INNER JOIN detalle_venta dv ON dv.id_venta=v.id_venta
INNER JOIN sucursal s ON s.id_sucursal= v.id_sucursal
INNER JOIN vendedor ve ON ve.dni=s.dni
GROUP BY id, serieNum, num, tipoComprobante, cliente_n,cliente_r,dni,ruc,fecha,igv,cajero, cajeroId, estado
        `);

        // Consulta para obtener los detalles de ventas
        const [detalles] = await connection.query(`
            SELECT dv.id_venta,dv.id_detalle AS codigo ,pr.descripcion AS nombre, dv.cantidad AS cantidad, dv.precio AS precio, dv.descuento AS descuento, dv.total AS subtotal FROM venta v 
INNER JOIN detalle_venta dv ON dv.id_venta=v.id_venta
INNER JOIN producto pr ON pr.id_producto=dv.id_producto
        `);

        // Combinar los resultados: Agregar detalles de venta a cada venta
        const ventasConDetalles = ventas.map(venta => {
            return {
                ...venta,
                detalles: detalles.filter(detalle => detalle.id_venta === venta.id)
            };
        });

        // Enviar los resultados combinados como respuesta
        res.json({ code: 1, data: ventasConDetalles, message: "Ventas y detalles listados" });
    } catch (error) {
        res.status(500).send(error.message);
    }
};




export const methods = {
    getVentas
};