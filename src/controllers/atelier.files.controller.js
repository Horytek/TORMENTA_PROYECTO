import { randomUUID } from "node:crypto";
import { getConnection } from "../database/database_atelier.js";
import {
  assertCanReadFile,
  assertCanUpload,
  assertUploadLimits,
  getFileRow,
  publicFileMeta,
} from "../services/atelier/FileAccessService.js";
import {
  buildStorageFileName,
  commissionFolder,
  getFileDetails,
  getPublicUploadConfig,
  getUploadAuth,
  pathIsInsideFolder,
  previewUrl,
  signedUrl,
} from "../services/atelier/FileStorageService.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error) => res.status(error.status || 500).json({ success: false, message: error.message || "Error interno" });
const q = async (c, sql, params = []) => (await c.query(sql, params))[0];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mimeFromDetails(details, fallback) {
  const raw = details?.mime;
  if (raw && ["image/png", "image/jpeg", "image/webp"].includes(raw)) return raw;
  const name = String(details?.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

export async function createFileAuth(req, res) {
  let c;
  try {
    c = await getConnection();
    const { category, id_request, id_order, file_name, mime, byte_size } = req.body;
    assertUploadLimits({ category, mime, byte_size });
    const scope = await assertCanUpload(c, {
      user: req.atelierUser,
      category,
      id_request: id_request || null,
      id_order: id_order || null,
    });
    const folder = commissionFolder({ kind: scope.kind, id: scope.id, category });
    const storageFileName = buildStorageFileName(mime);
    const auth = getUploadAuth();
    const pub = getPublicUploadConfig();
    return ok(res, {
      ...auth,
      ...pub,
      folder,
      fileName: storageFileName,
      original_name: file_name,
      tags: ["atelier", `atelier-${category}`],
      useUniqueFileName: false,
    });
  } catch (e) {
    return fail(res, e);
  } finally {
    c?.release();
  }
}

export async function confirmFile(req, res) {
  let c;
  try {
    c = await getConnection();
    const { provider_file_id, category, id_request, id_order, file_name, mime, byte_size } = req.body;
    const scope = await assertCanUpload(c, {
      user: req.atelierUser,
      category,
      id_request: id_request || null,
      id_order: id_order || null,
    });
    const folder = commissionFolder({ kind: scope.kind, id: scope.id, category });

    const [existing] = await q(c, "SELECT * FROM atelier_file WHERE provider_file_id = ? AND deleted_at IS NULL", [
      provider_file_id,
    ]);
    if (existing) {
      const sameScope =
        Number(existing.id_request) === Number(scope.id_request) &&
        Number(existing.id_order || 0) === Number(scope.id_order || 0);
      if (!sameScope) throw Object.assign(new Error("El archivo ya está asociado a otro encargo"), { status: 409 });
      return ok(res, publicFileMeta(existing));
    }

    let details;
    try {
      details = await getFileDetails(provider_file_id);
    } catch {
      throw Object.assign(new Error("No se pudo verificar el archivo en storage"), { status: 400 });
    }
    if (details?.isPrivateFile !== true && details?.isPrivateFile !== "true") {
      throw Object.assign(new Error("El archivo debe ser privado"), { status: 400 });
    }
    const rawPath = details.filePath || details.file_path || req.body.storage_key;
    if (!pathIsInsideFolder(rawPath, folder)) {
      throw Object.assign(new Error("La carpeta del archivo no coincide con el encargo"), { status: 400 });
    }
    const filePath = String(rawPath).startsWith("/") ? rawPath : `/${rawPath}`;

    const resolvedMime = mime || mimeFromDetails(details, "image/jpeg");
    const resolvedSize = Number(byte_size || details.size || details.bytes || 0);
    assertUploadLimits({ category, mime: resolvedMime, byte_size: resolvedSize || 1 });

    const idFile = randomUUID();
    await q(
      c,
      `INSERT INTO atelier_file
        (id_file, id_request, id_order, id_uploader, category, file_name, mime, byte_size, storage_key, provider_file_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        idFile,
        scope.id_request,
        scope.id_order,
        req.atelierUser.sub,
        category,
        file_name || details.name || "archivo",
        resolvedMime,
        resolvedSize || 0,
        filePath,
        provider_file_id,
      ]
    );
    const [row] = await q(c, "SELECT * FROM atelier_file WHERE id_file = ?", [idFile]);
    return ok(res, publicFileMeta(row), 201);
  } catch (e) {
    return fail(res, e);
  } finally {
    c?.release();
  }
}

async function signedFileUrl(req, res, kind) {
  let c;
  try {
    const uuid = req.params.uuid;
    if (!UUID_RE.test(uuid)) {
      return res.status(400).json({ success: false, message: "Identificador de archivo inválido" });
    }
    c = await getConnection();
    const file = await getFileRow(c, uuid);
    await assertCanReadFile(c, { user: req.atelierUser, file, purpose: kind === "preview" ? "preview" : "download" });
    const url = kind === "preview" ? previewUrl(file.storage_key) : signedUrl(file.storage_key);
    return ok(res, {
      id_file: file.id_file,
      url,
      expires_in: 600,
      kind,
      file: publicFileMeta(file),
    });
  } catch (e) {
    return fail(res, e);
  } finally {
    c?.release();
  }
}

export const getFilePreviewUrl = (req, res) => signedFileUrl(req, res, "preview");
export const getFileDownloadUrl = (req, res) => signedFileUrl(req, res, "download");
