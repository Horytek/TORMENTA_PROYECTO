import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword } from "../utils/passwordUtil.js";

const slug = "demo-horytek";
const email = "demo-ecommerce@horytek.test";
const usua = "ecom_demo";
const clave = "DemoEcom2026!";

const c = await getEcommerceConnection();
try {
  await c.beginTransaction();
  const [[dup]] = await c.query(
    "SELECT id_tienda FROM tienda WHERE slug = ? OR email = ? LIMIT 1",
    [slug, email]
  );
  if (dup) {
    console.log(
      JSON.stringify(
        {
          already: true,
          admin: { login: "/login?mode=ecommerce", usuario: usua, password: clave, email },
          storefront: `/tienda/${slug}`,
        },
        null,
        2
      )
    );
    await c.rollback();
    process.exit(0);
  }

  const hash = await hashPassword(clave);
  const [ins] = await c.query(
    `INSERT INTO tienda
      (id_plan, slug, nombre, email, telefono, estado, fecha_pago, descripcion)
     VALUES (1, ?, ?, ?, ?, 'active', CURDATE(), ?)`,
    [slug, "Demo Horytek Shop", email, "999000111", "Tienda de prueba Ecommerce"]
  );
  const id_tienda = ins.insertId;
  await c.query(
    `INSERT INTO usuario
      (id_tienda, usua, password_hash, email, nombre, rol, estado)
     VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
    [id_tienda, usua, hash, email, "Admin Demo"]
  );
  await c.commit();
  console.log(
    JSON.stringify(
      {
        ok: true,
        admin: { login: "/login?mode=ecommerce", usuario: usua, password: clave, email },
        storefront: { url: `/tienda/${slug}`, nota: "Sin login de cliente: el catálogo es público" },
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
  console.error(e.message);
  process.exitCode = 1;
} finally {
  c.release();
}
