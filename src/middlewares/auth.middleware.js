import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const auth = (req, res, next) => {
  try {
    let token = null;

    // Extraer token de cookie o header Authorization
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      // Soporta formato "Bearer <token>" o solo el token
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        token = authHeader;
      }
    }

    if (!token)
      return res
        .status(401)
        .json({ message: "No token, autorización denegada" });

    jwt.verify(token, TOKEN_SECRET, (error, user) => {
      if (error) {
        return res.status(401).json({ message: "Token no válido" });
      }
      req.user = user;
      req.id_usuario = user.id_usuario;  // Establecer id_usuario desde el token
      req.id_tenant = user.id_tenant;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};