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

    jwt.verify(
      token,
      TOKEN_SECRET,
      { audience: "horytek-erp", issuer: "horytek-backend" },
      (error, user) => {
        if (error) {
          return res.status(401).json({ message: "Token no válido" });
        }

        // Normalización más robusta
        const normalized = {
          ...user,
          // posibles nombres en distintos flujos
          nameUser:
            user.usr ??
            user.nameUser ??
            user.usuario ??
            user.username ??
            user.name_user ??
            null,
          id_usuario: user.sub ?? user.id_usuario ?? user.id ?? null,
          id_tenant: user.ten ?? user.id_tenant ?? user.tenant ?? null,
          rol: user.rol ?? user.role ?? null,
        };

        req.user = normalized;
        req.id_tenant = normalized.id_tenant ?? null;
        // compat opcional
        req.nameUser = normalized.nameUser ?? null;

        return next();
      }
    );
  } catch {
    return res.status(401).json({ message: "Token no válido" });
  }
};