import { getConnection } from "../database/database.js";

const CODIGO = "ECMSGZJI3AEC56";
const TENANT = 800002;

const c = await getConnection();
try {
  await c.beginTransaction();
  const [[orden]] = await c.query(
    `SELECT * FROM ecommerce_orden WHERE codigo = ? AND id_tenant = ? FOR UPDATE`,
    [CODIGO, TENANT]
  );
  if (!orden) throw new Error("orden no encontrada");

  if (orden.estado !== "approved") {
    const [detalle] = await c.query(
      `SELECT id_producto, cantidad FROM ecommerce_orden_detalle WHERE id_orden = ? AND id_tenant = ?`,
      [orden.id_orden, TENANT]
    );
    for (const d of detalle) {
      await c.query(
        `UPDATE ecommerce_producto SET stock = GREATEST(0, stock - ?)
         WHERE id_producto = ? AND id_tenant = ?`,
        [d.cantidad, d.id_producto, TENANT]
      );
    }
    await c.query(
      `UPDATE ecommerce_orden
       SET estado = 'approved', mp_payment_id = ?
       WHERE id_orden = ? AND id_tenant = ?`,
      [`TEST_E2E_CART_${Date.now()}`, orden.id_orden, TENANT]
    );
  }

  await c.commit();

  const [[o]] = await c.query(
    `SELECT codigo, estado, total, mp_preference_id, mp_payment_id
     FROM ecommerce_orden WHERE id_orden = ?`,
    [orden.id_orden]
  );
  const [[p]] = await c.query(
    `SELECT stock, nombre FROM ecommerce_producto WHERE id_producto = 2 AND id_tenant = ?`,
    [TENANT]
  );
  console.log(JSON.stringify({ orden: o, producto: p }, null, 2));
} catch (e) {
  try {
    await c.rollback();
  } catch {
    /* noop */
  }
  console.error(e.message);
  process.exitCode = 1;
} finally {
  c.release();
}
