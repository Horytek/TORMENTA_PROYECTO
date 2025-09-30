import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const auth = (req, res, next) => {
  try {
    let token = null;

    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No token, autorización denegada" });
    }

    // Verificación con issuer/audience para mayor seguridad
    jwt.verify(
      token,
      TOKEN_SECRET,
      { audience: "horytek-erp", issuer: "horytek-backend" },
      (error, user) => {
        if (error) {
          return res.status(401).json({ message: "Token no válido" });
        }

        // Normalización (compatibilidad hacia atrás)
        const normalized = {
          ...user,
          nameUser: user.usr ?? user.nameUser,
          id_usuario: user.sub ?? user.id_usuario,
          id_tenant: user.ten ?? user.id_tenant ?? null,
        };

        req.user = normalized;

        // Accesos directos usados por el código actual
        req.id_usuario = normalized.id_usuario;
        req.id_tenant = normalized.id_tenant;
        req.nameUser = normalized.nameUser;

        next();
      }
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
