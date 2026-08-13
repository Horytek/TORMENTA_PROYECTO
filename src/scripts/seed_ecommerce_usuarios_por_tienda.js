/**
 * Crea un usuario por sucursal "Tienda *" con rol Operador de tienda
 * (stock, pedidos y recojo). Idempotente.
 *
 * Uso: node src/scripts/seed_ecommerce_usuarios_por_tienda.js
 * Env: ECOM_SYNC_SLUG (default textiles_creando_moda)
 *      ECOM_TIENDA_PASSWORD (default Tienda2026!)
 */
import { HOST } from "../config.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword } from "../utils/passwordUtil.js";

const SLUG = (process.env.ECOM_SYNC_SLUG || "textiles_creando_moda").trim();
const PASSWORD = (process.env.ECOM_TIENDA_PASSWORD || "Tienda2026!").trim();

const ROL = {
  codigo: "operador_tienda",
  nombre: "Operador de tienda",
  permisos: [
    "stock.ver",
    "inventario.ver",
    "pedidos.ver",
    "pedidos.editar",
    "pedidos.confirmar",
    "recojo.ver",
    "recojo.escanear",
    "recojo.confirmar",
  ],
};

function slugUsuario(nombre) {
  const base = String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^tienda\s+/i, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
  return `tienda_${base || "sucursal"}`;
}

async function ensureRol(cx, id_tienda) {
  const [[ex]] = await cx.query(
    `SELECT id_rol FROM ecom_rol WHERE id_tienda = ? AND codigo = ? LIMIT 1`,
    [id_tienda, ROL.codigo]
  );
  let id_rol = ex?.id_rol;
  if (!id_rol) {
    const [ins] = await cx.query(
      `INSERT INTO ecom_rol (id_tienda, codigo, nombre, es_sistema, acceso_global)
       VALUES (?, ?, ?, 1, 0)`,
      [id_tienda, ROL.codigo, ROL.nombre]
    );
    id_rol = ins.insertId;
  } else {
    await cx.query(
      `UPDATE ecom_rol SET nombre = ?, acceso_global = 0 WHERE id_rol = ? AND id_tienda = ?`,
      [ROL.nombre, id_rol, id_tienda]
    );
  }

  await cx.query(`DELETE FROM ecom_rol_permiso WHERE id_rol = ?`, [id_rol]);
  const [perms] = await cx.query(
    `SELECT id_permiso, codigo FROM ecom_permiso WHERE codigo IN (?)`,
    [ROL.permisos]
  );
  for (const p of perms) {
    await cx.query(
      `INSERT IGNORE INTO ecom_rol_permiso (id_rol, id_permiso) VALUES (?, ?)`,
      [id_rol, p.id_permiso]
    );
  }
  return id_rol;
}

async function main() {
  if (!["localhost", "127.0.0.1", "::1"].includes(String(HOST)) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Solo corre en BD local. Usa ALLOW_REMOTE_MIGRATE=1 si es intencional.");
  }

  const cx = await getEcommerceConnection();
  try {
    const [[tienda]] = await cx.query(
      `SELECT id_tienda, slug, nombre FROM tienda WHERE slug = ? LIMIT 1`,
      [SLUG]
    );
    if (!tienda) throw new Error(`Tienda slug=${SLUG} no encontrada.`);

    await cx.beginTransaction();
    const id_rol = await ensureRol(cx, tienda.id_tienda);
    const hash = await hashPassword(PASSWORD);

    const [sucursales] = await cx.query(
      `SELECT id_sucursal, nombre, activo FROM ecom_sucursal
       WHERE id_tienda = ? AND nombre LIKE 'Tienda%'
       ORDER BY nombre`,
      [tienda.id_tienda]
    );
    if (!sucursales.length) {
      throw new Error("No hay sucursales cuyo nombre empiece por 'Tienda'.");
    }

    const created = [];
    for (const s of sucursales) {
      const usua = slugUsuario(s.nombre);
      const email = `${usua}@textilescreandomoda.local`;
      const nombre = `Operador ${s.nombre}`;

      if (!Number(s.activo)) {
        await cx.query(
          `UPDATE ecom_sucursal SET activo = 1 WHERE id_sucursal = ? AND id_tienda = ?`,
          [s.id_sucursal, tienda.id_tienda]
        );
      }

      const [[existing]] = await cx.query(
        `SELECT id_usuario FROM usuario WHERE id_tienda = ? AND (usua = ? OR email = ?) LIMIT 1`,
        [tienda.id_tienda, usua, email]
      );

      let id_usuario = existing?.id_usuario;
      if (id_usuario) {
        await cx.query(
          `UPDATE usuario SET
             nombre = ?, email = ?, id_rol = ?, acceso_global = 0, estado = 1, rol = 'admin'
           WHERE id_usuario = ? AND id_tienda = ?`,
          [nombre, email, id_rol, id_usuario, tienda.id_tienda]
        );
      } else {
        const [ins] = await cx.query(
          `INSERT INTO usuario
            (id_tienda, usua, password_hash, email, nombre, rol, id_rol, acceso_global, estado)
           VALUES (?, ?, ?, ?, ?, 'admin', ?, 0, 1)`,
          [tienda.id_tienda, usua, hash, email, nombre, id_rol]
        );
        id_usuario = ins.insertId;
      }

      await cx.query(
        `DELETE FROM ecom_usuario_sucursal WHERE id_usuario = ? AND id_tienda = ?`,
        [id_usuario, tienda.id_tienda]
      );
      await cx.query(
        `INSERT INTO ecom_usuario_sucursal (id_usuario, id_sucursal, id_tienda)
         VALUES (?, ?, ?)`,
        [id_usuario, s.id_sucursal, tienda.id_tienda]
      );

      created.push({
        sucursal: s.nombre,
        usuario: usua,
        email,
        password: PASSWORD,
        created: !existing,
      });
    }

    await cx.commit();
    console.log(JSON.stringify({ ok: true, slug: SLUG, rol: ROL.nombre, usuarios: created }, null, 2));
  } catch (err) {
    try { await cx.rollback(); } catch { /* noop */ }
    throw err;
  } finally {
    cx.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
