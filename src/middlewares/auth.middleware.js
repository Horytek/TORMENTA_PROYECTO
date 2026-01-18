import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const auth = (req, res, next) => {
  try {
    let token = null;

    // Prioridad: Header Authorization Bearer
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // Fallback: Cookie (para compatibilidad o si se revierte)
    else if (req.cookies?.token) {
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
          id_empresa: user.emp ?? user.id_empresa ?? null,
          rol: user.rol ?? user.role ?? null,
        };

        req.user = normalized;
        req.id_tenant = normalized.id_tenant ?? null;
        req.id_empresa = normalized.id_empresa ?? null;
        // compat opcional
        req.nameUser = normalized.nameUser ?? null;

        return next();
      }
    );
  } catch {
    return res.status(401).json({ message: "Token no válido" });
  }
};