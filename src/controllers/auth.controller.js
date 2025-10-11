import { getConnection } from "./../database/database.js";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { logAcceso } from "../utils/logActions.js";
import { verifyPassword, isBcryptHash } from "../utils/passwordUtil.js";
import { recordFailedAttempt, clearAttempts } from "../middlewares/rateLimiter.middleware.js";

// Cache para rutas por defecto (se consulta en cada login)
const routeCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// LOGIN - OPTIMIZADO Y SEGURO
const login = async (req, res) => {
    let connection;
    try {
        const { usuario, password } = req.body;
        
        // Validaciones mejoradas
        if (!usuario || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Usuario y contraseña son requeridos" 
            });
        }

        if (typeof usuario !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ 
                success: false, 
                message: "Credenciales inválidas" 
            });
        }

        const user = { usuario: usuario.trim(), password: password.trim() };
        connection = await getConnection();

        // Verificar que el usuario existe y está activo
        const [userFound] = await connection.query(
            "SELECT 1 FROM usuario WHERE usua = ? AND estado_usuario = 1 LIMIT 1",
            [user.usuario]
        );

        if (userFound.length === 0) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            
            // Registrar intento fallido
            recordFailedAttempt(req);
            
            try {
                await logAcceso.loginFail(user.usuario, ip, null, "Usuario no existe o está deshabilitado");
            } catch (eLog) {
                console.error('[SECURITY] Error al registrar login fallido:', eLog);
            }
            
            return res.status(401).json({ 
                success: false, 
                message: "Credenciales incorrectas" 
            });
        }

        let userValid = null;
        let userbd = null;

        // Obtener datos del usuario con su contraseña hasheada
        if (user.usuario === "desarrollador") {
            const [rows] = await connection.query(
                "SELECT id_usuario, id_rol, usua, contra, estado_usuario, id_tenant FROM usuario WHERE usua = ? LIMIT 1",
                [user.usuario]
            );
            userValid = rows;
        } else {
            const [rows] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.contra, usu.estado_usuario, su.nombre_sucursal, usu.id_tenant
                 FROM usuario usu
                 LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                 LEFT JOIN sucursal su ON su.dni = ven.dni
                 WHERE usu.usua = ? AND usu.estado_usuario = 1
                 LIMIT 1`,
                [user.usuario]
            );
            userValid = rows;
        }

        if (userValid.length === 0) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            
            recordFailedAttempt(req);
            
            try {
                await logAcceso.loginFail(user.usuario, ip, null, "Credenciales incorrectas");
            } catch (eLog) {
                console.error('[SECURITY] Error al registrar login fallido:', eLog);
            }
            
            return res.status(401).json({ 
                success: false, 
                message: "Credenciales incorrectas" 
            });
        }

        userbd = userValid[0];
        
        // Verificar contraseña con bcrypt si está hasheada, sino comparar texto plano (compatibilidad)
        let passwordMatch = false;
        
        if (isBcryptHash(userbd.contra)) {
            // Contraseña hasheada con bcrypt (segura)
            passwordMatch = await verifyPassword(user.password, userbd.contra);
        } else {
            // Contraseña en texto plano (modo compatibilidad - INSEGURO)
            console.warn(`[SECURITY] Usuario "${user.usuario}" tiene contraseña en texto plano. Considere migrar a bcrypt.`);
            passwordMatch = user.password === userbd.contra;
        }

        if (!passwordMatch) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            
            recordFailedAttempt(req);
            
            try {
                await logAcceso.loginFail(user.usuario, ip, userbd?.id_tenant ?? null, "Contraseña incorrecta");
            } catch (eLog) {
                console.error('[SECURITY] Error al registrar login fallido:', eLog);
            }
            
            return res.status(401).json({ 
                success: false, 
                message: "Credenciales incorrectas" 
            });
        }

        // Login exitoso - Limpiar intentos fallidos
        clearAttempts(req);

        // Crear token JWT seguro
        const token = await createAccessToken({
            nameUser: user.usuario,
            id_usuario: userbd.id_usuario,
            id_tenant: userbd.id_tenant ?? null
        });

        // Resolver ruta por defecto usando caché
        let defaultRedirect = "/inicio";
        const cacheKey = `route_${userbd.id_rol}`;
        
        if (routeCache.has(cacheKey)) {
            const cached = routeCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                defaultRedirect = cached.route;
            } else {
                routeCache.delete(cacheKey);
            }
        }
        
        if (defaultRedirect === "/inicio") {
            const [rolData] = await connection.query(
                "SELECT id_modulo, id_submodulo FROM rol WHERE id_rol = ? LIMIT 1",
                [userbd.id_rol]
            );
            
            if (rolData[0]?.id_submodulo) {
                const [submoduleData] = await connection.query(
                    "SELECT ruta FROM submodulos WHERE id_submodulo = ? LIMIT 1",
                    [rolData[0].id_submodulo]
                );
                if (submoduleData.length > 0 && submoduleData[0].ruta) {
                    defaultRedirect = submoduleData[0].ruta;
                }
            }
            
            if (defaultRedirect === "/inicio" && rolData[0]?.id_modulo) {
                const [moduleData] = await connection.query(
                    "SELECT ruta FROM modulo WHERE id_modulo = ? LIMIT 1",
                    [rolData[0].id_modulo]
                );
                if (moduleData.length > 0 && moduleData[0].ruta) {
                    defaultRedirect = moduleData[0].ruta;
                }
            }
            
            // Guardar en caché
            routeCache.set(cacheKey, {
                route: defaultRedirect,
                timestamp: Date.now()
            });
        }

        // Registrar login exitoso
        const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
        if (userbd.id_tenant) {
            try {
                await logAcceso.loginOk(userbd.id_usuario, ip, userbd.id_tenant);
            } catch (eLog) {
                console.error('[AUTH] Error al registrar login exitoso:', eLog);
            }
        }

        // Configuración segura de cookie
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("token", token, {
            httpOnly: true,        // Previene acceso desde JavaScript
            secure: isProd,        // Solo HTTPS en producción
            sameSite: isProd ? "none" : "lax", // Protección CSRF
            maxAge: 1000 * 60 * 60 * 8 // 8 horas
        });

        res.json({
            success: true,
            data: {
                id: userbd.id_usuario,
                rol: userbd.id_rol,
                usuario: userbd.usua,
                sucursal: userbd.nombre_sucursal || null,
                id_tenant: userbd.id_tenant || null,
                defaultPage: defaultRedirect
            }
        });

        // Actualizar estado del token en BD
        try {
            await connection.query(
                "UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", 
                [1, userbd.id_usuario]
            );
        } catch (eUpd) {
            console.error('[AUTH] Error al actualizar estado_token:', eUpd);
        }

    } catch (error) {
        console.error('[SECURITY] Error en login:', error);
        
        // NO exponer detalles del error en producción
        if (process.env.DEBUG_AUTH === "1") {
            return res.status(500).json({
                code: 0,
                debug: { 
                    code: error.code || null, 
                    msg: error.sqlMessage || error.message || "unknown" 
                }
            });
        }
        
        return res.status(500).json({ 
            success: false,
            code: 0, 
            message: "Error interno del servidor" 
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// VERIFY TOKEN - OPTIMIZADO
const verifyToken = async (req, res) => {
    // Validar cookie y JWT primero (sin DB)
    const token = req.cookies?.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "No autenticado" 
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, TOKEN_SECRET, { 
            audience: "horytek-erp", 
            issuer: "horytek-backend" 
        });
    } catch (error) {
        console.warn('[SECURITY] Token inválido:', error.message);
        return res.status(401).json({ 
            success: false,
            message: "Token inválido o expirado" 
        });
    }

    // Verificar en base de datos
    let connection;
    try {
        connection = await getConnection();

        const usuario = decoded.usr ?? decoded.nameUser;
        const id_tenant = decoded.ten ?? decoded.id_tenant ?? null;

        let userFound;
        if (id_tenant) {
            [userFound] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.estado_usuario, usu.estado_token, su.nombre_sucursal, usu.id_tenant
                 FROM usuario usu
                 LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                 LEFT JOIN sucursal su ON su.dni = ven.dni
                 WHERE usu.usua = ? AND usu.estado_usuario = 1 AND usu.id_tenant = ?
                 LIMIT 1`,
                [usuario, id_tenant]
            );
        } else {
            [userFound] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.estado_usuario, usu.estado_token, null as nombre_sucursal, null as id_tenant
                 FROM usuario usu
                 WHERE usu.usua = ? AND usu.estado_usuario = 1
                 LIMIT 1`,
                [usuario]
            );
        }

        if (!userFound || userFound.length === 0) {
            console.warn('[SECURITY] Usuario no encontrado en verifyToken:', usuario);
            return res.status(401).json({ 
                success: false,
                message: "Usuario no encontrado" 
            });
        }

        const userbd = userFound[0];
        
        // Verificar que el token esté activo (previene uso después de logout)
        if (userbd.estado_token === 0) {
            console.warn('[SECURITY] Token inactivo para usuario:', usuario);
            return res.status(401).json({ 
                success: false,
                message: "Sesión inválida" 
            });
        }

        return res.json({
            success: true,
            id: userbd.id_usuario,
            rol: userbd.id_rol,
            usuario: userbd.usua,
            sucursal: userbd.nombre_sucursal || null,
            id_tenant: userbd.id_tenant || null
        });
    } catch (error) {
        console.error('[SECURITY] Error en verifyToken:', error);
        return res.status(500).json({ 
            success: false,
            code: 0, 
            message: "Error al verificar token" 
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// LOGOUT - OPTIMIZADO
const logout = async (req, res) => {
    const token = req.cookies?.token;
    
    if (!token) {
        return res.status(400).json({ 
            success: false,
            message: "No hay sesión activa" 
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, TOKEN_SECRET, { 
            audience: "horytek-erp", 
            issuer: "horytek-backend" 
        });
    } catch (error) {
        console.warn('[SECURITY] Token inválido en logout:', error.message);
        // Limpiar cookie de todos modos
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("token", "", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            expires: new Date(0),
        });
        return res.sendStatus(200);
    }

    let connection;
    try {
        connection = await getConnection();

        const usuario = decoded.usr ?? decoded.nameUser;
        const [userFound] = await connection.query(
            "SELECT id_usuario, id_tenant FROM usuario WHERE usua = ? LIMIT 1", 
            [usuario]
        );
        
        if (userFound.length === 0) {
            console.warn('[SECURITY] Usuario no encontrado en logout:', usuario);
            return res.sendStatus(401);
        }

        const userbd = userFound[0];
        const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;

        // Registrar logout
        if (userbd.id_tenant) {
            try { 
                await logAcceso.logout(userbd.id_usuario, ip, userbd.id_tenant); 
            } catch (eLog) {
                console.error('[AUTH] Error al registrar logout:', eLog);
            }
        }

        // Invalidar token en BD
        await connection.query(
            "UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", 
            [0, userbd.id_usuario]
        );

        // Limpiar cookie
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("token", "", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            expires: new Date(0),
        });

        return res.json({ 
            success: true,
            message: "Sesión cerrada correctamente" 
        });
    } catch (error) {
        console.error('[SECURITY] Error en logout:', error);
        return res.status(500).json({ 
            success: false,
            code: 0, 
            message: "Error al cerrar sesión" 
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ACTUALIZAR NOMBRE DE USUARIO - OPTIMIZADO
const updateUsuarioName = async (req, res) => {
    let connection;
    try {
        const { usua } = req.body;
        
        if (!usua) {
            return res.status(400).json({ 
                code: 0,
                message: "El usuario es requerido" 
            });
        }

        connection = await getConnection();
        
        const [userResult] = await connection.query(
            `SELECT id_usuario FROM usuario WHERE usua = ? LIMIT 1`, 
            [usua]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "Usuario no encontrado" 
            });
        }

        const userbd = userResult[0];
        
        await connection.query(
            "UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", 
            [0, userbd.id_usuario]
        );

        res.json({ 
            code: 1, 
            message: "Estado de token actualizado" 
        });
    } catch (error) {
        console.error('Error en updateUsuarioName:', error);
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

export const methods = {
    login,
    verifyToken,
    logout,
    updateUsuarioName
};
