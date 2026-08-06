import { getConnection } from "../database/database.js";
import { hashPassword } from "../utils/passwordUtil.js";

const slug = "demo-horytek";
const email = "demo-ecommerce@horytek.test";
const usua = "ecom_demo";
const clave = "DemoEcom2026!";
const id_tenant = 800001;

const c = await getConnection();
try {
  await c.beginTransaction();
  const [[dup]] = await c.query(
    "SELECT id_tienda FROM ecommerce_tienda WHERE slug = ? OR email = ? LIMIT 1",
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
  await c.query(
    `INSERT INTO ecommerce_tienda
      (id_tenant, id_plan, slug, nombre, email, telefono, estado, fecha_pago, descripcion)
     VALUES (?, 1, ?, ?, ?, ?, 'active', CURDATE(), ?)`,
    [id_tenant, slug, "Demo Horytek Shop", email, "999000111", "Tienda de prueba Ecommerce"]
  );
  await c.query(
    `INSERT INTO ecommerce_usuario
      (id_tenant, usua, password_hash, clave_acceso, email, nombre, rol, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'admin', 1)`,
    [id_tenant, usua, hash, clave, email, "Admin Demo"]
  );
  await c.commit();
  console.log(
    JSON.stringify(
      {
        ok: true,
        admin: { login: "/login?mode=ecommerce", usuario: usua, password: clave, email },
        storefront: {
          url: `/tienda/${slug}`,
          nota: "Sin login de cliente: el catálogo es público",
        },
        id_tenant,
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
