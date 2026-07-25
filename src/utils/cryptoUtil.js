import crypto from "crypto";

const IV_LENGTH = 16;

function getCurrentKey() {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY falta o no mide 64 caracteres hex (32 bytes). " +
      "Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/** Encripta con la clave de entorno (formato versionado v1:iv:cipher). */
export function encrypt(text) {
  const key = getCurrentKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `v1:${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Desencripta un valor en formato v1:iv:cipher con CREDENTIALS_ENCRYPTION_KEY.
 *
 * No hay fallback a la clave vieja hardcodeada del esquema anterior: se
 * retiró a propósito (ver id_empresa=2, cuyo valor real ya se había perdido
 * de todas formas). Cualquier fila que no esté en este formato debe
 * reingresarse desde el panel de credenciales.
 *
 * Lanza en vez de devolver un valor "silencioso" tipo "****": ese fallback
 * era indistinguible de una máscara real y complicó diagnosticar la
 * credencial corrupta la primera vez.
 */
export function decrypt(text) {
  const parts = String(text).split(":");
  if (parts.length !== 3 || parts[0] !== "v1") {
    throw new Error("Formato de credencial no soportado, debe reingresarse desde el panel de claves");
  }
  const [, ivHex, encryptedHex] = parts;

  const key = getCurrentKey();
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
