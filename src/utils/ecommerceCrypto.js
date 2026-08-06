import crypto from "crypto";
import { TOKEN_SECRET } from "../config.js";

const ALGO = "aes-256-gcm";
const KEY = crypto.createHash("sha256").update(String(TOKEN_SECRET || "horytek-ecom")).digest();

/** Cifra el access_token de MP del comerciante antes de persistir. */
export function encryptMpToken(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptMpToken(payload) {
  const [ivB64, tagB64, dataB64] = String(payload || "").split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Token cifrado inválido");
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
