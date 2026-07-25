import { getConnection } from "./../database/database.js";
import { AuthZService } from "../services/authz.service.js";

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
    const { nombre, ruta, icon = null, group_name = null, sort_order = 0, frontend_route = null, is_visible = true, active_actions = null } = req.body;
    const nombre_modulo = nombre;
    const activeActionsJson = Array.isArray(active_actions) && active_actions.length > 0 ? JSON.stringify(active_actions) : null;

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

        const query = "INSERT INTO modulo (nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await connection.query(query, [nombre_modulo.trim(), ruta.trim(), icon, group_name, sort_order, frontend_route, is_visible ? 1 : 0, activeActionsJson]);

        await connection.commit();

        // Limpiar caché (propio + AuthZService compartido). Cambió metadata de
        // módulo/submódulo → el catálogo cacheado por tenant queda stale.
        // ponytail: clear global del AuthZService.
        queryCache.clear();
        AuthZService.clearCache();

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
                m.icon as icon_modulo,
                m.group_name as group_name_modulo,
                m.sort_order as sort_order_modulo,
                m.frontend_route as frontend_route_modulo,
                m.is_visible as is_visible_modulo,
                m.active_actions as active_actions_modulo,
                s.id_submodulo,
                s.nombre_sub,
                s.ruta as ruta_submodulo,
                s.icon as icon_submodulo,
                s.group_name as group_name_submodulo,
                s.sort_order as sort_order_submodulo,
                s.frontend_route as frontend_route_submodulo,
                s.is_visible as is_visible_submodulo,
                s.active_actions as active_actions_submodulo
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
                    ruta: row.ruta_modulo,
                    icon: row.icon_modulo,
                    group_name: row.group_name_modulo,
                    sort_order: row.sort_order_modulo,
                    frontend_route: row.frontend_route_modulo,
                    is_visible: !!row.is_visible_modulo,
                    active_actions: row.active_actions_modulo
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
                    ruta_modulo: row.ruta_modulo,
                    icon: row.icon_submodulo,
                    group_name: row.group_name_submodulo,
                    sort_order: row.sort_order_submodulo,
                    frontend_route: row.frontend_route_submodulo,
                    is_visible: !!row.is_visible_submodulo,
                    active_actions: row.active_actions_submodulo
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
    const { id_modulo, nombre_sub, ruta, icon = null, group_name = null, sort_order = 0, frontend_route = null, is_visible = true } = req.body;

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
            'SELECT id_submodulo FROM submodulos WHERE (nombre_sub = ? OR ruta = ?) AND id_modulo = ? LIMIT 1',
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

        const query = "INSERT INTO submodulos (id_modulo, nombre_sub, ruta, icon, group_name, sort_order, frontend_route, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await connection.query(query, [id_modulo, nombre_sub.trim(), ruta.trim(), icon, group_name, sort_order, frontend_route, is_visible ? 1 : 0]);

        await connection.commit();

        // Limpiar caché (propio + AuthZService compartido). Cambió metadata de
        // módulo/submódulo → el catálogo cacheado por tenant queda stale.
        // ponytail: clear global del AuthZService.
        queryCache.clear();
        AuthZService.clearCache();

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
    const { nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions } = req.body;

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

        // Campos de metadata visual son opcionales: solo se actualizan si el
        // caller los envía, para no pisar con NULL a quien todavía solo manda
        // {nombre_modulo, ruta} (contrato original de este endpoint).
        const updates = ["nombre_modulo = ?", "ruta = ?"];
        const params = [nombre_modulo.trim(), ruta.trim()];
        if (icon !== undefined) { updates.push("icon = ?"); params.push(icon); }
        if (group_name !== undefined) { updates.push("group_name = ?"); params.push(group_name); }
        if (sort_order !== undefined) { updates.push("sort_order = ?"); params.push(sort_order); }
        if (frontend_route !== undefined) { updates.push("frontend_route = ?"); params.push(frontend_route); }
        if (is_visible !== undefined) { updates.push("is_visible = ?"); params.push(is_visible ? 1 : 0); }
        // active_actions: null = todas las estándar (default legado); array =
        // solo esas acciones (estándar + custom) habilitadas para el módulo.
        if (active_actions !== undefined) {
            updates.push("active_actions = ?");
            params.push(Array.isArray(active_actions) && active_actions.length > 0 ? JSON.stringify(active_actions) : null);
        }
        params.push(id);

        const [result] = await connection.query(
            `UPDATE modulo SET ${updates.join(', ')} WHERE id_modulo = ?`,
            params
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "No se pudo actualizar el módulo"
            });
        }

        // Limpiar caché (propio + AuthZService compartido). Cambió metadata de
        // módulo/submódulo → el catálogo cacheado por tenant queda stale.
        // ponytail: clear global del AuthZService.
        queryCache.clear();
        AuthZService.clearCache();

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

        // Limpiar caché (propio + AuthZService compartido). Cambió metadata de
        // módulo/submódulo → el catálogo cacheado por tenant queda stale.
        // ponytail: clear global del AuthZService.
        queryCache.clear();
        AuthZService.clearCache();

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
