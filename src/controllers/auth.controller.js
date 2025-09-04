import { getConnection } from "./../database/database.js";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { logAcceso } from "../utils/logActions.js";

const login = async (req, res) => {
    let connection;
    try {
        const { usuario, password } = req.body;
        const user = { usuario: usuario.trim(), password: password.trim() };
        connection = await getConnection();
        const [userFound] = await connection.query("SELECT 1 FROM usuario WHERE usua = ? AND estado_usuario=1", user.usuario);

        if (userFound.length === 0) {
            // Registrar log de login fallido por usuario inexistente
            const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.connection.socket ? req.connection.socket.remoteAddress : null);
            
            await logAcceso.loginFail(user.usuario, ip, 1, 'Usuario no existe o está deshabilitado');
            
            return res.status(400).json({ success: false, message: 'El usuario ingresado no existe o esta deshabilitado' });
        }

        let userValid;
        let userbd = null;

        if (usuario && usuario === 'desarrollador') {
            const [rows] = await connection.query(
                "SELECT * FROM usuario WHERE usua = ? AND contra = ?", 
                [user.usuario, user.password]
            );
            userValid = rows;
        } else {
            // Intentar obtener usuario con tenant
            const [rows] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.contra, usu.estado_usuario, su.nombre_sucursal, usu.id_tenant
                FROM usuario usu
                LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                LEFT JOIN sucursal su ON su.dni = ven.dni
                WHERE usu.usua = ? AND usu.contra = ? AND usu.estado_usuario = 1`, 
                [user.usuario, user.password]
            );
            userValid = rows;
        }

        if (userValid.length > 0) {
            userbd = userValid[0];
            // Crear payload del token con los datos necesarios
            const tokenPayload = { 
                nameUser: user.usuario,
                id_usuario: userbd.id_usuario  // Agregar id_usuario al token
            };
            if (userbd.id_tenant) tokenPayload.id_tenant = userbd.id_tenant;
            const token = await createAccessToken(tokenPayload);

            // Obtener la página por defecto para el rol del usuario
            let defaultRedirect = '/inicio';

            const [rolData] = await connection.query(
                "SELECT id_modulo, id_submodulo FROM rol WHERE id_rol = ?",
                [userbd.id_rol]
            );

            if (rolData[0]?.id_submodulo) {
                const [submoduleData] = await connection.query(
                    "SELECT ruta FROM submodulos WHERE id_submodulo = ?",
                    [rolData[0].id_submodulo]
                );
                if (submoduleData.length > 0 && submoduleData[0].ruta) {
                    defaultRedirect = submoduleData[0].ruta;
                }
            }

            if (defaultRedirect === '/inicio' && rolData[0]?.id_modulo) {
                const [moduleData] = await connection.query(
                    "SELECT ruta FROM modulo WHERE id_modulo = ?",
                    [rolData[0].id_modulo]
                );
                if (moduleData.length > 0 && moduleData[0].ruta) {
                    defaultRedirect = moduleData[0].ruta;
                }
            }

            // Registrar log de login exitoso
            const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.connection.socket ? req.connection.socket.remoteAddress : null);
            
            if (userbd.id_tenant) {
                await logAcceso.loginOk(userbd.id_usuario, ip, userbd.id_tenant);
            }

            res.json({
                success: true,
                data: {
                    id: userbd.id_usuario,
                    rol: userbd.id_rol,
                    usuario: userbd.usua,
                    sucursal: userbd.nombre_sucursal || null,
                    id_tenant: userbd.id_tenant || null,
                    defaultPage: defaultRedirect
                },
                token,
                message: 'Usuario encontrado'
            });

            // Registrar el último inicio de sesión
            await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [1, userbd.id_usuario]);
        } else {
            // Registrar log de login fallido
            const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.connection.socket ? req.connection.socket.remoteAddress : null);
            
            // Para login fallido, usar id_tenant = 1 por defecto (o el que corresponda)
            await logAcceso.loginFail(user.usuario, ip, 1, 'Contraseña incorrecta');
            
            res.status(400).json({ success: false, message: 'La contraseña ingresada no es correcta' });
        }

    } catch (error) {
        res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const verifyToken = async (req, res) => {
    let connection;
    connection = await getConnection();
    const tokenHeader = req.headers['authorization'];
    let token = tokenHeader;

    // Si el header tiene formato Bearer <token>, extrae solo el token
    if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
        token = tokenHeader.split(' ')[1];
    }

    if (!token) return res.send(false);

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.sendStatus(401);

        // Si el usuario tiene id_tenant, buscar con joins, si no, solo por usuario
        let userFound;
        if (user.id_tenant) {
            [userFound] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.contra, usu.estado_usuario, su.nombre_sucursal, usu.id_tenant
                FROM usuario usu
                LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                LEFT JOIN sucursal su ON su.dni = ven.dni
                WHERE usu.usua = ? AND usu.estado_usuario = 1 AND usu.id_tenant = ?`,
                [user.nameUser, user.id_tenant]
            );
        } else {
            [userFound] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.contra, usu.estado_usuario, null as nombre_sucursal, null as id_tenant
                FROM usuario usu
                WHERE usu.usua = ? AND usu.estado_usuario = 1`,
                [user.nameUser]
            );
        }

        if (userFound.length === 0) return res.sendStatus(401);

        const userbd = userFound[0];

        return res.json({
            id: userbd.id_usuario,
            rol: userbd.id_rol,
            usuario: userbd.usua,
            sucursal: userbd.nombre_sucursal || null,
            id_tenant: userbd.id_tenant || null
        });
    });
};

//Revisa
const logout = async (req, res) => {
    let connection;
    connection = await getConnection();
    const tokenHeader = req.headers['authorization'];
    let token = tokenHeader;

    // Si el header tiene formato Bearer <token>, extrae solo el token
    if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
        token = tokenHeader.split(' ')[1];
    }

    if (!token) return res.send(false);

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.sendStatus(401);

        const [userFound] = await connection.query("SELECT * FROM usuario WHERE usua = ?", user.nameUser);
        if (userFound.length === 0) return res.sendStatus(401);

        const userbd = userFound[0];
        
        // Registrar log de logout
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                  (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        if (userbd.id_tenant) {
            await logAcceso.logout(userbd.id_usuario, ip, userbd.id_tenant);
        }
        
        await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [0, userbd.id_usuario]);

        res.cookie("token", "", {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            domain: '.bck-omega.vercel.app',
            expires: new Date(0),
        });

        return res.sendStatus(200);
    });
};

const updateUsuarioName = async (req, res) => {
    let connection;
    try {
        const { usua } = req.body;
        if (!usua) {
            return res.status(400).json({ message: "El usuario no fue enviado en la solicitud" });
        }

        connection = await getConnection();
        const [userResult] = await connection.query(`SELECT id_usuario FROM usuario WHERE usua = ?`, [usua]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const userbd = userResult[0];
        await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [0, userbd.id_usuario]);

        res.json({ code: 1, message: "Usuario actualizado" });
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    login,
    verifyToken,
    logout,
    updateUsuarioName
};