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

// AGREGAR MÓDULO - OPTIMIZADO
const addModulo = async (req, res) => {
    const { nombre, ruta } = req.body;
    const nombre_modulo = nombre;

    // Validaciones mejoradas
    if (!nombre_modulo || nombre_modulo.trim() === '') {
        return res.status(400).json({
            success: false,
            code: 0,
            message: "El nombre del módulo es requerido"
        });
    }

    if (!ruta || ruta.trim() === '') {
        return res.status(400).json({
            success: false,
            code: 0,
            message: "La ruta del módulo es requerida"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar duplicados
        const [duplicado] = await connection.query(
            'SELECT id_modulo FROM modulo WHERE nombre_modulo = ? OR ruta = ? LIMIT 1',
            [nombre_modulo.trim(), ruta.trim()]
        );

        if (duplicado.length > 0) {
            return res.status(400).json({
                success: false,
                code: 0,
                message: "Ya existe un módulo con ese nombre o ruta"
            });
        }

        await connection.beginTransaction();

        const query = "INSERT INTO modulo (nombre_modulo, ruta) VALUES (?, ?)";
        const [result] = await connection.query(query, [nombre_modulo.trim(), ruta.trim()]);

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.json({
            success: true,
            code: 1,
            message: "Módulo agregado correctamente",
            data: {
                id_modulo: result.insertId,
                nombre_modulo: nombre_modulo.trim(),
                ruta: ruta.trim()
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addModulo:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                success: false,
                code: 0,
                message: "Ya existe un módulo con ese nombre o ruta"
            });
        } else {
            res.status(500).json({
                success: false,
                code: 0,
                message: "Error interno en el servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER MÓDULOS Y SUBMÓDULOS - OPTIMIZADO CON CACHÉ
const getModulos = async (req, res) => {
    const cacheKey = 'modulos_completos';

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({
                success: true,
                data: cached.data
            });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        // Query optimizada: obtener todo en una sola consulta con LEFT JOIN
        const [rows] = await connection.query(`
            SELECT 
                m.id_modulo,
                m.nombre_modulo,
                m.ruta as ruta_modulo,
                s.id_submodulo,
                s.nombre_sub,
                s.ruta as ruta_submodulo
            FROM modulo m
            LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo
            ORDER BY m.id_modulo, s.id_submodulo
        `);

        // Separar módulos y submódulos de forma eficiente
        const modulosMap = new Map();
        const submodulos = [];

        for (const row of rows) {
            // Agregar módulo si no existe
            if (!modulosMap.has(row.id_modulo)) {
                modulosMap.set(row.id_modulo, {
                    id_modulo: row.id_modulo,
                    nombre_modulo: row.nombre_modulo,
                    ruta: row.ruta_modulo
                });
            }

            // Agregar submódulo si existe
            if (row.id_submodulo) {
                submodulos.push({
                    id_submodulo: row.id_submodulo,
                    id_modulo: row.id_modulo,
                    nombre_sub: row.nombre_sub,
                    ruta_submodulo: row.ruta_submodulo,
                    nombre_modulo: row.nombre_modulo,
                    ruta_modulo: row.ruta_modulo
                });
            }
        }

        const modulos = Array.from(modulosMap.values());

        const data = {
            modulos,
            submodulos
        };

        // Guardar en caché
        queryCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error en getModulos:', error);
        res.status(500).json({
            success: false,
            message: "Error interno en el servidor"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// AGREGAR SUBMÓDULO - OPTIMIZADO
const addSubmodulo = async (req, res) => {
    const { id_modulo, nombre_sub, ruta } = req.body;

    // Validaciones mejoradas
    if (!id_modulo) {
        return res.status(400).json({
            success: false,
            code: 0,
            message: "El ID del módulo es requerido"
        });
    }

    if (!nombre_sub || nombre_sub.trim() === '') {
        return res.status(400).json({
            success: false,
            code: 0,
            message: "El nombre del submódulo es requerido"
        });
    }

    if (!ruta || ruta.trim() === '') {
        return res.status(400).json({
            success: false,
            code: 0,
            message: "La ruta del submódulo es requerida"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que el módulo existe
        const [modulos] = await connection.query(
            "SELECT id_modulo, nombre_modulo FROM modulo WHERE id_modulo = ? LIMIT 1",
            [id_modulo]
        );

        if (modulos.length === 0) {
            return res.status(404).json({
                success: false,
                code: 0,
                message: "El módulo seleccionado no existe"
            });
        }

        // Verificar duplicados
        const [duplicado] = await connection.query(
            'SELECT id_submodulo FROM sub_modulo WHERE (nom_submodulo = ? OR ruta = ?) AND id_modulo = ? LIMIT 1',
            [nombre_sub.trim(), ruta.trim(), id_modulo]
        );

        if (duplicado.length > 0) {
            return res.status(400).json({
                success: false,
                code: 0,
                message: "Ya existe un submódulo con ese nombre o ruta en este módulo"
            });
        }

        await connection.beginTransaction();

        const query = "INSERT INTO sub_modulo (id_modulo, nom_submodulo, ruta) VALUES (?, ?, ?)";
        const [result] = await connection.query(query, [id_modulo, nombre_sub.trim(), ruta.trim()]);

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.json({
            success: true,
            code: 1,
            message: "Submódulo agregado correctamente",
            data: {
                id_submodulo: result.insertId,
                id_modulo,
                nombre_sub: nombre_sub.trim(),
                ruta: ruta.trim(),
                nombre_modulo: modulos[0].nombre_modulo
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addSubmodulo:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                success: false,
                code: 0,
                message: "Ya existe un submódulo con ese nombre o ruta"
            });
        } else {
            res.status(500).json({
                success: false,
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

// ACTUALIZAR MÓDULO - OPTIMIZADO
const updateModulo = async (req, res) => {
    const { id } = req.params;
    const { nombre_modulo, ruta } = req.body;

    // Validaciones mejoradas
    if (!id) {
        return res.status(400).json({
            code: 0,
            message: "El ID del módulo es requerido"
        });
    }

    if (!nombre_modulo || nombre_modulo.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "El nombre del módulo es requerido"
        });
    }

    if (!ruta || ruta.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "La ruta del módulo es requerida"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que el módulo existe
        const [moduloExiste] = await connection.query(
            "SELECT id_modulo FROM modulo WHERE id_modulo = ? LIMIT 1",
            [id]
        );

        if (moduloExiste.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Módulo no encontrado"
            });
        }

        // Verificar duplicados (excluyendo el módulo actual)
        const [duplicado] = await connection.query(
            'SELECT id_modulo FROM modulo WHERE (nombre_modulo = ? OR ruta = ?) AND id_modulo != ? LIMIT 1',
            [nombre_modulo.trim(), ruta.trim(), id]
        );

        if (duplicado.length > 0) {
            return res.status(400).json({
                code: 0,
                message: "Ya existe otro módulo con ese nombre o ruta"
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            "UPDATE modulo SET nombre_modulo = ?, ruta = ? WHERE id_modulo = ?",
            [nombre_modulo.trim(), ruta.trim(), id]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "No se pudo actualizar el módulo"
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({
            code: 1,
            message: "Módulo actualizado correctamente",
            data: {
                id_modulo: parseInt(id),
                nombre_modulo: nombre_modulo.trim(),
                ruta: ruta.trim()
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateModulo:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                code: 0,
                message: "Ya existe otro módulo con ese nombre o ruta"
            });
        } else if (!res.headersSent) {
            res.status(500).json({
                code: 0,
                message: "Error interno en el servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ELIMINAR MÓDULO - OPTIMIZADO CON VERIFICACIONES
const deleteModulo = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            code: 0,
            message: "El ID del módulo es requerido"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar que el módulo existe
        const [moduloExiste] = await connection.query(
            "SELECT id_modulo, nombre_modulo FROM modulo WHERE id_modulo = ? LIMIT 1",
            [id]
        );

        if (moduloExiste.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Módulo no encontrado"
            });
        }

        const recordToDelete = moduloExiste[0];

        // Verificar si tiene submódulos asociados
        const [submodulos] = await connection.query(
            'SELECT COUNT(*) as total FROM submodulos WHERE id_modulo = ?',
            [id]
        );

        if (submodulos[0].total > 0) {
            return res.status(400).json({
                code: 0,
                message: `No se puede eliminar el módulo porque tiene ${submodulos[0].total} submódulo(s) asociado(s)`
            });
        }

        // Verificar si tiene permisos asociados
        const [permisos] = await connection.query(
            'SELECT COUNT(*) as total FROM permisos WHERE id_modulo = ?',
            [id]
        );

        if (permisos[0].total > 0) {
            return res.status(400).json({
                code: 0,
                message: `No se puede eliminar el módulo porque tiene ${permisos[0].total} permiso(s) asociado(s)`
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query("DELETE FROM modulo WHERE id_modulo = ?", [id]);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "No se pudo eliminar el módulo"
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({
            code: 1,
            message: "Módulo eliminado correctamente",
            data: recordToDelete
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteModulo:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                code: 0,
                message: "No se puede eliminar el módulo porque tiene datos relacionados"
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
    addModulo,
    getModulos,
    addSubmodulo,
    updateModulo,
    deleteModulo
};
