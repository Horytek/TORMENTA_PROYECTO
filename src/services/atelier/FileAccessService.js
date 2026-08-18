/**
 * Autorización de archivos de encargo: autenticado + pertenece al brief/pedido + no borrado.
 * El admin no tiene bypass automático al original.
 */
import { ATELIER_FILE_MIMES, maxBytesForCategory } from "./fileConfig.js";

const q = async (c, sql, params = []) => (await c.query(sql, params))[0];
const sameId = (a, b) => Number(a) === Number(b);

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

/** Metadata segura: nunca storage_key, provider_file_id ni URL pública. */
export function publicFileMeta(row) {
  if (!row) return null;
  return {
    id_file: row.id_file,
    id_request: row.id_request,
    id_order: row.id_order,
    category: row.category,
    file_name: row.file_name,
    mime: row.mime,
    byte_size: Number(row.byte_size),
    creado_en: row.creado_en,
    expires_at: row.expires_at,
    deleted_at: row.deleted_at,
    disponible: !row.deleted_at,
  };
}

export function assertUploadLimits({ category, mime, byte_size }) {
  if (!ATELIER_FILE_MIMES.includes(mime)) {
    throw httpError("Formato no permitido. Usa PNG, JPEG o WEBP", 400);
  }
  const max = maxBytesForCategory(category);
  if (!byte_size || byte_size > max) {
    throw httpError(`El archivo supera el límite de ${Math.round(max / (1024 * 1024))} MB`, 400);
  }
}

async function loadScope(connection, { id_request, id_order }) {
  if (id_order) {
    const [order] = await q(
      connection,
      `SELECT o.id_order, o.id_request, o.id_client, o.id_creator, r.estado AS request_estado
       FROM atelier_order o JOIN atelier_request r ON r.id_request = o.id_request
       WHERE o.id_order = ?`,
      [id_order]
    );
    if (!order) throw httpError("Encargo no encontrado", 404);
    return order;
  }
  if (id_request) {
    const [request] = await q(
      connection,
      `SELECT r.id_request, NULL AS id_order, r.id_client, r.id_creator, r.estado AS request_estado
       FROM atelier_request r WHERE r.id_request = ?`,
      [id_request]
    );
    if (!request) throw httpError("Solicitud no encontrada", 404);
    return request;
  }
  throw httpError("id_request o id_order es obligatorio", 400);
}

function isParty(user, scope) {
  return sameId(scope.id_client, user.sub) || (scope.id_creator && sameId(scope.id_creator, user.sub));
}

export async function assertCanUpload(connection, { user, category, id_request, id_order }) {
  const scope = await loadScope(connection, { id_request, id_order });
  if (category === "reference") {
    if (!sameId(scope.id_client, user.sub) && !(scope.id_creator && sameId(scope.id_creator, user.sub))) {
      throw httpError("No puedes subir referencias a este encargo", 403);
    }
  } else {
    if (!scope.id_order) throw httpError("Boceto, avance y entrega requieren un encargo", 400);
    if (!sameId(scope.id_creator, user.sub)) {
      throw httpError("Solo el artista del encargo puede subir esta categoría", 403);
    }
  }
  return {
    id_request: scope.id_request,
    id_order: scope.id_order,
    kind: scope.id_order ? "order" : "request",
    id: scope.id_order || scope.id_request,
  };
}

export async function assertCanReadFile(connection, { user, file, purpose }) {
  if (!file) throw httpError("Archivo no encontrado", 404);
  if (file.deleted_at && purpose !== "meta") {
    throw httpError("Este archivo ya no está disponible", 410);
  }

  const scope = await loadScope(connection, {
    id_request: file.id_request,
    id_order: file.id_order,
  });

  if (purpose === "meta") {
    if (isParty(user, scope) || user.role === "admin") return scope;
    throw httpError("No autorizado", 403);
  }

  // Preview y descarga: solo cliente y artista del encargo. Admin sin bypass al original.
  if (isParty(user, scope)) return scope;

  const openBoard =
    file.category === "reference" &&
    !scope.id_creator &&
    ["submitted", "quote_sent"].includes(scope.request_estado) &&
    user.role === "creador";
  if (openBoard) {
    const [profile] = await q(
      connection,
      "SELECT id_user FROM atelier_creator_profile WHERE id_user = ? AND disponible = 1",
      [user.sub]
    );
    if (profile) return scope;
  }

  throw httpError("No autorizado", 403);
}

export async function listFilesMeta(connection, { id_request, id_order }) {
  const clauses = [];
  const params = [];
  if (id_order) {
    clauses.push("id_order = ?");
    params.push(id_order);
  }
  if (id_request) {
    clauses.push("id_request = ?");
    params.push(id_request);
  }
  if (!params.length) return [];
  const rows = await q(
    connection,
    `SELECT id_file, id_request, id_order, category, file_name, mime, byte_size, creado_en, expires_at, deleted_at
     FROM atelier_file WHERE ${clauses.join(" OR ")} ORDER BY creado_en ASC`,
    params
  );
  return rows.map(publicFileMeta);
}

export async function getFileRow(connection, idFile) {
  const [row] = await q(connection, "SELECT * FROM atelier_file WHERE id_file = ?", [idFile]);
  return row || null;
}
