/**
 * Roles, permisos y sucursales asignadas (ecommerce admin).
 */

export async function loadUserAccess(connection, id_tienda, id_usuario) {
  const [[user]] = await connection.query(
    `SELECT id_usuario, id_tienda, usua, email, nombre, rol, id_rol, acceso_global, estado
     FROM usuario WHERE id_usuario = ? AND id_tienda = ? LIMIT 1`,
    [id_usuario, id_tienda]
  );
  if (!user) return null;

  let permisos = [];
  let rol = { codigo: user.rol || "admin", nombre: "Administrador", acceso_global: true };
  if (user.id_rol) {
    const [[r]] = await connection.query(
      `SELECT id_rol, codigo, nombre, acceso_global FROM ecom_rol
       WHERE id_rol = ? AND id_tienda = ? LIMIT 1`,
      [user.id_rol, id_tienda]
    );
    if (r) {
      rol = {
        id_rol: r.id_rol,
        codigo: r.codigo,
        nombre: r.nombre,
        acceso_global: Boolean(r.acceso_global),
      };
      const [rows] = await connection.query(
        `SELECT p.codigo FROM ecom_rol_permiso rp
         JOIN ecom_permiso p ON p.id_permiso = rp.id_permiso
         WHERE rp.id_rol = ?`,
        [r.id_rol]
      );
      permisos = rows.map((x) => x.codigo);
    }
  }
  if (!permisos.length && (user.rol === "admin" || rol.codigo === "administrador")) {
    const [all] = await connection.query(`SELECT codigo FROM ecom_permiso`);
    permisos = all.map((x) => x.codigo);
    rol.acceso_global = true;
  }

  const acceso_global = Boolean(user.acceso_global) || Boolean(rol.acceso_global);
  let sucursales = [];
  if (!acceso_global) {
    const [rows] = await connection.query(
      `SELECT s.id_sucursal, s.nombre
       FROM ecom_usuario_sucursal us
       JOIN ecom_sucursal s ON s.id_sucursal = us.id_sucursal AND s.id_tienda = us.id_tienda
       WHERE us.id_usuario = ? AND us.id_tienda = ? AND s.activo = 1
       ORDER BY s.nombre`,
      [id_usuario, id_tienda]
    );
    sucursales = rows;
  } else {
    const [rows] = await connection.query(
      `SELECT id_sucursal, nombre FROM ecom_sucursal
       WHERE id_tienda = ? AND activo = 1 ORDER BY nombre`,
      [id_tienda]
    );
    sucursales = rows;
  }

  return {
    id_usuario: user.id_usuario,
    usua: user.usua,
    email: user.email,
    nombre: user.nombre,
    id_tienda: user.id_tienda,
    rol,
    permisos,
    acceso_global,
    sucursales,
    sucursal_ids: sucursales.map((s) => Number(s.id_sucursal)),
  };
}

export function assertPermiso(access, codigo) {
  if (!access?.permisos?.includes(codigo)) {
    throw Object.assign(new Error("No tienes permiso para esta acción."), { status: 403 });
  }
}

export function assertSucursal(access, id_sucursal) {
  if (access.acceso_global) return;
  if (id_sucursal == null) {
    if (access.sucursal_ids.length === 1) return;
    throw Object.assign(new Error("Indica una sucursal permitida."), { status: 403 });
  }
  if (!access.sucursal_ids.includes(Number(id_sucursal))) {
    throw Object.assign(new Error("No tienes acceso a esa sucursal."), { status: 403 });
  }
}

export function sucursalFilterSql(access, alias = "o") {
  if (!access || access.acceso_global) return { sql: "", params: [] };
  if (!access.sucursal_ids.length) {
    return { sql: ` AND 1=0`, params: [] };
  }
  return {
    sql: ` AND ${alias}.id_sucursal IN (?)`,
    params: [access.sucursal_ids],
  };
}

/** Filtro de sucursal: query UI + hard-scope RBAC. */
export function resolveSucursalFilter(access, requestedId, alias = "o") {
  let id = requestedId != null && requestedId !== "" ? Number(requestedId) : null;
  if (!Number.isFinite(id) || id <= 0) id = null;
  if (access && !access.acceso_global) {
    if (id && !access.sucursal_ids.includes(id)) {
      return { forbidden: true, sql: "", params: [], id: null };
    }
    if (!id && access.sucursal_ids.length === 1) id = access.sucursal_ids[0];
    if (id) return { forbidden: false, sql: ` AND ${alias}.id_sucursal = ?`, params: [id], id };
    if (!access.sucursal_ids.length) {
      return { forbidden: false, sql: ` AND 1=0`, params: [], id: null };
    }
    return {
      forbidden: false,
      sql: ` AND ${alias}.id_sucursal IN (?)`,
      params: [access.sucursal_ids],
      id: null,
    };
  }
  if (id) return { forbidden: false, sql: ` AND ${alias}.id_sucursal = ?`, params: [id], id };
  return { forbidden: false, sql: "", params: [], id: null };
}

export function assertOrdenSucursal(access, id_sucursal) {
  if (!access || access.acceso_global) return;
  if (id_sucursal == null || !access.sucursal_ids.includes(Number(id_sucursal))) {
    throw Object.assign(new Error("No tienes acceso a esa sucursal."), { status: 403 });
  }
}

export async function listRoles(connection, id_tienda) {
  const [roles] = await connection.query(
    `SELECT * FROM ecom_rol WHERE id_tienda = ? ORDER BY es_sistema DESC, nombre`,
    [id_tienda]
  );
  const [rp] = await connection.query(
    `SELECT rp.id_rol, p.codigo FROM ecom_rol_permiso rp
     JOIN ecom_rol r ON r.id_rol = rp.id_rol
     JOIN ecom_permiso p ON p.id_permiso = rp.id_permiso
     WHERE r.id_tienda = ?`,
    [id_tienda]
  );
  const byRol = new Map();
  for (const row of rp) {
    if (!byRol.has(row.id_rol)) byRol.set(row.id_rol, []);
    byRol.get(row.id_rol).push(row.codigo);
  }
  return roles.map((r) => ({
    id_rol: r.id_rol,
    codigo: r.codigo,
    nombre: r.nombre,
    es_sistema: Boolean(r.es_sistema),
    acceso_global: Boolean(r.acceso_global),
    permisos: byRol.get(r.id_rol) || [],
  }));
}

export async function listPermisosCatalogo(connection) {
  const [rows] = await connection.query(
    `SELECT codigo, modulo, accion FROM ecom_permiso ORDER BY modulo, accion`
  );
  return rows;
}

export async function updateRolPermisos(connection, id_tienda, id_rol, { nombre, acceso_global, permisos }) {
  const [[rol]] = await connection.query(
    `SELECT * FROM ecom_rol WHERE id_rol = ? AND id_tienda = ? LIMIT 1`,
    [id_rol, id_tienda]
  );
  if (!rol) throw Object.assign(new Error("Rol no encontrado."), { status: 404 });
  if (nombre) {
    await connection.query(
      `UPDATE ecom_rol SET nombre = ?, acceso_global = COALESCE(?, acceso_global)
       WHERE id_rol = ? AND id_tienda = ?`,
      [nombre, acceso_global == null ? null : acceso_global ? 1 : 0, id_rol, id_tienda]
    );
  } else if (acceso_global != null) {
    await connection.query(
      `UPDATE ecom_rol SET acceso_global = ? WHERE id_rol = ? AND id_tienda = ?`,
      [acceso_global ? 1 : 0, id_rol, id_tienda]
    );
  }
  if (Array.isArray(permisos)) {
    await connection.query(`DELETE FROM ecom_rol_permiso WHERE id_rol = ?`, [id_rol]);
    if (permisos.length) {
      const [ids] = await connection.query(
        `SELECT id_permiso, codigo FROM ecom_permiso WHERE codigo IN (?)`,
        [permisos]
      );
      for (const p of ids) {
        await connection.query(
          `INSERT IGNORE INTO ecom_rol_permiso (id_rol, id_permiso) VALUES (?, ?)`,
          [id_rol, p.id_permiso]
        );
      }
    }
  }
  const list = await listRoles(connection, id_tienda);
  return list.find((r) => r.id_rol === Number(id_rol));
}

export async function listUsuarios(connection, id_tienda) {
  const [rows] = await connection.query(
    `SELECT u.id_usuario, u.usua, u.email, u.nombre, u.estado, u.id_rol, u.acceso_global,
            r.nombre AS rol_nombre, r.codigo AS rol_codigo
     FROM usuario u
     LEFT JOIN ecom_rol r ON r.id_rol = u.id_rol
     WHERE u.id_tienda = ?
     ORDER BY u.id_usuario`,
    [id_tienda]
  );
  const [links] = await connection.query(
    `SELECT id_usuario, id_sucursal FROM ecom_usuario_sucursal WHERE id_tienda = ?`,
    [id_tienda]
  );
  const byUser = new Map();
  for (const l of links) {
    if (!byUser.has(l.id_usuario)) byUser.set(l.id_usuario, []);
    byUser.get(l.id_usuario).push(l.id_sucursal);
  }
  return rows.map((u) => ({
    ...u,
    estado: Boolean(u.estado),
    acceso_global: Boolean(u.acceso_global),
    sucursales: byUser.get(u.id_usuario) || [],
  }));
}

export async function createUsuario(connection, id_tienda, body, hashPassword) {
  const { usua, email, nombre, password, id_rol, acceso_global, sucursales } = body;
  if (!usua || !email || !password) {
    throw Object.assign(new Error("Usuario, email y contraseña son requeridos."), { status: 400 });
  }
  const hash = await hashPassword(password);
  try {
    const [ins] = await connection.query(
      `INSERT INTO usuario (id_tienda, usua, password_hash, email, nombre, rol, id_rol, acceso_global, estado)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, ?, 1)`,
      [id_tienda, usua, hash, email, nombre || usua, id_rol || null, acceso_global ? 1 : 0]
    );
    if (Array.isArray(sucursales)) {
      for (const id_sucursal of sucursales) {
        await connection.query(
          `INSERT IGNORE INTO ecom_usuario_sucursal (id_usuario, id_sucursal, id_tienda)
           VALUES (?, ?, ?)`,
          [ins.insertId, Number(id_sucursal), id_tienda]
        );
      }
    }
    return { id_usuario: ins.insertId };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw Object.assign(new Error("Usuario o email ya existe."), { status: 409 });
    }
    throw err;
  }
}

export async function updateUsuario(connection, id_tienda, id_usuario, body, hashPassword) {
  const [[ex]] = await connection.query(
    `SELECT id_usuario FROM usuario WHERE id_usuario = ? AND id_tienda = ? LIMIT 1`,
    [id_usuario, id_tienda]
  );
  if (!ex) throw Object.assign(new Error("Usuario no encontrado."), { status: 404 });
  const fields = [];
  const params = [];
  if (body.nombre != null) {
    fields.push("nombre = ?");
    params.push(body.nombre);
  }
  if (body.email != null) {
    fields.push("email = ?");
    params.push(body.email);
  }
  if (body.id_rol != null) {
    fields.push("id_rol = ?");
    params.push(body.id_rol);
  }
  if (body.acceso_global != null) {
    fields.push("acceso_global = ?");
    params.push(body.acceso_global ? 1 : 0);
  }
  if (body.estado != null) {
    fields.push("estado = ?");
    params.push(body.estado ? 1 : 0);
  }
  if (body.password) {
    fields.push("password_hash = ?");
    params.push(await hashPassword(body.password));
  }
  if (fields.length) {
    params.push(id_usuario, id_tienda);
    await connection.query(
      `UPDATE usuario SET ${fields.join(", ")} WHERE id_usuario = ? AND id_tienda = ?`,
      params
    );
  }
  if (Array.isArray(body.sucursales)) {
    await connection.query(
      `DELETE FROM ecom_usuario_sucursal WHERE id_usuario = ? AND id_tienda = ?`,
      [id_usuario, id_tienda]
    );
    for (const id_sucursal of body.sucursales) {
      await connection.query(
        `INSERT IGNORE INTO ecom_usuario_sucursal (id_usuario, id_sucursal, id_tienda)
         VALUES (?, ?, ?)`,
        [id_usuario, Number(id_sucursal), id_tienda]
      );
    }
  }
}
