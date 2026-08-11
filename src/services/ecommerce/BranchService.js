/**
 * Sucursales ecommerce (independientes del ERP en runtime).
 */

export async function listSucursalesActivas(connection, id_tienda) {
  const [rows] = await connection.query(
    `SELECT id_sucursal, id_tienda, nombre, direccion, lat, lng, horario_json,
            whatsapp, telefono, allow_pickup, allow_delivery, es_default, activo
     FROM ecom_sucursal
     WHERE id_tienda = ? AND activo = 1 AND allow_pickup = 1
     ORDER BY es_default DESC, nombre ASC`,
    [id_tienda]
  );
  return rows;
}

export async function getSucursal(connection, id_tienda, id_sucursal) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_sucursal WHERE id_sucursal = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
    [id_sucursal, id_tienda]
  );
  return row || null;
}

export async function getSucursalDefault(connection, id_tienda) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_sucursal
     WHERE id_tienda = ? AND activo = 1 AND allow_pickup = 1
     ORDER BY es_default DESC, id_sucursal ASC LIMIT 1`,
    [id_tienda]
  );
  return row || null;
}

export function mapPublicSucursal(s) {
  return {
    id_sucursal: s.id_sucursal,
    nombre: s.nombre,
    direccion: s.direccion,
    lat: s.lat,
    lng: s.lng,
    horario_json: s.horario_json,
    whatsapp: s.whatsapp,
    telefono: s.telefono,
    allow_pickup: Boolean(s.allow_pickup),
    allow_delivery: Boolean(s.allow_delivery),
    es_default: Boolean(s.es_default),
  };
}
