import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";

/**
 * Auth comprador vitrina. JWT aud=horytek-ecommerce-buyer; claim `ten` = id_tienda, `sub` = id_cliente.
 */
export const storefrontAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Inicia sesión para continuar." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, TOKEN_SECRET, {
        algorithms: ["HS256"],
        audience: "horytek-ecommerce-buyer",
        issuer: "horytek-backend",
      });
    } catch {
      return res.status(401).json({ success: false, message: "Sesión expirada." });
    }

    const id_cliente = Number(decoded.sub);
    const id_tienda = Number(decoded.ten ?? decoded.id_tienda);
    if (!Number.isFinite(id_cliente) || !Number.isFinite(id_tienda)) {
      return res.status(403).json({ success: false, message: "Token inválido." });
    }

    let connection;
    try {
      connection = await getEcommerceConnection();
      const [[cliente]] = await connection.query(
        `SELECT c.id_cliente, c.id_tienda, c.email, c.nombre, c.telefono, c.activo,
                t.slug, t.estado AS tienda_estado, t.nombre AS tienda_nombre
         FROM ecom_cliente c
         INNER JOIN tienda t ON t.id_tienda = c.id_tienda
         WHERE c.id_cliente = ? AND c.id_tienda = ? LIMIT 1`,
        [id_cliente, id_tienda]
      );
      if (!cliente || !cliente.activo) {
        return res.status(401).json({ success: false, message: "Cuenta no disponible." });
      }
      if (cliente.tienda_estado !== "active") {
        return res.status(403).json({ success: false, message: "Tienda no disponible." });
      }

      const slugParam = req.params.slug;
      if (slugParam && slugParam !== cliente.slug) {
        return res.status(403).json({ success: false, message: "Sesión no corresponde a esta tienda." });
      }

      req.id_tienda = id_tienda;
      req.id_cliente = id_cliente;
      req.storefrontUser = {
        id_cliente,
        id_tienda,
        email: cliente.email,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        slug: cliente.slug,
        tienda_nombre: cliente.tienda_nombre,
      };
      return next();
    } catch (err) {
      console.error("[storefrontAuth]", err.message);
      return res.status(500).json({ success: false, message: "Error de autorización." });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("[storefrontAuth]", error);
    return res.status(500).json({ success: false, message: "Error de autorización." });
  }
};

/** Resuelve tienda por slug sin auth (para register/login) */
export async function resolveTiendaBySlug(slug) {
  const connection = await getEcommerceConnection();
  try {
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, estado FROM tienda WHERE slug = ? LIMIT 1`,
      [slug]
    );
    return tienda || null;
  } finally {
    connection.release();
  }
}
