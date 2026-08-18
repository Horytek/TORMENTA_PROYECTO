/**
 * Adapter de storage para encargos Atelier.
 * Primer proveedor: ImageKit privado (isPrivateFile). No reutiliza URLs públicas del ERP.
 */
import { createHmac, randomUUID } from "node:crypto";
import ImageKit from "imagekit";
import { TOKEN_SECRET } from "../../config.js";
import {
  ATELIER_MIME_EXT,
  ATELIER_PREVIEW,
  ATELIER_SIGNED_URL_TTL_SEC,
} from "./fileConfig.js";

let client = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value || String(value).includes("tu_imagekit")) {
    const err = new Error("Storage de archivos Atelier no configurado");
    err.status = 503;
    throw err;
  }
  return value;
}

function getClient() {
  if (client) return client;
  client = new ImageKit({
    publicKey: requireEnv("IMAGEKIT_PUBLIC_KEY"),
    privateKey: requireEnv("IMAGEKIT_PRIVATE_KEY"),
    urlEndpoint: requireEnv("IMAGEKIT_URL_ENDPOINT"),
  });
  return client;
}

export function getPublicUploadConfig() {
  return {
    publicKey: requireEnv("IMAGEKIT_PUBLIC_KEY"),
    urlEndpoint: requireEnv("IMAGEKIT_URL_ENDPOINT"),
    isPrivateFile: true,
  };
}

/** Carpeta no secuencial por solicitud/pedido. */
export function commissionFolder({ kind, id, category }) {
  const token = createHmac("sha256", TOKEN_SECRET || "atelier-files")
    .update(`atelier:${kind}:${id}`)
    .digest("hex")
    .slice(0, 32);
  return `/atelier/commissions/${token}/${category}`;
}

export function buildStorageFileName(mime) {
  const ext = ATELIER_MIME_EXT[mime] || "bin";
  return `${randomUUID()}.${ext}`;
}

export function getUploadAuth() {
  const expire = Math.floor(Date.now() / 1000) + 30 * 60;
  return getClient().getAuthenticationParameters(undefined, expire);
}

export async function getFileDetails(providerFileId) {
  return getClient().getFileDetails(providerFileId);
}

export function signedUrl(storageKey, { ttlSec = ATELIER_SIGNED_URL_TTL_SEC, transformation } = {}) {
  const path = storageKey.startsWith("/") ? storageKey : `/${storageKey}`;
  const opts = { path, signed: true, expireSeconds: ttlSec };
  if (transformation) opts.transformation = [transformation];
  return getClient().url(opts);
}

export function previewUrl(storageKey) {
  return signedUrl(storageKey, {
    transformation: { width: ATELIER_PREVIEW.width, quality: ATELIER_PREVIEW.quality },
  });
}

export async function deleteStoredFile(providerFileId) {
  if (!providerFileId) return { success: false };
  try {
    await getClient().deleteFile(providerFileId);
    return { success: true };
  } catch (error) {
    console.error("Atelier FileStorageService delete:", error.message);
    return { success: false, message: error.message };
  }
}

export function pathIsInsideFolder(filePath, folder) {
  const rawPath = String(filePath || "").replace(/\\/g, "/");
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const rawPrefix = String(folder || "").replace(/\\/g, "/").replace(/\/$/, "");
  const prefix = rawPrefix.startsWith("/") ? rawPrefix : `/${rawPrefix}`;
  return path === prefix || path.startsWith(`${prefix}/`);
}
