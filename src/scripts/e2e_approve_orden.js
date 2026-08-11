import { getEcommerceConnection } from "../database/database_ecommerce.js";

const CODIGO = "ECMSGZJI3AEC56";

const c = await getEcommerceConnection();
try {
  await c.beginTransaction();
  const [[orden]] = await c.query(`SELECT * FROM orden WHERE codigo = ? FOR UPDATE`, [CODIGO]);
  if (!orden) throw new Error("orden no encontrada");

  if (orden.estado !== "approved") {
    const [detalle] = await c.query(
      `SELECT id_producto, cantidad FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
      [orden.id_orden, orden.id_tienda]
    );
    for (const d of detalle) {
      await c.query(
        `UPDATE producto SET stock = GREATEST(0, stock - ?)
         WHERE id_producto = ? AND id_tienda = ?`,
        [d.cantidad, d.id_producto, orden.id_tienda]
      );
    }
    await c.query(
      `UPDATE orden SET estado = 'approved', mp_payment_id = ?
       WHERE id_orden = ? AND id_tienda = ?`,
      [`TEST_E2E_CART_${Date.now()}`, orden.id_orden, orden.id_tienda]
    );
  }

  await c.commit();

  const [[o]] = await c.query(
    `SELECT codigo, estado, total, mp_preference_id, mp_payment_id FROM orden WHERE id_orden = ?`,
    [orden.id_orden]
  );
  console.log(JSON.stringify({ orden: o }, null, 2));
} catch (e) {
  try {
    await c.rollback();
  } catch {
    /* noop */
  }
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  c.release();
}
