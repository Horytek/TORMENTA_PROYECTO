import { getConnection } from "./../database/database.js";

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

// OBTENER TODOS LOS ROLES - OPTIMIZADO CON CACHÉ
const getRoles = async (req, res) => {
    const id_tenant = req.id_tenant;
    const cacheKey = `roles_${id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ 
                code: 1, 
                data: cached.data,
                message: "Roles listados (caché)" 
            });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        
        const query = `
            SELECT 
                id_rol, 
                nom_rol, 
                estado_rol,
                id_modulo,
                id_submodulo
            FROM rol 
            WHERE id_rol != 10 
                AND id_tenant = ?
            ORDER BY nom_rol
        `;
        
        const [result] = await connection.query(query, [id_tenant]);
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ 
            code: 1, 
            data: result,
            message: "Roles listados" 
        });
    } catch (error) {
        console.error('Error en getRoles:', error);
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

// OBTENER PÁGINA POR DEFECTO DE UN ROL - OPTIMIZADO
const getPaginaDefecto = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    if (!id) {
        return res.status(400).json({ 
            code: 0, 
            message: "El ID del rol es obligatorio" 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        
        const query = `
            SELECT 
                id_modulo, 
                id_submodulo 
            FROM rol 
            WHERE id_rol = ? 
                AND id_tenant = ?
            LIMIT 1
        `;
        
        const [result] = await connection.query(query, [id, id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Rol no encontrado" 
            });
        }

        res.json({ 
            code: 1, 
            data: result[0],
            message: "Página por defecto obtenida" 
        });
    } catch (error) {
        console.error('Error en getPaginaDefecto:', error);
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

// GUARDAR PÁGINA POR DEFECTO - OPTIMIZADO
const guardarPaginaPorDefecto = async (req, res) => {
    const { id_modulo, id_submodulo } = req.body;
    const id_rol = req.params.id;
    const id_tenant = req.id_tenant;

    // Validaciones mejoradas
    if (!id_rol) {
        return res.status(400).json({ 
            code: 0, 
            message: "El ID del rol es obligatorio" 
        });
    }

    if (!id_modulo) {
        return res.status(400).json({ 
            code: 0, 
            message: "El ID del módulo es obligatorio" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que el rol existe
        const [rolExiste] = await connection.query(
            'SELECT id_rol FROM rol WHERE id_rol = ? AND id_tenant = ? LIMIT 1',
            [id_rol, id_tenant]
        );

        if (rolExiste.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Rol no encontrado" 
            });
        }

        // Verificar que el módulo existe
        const [moduloExiste] = await connection.query(
            'SELECT id_modulo FROM modulos WHERE id_modulo = ? LIMIT 1',
            [id_modulo]
        );

        if (moduloExiste.length === 0) {
            return res.status(400).json({ 
                code: 0, 
                message: "El módulo especificado no existe" 
            });
        }

        // Si se especifica submódulo, verificar que existe
        if (id_submodulo) {
            const [submoduloExiste] = await connection.query(
                'SELECT id_submodulo FROM submodulos WHERE id_submodulo = ? AND id_modulo = ? LIMIT 1',
                [id_submodulo, id_modulo]
            );

            if (submoduloExiste.length === 0) {
                return res.status(400).json({ 
                    code: 0, 
                    message: "El submódulo especificado no existe o no pertenece al módulo" 
                });
            }
        }

        await connection.beginTransaction();

        const query = `
            UPDATE rol 
            SET id_modulo = ?, 
                id_submodulo = ? 
            WHERE id_rol = ? 
                AND id_tenant = ?
        `;
        
        const [result] = await connection.query(
            query, 
            [id_modulo, id_submodulo || null, id_rol, id_tenant]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo actualizar el rol" 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Página por defecto guardada correctamente" 
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en guardarPaginaPorDefecto:', error);
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

// OBTENER UN ROL - OPTIMIZADO CON CACHÉ
const getRol = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    if (!id) {
        return res.status(400).json({ 
            code: 0, 
            message: "El ID del rol es obligatorio" 
        });
    }

    const cacheKey = `rol_${id}_${id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ 
                code: 1, 
                data: cached.data,
                message: "Rol encontrado (caché)" 
            });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();
        
        const query = `
            SELECT 
                id_rol, 
                nom_rol, 
                estado_rol,
                id_modulo,
                id_submodulo
            FROM rol 
            WHERE id_rol = ? 
                AND id_tenant = ?
            LIMIT 1
        `;
        
        const [result] = await connection.query(query, [id, id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ 
                code: 0,
                data: [], 
                message: "Rol no encontrado" 
            });
        }

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result[0],
            timestamp: Date.now()
        });

        res.json({ 
            code: 1, 
            data: result[0], 
            message: "Rol encontrado" 
        });
    } catch (error) {
        console.error('Error en getRol:', error);
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

// AGREGAR ROL - OPTIMIZADO
const addRol = async (req, res) => {
    const { nom_rol, estado_rol } = req.body;
    const id_tenant = req.id_tenant;

    // Validaciones mejoradas
    if (!nom_rol || nom_rol.trim() === '') {
        return res.status(400).json({ 
            code: 0,
            message: "El nombre del rol es obligatorio" 
        });
    }

    if (estado_rol === undefined) {
        return res.status(400).json({ 
            code: 0,
            message: "El estado del rol es obligatorio" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que no exista un rol con el mismo nombre
        const [rolExiste] = await connection.query(
            'SELECT id_rol FROM rol WHERE nom_rol = ? AND id_tenant = ? LIMIT 1',
            [nom_rol.trim(), id_tenant]
        );

        if (rolExiste.length > 0) {
            return res.status(400).json({ 
                code: 0,
                message: "Ya existe un rol con ese nombre" 
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO rol (nom_rol, estado_rol, id_tenant) VALUES (?, ?, ?)',
            [nom_rol.trim(), estado_rol, id_tenant]
        );

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Rol añadido exitosamente",
            data: { id: result.insertId }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addRol:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "Ya existe un rol con ese nombre" 
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

// ACTUALIZAR ROL - OPTIMIZADO
const updateRol = async (req, res) => {
    const { id } = req.params;
    const { nom_rol, estado_rol } = req.body;
    const id_tenant = req.id_tenant;

    // Validaciones mejoradas
    if (!id) {
        return res.status(400).json({ 
            code: 0,
            message: "El ID del rol es obligatorio" 
        });
    }

    if (!nom_rol || nom_rol.trim() === '') {
        return res.status(400).json({ 
            code: 0,
            message: "El nombre del rol es obligatorio" 
        });
    }

    if (estado_rol === undefined) {
        return res.status(400).json({ 
            code: 0,
            message: "El estado del rol es obligatorio" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que el rol existe
        const [rolExiste] = await connection.query(
            'SELECT id_rol FROM rol WHERE id_rol = ? AND id_tenant = ? LIMIT 1',
            [id, id_tenant]
        );

        if (rolExiste.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Rol no encontrado" 
            });
        }

        // Verificar que no exista otro rol con el mismo nombre
        const [nombreDuplicado] = await connection.query(
            'SELECT id_rol FROM rol WHERE nom_rol = ? AND id_rol != ? AND id_tenant = ? LIMIT 1',
            [nom_rol.trim(), id, id_tenant]
        );

        if (nombreDuplicado.length > 0) {
            return res.status(400).json({ 
                code: 0,
                message: "Ya existe otro rol con ese nombre" 
            });
        }

        await connection.beginTransaction();

        const query = `
            UPDATE rol 
            SET nom_rol = ?, 
                estado_rol = ? 
            WHERE id_rol = ? 
                AND id_tenant = ?
        `;
        
        const [result] = await connection.query(
            query, 
            [nom_rol.trim(), estado_rol, id, id_tenant]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo actualizar el rol" 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Rol modificado exitosamente" 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateRol:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "Ya existe otro rol con ese nombre" 
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

// ELIMINAR ROL - OPTIMIZADO CON LÓGICA INTELIGENTE
const deleteRol = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    if (!id) {
        return res.status(400).json({ 
            code: 0,
            message: "El ID del rol es obligatorio" 
        });
    }

    // Proteger el rol con ID 10 (rol especial del sistema)
    if (parseInt(id) === 10) {
        return res.status(400).json({ 
            code: 0,
            message: "No se puede eliminar el rol del sistema" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si el rol existe
        const [rolExiste] = await connection.query(
            'SELECT id_rol, nom_rol FROM rol WHERE id_rol = ? AND id_tenant = ? LIMIT 1',
            [id, id_tenant]
        );

        if (rolExiste.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Rol no encontrado" 
            });
        }

        // Verificar si el rol está en uso por algún usuario
        const [usuariosConRol] = await connection.query(
            'SELECT COUNT(*) as total FROM usuario WHERE id_rol = ? AND id_tenant = ?',
            [id, id_tenant]
        );

        const isRolInUse = usuariosConRol[0].total > 0;

        await connection.beginTransaction();

        if (isRolInUse) {
            // Si está en uso, solo desactivar
            const [updateResult] = await connection.query(
                'UPDATE rol SET estado_rol = 0 WHERE id_rol = ? AND id_tenant = ?',
                [id, id_tenant]
            );

            await connection.commit();

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ 
                    code: 0, 
                    message: "No se pudo desactivar el rol" 
                });
            }

            // Limpiar caché
            queryCache.clear();

            res.json({ 
                code: 2, 
                message: `Rol desactivado porque está siendo usado por ${usuariosConRol[0].total} usuario(s)`,
                usuarios_afectados: usuariosConRol[0].total
            });
        } else {
            // Si no está en uso, eliminar completamente
            const [deleteResult] = await connection.query(
                'DELETE FROM rol WHERE id_rol = ? AND id_tenant = ?',
                [id, id_tenant]
            );

            await connection.commit();

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ 
                    code: 0, 
                    message: "No se pudo eliminar el rol" 
                });
            }

            // Limpiar caché
            queryCache.clear();

            res.json({ 
                code: 1, 
                message: "Rol eliminado exitosamente" 
            });
        }

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteRol:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ 
                code: 0, 
                message: "No se puede eliminar el rol porque tiene datos relacionados" 
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
    getRoles,
    getRol,
    addRol,
    updateRol,
    deleteRol,
    guardarPaginaPorDefecto,
    getPaginaDefecto
};
