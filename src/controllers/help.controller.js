import { getConnection } from "../database/database.js";

// Buscar módulos/submódulos por texto (RAG ligero)
export const helpSearch = async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q || q.length < 2) return res.json({ ok: true, matches: [] });

  let connection;
  try {
    connection = await getConnection();
    const like = `%${q}%`;

    const byTenant = req.id_tenant ? " WHERE m.id_tenant = ? " : "";
    const paramsM = req.id_tenant ? [req.id_tenant, like, like] : [like, like];
    const [mods] = await connection.query(
      `
      SELECT m.id_modulo AS id, m.nombre_modulo AS nombre, m.ruta AS ruta, 'modulo' AS tipo
      FROM modulo m
      ${byTenant}
      AND (m.nombre_modulo LIKE ? OR m.ruta LIKE ?)
      ORDER BY m.id_modulo
      LIMIT 12
      `.replace("WHERE  AND", "WHERE"),
      paramsM
    );

    const byTenantS = req.id_tenant ? " WHERE s.id_tenant = ? " : "";
    const paramsS = req.id_tenant ? [req.id_tenant, like, like] : [like, like];
    const [subs] = await connection.query(
      `
      SELECT s.id_submodulo AS id, s.nombre_sub AS nombre, s.ruta AS ruta, 'submodulo' AS tipo
      FROM submodulos s
      ${byTenantS}
      AND (s.nombre_sub LIKE ? OR s.ruta LIKE ?)
      ORDER BY s.id_submodulo
      LIMIT 12
      `.replace("WHERE  AND", "WHERE"),
      paramsS
    );

    res.json({ ok: true, matches: [...mods, ...subs].slice(0, 12) });
  } catch (e) {
    console.error("HELP_SEARCH_ERR", e);
    res.status(200).json({ ok: true, matches: [] });
  } finally {
    if (connection) connection.release();
  }
};

// Mini contextos por entidad (ligeros y seguros)
export const helpMiniContext = async (req, res) => {
  const entity = String(req.query.entity || "").toLowerCase();
  try {
    // No exponer datos sensibles, solo hints agregados
    if (entity === "inventory") {
      return res.json({
        ok: true,
        text: "Inventario: Notas de ingreso/salida y Kardex están en Almacén. Recuerda que el stock mínimo genera alertas y los ajustes dependen de permisos."
      });
    }
    if (entity === "purchases") {
      return res.json({
        ok: true,
        text: "Compras: registra proveedores y documentos de compra; revisa notas vinculadas y estados."
      });
    }
    if (entity === "permissions") {
      return res.json({
        ok: true,
        text: "Permisos efectivos dependen del rol y, si aplica, del plan. La sección suele estar en Configuración → Roles y permisos."
      });
    }
    if (entity === "sales") {
      return res.json({
        ok: true,
        text: "Ventas: emisión de boletas/facturas y reporte de ventas recientes disponibles según permisos."
      });
    }
    return res.json({ ok: true, text: "" });
  } catch (e) {
    return res.json({ ok: true, text: "" });
  }
};