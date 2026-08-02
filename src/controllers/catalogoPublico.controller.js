import { getConnection } from "./../database/database.js";
import { stockPorProducto } from "../services/inventario/stockRepository.js";
import { listarPorProductos } from "../services/producto/productoImagenRepository.js";

/**
 * Catálogo digital público (sin auth) — vitrina por tenant para pedidos por
 * WhatsApp. Deliberadamente expone solo lo que un cliente necesita ver:
 * nada de costos, RUC, email ni otros datos internos de `empresa`.
 *
 * `id_tenant` viaja en la URL (no hay slug todavía — agregar uno es una
 * mejora de UX futura, no bloquea esta versión).
 */
const getCatalogoPublico = async (req, res) => {
    let connection;
    try {
        const id_tenant = Number(req.params.id_tenant);
        if (!Number.isInteger(id_tenant) || id_tenant <= 0) {
            return res.status(400).json({ code: 0, message: "Tenant inválido" });
        }

        connection = await getConnection();

        const [[negocio]] = await connection.query(
            "SELECT nombreComercial, razonSocial, telefono, logotipo, direccion FROM empresa WHERE id_tenant = ? LIMIT 1",
            [id_tenant]
        );
        if (!negocio) {
            return res.status(404).json({ code: 0, message: "Catálogo no encontrado" });
        }

        const [productos] = await connection.query(`
            SELECT PR.id_producto AS codigo, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
                   PR.imagen_url, PR.undm, MA.nom_marca, CA.nom_subcat AS categoria
            FROM producto PR
            INNER JOIN marca MA ON MA.id_marca = PR.id_marca
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
            WHERE PR.estado_producto = 1 AND PR.id_tenant = ?
            ORDER BY PR.descripcion
        `, [id_tenant]);

        const stockMap = await stockPorProducto(connection, {
            id_tenant,
            ids_producto: productos.map((p) => p.codigo),
        });
        const imagesMap = await listarPorProductos(connection, {
            id_tenant,
            ids_producto: productos.map((p) => p.codigo),
        });

        const data = productos
            .map((p) => ({ ...p, stock: stockMap.get(p.codigo) ?? 0, images: imagesMap.get(p.codigo) ?? [] }))
            .filter((p) => p.stock > 0);

        res.json({
            code: 1,
            data: {
                negocio: {
                    nombre: negocio.nombreComercial || negocio.razonSocial,
                    telefono: negocio.telefono,
                    logo: negocio.logotipo,
                    direccion: negocio.direccion,
                },
                productos: data,
            },
        });
    } catch (error) {
        console.error('Error en getCatalogoPublico:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getCatalogoPublico };
