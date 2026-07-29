import { getConnection } from "../database/database.js";

// Cache para consultas frecuentes
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpieza periódica del caché
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

// OBTENER TODOS LOS VENDEDORES - OPTIMIZADO CON CACHÉ
const getVendedores = async (req, res) => {
    const id_tenant = req.id_tenant;
    const cacheKey = `vendedores_${id_tenant}`;

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({
                code: 1,
                data: cached.data,
                message: "Vendedores listados (caché)"
            });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(`
            SELECT
                ve.dni,
                usu.usua,
                CONCAT(ve.nombres, ' ', ve.apellidos) AS nombre,
                ve.nombres,
                ve.apellidos,
                ve.telefono,
                ve.estado_vendedor,
                ve.id_usuario,
                ve.porcentaje_comision,
                ve.meta_mensual
            FROM vendedor ve
            INNER JOIN usuario usu ON usu.id_usuario = ve.id_usuario
            WHERE ve.id_tenant = ?
            ORDER BY ve.nombres, ve.apellidos
        `, [id_tenant]);

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json({
            code: 1,
            data: result,
            message: "Vendedores listados"
        });
    } catch (error) {
        console.error('Error en getVendedores:', error);
        if (!res.headersSent) {
            res.status(500).json({
                code: 0,
                message: "Error interno del servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER UN VENDEDOR - OPTIMIZADO
const getVendedor = async (req, res) => {
    const { dni } = req.params;
    const id_tenant = req.id_tenant;

    if (!dni) {
        return res.status(400).json({
            code: 0,
            message: "El DNI del vendedor es obligatorio"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(`
            SELECT 
                ve.dni, 
                usu.usua, 
                CONCAT(ve.nombres, ' ', ve.apellidos) AS nombre, 
                ve.nombres, 
                ve.apellidos, 
                ve.telefono, 
                ve.estado_vendedor, 
                ve.id_usuario
            FROM vendedor ve 
            INNER JOIN usuario usu ON usu.id_usuario = ve.id_usuario
            WHERE ve.dni = ? AND ve.id_tenant = ?
            LIMIT 1
        `, [dni, id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({
                code: 0,
                data: [],
                message: "Vendedor no encontrado"
            });
        }

        res.json({
            code: 1,
            data: result[0],
            message: "Vendedor encontrado"
        });
    } catch (error) {
        console.error('Error en getVendedor:', error);
        if (!res.headersSent) {
            res.status(500).json({
                code: 0,
                message: "Error interno del servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// AGREGAR VENDEDOR - OPTIMIZADO
const addVendedor = async (req, res) => {
    const { dni, id_usuario, nombres, apellidos, telefono, estado_vendedor, porcentaje_comision, meta_mensual } = req.body;
    const id_tenant = req.id_tenant;

    // Validaciones mejoradas
    if (!dni || dni.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "El DNI es obligatorio"
        });
    }

    if (!id_usuario) {
        return res.status(400).json({
            code: 0,
            message: "El ID de usuario es obligatorio"
        });
    }

    if (!nombres || nombres.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "El nombre es obligatorio"
        });
    }

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
        return res.status(400).json({
            code: 0,
            message: "El DNI debe tener 8 dígitos numéricos"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que el DNI no exista
        const [dniExiste] = await connection.query(
            'SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? LIMIT 1',
            [dni, id_tenant]
        );

        if (dniExiste.length > 0) {
            return res.status(400).json({
                code: 0,
                message: "Ya existe un vendedor con ese DNI"
            });
        }

        // Verificar que el usuario existe
        const [usuarioExiste] = await connection.query(
            'SELECT id_usuario FROM usuario WHERE id_usuario = ? AND id_tenant = ? LIMIT 1',
            [id_usuario, id_tenant]
        );

        if (usuarioExiste.length === 0) {
            return res.status(400).json({
                code: 0,
                message: "El usuario especificado no existe"
            });
        }

        await connection.beginTransaction();

        const vendedor = {
            dni: dni.trim(),
            id_usuario,
            nombres: nombres.trim(),
            apellidos: apellidos?.trim() || '',
            telefono: telefono?.trim() || '',
            estado_vendedor: estado_vendedor !== undefined ? estado_vendedor : 1,
            porcentaje_comision: porcentaje_comision ?? null,
            meta_mensual: meta_mensual ?? null,
            id_tenant
        };

        await connection.query("INSERT INTO vendedor SET ?", vendedor);

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.status(201).json({
            code: 1,
            message: "Vendedor añadido con éxito",
            data: { dni: vendedor.dni }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addVendedor:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                code: 0,
                message: "Ya existe un vendedor con ese DNI"
            });
        } else if (!res.headersSent) {
            res.status(500).json({
                code: 0,
                message: "Error interno del servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ACTUALIZAR VENDEDOR - OPTIMIZADO
const updateVendedor = async (req, res) => {
    const { dni } = req.params; // DNI original
    const { nuevo_dni, id_usuario, nombres, apellidos, telefono, estado_vendedor, porcentaje_comision, meta_mensual } = req.body;
    const id_tenant = req.id_tenant;

    // Validaciones mejoradas
    if (!dni) {
        return res.status(400).json({
            code: 0,
            message: "El DNI del vendedor es obligatorio"
        });
    }

    if (!nombres || nombres.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "El nombre es obligatorio"
        });
    }

    // Validar formato de nuevo DNI si se proporciona
    if (nuevo_dni && !/^\d{8}$/.test(nuevo_dni)) {
        return res.status(400).json({
            code: 0,
            message: "El nuevo DNI debe tener 8 dígitos numéricos"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si el vendedor existe
        const [vendedorExiste] = await connection.query(
            "SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? LIMIT 1",
            [dni, id_tenant]
        );

        if (vendedorExiste.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Vendedor no encontrado"
            });
        }

        // Si el DNI cambia, verificar que no esté en uso
        if (nuevo_dni && nuevo_dni !== dni) {
            const [dniEnUso] = await connection.query(
                "SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? LIMIT 1",
                [nuevo_dni, id_tenant]
            );

            if (dniEnUso.length > 0) {
                return res.status(400).json({
                    code: 0,
                    message: "El nuevo DNI ya está en uso"
                });
            }
        }

        // Si se cambia el usuario, verificar que existe
        if (id_usuario) {
            const [usuarioExiste] = await connection.query(
                'SELECT id_usuario FROM usuario WHERE id_usuario = ? AND id_tenant = ? LIMIT 1',
                [id_usuario, id_tenant]
            );

            if (usuarioExiste.length === 0) {
                return res.status(400).json({
                    code: 0,
                    message: "El usuario especificado no existe"
                });
            }
        }

        // Obtener datos actuales del vendedor (para el swap y para no borrar
        // porcentaje_comision/meta_mensual cuando el caller no los manda)
        const [currentData] = await connection.query(
            'SELECT id_usuario, porcentaje_comision, meta_mensual FROM vendedor WHERE dni = ? AND id_tenant = ?',
            [dni, id_tenant]
        );
        const currentUserId = currentData[0]?.id_usuario;

        await connection.beginTransaction();

        // LOGIC SWAP: Si cambiamos de usuario
        if (id_usuario && parseInt(id_usuario) !== parseInt(currentUserId)) {
            // Verificar si el NUEVO usuario ya está asignado a OTRO vendedor
            const [otherVendor] = await connection.query(
                'SELECT dni FROM vendedor WHERE id_usuario = ? AND id_tenant = ? AND dni != ?',
                [id_usuario, id_tenant, dni]
            );

            if (otherVendor.length > 0) {
                // EL INTERCAMBIO:
                // El otro vendedor recibe el usuario que SOLTAMOS (currentUserId)
                // Si el vendedor actual no tenía usuario (currentUserId null), el otro vendedor se queda sin usuario (null).

                await connection.query(
                    'UPDATE vendedor SET id_usuario = ? WHERE dni = ? AND id_tenant = ?',
                    [currentUserId, otherVendor[0].dni, id_tenant]
                );
            }
        }

        const [result] = await connection.query(`
            UPDATE vendedor
            SET dni = ?,
                id_usuario = ?,
                nombres = ?,
                apellidos = ?,
                telefono = ?,
                estado_vendedor = ?,
                porcentaje_comision = ?,
                meta_mensual = ?
            WHERE dni = ? AND id_tenant = ?
        `, [
            nuevo_dni || dni,
            id_usuario,
            nombres.trim(),
            apellidos?.trim() || '',
            telefono?.trim() || '',
            estado_vendedor !== undefined ? estado_vendedor : 1,
            porcentaje_comision !== undefined ? porcentaje_comision : currentData[0]?.porcentaje_comision ?? null,
            meta_mensual !== undefined ? meta_mensual : currentData[0]?.meta_mensual ?? null,
            dni,
            id_tenant
        ]);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(400).json({
                code: 0,
                message: "No se realizó ninguna actualización"
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({
            code: 1,
            message: "Vendedor actualizado con éxito",
            data: { dni: nuevo_dni || dni }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateVendedor:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                code: 0,
                message: "El nuevo DNI ya está en uso"
            });
        } else {
            res.status(500).json({
                code: 0,
                message: "Error interno del servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// DESACTIVAR VENDEDOR
// "Dar de baja" siempre desactiva y nunca borra — para eliminar de verdad ya
// existe `deleteVendedor`, con su propia confirmación en el frontend. Antes
// esta acción borraba el registro sin aviso cuando el vendedor no tenía
// sucursal asociada, lo que la volvía irreversible pese a llamarse "baja".
const deactivateVendedor = async (req, res) => {
    const { dni } = req.params;
    const id_tenant = req.id_tenant;

    if (!dni || dni.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "El DNI es obligatorio"
        });
    }

    if (!/^\d{8}$/.test(dni)) {
        return res.status(400).json({
            code: 0,
            message: "DNI inválido. Debe tener 8 dígitos numéricos"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        const [updateResult] = await connection.query(
            "UPDATE vendedor SET estado_vendedor = 0 WHERE dni = ? AND id_tenant = ?",
            [dni, id_tenant]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "Vendedor no encontrado"
            });
        }

        queryCache.clear();

        return res.json({
            code: 1,
            message: "Vendedor desactivado"
        });
    } catch (error) {
        console.error('Error en deactivateVendedor:', error);
        res.status(500).json({
            code: 0,
            message: "Error interno del servidor"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// REACTIVAR VENDEDOR — acción explícita, simétrica a desactivar. Antes
// "Reactivar" abría el formulario de edición y reactivaba solo como efecto
// secundario de guardar, sin que el usuario lo decidiera directamente.
const reactivateVendedor = async (req, res) => {
    const { dni } = req.params;
    const id_tenant = req.id_tenant;

    if (!dni || !/^\d{8}$/.test(dni)) {
        return res.status(400).json({
            code: 0,
            message: "DNI inválido. Debe tener 8 dígitos numéricos"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        const [updateResult] = await connection.query(
            "UPDATE vendedor SET estado_vendedor = 1 WHERE dni = ? AND id_tenant = ?",
            [dni, id_tenant]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "Vendedor no encontrado"
            });
        }

        queryCache.clear();

        return res.json({
            code: 1,
            message: "Vendedor reactivado"
        });
    } catch (error) {
        console.error('Error en reactivateVendedor:', error);
        res.status(500).json({
            code: 0,
            message: "Error interno del servidor"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ELIMINAR VENDEDOR - OPTIMIZADO CON VERIFICACIONES
const deleteVendedor = async (req, res) => {
    const { dni } = req.params;
    const id_tenant = req.id_tenant;

    if (!dni) {
        return res.status(400).json({
            code: 0,
            message: "El DNI del vendedor es obligatorio"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si el vendedor existe
        const [vendedorExiste] = await connection.query(
            "SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? LIMIT 1",
            [dni, id_tenant]
        );

        if (vendedorExiste.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Vendedor no encontrado"
            });
        }

        // Verificar si tiene sucursales asociadas
        const [sucursales] = await connection.query(
            'SELECT COUNT(*) as total FROM sucursal WHERE dni = ? AND id_tenant = ?',
            [dni, id_tenant]
        );

        if (sucursales[0].total > 0) {
            return res.status(400).json({
                code: 0,
                message: `No se puede eliminar el vendedor porque tiene ${sucursales[0].total} sucursal(es) asociada(s). Considere desactivarlo en lugar de eliminarlo.`
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            "DELETE FROM vendedor WHERE dni = ? AND id_tenant = ?",
            [dni, id_tenant]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "No se pudo eliminar el vendedor"
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({
            code: 1,
            message: "Vendedor eliminado correctamente"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteVendedor:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                code: 0,
                message: "No se puede eliminar el vendedor porque tiene datos relacionados"
            });
        } else if (!res.headersSent) {
            res.status(500).json({
                code: 0,
                message: "Error interno del servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Comisiones por vendedor en un rango de fechas — solo cuenta ventas
// atribuidas (dni_vendedor no nulo) y con estado activo (no anuladas).
const getComisiones = async (req, res) => {
    const id_tenant = req.id_tenant;
    const { fecha_inicio, fecha_fin } = req.query;
    let connection;

    try {
        connection = await getConnection();

        const where = ["v.estado_venta != 0", "v.id_tenant = ?", "v.dni_vendedor IS NOT NULL"];
        const params = [id_tenant];
        if (fecha_inicio) { where.push("v.f_venta >= ?"); params.push(fecha_inicio); }
        if (fecha_fin) { where.push("v.f_venta <= ?"); params.push(fecha_fin); }

        const [rows] = await connection.query(`
            SELECT
                ve.dni,
                CONCAT(ve.nombres, ' ', ve.apellidos) AS nombre,
                ve.porcentaje_comision,
                ve.meta_mensual,
                COUNT(DISTINCT v.id_venta) AS cantidad_ventas,
                COALESCE(SUM(dv.total), 0) AS total_ventas
            FROM venta v
            INNER JOIN vendedor ve ON ve.dni = v.dni_vendedor AND ve.id_tenant = v.id_tenant
            INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
            WHERE ${where.join(" AND ")}
            GROUP BY ve.dni, ve.nombres, ve.apellidos, ve.porcentaje_comision, ve.meta_mensual
            ORDER BY total_ventas DESC
        `, params);

        const data = rows.map((r) => ({
            ...r,
            comision: r.porcentaje_comision != null ? Number(r.total_ventas) * (Number(r.porcentaje_comision) / 100) : null,
            pct_meta: r.meta_mensual != null && Number(r.meta_mensual) > 0 ? (Number(r.total_ventas) / Number(r.meta_mensual)) * 100 : null,
        }));

        res.json({ code: 1, data });
    } catch (error) {
        console.error('Error en getComisiones:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getVendedores,
    getVendedor,
    addVendedor,
    updateVendedor,
    deactivateVendedor,
    reactivateVendedor,
    deleteVendedor,
    getComisiones
};
