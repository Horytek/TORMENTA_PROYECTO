import { getConnection } from "./../database/database";
import { logAcceso, logClientes } from "../utils/logActions.js";

// Obtener todos los usuarios (con o sin id_tenant)
const getUsuarios = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        let query = `
            SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario, estado_token, id_empresa, pp.descripcion_plan AS plan_pago_1, U.fecha_pago AS fecha_pago
            FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol
            LEFT JOIN plan_pago pp ON pp.id_plan=U.plan_pago
            WHERE R.id_rol!=10
            ORDER BY id_usuario desc
        `;
        let params = [];
        // Si existe req.id_tenant, filtra por tenant
        if (req.id_tenant) {
            query = query.replace('ORDER BY', 'AND U.id_tenant = ? ORDER BY');
            params.push(req.id_tenant);
        }
        const [result] = await connection.query(query, params);
        res.json({ code: 1, data: result });
    } catch (error) {
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
        const [result] = await connection.query(query, params);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Usuario no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Usuario encontrado" });
    } catch (error) {
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
        const [result] = await connection.query(query, params);

        if (result.length === 0) {
            return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Usuario encontrado" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const addUsuario = async (req, res) => {
    let connection;
    try {
        const { id_rol, usua, contra, estado_usuario, id_empresa } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || id_empresa === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_rol, usua: usua.trim(), contra: contra.trim(), estado_usuario, id_empresa };
        // Si hay id_tenant, agregarlo al usuario
        if (req.id_tenant) usuario.id_tenant = req.id_tenant;

        connection = await getConnection();
        await connection.query("INSERT INTO usuario SET ? ", usuario);

        res.json({ code: 1, message: "Usuario añadido" });
    } catch (error) {
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
            res.status(400).json({ message: "Bad Request. Please fill all field." });
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

        res.json({ code: 1, message: "Usuario modificado" });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
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
            res.status(400).json({ message: "Bad Request. Please fill all field." });
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

        res.json({ code: 1, message: "Usuario modificado" });
    } catch (error) {
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
        const [verify] = await connection.query("SELECT 1 FROM vendedor WHERE id_usuario = ?", id);
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

            res.json({ code: 1, message: "Usuario eliminado" });
        }

    } catch (error) {
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