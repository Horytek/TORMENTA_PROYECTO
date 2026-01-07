import { getConnection } from "./../database/database.js";
import { logAcceso } from "../utils/logActions.js";
import { checkLimit } from "../services/limites.service.js";
import { hashPassword } from "../utils/passwordUtil.js";
import * as XLSX from 'xlsx';

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
                U.id_empresa, pp.descripcion_plan AS plan_pago_1, U.fecha_pago AS fecha_pago,
                U.estado_prueba
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
            SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario, estado_token, 
                   id_empresa, pp.descripcion_plan as plan_pago_1, U.fecha_pago AS fecha_pago,
                   U.estado_prueba
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

        let id_tenant;

        if (id_rol === 1) {
            // Si es administrador, crear nuevo tenant
            const [lastTenant] = await connection.query("SELECT MAX(id_tenant) as lastId FROM tenant");
            const newIdTenant = (lastTenant[0].lastId || 0) + 1;
            await connection.query("INSERT INTO tenant (id_tenant) VALUES (?)", [newIdTenant]);
            id_tenant = newIdTenant;
        } else {
            // Si no es administrador, usar el id_tenant actual de la sesión
            // Si no es administrador, usar el id_tenant actual de la sesión
            id_tenant = req.id_tenant;

            // Verificar límite de usuarios
            const limitCheck = await checkLimit(id_tenant, 'MAX_USERS');
            if (!limitCheck.allowed) {
                return res.status(403).json({ code: 0, message: `Límite de usuarios alcanzado (${limitCheck.current}/${limitCheck.limit})` });
            }
        }

        // Encriptar la contraseña antes de guardar
        const hashedPassword = await hashPassword(contra.trim());

        // Solo agrega id_empresa si viene definido
        const usuario = {
            id_rol,
            usua: usua.trim(),
            contra: hashedPassword,
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

        // Campos opcionales: cualquiera puede venir de forma individual
        const {
            id_rol,
            usua,
            contra,
            estado_usuario,
            estado_prueba // <-- NUEVO campo soportado para actualización parcial
        } = req.body;

        // Si no vino ningún campo actualizable, retorna 400
        if (
            typeof id_rol === "undefined" &&
            typeof usua === "undefined" &&
            typeof contra === "undefined" &&
            typeof estado_usuario === "undefined" &&
            typeof estado_prueba === "undefined"
        ) {
            return res.status(400).json({ code: 0, message: "No hay campos para actualizar" });
        }

        connection = await getConnection();

        // Traer datos actuales para comparar (logs y hash)
        let selectSQL = "SELECT estado_usuario, contra, estado_prueba FROM usuario WHERE id_usuario = ?";
        const selectParams = [id];
        if (req.id_tenant) {
            selectSQL += " AND id_tenant = ?";
            selectParams.push(req.id_tenant);
        }
        const [currentRows] = await connection.query(selectSQL, selectParams);
        if (currentRows.length === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }
        const currentUser = currentRows[0];

        // Construir update dinámico
        const updates = [];
        const params = [];

        if (typeof id_rol !== "undefined") {
            updates.push("id_rol = ?");
            params.push(id_rol);
        }
        if (typeof usua !== "undefined") {
            updates.push("usua = ?");
            params.push(String(usua).trim());
        }
        if (typeof contra !== "undefined") {
            // Encriptar solo si se envió una nueva contraseña
            let nuevaContra = String(contra).trim();
            if (currentUser.contra !== nuevaContra) {
                nuevaContra = await hashPassword(nuevaContra);
            }
            updates.push("contra = ?");
            params.push(nuevaContra);
        }
        if (typeof estado_usuario !== "undefined") {
            const parsed = parseInt(estado_usuario);
            if (![0, 1].includes(parsed)) {
                return res.status(400).json({ code: 0, message: "estado_usuario inválido" });
            }
        }
        if (typeof estado_prueba !== "undefined") {
            updates.push("estado_prueba = ?");
            params.push(estado_prueba);
        }

        if (updates.length === 0) {
            return res.status(400).json({ code: 0, message: "No hay cambios para aplicar" });
        }

        let updateSQL = `UPDATE usuario SET ${updates.join(", ")} WHERE id_usuario = ?`;
        params.push(id);
        if (req.id_tenant) {
            updateSQL += " AND id_tenant = ?";
            params.push(req.id_tenant);
        }

        const [result] = await connection.query(updateSQL, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }

        // Logs (solo si se envió ese campo)
        const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress ||
            (req.connection?.socket ? req.connection.socket.remoteAddress : null);

        if (typeof estado_usuario !== "undefined" && req.id_tenant && currentUser.estado_usuario !== estado_usuario) {
            if (estado_usuario === 0) {
                await logAcceso.bloquearUsuario(id, req.id_usuario, ip, req.id_tenant);
            } else if (estado_usuario === 1) {
                await logAcceso.desbloquearUsuario(id, req.id_usuario, ip, req.id_tenant);
            }
        }

        if (typeof contra !== "undefined" && req.id_tenant && currentUser.contra !== String(contra).trim()) {
            const esAdministrador = req.id_usuario !== parseInt(id);
            await logAcceso.cambiarContrasena(id, ip, req.id_tenant, esAdministrador);
        }

        // Limpiar caché
        queryCache.clear();

        return res.json({ code: 1, message: "Usuario modificado" });
    } catch (error) {
        console.error("Error en updateUsuario:", error);
        return res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
            // Solo desactiva el usuario
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

            queryCache.clear();
            return res.json({ code: 2, message: "Usuario dado de baja" });
        } else {
            // Intenta eliminar el usuario
            let query = "DELETE FROM usuario WHERE id_usuario = ?";
            let params = [id];
            if (req.id_tenant) {
                query += " AND id_tenant = ?";
                params.push(req.id_tenant);
            }
            try {
                const [result] = await connection.query(query, params);

                if (result.affectedRows === 0) {
                    return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
                }

                queryCache.clear();
                return res.json({ code: 1, message: "Usuario eliminado" });
            } catch (error) {
                // Si hay error de integridad referencial, desactiva el usuario
                if (error.code === 'ER_ROW_IS_REFERENCED_2') {
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

                    queryCache.clear();
                    return res.status(400).json({
                        code: 2,
                        message: "No se puede eliminar el usuario porque tiene datos relacionados. Se ha dado de baja."
                    });
                }
                throw error;
            }
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

const addUsuarioLanding = async (req, res) => {
    let connection;
    try {
        const { id_rol, usua, contra, estado_usuario, id_empresa, plan_pago } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || estado_usuario === undefined) {
            return res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        connection = await getConnection();

        // Si el rol es "administrador", crear un nuevo tenant
        let id_tenant = undefined;
        if (id_rol === 1) {
            const [lastTenant] = await connection.query("SELECT MAX(id_tenant) as lastId FROM tenant");
            const newIdTenant = (lastTenant[0].lastId || 0) + 1;
            await connection.query("INSERT INTO tenant (id_tenant) VALUES (?)", [newIdTenant]);
            id_tenant = newIdTenant;
        }

        // Encriptar la contraseña antes de guardar
        const hashedPassword = await hashPassword(contra.trim());

        // Construir usuario sin restricciones
        const usuario = {
            id_rol,
            usua: usua.trim(),
            contra: hashedPassword,
            estado_usuario
        };
        if (id_empresa !== undefined) usuario.id_empresa = id_empresa;
        if (id_tenant) usuario.id_tenant = id_tenant;
        if (plan_pago !== undefined) usuario.plan_pago = plan_pago;

        await connection.query("INSERT INTO usuario SET ? ", usuario);

        // Si se creó un nuevo tenant y hay empresa, actualizar la empresa con el id_tenant
        if (id_tenant && id_empresa) {
            await connection.query(
                "UPDATE empresa SET id_tenant = ? WHERE id_empresa = ?",
                [id_tenant, id_empresa]
            );
        }

        res.json({ code: 1, message: "Usuario añadido (landing)" });
    } catch (error) {
        console.error('Error en addUsuarioLanding:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor (landing)" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const bulkUpdateUsuarios = async (req, res) => {
    let connection;
    try {
        const { action, ids } = req.body;

        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ code: 0, message: "Acción e IDs son requeridos" });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        const id_tenant = req.id_tenant;
        let query = "";
        let params = [];
        let successMessage = "";

        // Validar que todos los IDs pertenezcan al tenant (si aplica)
        if (id_tenant) {
            const placeholders = ids.map(() => '?').join(',');
            const [validIds] = await connection.query(
                `SELECT id_usuario FROM usuario WHERE id_usuario IN (${placeholders}) AND id_tenant = ?`,
                [...ids, id_tenant]
            );

            if (validIds.length !== ids.length) {
                await connection.rollback();
                return res.status(403).json({ code: 0, message: "Algunos usuarios no pertenecen a tu organización" });
            }
        }

        if (action === 'activate') {
            query = `UPDATE usuario SET estado_usuario = 1 WHERE id_usuario IN (${ids.map(() => '?').join(',')})`;
            params = [...ids];
            successMessage = "Usuarios activados correctamente";
        } else if (action === 'deactivate') {
            query = `UPDATE usuario SET estado_usuario = 0 WHERE id_usuario IN (${ids.map(() => '?').join(',')})`;
            params = [...ids];
            successMessage = "Usuarios desactivados correctamente";
        } else if (action === 'delete') {
            // Para eliminar, primero verificamos dependencias
            // Si tienen dependencias, los desactivamos en lugar de eliminar
            // Esta lógica es compleja para bulk, así que simplificaremos:
            // Intentamos eliminar, si falla por FK, hacemos rollback y retornamos error o advertencia
            // O mejor: marcamos como inactivos los que no se pueden eliminar (soft delete forzado)

            // Opción segura: Soft delete para todos en bulk delete
            // query = `UPDATE usuario SET estado_usuario = 0 WHERE id_usuario IN (${ids.map(() => '?').join(',')})`;

            // Opción real: Intentar eliminar uno por uno o en grupo si la DB lo permite
            // Vamos a intentar eliminar físicamente
            query = `DELETE FROM usuario WHERE id_usuario IN (${ids.map(() => '?').join(',')})`;
            params = [...ids];
            successMessage = "Usuarios eliminados correctamente";
        } else {
            await connection.rollback();
            return res.status(400).json({ code: 0, message: "Acción no válida" });
        }

        if (id_tenant) {
            query += " AND id_tenant = ?";
            params.push(id_tenant);
        }

        try {
            const [result] = await connection.query(query, params);

            // Logs de auditoría (simplificado para bulk)
            const ip = req.ip || req.connection?.remoteAddress;
            // Aquí podríamos iterar para guardar logs individuales si fuera necesario

            await connection.commit();
            queryCache.clear();
            res.json({ code: 1, message: successMessage, affectedRows: result.affectedRows });
        } catch (error) {
            await connection.rollback();
            // Si falla eliminación por FK, sugerir desactivación
            if (error.code === 'ER_ROW_IS_REFERENCED_2' && action === 'delete') {
                return res.status(400).json({
                    code: 2,
                    message: "No se pueden eliminar algunos usuarios porque tienen registros asociados. Intente desactivarlos."
                });
            }
            throw error;
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en bulkUpdateUsuarios:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const importUsuarios = async (req, res) => {
    let connection;
    try {
        if (!req.file) {
            return res.status(400).json({ code: 0, message: "No se ha subido ningún archivo" });
        }

        const file = req.file;
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return res.status(400).json({ code: 0, message: "El archivo está vacío" });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        const id_tenant = req.id_tenant;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Obtener roles para validación
        const [roles] = await connection.query("SELECT id_rol, nom_rol FROM rol WHERE id_rol != 10");
        const roleMap = new Map(roles.map(r => [r.id_rol, r.nom_rol]));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel header is row 1

            // Validaciones básicas
            if (!row.username || !row.password || !row.role_id) {
                errorCount++;
                errors.push(`Fila ${rowNum}: Faltan campos obligatorios (username, password, role_id)`);
                continue;
            }

            // Validar rol
            if (!roleMap.has(row.role_id)) {
                errorCount++;
                errors.push(`Fila ${rowNum}: ID de rol inválido (${row.role_id})`);
                continue;
            }

            // Validar duplicados (username)
            const [existing] = await connection.query("SELECT 1 FROM usuario WHERE usua = ?", [row.username]);
            if (existing.length > 0) {
                errorCount++;
                errors.push(`Fila ${rowNum}: El usuario '${row.username}' ya existe`);
                continue;
            }

            try {
                const hashedPassword = await hashPassword(String(row.password).trim());

                const usuario = {
                    id_rol: row.role_id,
                    usua: String(row.username).trim(),
                    contra: hashedPassword,
                    estado_usuario: row.status === 0 ? 0 : 1 // Default active
                };

                if (id_tenant) usuario.id_tenant = id_tenant;
                // Asignar empresa del admin si aplica, o dejar null
                // Para simplificar, asumimos que si el admin tiene empresa, los usuarios nuevos también
                if (req.id_empresa) usuario.id_empresa = req.id_empresa;

                await connection.query("INSERT INTO usuario SET ?", usuario);
                successCount++;
            } catch (err) {
                errorCount++;
                errors.push(`Fila ${rowNum}: Error al insertar - ${err.message}`);
            }
        }

        if (successCount > 0) {
            await connection.commit();
            queryCache.clear();
            res.json({
                code: 1,
                message: `Importación completada: ${successCount} exitosos, ${errorCount} fallidos`,
                details: { successCount, errorCount, errors }
            });
        } else {
            await connection.rollback();
            res.status(400).json({
                code: 0,
                message: "No se pudo importar ningún usuario",
                details: { successCount, errorCount, errors }
            });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en importUsuarios:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const exportUsuarios = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // Reutilizamos lógica de filtros de getUsuarios pero sin paginación
        const { id_rol, estado_usuario, id_empresa, usua, ids } = req.query;
        const whereClauses = ['R.id_rol != 10'];
        const whereParams = [];

        if (req.id_tenant) {
            whereClauses.push('U.id_tenant = ?');
            whereParams.push(req.id_tenant);
        }

        // Si se especifican IDs (exportar seleccionados)
        if (ids) {
            const idList = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (idList.length > 0) {
                whereClauses.push(`U.id_usuario IN (${idList.map(() => '?').join(',')})`);
                whereParams.push(...idList);
            }
        } else {
            // Aplicar otros filtros solo si no hay IDs específicos
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
                whereClauses.push('U.usua LIKE ?');
                whereParams.push(`%${usua}%`);
            }
        }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        const query = `
            SELECT 
                U.id_usuario, R.nom_rol, U.usua, 
                CASE WHEN U.estado_usuario = 1 THEN 'Activo' ELSE 'Inactivo' END as estado,
                CASE WHEN U.estado_token = 1 THEN 'Conectado' ELSE 'Desconectado' END as conexion,
                pp.descripcion_plan as plan
            FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol
            LEFT JOIN plan_pago pp ON pp.id_plan = U.plan_pago
            ${whereSQL}
            ORDER BY U.id_usuario DESC
        `;

        const [rows] = await connection.query(query, whereParams);

        // Generar Excel
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=usuarios.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error('Error en exportUsuarios:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getUsuarios,
    getUsuario,
    addUsuario,
    updateUsuario,
    getUsuario_1,
    deleteUsuario,
    updateUsuarioPlan,
    addUsuarioLanding,
    bulkUpdateUsuarios,
    importUsuarios,
    exportUsuarios
};
