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

// OBTENER SUCURSALES PARA INICIO - OPTIMIZADO CON CACHÉ
const getSucursalInicio = async (req, res) => {
    const { nombre = '' } = req.query;
    const id_tenant = req.id_tenant;
    const cacheKey = `sucursal_inicio_${nombre}_${id_tenant}`;
    
    // Verificar caché solo si no hay búsqueda específica o si es corta
    if (!nombre || nombre.length < 3) {
        if (queryCache.has(cacheKey)) {
            const cached = queryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return res.json({ 
                    code: 1, 
                    data: cached.data, 
                    message: "Sucursales listadas (caché)" 
                });
            }
            queryCache.delete(cacheKey);
        }
    }
    
    let connection;
    try {
        connection = await getConnection();

        const query = `
            SELECT 
                s.id_sucursal AS id,
                s.nombre_sucursal AS nombre
            FROM sucursal s
            WHERE s.nombre_sucursal LIKE ? 
                AND s.id_tenant = ?
                AND s.estado_sucursal = 1
            ORDER BY s.nombre_sucursal
            LIMIT 100
        `;

        const params = [`%${nombre}%`, id_tenant];
        const [result] = await connection.query(query, params);

        // Guardar en caché solo si no hay búsqueda específica
        if (!nombre || nombre.length < 3) {
            queryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }

        res.json({ code: 1, data: result, message: "Sucursales listadas" });

    } catch (error) {
        console.error('Error en getSucursalInicio:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER SUCURSALES CON FILTROS - OPTIMIZADO
const getSucursales = async (req, res) => {
    const { nombre = '', estado = '' } = req.query;
    const id_tenant = req.id_tenant;
    
    let connection;
    try {
        connection = await getConnection();

        // Construir query dinámica de forma más eficiente
        const whereClauses = ['s.id_tenant = ?'];
        const params = [id_tenant];

        if (nombre) {
            whereClauses.push('s.nombre_sucursal LIKE ?');
            params.push(`%${nombre}%`);
        }

        if (estado && estado !== '%') {
            whereClauses.push('s.estado_sucursal = ?');
            params.push(parseInt(estado));
        }

        const query = `
            SELECT 
                s.id_sucursal AS id,
                s.dni,
                s.nombre_sucursal,
                s.ubicacion,
                s.estado_sucursal,
                COALESCE(CONCAT(v.nombres, ' ', v.apellidos), 'Sin vendedor') AS nombre_vendedor
            FROM sucursal s
            LEFT JOIN vendedor v ON s.dni = v.dni AND v.id_tenant = s.id_tenant
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY s.nombre_sucursal
            LIMIT 200
        `;

        const [result] = await connection.query(query, params);

        res.json({ code: 1, data: result, message: "Sucursales listadas" });

    } catch (error) {
        console.error('Error en getSucursales:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// INSERTAR SUCURSAL - OPTIMIZADO
const insertSucursal = async (req, res) => {
    const { dni, nombre_sucursal, ubicacion, estado_sucursal } = req.body;
    const id_tenant = req.id_tenant;

    // Validación mejorada
    if (!dni || !nombre_sucursal || !ubicacion || estado_sucursal === undefined) {
        return res.status(400).json({ 
            code: 0,
            message: "Campos requeridos: dni, nombre_sucursal, ubicacion, estado_sucursal" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si el vendedor existe antes de insertar
        const [vendedorExiste] = await connection.query(
            'SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? AND estado_vendedor = 1',
            [dni, id_tenant]
        );

        if (vendedorExiste.length === 0) {
            return res.status(400).json({ 
                code: 0,
                message: "El vendedor especificado no existe o está inactivo" 
            });
        }

        // Verificar si ya existe una sucursal con ese nombre
        const [sucursalExiste] = await connection.query(
            'SELECT id_sucursal FROM sucursal WHERE nombre_sucursal = ? AND id_tenant = ?',
            [nombre_sucursal, id_tenant]
        );

        if (sucursalExiste.length > 0) {
            return res.status(400).json({ 
                code: 0,
                message: "Ya existe una sucursal con ese nombre" 
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO sucursal (dni, nombre_sucursal, ubicacion, estado_sucursal, id_tenant)
             VALUES (?, ?, ?, ?, ?)`,
            [dni, nombre_sucursal.trim(), ubicacion, estado_sucursal, id_tenant]
        );

        await connection.commit();

        // Limpiar caché relacionado
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: 'Sucursal insertada correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en insertSucursal:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "La sucursal ya existe" 
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

// ACTUALIZAR SUCURSAL - OPTIMIZADO
const updateSucursal = async (req, res) => {
    const { id, dni, nombre_sucursal, ubicacion, estado_sucursal } = req.body;
    const id_tenant = req.id_tenant;

    // Validación mejorada
    if (!id) {
        return res.status(400).json({ 
            code: 0,
            message: "El ID de la sucursal es obligatorio" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si la sucursal existe antes de actualizar
        const [sucursalExiste] = await connection.query(
            'SELECT id_sucursal FROM sucursal WHERE id_sucursal = ? AND id_tenant = ?',
            [id, id_tenant]
        );

        if (sucursalExiste.length === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "Sucursal no encontrada" 
            });
        }

        // Si se proporciona DNI, verificar que el vendedor existe
        if (dni) {
            const [vendedorExiste] = await connection.query(
                'SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? AND estado_vendedor = 1',
                [dni, id_tenant]
            );

            if (vendedorExiste.length === 0) {
                return res.status(400).json({ 
                    code: 0,
                    message: "El vendedor especificado no existe o está inactivo" 
                });
            }
        }

        // Construir query dinámica solo con campos proporcionados
        const updates = [];
        const params = [];

        if (dni !== undefined) {
            updates.push('dni = ?');
            params.push(dni);
        }
        if (nombre_sucursal !== undefined) {
            updates.push('nombre_sucursal = ?');
            params.push(nombre_sucursal.trim());
        }
        if (ubicacion !== undefined) {
            updates.push('ubicacion = ?');
            params.push(ubicacion);
        }
        if (estado_sucursal !== undefined) {
            updates.push('estado_sucursal = ?');
            params.push(estado_sucursal);
        }

        if (updates.length === 0) {
            return res.status(400).json({ 
                code: 0,
                message: "No se proporcionaron campos para actualizar" 
            });
        }

        await connection.beginTransaction();

        const query = `
            UPDATE sucursal
            SET ${updates.join(', ')}
            WHERE id_sucursal = ? AND id_tenant = ?
        `;

        params.push(id, id_tenant);

        const [result] = await connection.query(query, params);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "No se pudo actualizar la sucursal" 
            });
        }

        // Limpiar caché relacionado
        queryCache.clear();

        res.json({ code: 1, message: 'Sucursal actualizada correctamente' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateSucursal:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "Ya existe otra sucursal con ese nombre" 
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

// OBTENER VENDEDORES - OPTIMIZADO CON CACHÉ
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

        const query = `
            SELECT 
                dni,
                CONCAT(nombres, ' ', apellidos) AS nombre_completo,
                nombres,
                apellidos,
                telefono
            FROM vendedor
            WHERE estado_vendedor = 1 
                AND id_tenant = ?
            ORDER BY nombres, apellidos
        `;

        const [vendedores] = await connection.query(query, [id_tenant]);

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: vendedores,
            timestamp: Date.now()
        });

        res.json({ 
            code: 1, 
            data: vendedores, 
            message: "Vendedores listados correctamente" 
        });

    } catch (error) {
        console.error('Error en getVendedores:', error);
        res.status(500).json({ 
            code: 0, 
            message: "Error al obtener la lista de vendedores" 
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ELIMINAR SUCURSAL - OPTIMIZADO
const deleteSucursal = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    if (!id) {
        return res.status(400).json({ 
            code: 0,
            message: "El ID de la sucursal es obligatorio" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si la sucursal tiene datos relacionados antes de eliminar
        const [almacenesRelacionados] = await connection.query(
            'SELECT COUNT(*) as total FROM sucursal_almacen WHERE id_sucursal = ?',
            [id]
        );

        if (almacenesRelacionados[0].total > 0) {
            return res.status(400).json({ 
                code: 0,
                message: "No se puede eliminar la sucursal porque tiene almacenes asociados. Considere desactivarla en lugar de eliminarla." 
            });
        }

        await connection.beginTransaction();

        const query = `DELETE FROM sucursal WHERE id_sucursal = ? AND id_tenant = ?`;
        const [result] = await connection.query(query, [id, id_tenant]);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Sucursal no encontrada" 
            });
        }

        // Limpiar caché relacionado
        queryCache.clear();

        res.json({ code: 1, message: "Sucursal eliminada correctamente" });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteSucursal:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ 
                code: 0, 
                message: "No se puede eliminar la sucursal porque tiene datos relacionados. Considere desactivarla en lugar de eliminarla." 
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

export const methods = {
    getSucursalInicio,
    getSucursales,
    getVendedores,
    insertSucursal,
    updateSucursal,
    deleteSucursal,
};
