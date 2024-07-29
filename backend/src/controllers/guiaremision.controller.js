import { getConnection } from "./../database/database";

const getGuias = async (req, res) => {
    const {
        page = 0,
        limit = 10,
        num_guia = '',
        documento = '',
        nombre_sucursal = '',
        fecha_i = '2022-01-01',
        fecha_e = '2027-12-27'
    } = req.query;
    const offset = page * limit;

    try {
        const connection = await getConnection();

        // Obtener el número total de guías
        const [totalResult] = await connection.query("SELECT COUNT(*) as total FROM guia_remision");
        const totalGuias = totalResult[0].total;

        // Obtener las guías de remisión con paginación
        const [guiasResult] = await connection.query(
            `
            SELECT
                gr.id_guiaremision AS id,
                DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') AS fecha,
                c.num_comprobante AS num_guia,
                CASE 
                    WHEN d.dni IS NOT NULL THEN CONCAT(d.nombres, ' ', d.apellidos)
                    ELSE d.razon_social
                END AS cliente,
                COALESCE(d.dni, d.ruc) AS documento,
                CONCAT(v.nombres, ' ', v.apellidos) AS vendedor,
                SUBSTRING(c.num_comprobante, 2, 3) AS serieNum, 
                SUBSTRING(c.num_comprobante, 6, 8) AS num,
                gr.total,
                gr.glosa AS concepto,
                gr.estado_guia AS estado,
                s.nombre_sucursal
            FROM guia_remision gr
            INNER JOIN destinatario d ON gr.id_destinatario = d.id_destinatario
            INNER JOIN sucursal s ON gr.id_sucursal = s.id_sucursal
            INNER JOIN vendedor v ON s.dni = v.dni
            INNER JOIN comprobante c ON gr.id_comprobante = c.id_comprobante
            WHERE
                c.num_comprobante LIKE ?
                AND (d.dni LIKE ? OR d.ruc LIKE ?)
                AND DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') >= ? 
                AND DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') <= ?
                AND s.nombre_sucursal LIKE ?
            ORDER BY gr.f_generacion DESC
            LIMIT ? OFFSET ?;
            `,
            [`${num_guia}%`, `${documento}%`, `${documento}%`, fecha_i, fecha_e, `${nombre_sucursal}%`, parseInt(limit), parseInt(offset)]
        );

        const guias = await Promise.all(
            guiasResult.map(async (guia) => {
                const [detallesResult] = await connection.query(
                    `
                    SELECT 
                        de.id_producto AS codigo, 
                        m.nom_marca AS marca, 
                        p.descripcion, 
                        de.cantidad, 
                        p.undm AS um, 
                        de.precio, 
                        de.total,
                        a.nom_almacen AS almacen
                    FROM detalle_envio de
                    INNER JOIN producto p ON de.id_producto = p.id_producto
                    INNER JOIN marca m ON p.id_marca = m.id_marca
                    INNER JOIN inventario i ON de.id_producto = i.id_producto
                    INNER JOIN almacen a ON i.id_almacen = a.id_almacen
                    WHERE de.id_guiaremision = ? ;
                    `,
                    [guia.id]
                );

                return {
                    ...guia,
                    detalles: detallesResult,
                };
            })
        );

        res.json({ code: 1, data: guias, totalGuias });

    } catch (error) {
        console.error("Error obteniendo las guías de remisión:", error.message);
        res.status(500).send(error.message);
    }
};

export const methods = {
    getGuias
};
