/**
 * Aprovisionamiento automático de permisos al crear un módulo/submódulo.
 *
 * Antes: crear un módulo nuevo (`addModulo`/`addSubmodulo`) no tocaba
 * `permisos` — quedaba invisible para todos los roles hasta que alguien
 * sembrara filas a mano por cada tenant (ver PLAN_TRABAJO_SOCIO.md). Esto
 * cierra ese hueco otorgando acceso completo al Administrador (id_rol=1) de
 * cada tenant automáticamente, igual que ya hacían a mano los scripts de
 * migración de módulos anteriores (ej. `create_devoluciones_tables.js`).
 *
 * Deliberadamente NO otorga a roles no-admin: qué le corresponde por
 * default a un Vendedor/Almacenero en un módulo nuevo es una decisión de
 * producto sin resolver todavía (ver "Decisiones abiertas" en
 * PLAN_PERMISOS_PLAN_ROLES.md §3.2) — inventarla acá sería adivinar.
 *
 * Idempotente por diseño propio (check-then-insert), no vía
 * `ON DUPLICATE KEY`: `uk_permiso_completo` incluye `id_submodulo`/`id_plan`,
 * que suelen ir NULL acá — MySQL no trata dos NULL como iguales en un índice
 * único, así que `ON DUPLICATE KEY` no detectaría la fila existente y
 * duplicaría en cada re-ejecución. Se compara con `<=>` (NULL-safe) en vez.
 */
export async function aprovisionarPermisosAdmin(connection, { id_modulo, id_submodulo = null }) {
  const [tenants] = await connection.query(
    "SELECT DISTINCT id_tenant FROM usuario WHERE id_rol = 1 AND id_tenant IS NOT NULL"
  );

  let creados = 0;
  for (const { id_tenant } of tenants) {
    const [existente] = await connection.query(
      `SELECT id_permiso FROM permisos
       WHERE id_rol = 1 AND id_modulo = ? AND id_submodulo <=> ? AND id_tenant = ? AND id_plan IS NULL
       LIMIT 1`,
      [id_modulo, id_submodulo, id_tenant]
    );
    if (existente.length > 0) continue;

    await connection.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant, id_plan)
       VALUES (1, ?, ?, 1, 1, 1, 1, 0, 1, ?, NULL)`,
      [id_modulo, id_submodulo, id_tenant]
    );
    creados++;
  }
  return creados;
}
