/** Límites y whitelist de archivos Atelier (un solo módulo). */
export const ATELIER_FILE_CATEGORIES = ["reference", "sketch", "progress", "delivery"];

export const ATELIER_FILE_LIMITS = {
  avatar: 5 * 1024 * 1024,
  reference: 15 * 1024 * 1024,
  sketch: 25 * 1024 * 1024,
  progress: 50 * 1024 * 1024,
  delivery: 250 * 1024 * 1024,
};

export const ATELIER_FILE_MIMES = ["image/png", "image/jpeg", "image/webp"];

export const ATELIER_MIME_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** URLs firmadas ~10 min; no se persisten. */
export const ATELIER_SIGNED_URL_TTL_SEC = 10 * 60;

export const ATELIER_PREVIEW = { width: 1200, quality: 80 };

export function maxBytesForCategory(category) {
  return ATELIER_FILE_LIMITS[category] ?? ATELIER_FILE_LIMITS.reference;
}
