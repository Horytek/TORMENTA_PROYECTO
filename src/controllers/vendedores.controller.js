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
                ve.id_usuario
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
    const { dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = req.body;
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
    const { nuevo_dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = req.body;
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

        await connection.beginTransaction();

        const [result] = await connection.query(`
            UPDATE vendedor
            SET dni = ?, 
                id_usuario = ?, 
                nombres = ?, 
                apellidos = ?, 
                telefono = ?, 
                estado_vendedor = ?
            WHERE dni = ? AND id_tenant = ?
        `, [
            nuevo_dni || dni, 
            id_usuario, 
            nombres.trim(), 
            apellidos?.trim() || '', 
            telefono?.trim() || '', 
            estado_vendedor !== undefined ? estado_vendedor : 1,
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

// DESACTIVAR VENDEDOR - OPTIMIZADO CON LÓGICA INTELIGENTE
const deactivateVendedor = async (req, res) => {
    const { dni } = req.params;
    const id_tenant = req.id_tenant;

    // Validaciones mejoradas
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

        // Verificar si el vendedor existe
        const [vendedorExiste] = await connection.query(
            "SELECT dni, estado_vendedor FROM vendedor WHERE dni = ? AND id_tenant = ? LIMIT 1",
            [dni, id_tenant]
        );

        if (vendedorExiste.length === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "Vendedor no encontrado" 
            });
        }

        // Verificar si el vendedor está en una sucursal
        const [sucursales] = await connection.query(
            "SELECT COUNT(*) AS total FROM sucursal WHERE dni = ? AND id_tenant = ?",
            [dni, id_tenant]
        );

        const tieneSucursales = sucursales[0].total > 0;

        await connection.beginTransaction();

        if (tieneSucursales) {
            // Si tiene sucursales, solo desactivar
            const [updateResult] = await connection.query(
                "UPDATE vendedor SET estado_vendedor = 0 WHERE dni = ? AND id_tenant = ?",
                [dni, id_tenant]
            );

            await connection.commit();

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ 
                    code: 0,
                    message: "No se pudo desactivar el vendedor" 
                });
            }

            // Limpiar caché
            queryCache.clear();

            return res.json({ 
                code: 2, 
                message: `Vendedor desactivado porque está asociado a ${sucursales[0].total} sucursal(es)`,
                sucursales_asociadas: sucursales[0].total
            });
        } else {
            // Si no tiene sucursales, eliminar
            const [deleteResult] = await connection.query(
                "DELETE FROM vendedor WHERE dni = ? AND id_tenant = ?",
                [dni, id_tenant]
            );

            await connection.commit();

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ 
                    code: 0,
                    message: "No se pudo eliminar el vendedor" 
                });
            }

            // Limpiar caché
            queryCache.clear();

            return res.json({ 
                code: 1, 
                message: "Vendedor eliminado con éxito" 
            });
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deactivateVendedor:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ 
                code: 0,
                message: "No se puede eliminar el vendedor porque tiene datos relacionados" 
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

export const methods = {
    getVendedores,
    getVendedor,
    addVendedor,
    updateVendedor,
    deactivateVendedor,
    deleteVendedor
};
