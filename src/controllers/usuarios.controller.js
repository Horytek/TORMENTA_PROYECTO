import { getConnection } from "./../database/database.js";
import { logAcceso } from "../utils/logActions.js";

// Cache para queries repetitivas
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar caché periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

// Obtener usuarios con paginación, límites y filtros seguros
const getUsuarios = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // Paginación y límites
        const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
        const rawLimit = Math.max(parseInt(req.query.limit ?? '20', 10) || 20, 1);
        const limit = Math.min(rawLimit, 100); // límite máximo seguro
        const offset = (page - 1) * limit;

        // Orden seguro
        const allowedSort = {
            id_usuario: 'U.id_usuario',
            usua: 'U.usua',
            fecha_pago: 'U.fecha_pago'
        };
        const sortBy = allowedSort[(req.query.sortBy || 'id_usuario')] || allowedSort.id_usuario;
        const sortDir = (String(req.query.sortDir || 'desc').toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        // Filtros adicionales (exactos, sin LIKE)
        const { id_rol, estado_usuario, id_empresa, usua } = req.query;
        const whereClauses = [
            'R.id_rol != 10'
        ];
        const whereParams = [];

        if (req.id_tenant) {
            whereClauses.push('U.id_tenant = ?');
            whereParams.push(req.id_tenant);
        }
        if (id_rol) {
            whereClauses.push('U.id_rol = ?');
            whereParams.push(id_rol);
        }
        if (typeof estado_usuario !== 'undefined' && estado_usuario !== '') {
            whereClauses.push('U.estado_usuario = ?');
            whereParams.push(estado_usuario);
        }
        if (id_empresa) {
            whereClauses.push('U.id_empresa = ?');
            whereParams.push(id_empresa);
        }
        if (usua) {
            whereClauses.push('U.usua = ?');
            whereParams.push(String(usua).trim());
        }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        // Total para paginación
        const countSQL = `
            SELECT COUNT(1) AS total
            FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol
            LEFT JOIN plan_pago pp ON pp.id_plan = U.plan_pago
            ${whereSQL}
        `;
        const [countRows] = await connection.query(countSQL, whereParams);
        const total = countRows?.[0]?.total || 0;

        // Datos paginados
        const dataSQL = `
            SELECT 
                U.id_usuario, U.id_rol, R.nom_rol, U.usua, U.contra, U.estado_usuario, U.estado_token, 
                U.id_empresa, pp.descripcion_plan AS plan_pago_1, U.fecha_pago AS fecha_pago
            FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol
            LEFT JOIN plan_pago pp ON pp.id_plan = U.plan_pago
            ${whereSQL}
            ORDER BY ${sortBy} ${sortDir}
            LIMIT ? OFFSET ?
        `;
        const [rows] = await connection.query(dataSQL, [...whereParams, limit, offset]);

        res.json({
            code: 1,
            data: rows,
            meta: {
                total,
                page,
                limit,
                pages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Obtener usuario por id (con o sin id_tenant)
const getUsuario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        let query = `
            SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario, estado_token, id_empresa, pp.descripcion_plan as plan_pago_1, U.fecha_pago AS fecha_pago
            FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol
            LEFT JOIN plan_pago pp ON pp.id_plan=U.plan_pago
            WHERE U.id_usuario = ?
        `;
        let params = [id];
        if (req.id_tenant) {
            query += " AND U.id_tenant = ?";
            params.push(req.id_tenant);
        }
        query += " LIMIT 1";
        const [result] = await connection.query(query, params);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Usuario no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Usuario encontrado" });
    } catch (error) {
        console.error('Error en getUsuario:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Obtener usuario por nombre (con o sin id_tenant)
const getUsuario_1 = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        let query = `
            SELECT id_usuario, id_rol, usua, contra, estado_usuario, estado_token, id_empresa
            FROM usuario
            WHERE usua = ?
        `;
        let params = [id];
        if (req.id_tenant) {
            query += " AND id_tenant = ?";
            params.push(req.id_tenant);
        }
        query += " LIMIT 1";
        const [result] = await connection.query(query, params);

        if (result.length === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Usuario encontrado" });
    } catch (error) {
        console.error('Error en getUsuario_1:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const addUsuario = async (req, res) => {
    let connection;
    try {
        const { id_rol, usua, contra, estado_usuario, id_empresa } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || estado_usuario === undefined) {
            return res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        connection = await getConnection();

        let id_tenant = req.id_tenant;

        // 1. Si el rol es "administrador", crear un nuevo tenant
        // (Asegúrate que el id_rol de administrador es 1, si no, ajusta el valor)
        if (id_rol === 1) {
            // Obtener el último id_tenant
            const [lastTenant] = await connection.query("SELECT MAX(id_tenant) as lastId FROM tenant");
            const newIdTenant = (lastTenant[0].lastId || 0) + 1;

            // Insertar nuevo tenant
            await connection.query(
                "INSERT INTO tenant (id_tenant) VALUES (?)",
                [newIdTenant]
            );

            id_tenant = newIdTenant;
        }

        // Solo agrega id_empresa si viene definido
        const usuario = {
            id_rol,
            usua: usua.trim(),
            contra: contra.trim(),
            estado_usuario
        };
        if (id_empresa !== undefined) usuario.id_empresa = id_empresa;
        if (id_tenant) usuario.id_tenant = id_tenant;

        await connection.query("INSERT INTO usuario SET ? ", usuario);

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Usuario añadido" });
    } catch (error) {
        console.error('Error en addUsuario:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateUsuario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_rol, usua, contra, estado_usuario } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || estado_usuario === undefined) {
            return res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        connection = await getConnection();
        
        // Obtener el estado actual del usuario para comparar cambios
        let querySelect = "SELECT estado_usuario, contra FROM usuario WHERE id_usuario = ?";
        let paramsSelect = [id];
        if (req.id_tenant) {
            querySelect += " AND id_tenant = ?";
            paramsSelect.push(req.id_tenant);
        }
        const [currentUser] = await connection.query(querySelect, paramsSelect);
        
        if (currentUser.length === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }

        const usuario = { id_rol, usua: usua.trim(), contra: contra.trim(), estado_usuario };
        let query = "UPDATE usuario SET ? WHERE id_usuario = ?";
        let params = [usuario, id];
        if (req.id_tenant) {
            query += " AND id_tenant = ?";
            params.push(req.id_tenant);
        }
        const [result] = await connection.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }

        // Registrar logs de cambios importantes
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                  (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        const currentUserData = currentUser[0];
        
        // Log de cambio de estado (bloqueo/desbloqueo)
        if (currentUserData.estado_usuario !== estado_usuario && req.id_tenant) {
            if (estado_usuario === 0) {
                // Usuario bloqueado
                await logAcceso.bloquearUsuario(id, req.id_usuario, ip, req.id_tenant);
            } else if (estado_usuario === 1) {
                // Usuario desbloqueado
                await logAcceso.desbloquearUsuario(id, req.id_usuario, ip, req.id_tenant);
            }
        }
        
        // Log de cambio de contraseña
        if (currentUserData.contra !== contra.trim() && req.id_tenant) {
            const esAdministrador = req.id_usuario !== parseInt(id);
            await logAcceso.cambiarContrasena(id, ip, req.id_tenant, esAdministrador);
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Usuario modificado" });
    } catch (error) {
        console.error('Error en updateUsuario:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateUsuarioPlan = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_empresa, plan_pago, estado_usuario, fecha_pago } = req.body;

        if (id_empresa === undefined || plan_pago === undefined || estado_usuario === undefined || fecha_pago === undefined) {
            return res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_empresa, plan_pago, estado_usuario, fecha_pago };
        connection = await getConnection();
        let query = "UPDATE usuario SET ? WHERE id_usuario = ?";
        let params = [usuario, id];
        if (req.id_tenant) {
            query += " AND id_tenant = ?";
            params.push(req.id_tenant);
        }
        const [result] = await connection.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Usuario modificado" });
    } catch (error) {
        console.error('Error en updateUsuarioPlan:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteUsuario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // Verificar si el usuario está en uso dentro de la base de datos
        const [verify] = await connection.query("SELECT 1 FROM vendedor WHERE id_usuario = ? LIMIT 1", [id]);
        const isUserInUse = verify.length > 0;

        if (isUserInUse) {
            let query = "UPDATE usuario SET estado_usuario = 0 WHERE id_usuario = ?";
            let params = [id];
            if (req.id_tenant) {
                query += " AND id_tenant = ?";
                params.push(req.id_tenant);
            }
            const [Updateresult] = await connection.query(query, params);

            if (Updateresult.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
            }

            // Limpiar caché
            queryCache.clear();

            res.json({ code: 2, message: "Usuario dado de baja" });
        } else {
            let query = "DELETE FROM usuario WHERE id_usuario = ?";
            let params = [id];
            if (req.id_tenant) {
                query += " AND id_tenant = ?";
                params.push(req.id_tenant);
            }
            const [result] = await connection.query(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
            }

            // Limpiar caché
            queryCache.clear();

            res.json({ code: 1, message: "Usuario eliminado" });
        }

    } catch (error) {
        console.error('Error en deleteUsuario:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getUsuarios,
    getUsuario,
    addUsuario,
    updateUsuario,
    getUsuario_1,
    deleteUsuario,
    updateUsuarioPlan
};
