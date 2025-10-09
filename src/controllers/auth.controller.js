import { getConnection } from "./../database/database.js";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { logAcceso } from "../utils/logActions.js";

const login = async (req, res) => {
    let connection;
    try {
        const { usuario, password } = req.body;
        if (!usuario || !password) {
            return res.status(400).json({ success: false, message: "Surgio un problema" });
        }

        const user = { usuario: usuario.trim(), password: password.trim() };
        connection = await getConnection();

        const [userFound] = await connection.query(
            "SELECT 1 FROM usuario WHERE usua = ? AND estado_usuario = 1",
            [user.usuario]
        );

        if (userFound.length === 0) {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            try {
                await logAcceso.loginFail(user.usuario, ip, null, "Usuario no existe o está deshabilitado");
            } catch (eLog) {
                //console.warn("[auth.login] fallo registrando loginFail:", eLog.code || eLog.message);
            }
            return res.status(400).json({ success: false, message: "Ha surgido un problema" });
        }

        let userValid;
        let userbd = null;

        if (user.usuario === "desarrollador") {
            const [rows] = await connection.query(
                "SELECT * FROM usuario WHERE usua = ? AND contra = ?",
                [user.usuario, user.password]
            );
            userValid = rows;
        } else {
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

            const token = await createAccessToken({
                nameUser: user.usuario,
                id_usuario: userbd.id_usuario,
                id_tenant: userbd.id_tenant ?? null
            });

            // Resolver ruta por defecto
            let defaultRedirect = "/inicio";
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
            if (defaultRedirect === "/inicio" && rolData[0]?.id_modulo) {
                const [moduleData] = await connection.query(
                    "SELECT ruta FROM modulo WHERE id_modulo = ?",
                    [rolData[0].id_modulo]
                );
                if (moduleData.length > 0 && moduleData[0].ruta) {
                    defaultRedirect = moduleData[0].ruta;
                }
            }

            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            if (userbd.id_tenant) {
                try {
                    await logAcceso.loginOk(userbd.id_usuario, ip, userbd.id_tenant);
                } catch (eLog) {
                    //console.warn("[auth.login] fallo registrando loginOk:", eLog.code || eLog.message);
                }
            }

            // Cookie en prod: Secure + None
            const isProd = process.env.NODE_ENV === "production";
            res.cookie("token", token, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? "none" : "lax",
                maxAge: 1000 * 60 * 60 * 8
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

            try {
                await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [1, userbd.id_usuario]);
            } catch (eUpd) {
                //console.warn("[auth.login] fallo actualizando estado_token:", eUpd.code || eUpd.message);
            }
        } else {
            const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
            try {
                await logAcceso.loginFail(user.usuario, ip, userbd?.id_tenant ?? null, "Ha surgido un problema");
            } catch (eLog) {
                //console.warn("[auth.login] fallo registrando loginFail:", eLog.code || eLog.message);
            }
            res.status(400).json({ success: false, message: "Ocurrió un error inesperado" });
        }

    } catch (error) {
        //console.error("[auth.login] error:", error.code || error.message);
        // Modo diagnóstico: expone el código del error SOLO si DEBUG_AUTH=1
        if (process.env.DEBUG_AUTH === "1") {
          return res.status(500).json({
            code: 0,
            debug: { code: error.code || null, msg: error.sqlMessage || error.message || "unknown" }
          });
        }
        return res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
    } finally {
        if (connection) connection.release();
    }
};

const verifyToken = async (req, res) => {
  // Validar cookie y JWT primero (sin DB)
  const token = req.cookies?.token;
  if (!token) return res.send(false);

  let decoded;
  try {
    decoded = jwt.verify(token, TOKEN_SECRET, { audience: "horytek-erp", issuer: "horytek-backend" });
  } catch {
    return res.sendStatus(401);
  }

  // Luego DB
  let connection;
  try {
    connection = await getConnection();

    const usuario = decoded.usr ?? decoded.nameUser;
    const id_tenant = decoded.ten ?? decoded.id_tenant ?? null;

    let userFound;
    if (id_tenant) {
      [userFound] = await connection.query(
        `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.estado_usuario, su.nombre_sucursal, usu.id_tenant
         FROM usuario usu
         LEFT JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
         LEFT JOIN sucursal su ON su.dni = ven.dni
         WHERE usu.usua = ? AND usu.estado_usuario = 1 AND usu.id_tenant = ?`,
        [usuario, id_tenant]
      );
    } else {
      [userFound] = await connection.query(
        `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.estado_usuario, null as nombre_sucursal, null as id_tenant
         FROM usuario usu
         WHERE usu.usua = ? AND usu.estado_usuario = 1`,
        [usuario]
      );
    }

    if (!userFound || userFound.length === 0) return res.sendStatus(401);

    const userbd = userFound[0];
    return res.json({
      id: userbd.id_usuario,
      rol: userbd.id_rol,
      usuario: userbd.usua,
      sucursal: userbd.nombre_sucursal || null,
      id_tenant: userbd.id_tenant || null
    });
  } catch (e) {
    //console.error("[auth.verifyToken] error:", e.code || e.message);
    return res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

const logout = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.send(false);

  let decoded;
  try {
    decoded = jwt.verify(token, TOKEN_SECRET, { audience: "horytek-erp", issuer: "horytek-backend" });
  } catch {
    return res.sendStatus(401);
  }

  let connection;
  try {
    connection = await getConnection();

    const usuario = decoded.usr ?? decoded.nameUser;
    const [userFound] = await connection.query("SELECT * FROM usuario WHERE usua = ?", [usuario]);
    if (userFound.length === 0) return res.sendStatus(401);

    const userbd = userFound[0];
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;

    if (userbd.id_tenant) {
      try { await logAcceso.logout(userbd.id_usuario, ip, userbd.id_tenant); } catch {}
    }

    await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [0, userbd.id_usuario]);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      expires: new Date(0),
    });

    return res.sendStatus(200);
  } catch (e) {
    //console.error("[auth.logout] error:", e.code || e.message);
    return res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
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
            return res.status(404).json({ message: "Ocurrió un error inesperado" });
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