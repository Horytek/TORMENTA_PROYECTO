import crypto from "crypto";

/** Transiciones permitidas de estado_fulfillment */
const TRANSICIONES = {
  pendiente_confirmacion: ["pago_pendiente", "cancelado"],
  pago_pendiente: ["pago_confirmado", "cancelado"],
  pago_confirmado: ["preparando", "cancelado"],
  preparando: ["listo_recoger", "en_camino", "cancelado"],
  listo_recoger: ["entregado"],
  en_camino: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

export function puedeTransicionar(desde, hacia) {
  const permitidos = TRANSICIONES[desde] || [];
  return permitidos.includes(hacia);
}

export function generarPickupToken() {
  return crypto.randomBytes(16).toString("hex");
}

export function generarCodigoRetiro() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code;
}

export async function registrarHistFulfillment(connection, {
  id_orden,
  id_tienda,
  estado_anterior,
  estado_nuevo,
  id_usuario = null,
  id_sucursal = null,
  notas = null,
}) {
  await connection.query(
    `INSERT INTO ecom_orden_estado_hist
      (id_orden, id_tienda, estado_anterior, estado_nuevo, id_usuario, id_sucursal, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id_orden, id_tienda, estado_anterior, estado_nuevo, id_usuario, id_sucursal, notas]
  );
}

/** Genera token/código únicos por tienda con retry */
export async function generarTokensRetiro(connection, id_tienda, maxIntentos = 5) {
  for (let i = 0; i < maxIntentos; i++) {
    const pickup_token = generarPickupToken();
    const codigo_retiro = generarCodigoRetiro();
    const [[dupToken]] = await connection.query(
      `SELECT 1 FROM orden WHERE id_tienda = ? AND pickup_token = ? LIMIT 1`,
      [id_tienda, pickup_token]
    );
    const [[dupCodigo]] = await connection.query(
      `SELECT 1 FROM orden WHERE id_tienda = ? AND codigo_retiro = ? LIMIT 1`,
      [id_tienda, codigo_retiro]
    );
    if (!dupToken && !dupCodigo) {
      return { pickup_token, codigo_retiro };
    }
  }
  throw new Error("No se pudo generar tokens de retiro únicos.");
}

export function parseQrPayload(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const prefix = "HORYTEK-PICKUP:";
  if (s.startsWith(prefix)) {
    return s.slice(prefix.length);
  }
  return s;
}

/** Registro histórico al crear orden */
export async function registrarOrdenCreada(connection, id_orden, id_tienda) {
  await registrarHistFulfillment(connection, {
    id_orden,
    id_tienda,
    estado_anterior: null,
    estado_nuevo: "pago_pendiente",
    notas: "Orden creada",
  });
}
