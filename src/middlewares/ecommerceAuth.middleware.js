import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";

/**
 * Auth admin Ecommerce. JWT aud=horytek-ecommerce; claim `ten` = id_tienda.
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

    // ten = id_tienda (nuevo). Compat: tokens viejos con ten=legacy_tenant se resuelven abajo.
    const ten = decoded.ten ?? decoded.id_tienda ?? decoded.id_tenant;
    if (ten == null) {
      return res.status(403).json({ success: false, message: "Token no es de Ecommerce." });
    }

    let connection;
    try {
      connection = await getEcommerceConnection();
      let [[tienda]] = await connection.query(
        `SELECT id_tienda, estado, slug, nombre
         FROM tienda WHERE id_tienda = ? LIMIT 1`,
        [ten]
      );
      if (!tienda) {
        [[tienda]] = await connection.query(
          `SELECT id_tienda, estado, slug, nombre
           FROM tienda WHERE legacy_tenant_id = ? LIMIT 1`,
          [ten]
        );
      }
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

      req.id_tienda = Number(tienda.id_tienda);
      // Alias temporal para código legado en el mismo request
      req.id_tenant = req.id_tienda;
      req.ecommerceUser = {
        id_usuario: decoded.sub,
        usua: decoded.usr,
        id_tienda: req.id_tienda,
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
