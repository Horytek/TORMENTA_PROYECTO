import { getConnection } from "../database/database.js";
import formsSchema from "../config/forms.schema.js";

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
    if (entity === "inventory") return res.json({ ok: true, text: "Inventario: notas de ingreso/salida y Kardex están en Almacén." });
    if (entity === "purchases") return res.json({ ok: true, text: "Compras: proveedores, documentos y estados vinculados." });
    if (entity === "permissions") return res.json({ ok: true, text: "Permisos: suelen estar en Configuración → Roles y permisos." });
    if (entity === "sales") return res.json({ ok: true, text: "Ventas: emisión de boletas/facturas y reportes." });
    if (entity === "product") return res.json({ ok: true, text: "Producto: usa el formulario con los campos visibles en tu UI." });
    if (entity === "user") return res.json({ ok: true, text: "Usuarios: Rol, Usuario, Contraseña y Estado son requeridos." });
    return res.json({ ok: true, text: "" });
  } catch {
    return res.json({ ok: true, text: "" });
  }
};

// NUEVO: esquema de BD (para el chatbot, no visible en UI)
export const helpSchema = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    // Descubrir base actual
    const [dbRow] = await connection.query(`SELECT DATABASE() AS db`);
    const db = dbRow?.[0]?.db;

    // Tablas solicitadas (coma-separadas) o un set por defecto
    const tablesParam = String(req.query.tables || "").trim();
    let tables = tablesParam
      ? tablesParam.split(",").map(s => s.trim()).filter(Boolean)
      : [
          "usuario","rol","permisos","modulo","submodulos",
          "cliente","venta","detalle_venta","comprobante",
          "producto","marca","sub_categoria","inventario",
          "almacen","sucursal","nota","detalle_nota",
          "guia_remision","destinatario","transportista","vehiculo"
        ];

    if (!db || !tables.length) return res.json({ ok: true, text: "" });

    const placeholders = tables.map(() => "?").join(",");

    // Columnas
    const [cols] = await connection.query(
      `
      SELECT 
        TABLE_NAME   AS tableName,
        COLUMN_NAME  AS columnName,
        COLUMN_TYPE  AS columnType,
        IS_NULLABLE  AS isNullable,
        COLUMN_KEY   AS columnKey,
        EXTRA        AS extra
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
      ORDER BY TABLE_NAME, ORDINAL_POSITION
      `,
      [db, ...tables]
    );

    // FKs
    const [fks] = await connection.query(
      `
      SELECT 
        TABLE_NAME               AS tableName,
        COLUMN_NAME              AS columnName,
        REFERENCED_TABLE_NAME    AS refTable,
        REFERENCED_COLUMN_NAME   AS refColumn,
        CONSTRAINT_NAME          AS constraintName
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      [db, ...tables]
    );

    const fkMap = {};
    for (const fk of fks) {
      const k = `${fk.tableName}.${fk.columnName}`;
      fkMap[k] = `${fk.refTable}.${fk.refColumn}`;
    }

    // Texto compacto y seguro
    const parts = [];
    const byTable = {};
    for (const c of cols) {
      (byTable[c.tableName] ||= []).push(c);
    }

    for (const t of tables) {
      const colsT = (byTable[t] || []).map(c => {
        const key =
          c.columnKey === "PRI" ? "PK" :
          c.columnKey === "UNI" ? "UQ" :
          c.columnKey === "MUL" ? (fkMap[`${t}.${c.columnName}`] ? `FK→${fkMap[`${t}.${c.columnName}`]}` : "IDX") :
          "";
        return `${c.columnName} ${c.columnType}${key ? ` [${key}]` : ""}`;
      });

      if (colsT.length) {
        parts.push(`Tabla ${t}:\n  - ${colsT.join("\n  - ")}`);
      }
    }

    // Limitar tamaño para el prompt
    let text = parts.join("\n\n");
    if (text.length > 4000) text = text.slice(0, 4000) + "\n…";

    return res.json({ ok: true, text });
  } catch (e) {
    return res.json({ ok: true, text: "" });
  } finally {
    if (connection) connection.release();
  }
};

// Nuevo: catálogo de formularios (de uso interno para el chatbot)
export const helpForms = async (req, res) => {
  const entity = String(req.query.entity || "").toLowerCase();
  let connection;
  try {
    const schema = formsSchema[entity];
    if (!schema) return res.json({ ok: true, entity, required: [], optional: [], extras: [], notes: "" });

    // Extras solo si el usuario es “desarrollador” (o rol id=10 como ejemplo)
    connection = await getConnection();
    const nameUser = req.user?.usuario || req.user?.usua || req.user?.nameUser || req.nameUser;
    const id_tenant = req.id_tenant;

    let isDev = false;
    if (nameUser && id_tenant) {
      const [rows] = await connection.query(
        "SELECT id_rol FROM usuario WHERE usua = ? AND id_tenant = ? LIMIT 1",
        [nameUser, id_tenant]
      );
      isDev = nameUser === "desarrollador" || rows?.[0]?.id_rol == 10;
    }

    return res.json({
      ok: true,
      entity,
      required: schema.required || [],
      optional: schema.optional || [],
      extras: isDev ? (schema.developerExtras || []) : [],
      notes: schema.notes || ""
    });
  } catch {
    return res.json({ ok: true, entity, required: [], optional: [], extras: [], notes: "" });
  } finally {
    if (connection) connection.release();
  }
};