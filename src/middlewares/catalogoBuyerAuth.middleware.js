import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { getConnection } from "../database/database.js";

const BUYER_AUD = "horytek-catalogo-buyer";

export const catalogoBuyerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    let payload;
    try {
      payload = jwt.verify(token, TOKEN_SECRET, {
        audience: BUYER_AUD,
        issuer: "horytek-backend",
      });
    } catch {
      return res.status(401).json({ success: false, message: "Token inválido" });
    }

    const id_tenant = Number(payload.ten);
    const id_comprador = Number(payload.sub);
    if (!id_tenant || !id_comprador) {
      return res.status(401).json({ success: false, message: "Token inválido" });
    }

    let connection;
    try {
      connection = await getConnection();
      const [[comprador]] = await connection.query(
        `SELECT * FROM tienda_comprador
         WHERE id_comprador = ? AND id_tenant = ? AND estado = 1 LIMIT 1`,
        [id_comprador, id_tenant]
      );
      if (!comprador) {
        return res.status(401).json({ success: false, message: "Cuenta no válida" });
      }
      req.id_tenant = id_tenant;
      req.id_comprador = id_comprador;
      req.catalogoBuyer = comprador;
      return next();
    } finally {
      if (connection) connection.release();
    }
  } catch (err) {
    console.error("catalogoBuyerAuth:", err);
    return res.status(500).json({ success: false, message: "Error de autenticación" });
  }
};

export const catalogoBuyerAuthOptional = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, TOKEN_SECRET, {
      audience: BUYER_AUD,
      issuer: "horytek-backend",
    });
    const id_tenant = Number(payload.ten);
    const id_comprador = Number(payload.sub);
    if (!id_tenant || !id_comprador) return next();

    let connection;
    try {
      connection = await getConnection();
      const [[comprador]] = await connection.query(
        `SELECT * FROM tienda_comprador
         WHERE id_comprador = ? AND id_tenant = ? AND estado = 1 LIMIT 1`,
        [id_comprador, id_tenant]
      );
      if (comprador) {
        req.id_tenant = id_tenant;
        req.id_comprador = id_comprador;
        req.catalogoBuyer = comprador;
      }
    } finally {
      if (connection) connection.release();
    }
  } catch {
    // opcional: ignorar token inválido
  }
  return next();
};

export function signCatalogoBuyerToken(comprador) {
  return jwt.sign(
    {
      sub: comprador.id_comprador,
      ten: comprador.id_tenant,
      em: comprador.email,
    },
    TOKEN_SECRET,
    {
      expiresIn: "30d",
      algorithm: "HS256",
      issuer: "horytek-backend",
      audience: BUYER_AUD,
    }
  );
}
