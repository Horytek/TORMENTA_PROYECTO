/**
 * Kit compartido para productos multi-tenant (patrón Sync/Mayorista).
 */
export async function ensureEntitlement(connection, table, id_tenant) {
  const [[row]] = await connection.query(
    `SELECT activo FROM \`${table}\` WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (!row) {
    await connection.query(
      `INSERT INTO \`${table}\` (id_tenant, activo, plan_flag) VALUES (?, 1, 'platform')`,
      [id_tenant]
    );
    return true;
  }
  return Number(row.activo) === 1;
}

export function denyEntitlement(res, productName) {
  return res.status(403).json({
    success: false,
    message: `${productName} no está habilitado para este tenant.`,
  });
}

export function requireTenant(req, res) {
  const id_tenant = req.id_tenant;
  if (!id_tenant) {
    res.status(401).json({ success: false, message: "Sesión inválida" });
    return null;
  }
  return id_tenant;
}
