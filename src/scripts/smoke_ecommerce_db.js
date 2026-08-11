import { getEcommerceConnection } from "../database/database_ecommerce.js";

const c = await getEcommerceConnection();
try {
  const [[t]] = await c.query(
    `SELECT id_tienda, slug, nombre, estado FROM tienda WHERE slug = ? LIMIT 1`,
    ["textiles_creando_moda"]
  );
  if (!t) throw new Error("textiles_creando_moda no encontrada");
  const [[p]] = await c.query(
    `SELECT COUNT(*) AS c FROM producto WHERE id_tienda = ? AND activo = 1`,
    [t.id_tienda]
  );
  const [[i]] = await c.query(
    `SELECT COUNT(*) AS c FROM producto_imagen WHERE id_tienda = ?`,
    [t.id_tienda]
  );
  const [[mp]] = await c.query(`SELECT COUNT(*) AS c FROM mp_cuenta WHERE id_tienda = ?`, [
    t.id_tienda,
  ]);
  const [[o]] = await c.query(`SELECT COUNT(*) AS c FROM orden WHERE id_tienda = ?`, [t.id_tienda]);
  console.log(
    JSON.stringify(
      {
        ok: true,
        tienda: t,
        productos_activos: Number(p.c),
        imagenes: Number(i.c),
        mp_cuenta: Number(mp.c),
        ordenes: Number(o.c),
      },
      null,
      2
    )
  );
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  c.release();
  process.exit(process.exitCode || 0);
}
