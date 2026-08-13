/**
 * Soft-holds de disponibilidad (confirmación WhatsApp / reserva manual admin).
 * Usa ecom_reserva_disponibilidad + comprometido en ecom_inventario.
 */
import { comprometerStock, liberarComprometido } from "./InventoryService.js";
import { parseConfig, DEFAULT_CONFIG } from "./DisponibilidadService.js";

export async function crearReservaManual(
  connection,
  {
    id_tienda,
    id_producto,
    id_variante,
    id_sucursal,
    cantidad = 1,
    minutos,
    id_usuario_staff,
    id_consulta,
    id_solicitud,
    notas,
    theme_json,
  }
) {
  const cfg = parseConfig(theme_json);
  const ttl = Number(minutos) > 0 ? Number(minutos) : cfg.validez_confirmacion_min || DEFAULT_CONFIG.validez_confirmacion_min;
  if (!id_variante) {
    throw Object.assign(new Error("Se requiere variante para reservar stock."), { status: 400 });
  }
  await comprometerStock(connection, {
    id_tienda,
    id_variante,
    id_sucursal,
    cantidad,
  });
  const [ins] = await connection.query(
    `INSERT INTO ecom_reserva_disponibilidad
      (id_tienda, id_producto, id_variante, id_sucursal, cantidad, estado, expires_at, id_usuario_staff, id_consulta, id_solicitud, notas)
     VALUES (?, ?, ?, ?, ?, 'activa', DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, ?, ?, ?)`,
    [
      id_tienda,
      id_producto,
      id_variante,
      id_sucursal,
      cantidad,
      ttl,
      id_usuario_staff || null,
      id_consulta || null,
      id_solicitud || null,
      notas || null,
    ]
  );
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_reserva_disponibilidad WHERE id_reserva = ? LIMIT 1`,
    [ins.insertId]
  );
  return row;
}

export async function cancelarReservaManual(connection, id_tienda, id_reserva) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_reserva_disponibilidad
     WHERE id_reserva = ? AND id_tienda = ? FOR UPDATE`,
    [id_reserva, id_tienda]
  );
  if (!row) throw Object.assign(new Error("Reserva no encontrada."), { status: 404 });
  if (row.estado !== "activa") {
    throw Object.assign(new Error("La reserva ya no está activa."), { status: 400 });
  }
  if (row.id_variante) {
    await liberarComprometido(connection, {
      id_tienda,
      id_variante: row.id_variante,
      id_sucursal: row.id_sucursal,
      cantidad: row.cantidad,
    });
  }
  await connection.query(
    `UPDATE ecom_reserva_disponibilidad SET estado = 'cancelada' WHERE id_reserva = ? AND id_tienda = ?`,
    [id_reserva, id_tienda]
  );
  return true;
}

export async function listReservasActivas(connection, id_tienda, limit = 50) {
  const [rows] = await connection.query(
    `SELECT r.*, p.nombre AS producto_nombre, s.nombre AS sucursal_nombre
     FROM ecom_reserva_disponibilidad r
     LEFT JOIN producto p ON p.id_producto = r.id_producto AND p.id_tienda = r.id_tienda
     LEFT JOIN ecom_sucursal s ON s.id_sucursal = r.id_sucursal AND s.id_tienda = r.id_tienda
     WHERE r.id_tienda = ? AND r.estado = 'activa'
     ORDER BY r.expires_at ASC
     LIMIT ?`,
    [id_tienda, limit]
  );
  return rows;
}
