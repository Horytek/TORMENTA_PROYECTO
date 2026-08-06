import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { getConnection } from "../database/database.js";

/**
 * Auth del admin Ecommerce. JWT con aud=horytek-ecommerce y claim ten.
 * req.id_tenant / req.ecommerceUser solo desde el token — nunca del body.
 */
export const ecommerceAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No autorizado." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, TOKEN_SECRET, {
        algorithms: ["HS256"],
        audience: "horytek-ecommerce",
        issuer: "horytek-backend",
      });
    } catch {
      return res.status(401).json({ success: false, message: "Token inválido." });
    }

    const id_tenant = decoded.ten ?? decoded.id_tenant;
    if (id_tenant == null) {
      return res.status(403).json({ success: false, message: "Token no es de Ecommerce." });
    }

    let connection;
    try {
      connection = await getConnection();
      const [[tienda]] = await connection.query(
        `SELECT id_tienda, id_tenant, estado, slug, nombre
         FROM ecommerce_tienda WHERE id_tenant = ? LIMIT 1`,
        [id_tenant]
      );
      if (!tienda) {
        return res.status(403).json({ success: false, message: "Tienda no encontrada." });
      }
      if (tienda.estado !== "active") {
        return res.status(402).json({
          success: false,
          message: "Tu tienda no está activa. Completa el pago o contacta soporte.",
          code: "ECOMMERCE_INACTIVE",
          estado: tienda.estado,
        });
      }

      req.id_tenant = Number(tienda.id_tenant);
      req.id_tienda = Number(tienda.id_tienda);
      req.ecommerceUser = {
        id_usuario: decoded.sub,
        usua: decoded.usr,
        id_tenant: req.id_tenant,
        slug: tienda.slug,
        nombre: tienda.nombre,
      };
      return next();
    } catch (err) {
      console.error("[ecommerceAuth]", err.message);
      return res.status(500).json({ success: false, message: "Error de autorización." });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("[ecommerceAuth]", error);
    return res.status(500).json({ success: false, message: "Error de autorización." });
  }
};
