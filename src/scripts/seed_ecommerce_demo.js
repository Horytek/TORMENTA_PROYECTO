import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword } from "../utils/passwordUtil.js";

/**
 * Seed/upsert de la tienda demo ecommerce (idempotente).
 * Defaults = demo público (no Textiles Creando Moda).
 *
 * Overrides:
 *   ECOM_DEMO_SLUG, ECOM_DEMO_EMAIL, ECOM_DEMO_USUA, ECOM_DEMO_PASSWORD
 */
const slug = (process.env.ECOM_DEMO_SLUG || "demo_ecommerce_store").trim();
const email = (process.env.ECOM_DEMO_EMAIL || "admin@demoecommerce.local").trim();
const usua = (process.env.ECOM_DEMO_USUA || "ecom_demo").trim();
const clave = (process.env.ECOM_DEMO_PASSWORD || "DemoEcom2026!").trim();
const nombreTienda =
  (process.env.ECOM_DEMO_NOMBRE || "Horytek Ecommerce Demo").trim();

const c = await getEcommerceConnection();
try {
  await c.beginTransaction();

  let [[tienda]] = await c.query(
    "SELECT id_tienda FROM tienda WHERE slug = ? LIMIT 1",
    [slug]
  );

  const hash = await hashPassword(clave);

  if (!tienda) {
    const [ins] = await c.query(
      `INSERT INTO tienda
        (id_plan, slug, nombre, email, telefono, estado, fecha_pago, descripcion)
       VALUES (1, ?, ?, ?, ?, 'active', CURDATE(), ?)`,
      [slug, nombreTienda, email, "999000111", "Tienda demo ecommerce"]
    );
    tienda = { id_tienda: ins.insertId };
  } else {
    await c.query(
      `UPDATE tienda SET nombre = ?, email = ?, estado = 'active' WHERE id_tienda = ?`,
      [nombreTienda, email, tienda.id_tienda]
    );
  }

  const id_tienda = tienda.id_tienda;

  const [[existing]] = await c.query(
    `SELECT id_usuario FROM usuario WHERE usua = ? OR email = ? LIMIT 1`,
    [usua, email]
  );

  if (existing) {
    await c.query(
      `UPDATE usuario SET
         id_tienda = ?, usua = ?, password_hash = ?, email = ?, nombre = ?, rol = 'admin', estado = 1
       WHERE id_usuario = ?`,
      [id_tienda, usua, hash, email, `Admin ${nombreTienda}`, existing.id_usuario]
    );
  } else {
    await c.query(
      `INSERT INTO usuario
        (id_tienda, usua, password_hash, email, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
      [id_tienda, usua, hash, email, `Admin ${nombreTienda}`]
    );
  }

  await c.commit();
  console.log(
    JSON.stringify(
      {
        ok: true,
        admin: { login: "/login?mode=ecommerce", usuario: usua, password: clave, email },
        storefront: { url: `/tienda/${slug}` },
        id_tienda,
        slug,
      },
      null,
      2
    )
  );
} catch (e) {
  try {
    await c.rollback();
  } catch {
    /* noop */
  }
  console.error(e);
  process.exitCode = 1;
} finally {
  c.release();
}
