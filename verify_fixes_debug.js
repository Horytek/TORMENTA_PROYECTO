
import { getConnection } from './src/database/database.js';

async function verifyQueries() {
    let connection;
    try {
        connection = await getConnection();
        console.log("Connected to DB.");

        // Test getDetalleKardex query syntax
        console.log("Testing getDetalleKardex query...");
        const fechaInicio = '2024-01-01';
        const fechaFin = '2024-12-31';
        const idProducto = 1; // Dummy ID
        const idAlmacen = 1; // Dummy ID
        const id_tenant = 1; // Dummy Tenant

        await connection.query(
            `SELECT
                bn.id_bitacora AS id,
                bn.fecha,
                DATE_FORMAT(bn.fecha, '%d/%m/%Y') AS fecha_formateada,
                COALESCE(c.num_comprobante, 'Sin comprobante') AS documento,
                COALESCE(n.nom_nota, 'Venta') AS nombre,
                bn.entra AS entra,
                bn.sale AS sale,
                bn.stock_actual AS stock,
                p.precio AS precio,
                COALESCE(n.glosa, 'VENTA DE PRODUCTOS') AS glosa,
                bn.hora_creacion,
                c.num_comprobante as num_comp_raw,
                -- Nuevos campos para historial detallado
                COALESCE(un.usua, uv.usua, 'Sistema') as usuario,
                COALESCE(ao.nom_almacen, abn.nom_almacen, 'N/A') as almacen_origen, 
                COALESCE(ad.nom_almacen, 'N/A') as almacen_destino,
                t.nombre as tonalidad,
                ta.nombre as talla,
                COALESCE(n.estado_nota, v.estado_venta, 1) as estado_doc,
                
                -- Productos de nota
                dn.id_producto AS nota_producto_codigo,
                pn.descripcion AS nota_producto_descripcion,
                mn.nom_marca AS nota_producto_marca,
                dn.cantidad AS nota_producto_cantidad,
                -- Productos de venta
                dv.id_producto AS venta_producto_codigo,
                pv.descripcion AS venta_producto_descripcion,
                mv.nom_marca AS venta_producto_marca,
                dv.cantidad AS venta_producto_cantidad
            FROM bitacora_nota bn
            INNER JOIN producto p ON bn.id_producto = p.id_producto 
            LEFT JOIN nota n ON bn.id_nota = n.id_nota
            LEFT JOIN venta v ON bn.id_venta = v.id_venta
            LEFT JOIN comprobante c ON COALESCE(n.id_comprobante, v.id_comprobante) = c.id_comprobante
            
            -- Joins para detalles extra
            LEFT JOIN usuario un ON n.id_usuario = un.id_usuario
            LEFT JOIN usuario uv ON v.u_modifica = uv.id_usuario
            LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen       -- Almacen Origen Nota
            LEFT JOIN almacen ad ON n.id_almacenD = ad.id_almacen       -- Almacen Destino Nota
            LEFT JOIN almacen abn ON bn.id_almacen = abn.id_almacen     -- Almacen Bitacora (Origen Venta)
            
            LEFT JOIN tonalidad t ON bn.id_tonalidad = t.id_tonalidad
            LEFT JOIN talla ta ON bn.id_talla = ta.id_talla

            -- JOIN para productos de nota
            LEFT JOIN detalle_nota dn ON n.id_nota = dn.id_nota
            LEFT JOIN producto pn ON dn.id_producto = pn.id_producto
            LEFT JOIN marca mn ON pn.id_marca = mn.id_marca
            -- JOIN para productos de venta
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            LEFT JOIN producto pv ON dv.id_producto = pv.id_producto
            LEFT JOIN marca mv ON pv.id_marca = mv.id_marca
            WHERE bn.fecha >= ?
                AND bn.fecha < DATE_ADD(?, INTERVAL 1 DAY)
                AND bn.id_producto = ?
                AND bn.id_almacen = ?
                AND bn.id_tenant = ?
            ORDER BY bn.fecha ASC, bn.hora_creacion ASC LIMIT 1`,
            [fechaInicio, fechaFin, idProducto, idAlmacen, id_tenant]
        );
        console.log("getDetalleKardex query passed!");

        // Test getInfProducto query syntax
        console.log("Testing getInfProducto query...");
        await connection.query(
            `SELECT 
                p.id_producto AS codigo, 
                p.descripcion AS descripcion, 
                m.nom_marca AS marca, 
                COALESCE(i.stock, 0) AS stock
            FROM producto p 
            INNER JOIN marca m ON p.id_marca = m.id_marca
            LEFT JOIN inventario i ON p.id_producto = i.id_producto AND i.id_almacen = ?
            WHERE p.id_producto = ?
                AND p.id_tenant = ?
            LIMIT 1`,
            [idAlmacen, idProducto, id_tenant]
        );
        console.log("getInfProducto query passed!");

    } catch (error) {
        console.error('Query Verification Failed:', error);
    } finally {
        if (connection) {
            process.exit(0);
        }
    }
}

verifyQueries();
