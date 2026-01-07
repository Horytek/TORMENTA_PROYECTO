import { getConnection } from "./../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

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

// OBTENER MÓDULOS CON SUBMÓDULOS - OPTIMIZADO
const getModulosConSubmodulos = async (req, res) => {
    const nameUser = req.user.nameUser;
    const isDeveloper = nameUser === 'desarrollador';
    const id_tenant = req.id_tenant;

    const cacheKey = `modulos_submodulos_${isDeveloper ? 'dev' : id_tenant}`;

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

        let query, queryParams;

        if (isDeveloper) {
            // Desarrollador ve todo en una sola query optimizada
            query = `
                SELECT 
                    m.id_modulo,
                    m.nombre_modulo,
                    m.ruta,
                    s.id_submodulo,
                    s.nombre_sub,
                    s.ruta as ruta_submodulo
                FROM modulo m
                LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo
                ORDER BY m.id_modulo, s.id_submodulo
            `;
            queryParams = [];
        } else {
            // Administrador de empresa ve solo su tenant
            query = `
                SELECT 
                    m.id_modulo,
                    m.nombre_modulo,
                    m.ruta,
                    s.id_submodulo,
                    s.nombre_sub,
                    s.ruta as ruta_submodulo
                FROM modulo m
                LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo AND s.id_tenant = ?
                WHERE m.id_tenant = ?
                ORDER BY m.id_modulo, s.id_submodulo
            `;
            queryParams = [id_tenant, id_tenant];
        }

        const [rows] = await connection.query(query, queryParams);

        // Agrupar resultados de forma eficiente
        const modulosMap = new Map();

        for (const row of rows) {
            const moduloId = row.id_modulo;

            if (!modulosMap.has(moduloId)) {
                modulosMap.set(moduloId, {
                    id: row.id_modulo,
                    nombre: row.nombre_modulo,
                    ruta: row.ruta,
                    submodulos: []
                });
            }

            // Agregar submódulo si existe
            if (row.id_submodulo) {
                modulosMap.get(moduloId).submodulos.push({
                    id_submodulo: row.id_submodulo,
                    id_modulo: row.id_modulo,
                    nombre_sub: row.nombre_sub,
                    ruta_submodulo: row.ruta_submodulo
                });
            }
        }

        const modulosConSubmodulos = Array.from(modulosMap.values()).map(modulo => ({
            ...modulo,
            expandible: modulo.submodulos.length > 0
        }));

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: modulosConSubmodulos,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            data: modulosConSubmodulos
        });
    } catch (error) {
        console.error('Error en getModulosConSubmodulos:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener módulos"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER PERMISOS DE MÓDULO - OPTIMIZADO
const getPermisosModulo = async (req, res) => {
    const { id_rol } = req.params;
    const nameUser = req.user.nameUser;
    const isDeveloper = nameUser === 'desarrollador';
    const id_tenant = req.id_tenant;

    if (!id_rol) {
        return res.status(400).json({
            success: false,
            message: "El ID del rol es obligatorio"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        let permisosQuery, queryParams;

        if (isDeveloper) {
            permisosQuery = `
                SELECT 
                    m.nombre_modulo, 
                    s.nombre_submodulo, 
                    p.ver, 
                    p.crear, 
                    p.editar, 
                    p.eliminar, 
                    p.desactivar, 
                    p.generar,
                    p.actions_json
                FROM permisos p
                INNER JOIN modulo m ON p.id_modulo = m.id_modulo
                LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                WHERE p.id_rol = ?
                ORDER BY m.nombre_modulo, s.nombre_submodulo
            `;
            queryParams = [id_rol];
        } else {
            permisosQuery = `
                SELECT 
                    m.nombre_modulo, 
                    s.nombre_submodulo, 
                    p.ver, 
                    p.crear, 
                    p.editar, 
                    p.eliminar, 
                    p.desactivar, 
                    p.generar,
                    p.actions_json
                FROM permisos p
                INNER JOIN modulo m ON p.id_modulo = m.id_modulo
                LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                WHERE p.id_rol = ? AND p.id_tenant = ?
                ORDER BY m.nombre_modulo, s.nombre_submodulo
            `;
            queryParams = [id_rol, id_tenant];
        }

        const [permisos] = await connection.query(permisosQuery, queryParams);

        res.json({
            success: true,
            data: permisos
        });
    } catch (error) {
        console.error('Error en getPermisosModulo:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener permisos"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER ROLES - OPTIMIZADO CON CACHÉ
const getRoles = async (req, res) => {
    const nameUser = req.user.nameUser;
    const isDeveloper = nameUser === 'desarrollador';
    const id_tenant = req.id_tenant;

    const cacheKey = `roles_permisos_${isDeveloper ? 'dev' : id_tenant}`;

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

        let rolesQuery, queryParams;

        if (isDeveloper) {
            rolesQuery = `
                SELECT id_rol, nom_rol, estado_rol 
                FROM rol 
                WHERE id_rol != 10 
                ORDER BY nom_rol
            `;
            queryParams = [];
        } else {
            rolesQuery = `
                SELECT id_rol, nom_rol, estado_rol 
                FROM rol 
                WHERE id_rol != 10 AND id_tenant = ? 
                ORDER BY nom_rol
            `;
            queryParams = [id_tenant];
        }

        const [roles] = await connection.query(rolesQuery, queryParams);

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: roles,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error en getRoles:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener roles"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER PERMISOS POR ROL - OPTIMIZADO
const getPermisosByRol = async (req, res) => {
    const { id_rol } = req.params;
    const nameUser = req.user.nameUser;
    const isDeveloper = nameUser === 'desarrollador';
    const id_tenant = req.id_tenant;

    if (!id_rol) {
        return res.status(400).json({
            success: false,
            message: "El ID del rol es obligatorio"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        let permisosQuery, queryParams;

        if (isDeveloper) {
            permisosQuery = `
                SELECT 
                    p.id_permiso,
                    p.id_rol,
                    p.id_modulo,
                    p.id_submodulo,
                    p.crear,
                    p.ver,
                    p.editar,
                    p.eliminar,
                    p.desactivar,
                    p.generar,
                    p.actions_json,
                    m.ruta AS modulo_ruta,
                    s.ruta AS submodulo_ruta
                FROM permisos p
                LEFT JOIN modulo m ON p.id_modulo = m.id_modulo
                LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                WHERE p.id_rol = ?
                ORDER BY p.id_modulo, p.id_submodulo
            `;
            queryParams = [id_rol];
        } else {
            permisosQuery = `
                SELECT 
                    p.id_permiso,
                    p.id_rol,
                    p.id_modulo,
                    p.id_submodulo,
                    p.crear,
                    p.ver,
                    p.editar,
                    p.eliminar,
                    p.desactivar,
                    p.generar,
                    p.actions_json,
                    m.ruta AS modulo_ruta,
                    s.ruta AS submodulo_ruta
                FROM permisos p
                LEFT JOIN modulo m ON p.id_modulo = m.id_modulo
                LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                WHERE p.id_rol = ? AND p.id_tenant = ?
                ORDER BY p.id_modulo, p.id_submodulo
            `;
            queryParams = [id_rol, id_tenant];
        }

        const [permisos] = await connection.query(permisosQuery, queryParams);

        res.json({
            success: true,
            data: permisos
        });
    } catch (error) {
        console.error('Error en getPermisosByRol:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener permisos del rol"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// GUARDAR PERMISOS - OPTIMIZADO CON BATCH INSERT
const savePermisos = async (req, res) => {
    const { id_rol, permisos } = req.body;
    const nameUser = req.user.nameUser;
    const isDeveloper = nameUser === 'desarrollador';
    const id_tenant = req.id_tenant;
    const id_usuario_actor = req.user.id_usuario; // del JWT

    // Validaciones
    if (!id_rol) {
        return res.status(400).json({
            success: false,
            message: "El ID del rol es obligatorio"
        });
    }

    if (!Array.isArray(permisos)) {
        return res.status(400).json({
            success: false,
            message: "Los permisos deben ser un array"
        });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // Eliminar permisos existentes
        if (isDeveloper) {
            await connection.query(
                'DELETE FROM permisos WHERE id_rol = ?',
                [id_rol]
            );
        } else {
            await connection.query(
                'DELETE FROM permisos WHERE id_rol = ? AND id_tenant = ?',
                [id_rol, id_tenant]
            );
        }

        // Insertar nuevos permisos
        if (permisos.length > 0) {
            if (isDeveloper) {
                // Desarrollador: obtener todos los tenants y preparar batch insert
                const [tenants] = await connection.query(
                    'SELECT DISTINCT id_tenant FROM usuario WHERE id_tenant IS NOT NULL'
                );

                if (tenants.length > 0) {
                    // Preparar valores para batch insert
                    const values = [];
                    const params = [];

                    for (const tenant of tenants) {
                        for (const p of permisos) {
                            values.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                            params.push(
                                id_rol,
                                p.id_modulo,
                                p.id_submodulo || null,
                                p.crear !== undefined ? p.crear : 0,
                                p.ver !== undefined ? p.ver : 0,
                                p.editar !== undefined ? p.editar : 0,
                                p.eliminar !== undefined ? p.eliminar : 0,
                                p.desactivar !== undefined ? p.desactivar : 0,
                                p.generar !== undefined ? p.generar : 0,
                                JSON.stringify(p.actions_json || {}),
                                tenant.id_tenant
                            );
                        }
                    }

                    // Batch insert - mucho más eficiente
                    const batchQuery = `
                        INSERT INTO permisos
                        (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant)
                        VALUES ${values.join(', ')}
                    `;

                    await connection.query(batchQuery, params);
                }
            } else {
                // Administrador de empresa: batch insert para su tenant
                const values = [];
                const params = [];

                for (const p of permisos) {
                    values.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    params.push(
                        id_rol,
                        p.id_modulo,
                        p.id_submodulo || null,
                        p.crear !== undefined ? p.crear : 0,
                        p.ver !== undefined ? p.ver : 0,
                        p.editar !== undefined ? p.editar : 0,
                        p.eliminar !== undefined ? p.eliminar : 0,
                        p.desactivar !== undefined ? p.desactivar : 0,
                        p.generar !== undefined ? p.generar : 0,
                        JSON.stringify(p.actions_json || {}),
                        id_tenant
                    );
                }

                // Batch insert
                const batchQuery = `
                    INSERT INTO permisos
                    (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant)
                    VALUES ${values.join(', ')}
                `;

                await connection.query(batchQuery, params);
            }
        }

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        // ---------------------------------------------------------
        // NUEVA ARQUITECTURA: Versionado + Auditoría
        // ---------------------------------------------------------
        if (!isDeveloper && id_tenant) {
            // 1. Incrementar perm_version del tenant
            connection.query(
                "UPDATE empresa SET perm_version = perm_version + 1 WHERE id_empresa = ?",
                [id_tenant]
            ).catch(e => console.error("Error updating perm_version:", e));

            // 2. Audit Log (Async)
            if (permisos.length > 0) {
                // Import dinámico para evitar error circular si fuera el caso, aunque aquí está ok
                // import { logAudit } from "../utils/auditLogger.js"; 
                // Asumimos que lo importamos arriba
                logAudit(req, {
                    actor_user_id: id_usuario_actor,
                    actor_role: req.user.rol,
                    id_tenant_target: id_tenant,
                    entity_type: 'PERMISOS',
                    entity_id: String(id_rol),
                    action: 'UPDATE',
                    details: {
                        permisos_count: permisos.length,
                        permisos_ids: permisos.map(p => p.id_modulo) // ejemplo
                    }
                });
            }
        }
        // ---------------------------------------------------------

        res.json({
            success: true,
            message: 'Permisos actualizados correctamente',
            data: {
                id_rol,
                permisos_count: permisos.length,
                tenant: isDeveloper ? 'todos' : id_tenant
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en savePermisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar permisos'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// VERIFICAR PERMISO - OPTIMIZADO CON CACHÉ
const checkPermiso = async (req, res) => {
    const idModulo = parseInt(req.query.idModulo);
    const idSubmodulo = req.query.idSubmodulo ? parseInt(req.query.idSubmodulo) : null;
    const id_tenant = req.id_tenant;

    // Validaciones
    if (isNaN(idModulo)) {
        return res.status(400).json({
            hasPermission: false,
            message: "El parámetro idModulo debe ser un número válido"
        });
    }

    const nameUser = req.user?.nameUser ||
        req.user?.usr ||
        req.user?.usuario ||
        req.user?.username ||
        req.nameUser;

    if (!nameUser) {
        return res.status(400).json({
            hasPermission: false,
            message: "Información de usuario incompleta en el token"
        });
    }

    // Si es desarrollador, tiene todos los permisos
    if (nameUser === 'desarrollador') {
        return res.json({
            hasPermission: true,
            hasCreatePermission: true,
            hasEditPermission: true,
            hasDeletePermission: true,
            hasGeneratePermission: true,
            hasDeactivatePermission: true
        });
    }

    const cacheKey = `permiso_${nameUser}_${idModulo}_${idSubmodulo || 'null'}_${id_tenant}`;

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json(cached.data);
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        // Query optimizada que obtiene usuario y permisos en una sola consulta
        const [resultado] = await connection.query(
            `SELECT 
                p.ver, 
                p.crear, 
                p.editar, 
                p.eliminar, 
                p.desactivar, 
                p.generar,
                p.actions_json,
                u.id_rol
            FROM usuario u
            LEFT JOIN permisos p ON u.id_rol = p.id_rol 
                AND p.id_modulo = ? 
                AND (p.id_submodulo = ? OR (p.id_submodulo IS NULL AND ? IS NULL))
                AND p.id_tenant = u.id_tenant
            WHERE u.usua = ? AND u.id_tenant = ?
            LIMIT 1`,
            [idModulo, idSubmodulo, idSubmodulo, nameUser, id_tenant]
        );

        if (resultado.length === 0) {
            return res.json({
                hasPermission: false,
                hasCreatePermission: false,
                hasEditPermission: false,
                hasDeletePermission: false,
                hasGeneratePermission: false,
                hasDeactivatePermission: false
            });
        }

        const usuario = resultado[0];

        // Si es rol 10 (superadmin), tiene todos los permisos
        if (usuario.id_rol === 10) {
            const allPermissions = {
                hasPermission: true,
                hasCreatePermission: true,
                hasEditPermission: true,
                hasDeletePermission: true,
                hasGeneratePermission: true,
                hasDeactivatePermission: true
            };

            // Guardar en caché
            queryCache.set(cacheKey, {
                data: allPermissions,
                timestamp: Date.now()
            });

            return res.json(allPermissions);
        }

        // Permisos normales
        const permisos = {
            hasPermission: usuario.ver === 1,
            hasCreatePermission: usuario.crear === 1,
            hasEditPermission: usuario.editar === 1,
            hasDeletePermission: usuario.eliminar === 1,
            hasGeneratePermission: usuario.generar === 1,
            hasDeactivatePermission: usuario.desactivar === 1
        };

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: permisos,
            timestamp: Date.now()
        });

        res.json(permisos);
    } catch (error) {
        console.error('Error en checkPermiso:', error);
        res.status(500).json({
            hasPermission: false,
            hasCreatePermission: false,
            hasEditPermission: false,
            hasDeletePermission: false,
            hasGeneratePermission: false,
            hasDeactivatePermission: false,
            message: "Error interno del servidor"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getModulosConSubmodulos,
    getRoles,
    getPermisosByRol,
    savePermisos,
    getPermisosModulo,
    checkPermiso
};
