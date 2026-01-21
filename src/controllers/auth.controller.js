import { getConnection } from "./../database/database.js";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { logAcceso } from "../utils/logActions.js";
import { verifyPassword, isBcryptHash } from "../utils/passwordUtil.js";
import { recordFailedAttempt, clearAttempts } from "../middlewares/rateLimiter.middleware.js";
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
// Cache para rutas por defecto (se consulta en cada login)
const routeCache = new Map();
const CACHE_TTL = 60000; // 1 minuto
const otpStore = {};
// LOGIN - OPTIMIZADO Y SEGURO
const login = async (req, res) => {
    let connection;
    try {
        const { usuario, password } = req.body;

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
        connection = await getConnection();

        const user = { usuario: usuario.trim(), password: password.trim() };

        // Verificar que el usuario existe (quitamos filtro estricto de estado_usuario=1 aquí para manejar mensaje personalizado)
        const [rows] = await connection.query(
            "SELECT id_usuario, id_rol, usua, contra, estado_usuario, id_tenant, id_empresa, fecha_pago, plan_pago FROM usuario WHERE usua = ? LIMIT 1",
            [user.usuario]
        );

        if (rows.length === 0) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            recordFailedAttempt(req);
            try { await logAcceso.loginFail(user.usuario, ip, null, "Usuario no existe"); } catch (e) { }
            return res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }

        let userbd = rows[0];

        // Verificar contraseña
        let passwordMatch = false;
        if (isBcryptHash(userbd.contra)) {
            passwordMatch = await verifyPassword(user.password, userbd.contra);
        } else {
            console.warn(`[SECURITY] Usuario "${user.usuario}" tiene contraseña en texto plano.`);
            passwordMatch = user.password === userbd.contra;
        }

        if (!passwordMatch) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            recordFailedAttempt(req);
            try { await logAcceso.loginFail(user.usuario, ip, userbd.id_tenant, "Contraseña incorrecta"); } catch (e) { }
            return res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }

        // ---------------------------------------------------------
        // VALIDACIÓN DE SUSCRIPCIÓN (NUEVA ARQUITECTURA E1)
        // ---------------------------------------------------------

        let tenantStatus = 'ACTIVE'; // Default para devs o usuarios sin tenant
        let permVersion = 1;

        if (userbd.id_tenant) {
            // Consultar estado del tenant
            const [tenantRows] = await connection.query(
                "SELECT tenant_status, grace_until, perm_version FROM empresa WHERE id_empresa = ? LIMIT 1",
                [userbd.id_tenant]
            );

            if (tenantRows.length > 0) {
                const tenantInfo = tenantRows[0];
                tenantStatus = tenantInfo.tenant_status;
                permVersion = tenantInfo.perm_version || 1;

                // Lógica de Bloqueo por Status
                if (tenantInfo.tenant_status === 'SUSPENDED') {
                    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
                    recordFailedAttempt(req);
                    return res.status(403).json({
                        success: false,
                        message: "La suscripción de la empresa está suspendida. Contacte al administrador."
                    });
                }

                if (tenantInfo.tenant_status === 'GRACE') {
                    // Validar si venció el periodo de gracia
                    if (tenantInfo.grace_until && new Date(tenantInfo.grace_until) < new Date()) {
                        // Opcional: Auto-suspender aquí o simplemente negar acceso
                        // Por ahora negamos acceso
                        return res.status(403).json({
                            success: false,
                            message: "El periodo de gracia de la suscripción ha terminado."
                        });
                    }
                }
            }
        }

        // El usuario individual debe estar activo
        if (userbd.estado_usuario !== 1) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            recordFailedAttempt(req);
            return res.status(403).json({ success: false, message: "Tu cuenta está desactivada." });
        }

        // Si es rol normal, traer más datos
        if (userbd.id_rol !== 1 && user.usuario !== "desarrollador") {
            const [extra] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.contra, usu.estado_usuario, su.nombre_sucursal, usu.id_tenant, usu.plan_pago
                 FROM usuario usu
                 LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                 LEFT JOIN sucursal su ON su.dni = ven.dni
                 WHERE usu.id_usuario = ? LIMIT 1`,
                [userbd.id_usuario]
            );
            if (extra.length > 0) userbd = { ...userbd, ...extra[0] };
        }

        // Login exitoso
        clearAttempts(req);

        // Crear token JWT seguro
        const token = await createAccessToken({
            nameUser: user.usuario,
            id_usuario: userbd.id_usuario,
            id_tenant: userbd.id_tenant ?? null,
            id_empresa: userbd.id_empresa ?? null,
            status: tenantStatus,
            pv: permVersion // perm_version corta para payload de JWT
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
            routeCache.set(cacheKey, { route: defaultRedirect, timestamp: Date.now() });
        }

        // Registrar login exitoso
        const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
        if (userbd.id_tenant) {
            try { await logAcceso.loginOk(userbd.id_usuario, ip, userbd.id_tenant); } catch (e) { }
        }

        // NOTA DE SEGURIDAD: Se remueve la cookie y se envía el token en el cuerpo
        // para almacenamiento en cliente (localStorage/Memory) según solicitud.
        // const isProd = process.env.NODE_ENV === "production";
        // res.cookie("token", token, { ... });

        res.json({
            success: true,
            token: token, // Enviamos el token al cliente
            data: {
                id: userbd.id_usuario,
                rol: userbd.id_rol,
                usuario: userbd.usua,
                sucursal: userbd.nombre_sucursal || null,
                id_tenant: userbd.id_tenant || null,
                id_empresa: userbd.id_empresa || null,
                plan_pago: userbd.plan_pago || null,
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
    // Validar token de Header (o cookie fallback)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else {
        token = req.cookies?.token;
    }

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
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.estado_usuario, usu.estado_token, su.nombre_sucursal, usu.id_tenant, usu.id_empresa, usu.plan_pago, usu.fecha_pago
                 FROM usuario usu
                 LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                 LEFT JOIN sucursal su ON su.dni = ven.dni
                 WHERE usu.usua = ? AND usu.estado_usuario = 1 AND usu.id_tenant = ?
                 LIMIT 1`,
                [usuario, id_tenant]
            );
        } else {
            [userFound] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.estado_usuario, usu.estado_token, null as nombre_sucursal, null as id_tenant, usu.id_empresa
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

        // ---------------------------------------------------------
        // VALIDACIÓN DE SUSCRIPCIÓN (EXPIRACIÓN)
        // ---------------------------------------------------------
        if (userbd.id_tenant && userbd.fecha_pago) {
            const today = new Date();
            const expiration = new Date(userbd.fecha_pago);
            today.setHours(0, 0, 0, 0);

            if (expiration < today) {
                try {
                    await connection.query(
                        "UPDATE usuario SET estado_usuario = 0 WHERE id_tenant = ?",
                        [userbd.id_tenant]
                    );
                    userbd.estado_usuario = 0;
                    return res.status(401).json({
                        success: false,
                        message: "Suscripción vencida"
                    });
                } catch (e) { }
            }
        }
        // ---------------------------------------------------------

        // Verificar que el token esté activo (previene uso después de logout)
        if (userbd.estado_token === 0) {
            console.warn('[SECURITY] Token inactivo para usuario:', usuario);
            return res.status(401).json({
                success: false,
                message: "Sesión inválida"
            });
        }

        // Resolver ruta por defecto usando caché (Igual que en login para consistencia)
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
            // Nota: Reutilizamos la conexión existente
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
            routeCache.set(cacheKey, { route: defaultRedirect, timestamp: Date.now() });
        }

        return res.json({
            success: true,
            id: userbd.id_usuario,
            rol: userbd.id_rol,
            usuario: userbd.usua,
            sucursal: userbd.nombre_sucursal || null,
            id_tenant: userbd.id_tenant || null,
            id_empresa: userbd.id_empresa || null,
            plan_pago: userbd.plan_pago || null,
            defaultPage: defaultRedirect
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
    // Leer token de cabecera Authorization (Bearer token)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else {
        // Fallback a cookie por si acaso
        token = req.cookies?.token;
    }

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "No hay sesión activa"
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
            // Si expiro, igual intentamos decodificar para el log si es posible, o simplemente seguimos
            if (err) throw err;
            return decoded;
        });
    } catch (error) {
        console.warn('[SECURITY] Token inválido en logout:', error.message);
        // Intentar limpiar cookie por si acaso existía
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

        // Limpiar cookie por si acaso
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


// AUTENTICAR CUENTA Y ENVIAR CÓDIGO
const sendAuthCode = async (req, res) => {
    let connection;
    try {
        const { usuario, password, clave_acceso } = req.body;
        if (!usuario || !password || !clave_acceso) {
            return res.status(400).json({ success: false, message: "Usuario, contraseña y clave de acceso requeridos" });
        }

        connection = await getConnection();
        const [userRows] = await connection.query(
            "SELECT id_usuario, usua, contra, id_empresa, estado_usuario, clave_acceso FROM usuario WHERE usua = ? LIMIT 1",
            [usuario.trim()]
        );
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        const user = userRows[0];

        let passwordMatch = false;
        if (isBcryptHash(user.contra)) {
            passwordMatch = await verifyPassword(password, user.contra);
        } else {
            passwordMatch = password === user.contra;
        }
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
        }

        // Validar clave de acceso y que el usuario esté inactivo
        if (!user.clave_acceso || user.clave_acceso !== clave_acceso) {
            return res.status(401).json({ success: false, message: "Clave de acceso incorrecta o expirada" });
        }
        if (user.estado_usuario === 1 || user.estado_usuario === "1") {
            return res.status(400).json({ success: false, message: "La cuenta ya está activada" });
        }

        // Cambiar estado_usuario a 1 (activo)
        await connection.query(
            "UPDATE usuario SET estado_usuario = 1 WHERE id_usuario = ?",
            [user.id_usuario]
        );

        // Obtener email de la empresa
        if (!user.id_empresa) {
            return res.status(400).json({ success: false, message: "El usuario no tiene empresa asociada" });
        }
        const [empresaRows] = await connection.query(
            "SELECT email FROM empresa WHERE id_empresa = ? LIMIT 1",
            [user.id_empresa]
        );
        if (empresaRows.length === 0 || !empresaRows[0].email) {
            return res.status(404).json({ success: false, message: "No se encontró el email de la empresa" });
        }
        const email = empresaRows[0].email;

        // Enviar correo de éxito de autenticación
        const { error } = await resend.emails.send({
            from: 'HoryCore <no-reply@send.horycore.online>',
            to: email,
            subject: 'Autenticación exitosa de cuenta',
            html: `
                <div style="background:#0b1020;padding:24px 12px;">
                  <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
                    <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:18px 20px;display:flex;align-items:center;gap:12px">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95">
                        <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <div style="font-weight:800;font-size:16px;letter-spacing:.2px">¡Cuenta autenticada correctamente!</div>
                      <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HoryCore</span>
                    </div>
                    <div style="padding:22px">
                      <div style="font-size:15px;color:#cbd5e1;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#16a34a">
                          <path d="M12 2l7 3v6c0 5.55-3.84 10.74-7 12-3.16-1.26-7-6.45-7-12V5l7-3z"/>
                        </svg>
                        ¡Bienvenido a HoryCore!
                      </div>
                      <div style="margin-bottom:18px;color:#e2e8f0;font-size:15px">
                        Tu cuenta ha sido activada y ahora puedes iniciar sesión normalmente en el sistema.
                      </div>
                      <div style="color:#cbd5e1;font-size:15px;margin-bottom:10px">
                        Si tienes dudas, contacta a soporte.<br>
                        <span style="color:#60a5fa">soporte@horycore.com</span>
                      </div>
                    </div>
                    <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
                      <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
                      <div style="font-size:12px">Sistema de Gestión Empresarial</div>
                      <div style="margin-top:6px;font-size:12px;color:#64748b">
                        Este correo fue enviado automáticamente desde la plataforma. Responde directamente para contactar a soporte.
                      </div>
                    </div>
                  </div>
                </div>
            `
        });

        if (error) {
            return res.status(500).json({ success: false, message: "No se pudo enviar el correo de autenticación", error });
        }

        // Borrar clave_acceso del usuario (por seguridad)
        await connection.query(
            "UPDATE usuario SET clave_acceso = NULL WHERE id_usuario = ?",
            [user.id_usuario]
        );

        return res.json({ success: true, message: "Cuenta autenticada correctamente. Ya puedes iniciar sesión." });
    } catch (error) {
        console.error('[AUTH] Error en sendAuthCode:', error);
        return res.status(500).json({ success: false, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    login,
    verifyToken,
    logout,
    updateUsuarioName,
    sendAuthCode
};
