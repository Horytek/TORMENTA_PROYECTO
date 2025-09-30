import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import crypto from "crypto";

/**
 * JWT eficiente y seguro:
 * - Payload mínimo con claves cortas: sub (id_usuario), usr (username), ten (tenant)
 * - Claims estándar: iat, iss, aud, exp (via expiresIn)
 * - HS256: firma corta (secreto robusto requerido)
 * - jti: opcional para revocación (replay defense)
 */
export async function createAccessToken(input) {
  const nameUser   = input?.nameUser   ?? input?.usr      ?? input?.usuario ?? input?.username ?? null;
  const id_usuario = input?.id_usuario ?? input?.sub      ?? input?.id      ?? null;
  const id_tenant  = input?.id_tenant  ?? input?.ten      ?? input?.tenant  ?? null;

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: id_usuario,
    usr: nameUser,
    ...(id_tenant != null ? { ten: id_tenant } : {}),
    iat: now,
    iss: "horytek-backend",
    aud: "horytek-erp",
    jti: crypto.randomUUID(),
  };

  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      TOKEN_SECRET,
      { expiresIn: "8h", algorithm: "HS256" },
      (err, token) => (err ? reject(err) : resolve(token))
    );
  });
}