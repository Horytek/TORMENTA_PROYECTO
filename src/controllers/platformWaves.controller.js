/**
 * Controladores oleadas B–E + Recluta (productos plataforma Horytek).
 */
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import {
  ensureEntitlement,
  denyEntitlement,
  requireTenant,
} from "../platform/tenantProductKit.js";
import { getConnection as getTaller } from "../database/database_taller.js";
import { getConnection as getPreventa } from "../database/database_preventa.js";
import { getConnection as getCrm } from "../database/database_crm.js";
import { getConnection as getEnvios } from "../database/database_envios.js";
import { getConnection as getWms } from "../database/database_wms.js";
import { getConnection as getDespacho } from "../database/database_despacho.js";
import { getConnection as getTaxi } from "../database/database_taxi.js";
import { getConnection as getDelivery } from "../database/database_delivery.js";
import { getConnection as getFlotas } from "../database/database_flotas.js";
import { getConnection as getCampo } from "../database/database_campo.js";
import { getConnection as getAcademia } from "../database/database_academia.js";
import { getConnection as getAgenda } from "../database/database_agenda.js";
import { getConnection as getMantto } from "../database/database_mantenimiento.js";
import { getConnection as getRecluta } from "../database/database_recluta.js";

/* ——— Helpers operadores ——— */

function signOperatorToken({ sub, email, ownerId, aud, role, extra = {} }) {
  return jwt.sign(
    {
      sub,
      email: email ?? null,
      op: ownerId,
      role,
      aud,
      iss: "horytek-backend",
      ...extra,
    },
    TOKEN_SECRET,
    { expiresIn: "12h", algorithm: "HS256" }
  );
}

function makeOperatorAuth(audience, ownerKey = "op") {
  return function authOperator(req, res, next) {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) {
        return res.status(401).json({ success: false, message: "Token requerido" });
      }
      const payload = jwt.verify(token, TOKEN_SECRET, {
        algorithms: ["HS256"],
        audience,
        issuer: "horytek-backend",
      });
      req.operator = {
        id: payload.sub,
        email: payload.email,
        ownerId: payload[ownerKey] ?? payload.op,
        role: payload.role || "admin",
        aud: audience,
      };
      next();
    } catch {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
  };
}

export const authTaxiAdmin = makeOperatorAuth("horytek-taxi");
export const authDeliveryAdmin = makeOperatorAuth("horytek-delivery");
export const authFlotasAdmin = makeOperatorAuth("horytek-flotas");
export const authAcademiaAdmin = makeOperatorAuth("horytek-academia");
export const authAgendaAdmin = makeOperatorAuth("horytek-agenda");

async function nextOwnerId(connection, table, pk) {
  const [[row]] = await connection.query(
    `SELECT COALESCE(MAX(\`${pk}\`), 0) + 1 AS next_id FROM \`${table}\``
  );
  return Number(row.next_id);
}

async function bootstrapOperator({
  connection,
  entitlementTable,
  adminTable,
  pk,
  slug,
  nombre,
  email,
  password,
  preferredId,
}) {
  const [[existing]] = await connection.query(
    `SELECT \`${pk}\` AS id FROM \`${entitlementTable}\` WHERE slug = ? LIMIT 1`,
    [slug]
  );
  if (existing) {
    const err = new Error("SLUG_EXISTS");
    err.code = "SLUG_EXISTS";
    throw err;
  }

  const ownerId = preferredId || (await nextOwnerId(connection, entitlementTable, pk));
  await connection.query(
    `INSERT INTO \`${entitlementTable}\` (\`${pk}\`, activo, plan_flag, slug, nombre)
     VALUES (?, 1, 'platform', ?, ?)`,
    [ownerId, slug, nombre]
  );
  const password_hash = await hashPassword(password);
  const [adminRes] = await connection.query(
    `INSERT INTO \`${adminTable}\` (\`${pk}\`, email, password_hash) VALUES (?, ?, ?)`,
    [ownerId, email.toLowerCase(), password_hash]
  );
  return { ownerId, id_admin: adminRes.insertId };
}

async function loginOperatorAdmin({
  connection,
  entitlementTable,
  adminTable,
  pk,
  slug,
  email,
  password,
  aud,
}) {
  const [[ent]] = await connection.query(
    `SELECT \`${pk}\` AS id, slug, nombre, activo FROM \`${entitlementTable}\`
     WHERE slug = ? LIMIT 1`,
    [String(slug).toLowerCase()]
  );
  if (!ent || !Number(ent.activo)) return null;

  const [[admin]] = await connection.query(
    `SELECT id_admin, email, password_hash FROM \`${adminTable}\`
     WHERE \`${pk}\` = ? AND email = ? LIMIT 1`,
    [ent.id, String(email).toLowerCase()]
  );
  if (!admin) return null;
  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) return null;

  const token = signOperatorToken({
    sub: admin.id_admin,
    email: admin.email,
    ownerId: ent.id,
    aud,
    role: "admin",
  });
  return {
    token,
    admin: { id_admin: admin.id_admin, email: admin.email },
    operador: { id: ent.id, slug: ent.slug, nombre: ent.nombre },
  };
}

/* ========================================================================
 * TALLER
 * ======================================================================== */

export async function tallerListOt(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const [rows] = await connection.query(
      `SELECT id_ot, codigo, titulo, estado, merma_pct, notas, creado_en
       FROM taller_ot WHERE id_tenant = ? ORDER BY id_ot DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("taller.listOt", error.message);
    return res.status(500).json({ success: false, message: "Error al listar OT" });
  } finally {
    connection?.release();
  }
}

export async function tallerCreateOt(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { codigo, titulo, merma_pct, notas } = req.body;
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const [result] = await connection.query(
      `INSERT INTO taller_ot (id_tenant, codigo, titulo, merma_pct, notas)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tenant, codigo, titulo, merma_pct ?? 0, notas ?? null]
    );
    return res.status(201).json({
      success: true,
      data: { id_ot: result.insertId, codigo, titulo },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Código de OT ya existe" });
    }
    console.error("taller.createOt", error.message);
    return res.status(500).json({ success: false, message: "Error al crear OT" });
  } finally {
    connection?.release();
  }
}

export async function tallerListInsumos(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const id_ot = Number(req.params.id_ot || req.query.id_ot);
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const params = [id_tenant];
    let sql = `SELECT id_insumo, id_ot, sku, nombre, cantidad FROM taller_insumo WHERE id_tenant = ?`;
    if (id_ot) {
      sql += ` AND id_ot = ?`;
      params.push(id_ot);
    }
    sql += ` ORDER BY id_insumo DESC LIMIT 500`;
    const [rows] = await connection.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("taller.listInsumos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar insumos" });
  } finally {
    connection?.release();
  }
}

export async function tallerAddInsumo(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_ot, sku, nombre, cantidad } = req.body;
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const [[ot]] = await connection.query(
      `SELECT id_ot FROM taller_ot WHERE id_ot = ? AND id_tenant = ? LIMIT 1`,
      [id_ot, id_tenant]
    );
    if (!ot) return res.status(404).json({ success: false, message: "OT no encontrada" });
    const [result] = await connection.query(
      `INSERT INTO taller_insumo (id_ot, id_tenant, sku, nombre, cantidad)
       VALUES (?, ?, ?, ?, ?)`,
      [id_ot, id_tenant, sku, nombre, cantidad ?? 1]
    );
    return res.status(201).json({ success: true, data: { id_insumo: result.insertId } });
  } catch (error) {
    console.error("taller.addInsumo", error.message);
    return res.status(500).json({ success: false, message: "Error al agregar insumo" });
  } finally {
    connection?.release();
  }
}

export async function tallerListOperadores(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const [rows] = await connection.query(
      `SELECT id_operador, nombre, activo FROM taller_operador WHERE id_tenant = ? ORDER BY nombre`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("taller.listOperadores", error.message);
    return res.status(500).json({ success: false, message: "Error al listar operadores" });
  } finally {
    connection?.release();
  }
}

export async function tallerCreateOperador(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { nombre, pin, activo } = req.body;
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const [result] = await connection.query(
      `INSERT INTO taller_operador (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, ?)`,
      [id_tenant, nombre, pin, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_operador: result.insertId, nombre },
    });
  } catch (error) {
    console.error("taller.createOperador", error.message);
    return res.status(500).json({ success: false, message: "Error al crear operador" });
  } finally {
    connection?.release();
  }
}

export async function tallerStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getTaller();
    if (!(await ensureEntitlement(connection, "taller_entitlement", id_tenant))) {
      return denyEntitlement(res, "Taller");
    }
    const [[ots]] = await connection.query(
      `SELECT COUNT(*) AS c FROM taller_ot WHERE id_tenant = ?`,
      [id_tenant]
    );
    const [[ops]] = await connection.query(
      `SELECT COUNT(*) AS c FROM taller_operador WHERE id_tenant = ? AND activo = 1`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: {
        producto: "taller",
        enabled: true,
        ots: Number(ots.c),
        operadores: Number(ops.c),
      },
    });
  } catch (error) {
    console.error("taller.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * CRM
 * ======================================================================== */

async function ensureCrmPipeline(connection, id_tenant) {
  const [[pipe]] = await connection.query(
    `SELECT id_pipeline FROM crm_pipeline WHERE id_tenant = ? ORDER BY id_pipeline ASC LIMIT 1`,
    [id_tenant]
  );
  if (pipe) return pipe.id_pipeline;

  const [r] = await connection.query(
    `INSERT INTO crm_pipeline (id_tenant, nombre) VALUES (?, 'Principal')`,
    [id_tenant]
  );
  const id_pipeline = r.insertId;
  const etapas = ["Nuevo", "Calificado", "Propuesta", "Negociación", "Cerrado"];
  for (let i = 0; i < etapas.length; i++) {
    await connection.query(
      `INSERT INTO crm_etapa (id_pipeline, id_tenant, nombre, orden) VALUES (?, ?, ?, ?)`,
      [id_pipeline, id_tenant, etapas[i], i]
    );
  }
  return id_pipeline;
}

export async function crmListDeals(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getCrm();
    if (!(await ensureEntitlement(connection, "crm_entitlement", id_tenant))) {
      return denyEntitlement(res, "CRM");
    }
    await ensureCrmPipeline(connection, id_tenant);
    const [rows] = await connection.query(
      `SELECT d.id_deal, d.id_pipeline, d.id_etapa, d.titulo, d.id_cliente_erp, d.monto, d.estado, d.creado_en,
              e.nombre AS etapa_nombre
       FROM crm_deal d
       LEFT JOIN crm_etapa e ON e.id_etapa = d.id_etapa
       WHERE d.id_tenant = ?
       ORDER BY d.id_deal DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("crm.listDeals", error.message);
    return res.status(500).json({ success: false, message: "Error al listar deals" });
  } finally {
    connection?.release();
  }
}

export async function crmCreateDeal(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { titulo, id_pipeline, id_etapa, id_cliente_erp, monto } = req.body;
    connection = await getCrm();
    if (!(await ensureEntitlement(connection, "crm_entitlement", id_tenant))) {
      return denyEntitlement(res, "CRM");
    }
    const pipelineId = id_pipeline || (await ensureCrmPipeline(connection, id_tenant));
    let etapaId = id_etapa;
    if (!etapaId) {
      const [[first]] = await connection.query(
        `SELECT id_etapa FROM crm_etapa WHERE id_pipeline = ? AND id_tenant = ?
         ORDER BY orden ASC LIMIT 1`,
        [pipelineId, id_tenant]
      );
      etapaId = first?.id_etapa;
    }
    if (!etapaId) {
      return res.status(400).json({ success: false, message: "Sin etapas en el pipeline" });
    }
    const [result] = await connection.query(
      `INSERT INTO crm_deal (id_tenant, id_pipeline, id_etapa, titulo, id_cliente_erp, monto)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_tenant, pipelineId, etapaId, titulo, id_cliente_erp ?? null, monto ?? 0]
    );
    return res.status(201).json({ success: true, data: { id_deal: result.insertId, titulo } });
  } catch (error) {
    console.error("crm.createDeal", error.message);
    return res.status(500).json({ success: false, message: "Error al crear deal" });
  } finally {
    connection?.release();
  }
}

export async function crmMoveDeal(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const id_deal = Number(req.params.id_deal);
    const { id_etapa, estado } = req.body;
    connection = await getCrm();
    if (!(await ensureEntitlement(connection, "crm_entitlement", id_tenant))) {
      return denyEntitlement(res, "CRM");
    }
    const [[etapa]] = await connection.query(
      `SELECT id_etapa FROM crm_etapa WHERE id_etapa = ? AND id_tenant = ? LIMIT 1`,
      [id_etapa, id_tenant]
    );
    if (!etapa) return res.status(404).json({ success: false, message: "Etapa no encontrada" });

    const fields = ["id_etapa = ?"];
    const params = [id_etapa];
    if (estado) {
      fields.push("estado = ?");
      params.push(estado);
    }
    params.push(id_deal, id_tenant);
    const [result] = await connection.query(
      `UPDATE crm_deal SET ${fields.join(", ")} WHERE id_deal = ? AND id_tenant = ?`,
      params
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Deal no encontrado" });
    }
    return res.json({ success: true, data: { id_deal, id_etapa, estado: estado ?? undefined } });
  } catch (error) {
    console.error("crm.moveDeal", error.message);
    return res.status(500).json({ success: false, message: "Error al mover deal" });
  } finally {
    connection?.release();
  }
}

export async function crmAddActividad(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_deal, tipo, nota } = req.body;
    connection = await getCrm();
    if (!(await ensureEntitlement(connection, "crm_entitlement", id_tenant))) {
      return denyEntitlement(res, "CRM");
    }
    const [[deal]] = await connection.query(
      `SELECT id_deal FROM crm_deal WHERE id_deal = ? AND id_tenant = ? LIMIT 1`,
      [id_deal, id_tenant]
    );
    if (!deal) return res.status(404).json({ success: false, message: "Deal no encontrado" });
    const [result] = await connection.query(
      `INSERT INTO crm_actividad (id_tenant, id_deal, tipo, nota) VALUES (?, ?, ?, ?)`,
      [id_tenant, id_deal, tipo, nota]
    );
    return res.status(201).json({ success: true, data: { id_actividad: result.insertId } });
  } catch (error) {
    console.error("crm.addActividad", error.message);
    return res.status(500).json({ success: false, message: "Error al agregar actividad" });
  } finally {
    connection?.release();
  }
}

export async function crmStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getCrm();
    if (!(await ensureEntitlement(connection, "crm_entitlement", id_tenant))) {
      return denyEntitlement(res, "CRM");
    }
    await ensureCrmPipeline(connection, id_tenant);
    const [[deals]] = await connection.query(
      `SELECT COUNT(*) AS c FROM crm_deal WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: { producto: "crm", enabled: true, deals: Number(deals.c) },
    });
  } catch (error) {
    console.error("crm.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * ENVÍOS
 * ======================================================================== */

export async function enviosListGuias(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getEnvios();
    if (!(await ensureEntitlement(connection, "envios_entitlement", id_tenant))) {
      return denyEntitlement(res, "Envíos");
    }
    const [rows] = await connection.query(
      `SELECT id_guia, codigo, courier, destinatario, destino, estado, creado_en
       FROM envios_guia WHERE id_tenant = ? ORDER BY id_guia DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("envios.listGuias", error.message);
    return res.status(500).json({ success: false, message: "Error al listar guías" });
  } finally {
    connection?.release();
  }
}

export async function enviosCreateGuia(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { codigo, courier, destinatario, destino } = req.body;
    connection = await getEnvios();
    if (!(await ensureEntitlement(connection, "envios_entitlement", id_tenant))) {
      return denyEntitlement(res, "Envíos");
    }
    const [result] = await connection.query(
      `INSERT INTO envios_guia (id_tenant, codigo, courier, destinatario, destino)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tenant, codigo, courier || "manual", destinatario, destino]
    );
    await connection.query(
      `INSERT INTO envios_evento (id_guia, estado, detalle) VALUES (?, 'creada', 'Guía creada')`,
      [result.insertId]
    );
    return res.status(201).json({
      success: true,
      data: { id_guia: result.insertId, codigo },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Código de guía ya existe" });
    }
    console.error("envios.createGuia", error.message);
    return res.status(500).json({ success: false, message: "Error al crear guía" });
  } finally {
    connection?.release();
  }
}

export async function enviosAddEvento(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_guia, estado, detalle } = req.body;
    connection = await getEnvios();
    if (!(await ensureEntitlement(connection, "envios_entitlement", id_tenant))) {
      return denyEntitlement(res, "Envíos");
    }
    const [[guia]] = await connection.query(
      `SELECT id_guia FROM envios_guia WHERE id_guia = ? AND id_tenant = ? LIMIT 1`,
      [id_guia, id_tenant]
    );
    if (!guia) return res.status(404).json({ success: false, message: "Guía no encontrada" });

    const allowed = ["creada", "en_transito", "entregada", "devuelta"];
    if (allowed.includes(estado)) {
      await connection.query(
        `UPDATE envios_guia SET estado = ? WHERE id_guia = ? AND id_tenant = ?`,
        [estado, id_guia, id_tenant]
      );
    }
    const [result] = await connection.query(
      `INSERT INTO envios_evento (id_guia, estado, detalle) VALUES (?, ?, ?)`,
      [id_guia, estado, detalle ?? null]
    );
    return res.status(201).json({ success: true, data: { id_evento: result.insertId } });
  } catch (error) {
    console.error("envios.addEvento", error.message);
    return res.status(500).json({ success: false, message: "Error al agregar evento" });
  } finally {
    connection?.release();
  }
}

export async function enviosGetPublicTracking(req, res) {
  let connection;
  try {
    const codigo = String(req.params.codigo || "").trim();
    connection = await getEnvios();
    const [[guia]] = await connection.query(
      `SELECT id_guia, codigo, courier, destinatario, destino, estado, creado_en
       FROM envios_guia WHERE codigo = ? LIMIT 1`,
      [codigo]
    );
    if (!guia) {
      return res.status(404).json({ success: false, message: "Guía no encontrada" });
    }
    const [eventos] = await connection.query(
      `SELECT estado, detalle, creado_en FROM envios_evento
       WHERE id_guia = ? ORDER BY id_evento ASC`,
      [guia.id_guia]
    );
    return res.json({
      success: true,
      data: {
        codigo: guia.codigo,
        courier: guia.courier,
        destinatario: guia.destinatario,
        destino: guia.destino,
        estado: guia.estado,
        creado_en: guia.creado_en,
        eventos,
      },
    });
  } catch (error) {
    console.error("envios.tracking", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar tracking" });
  } finally {
    connection?.release();
  }
}

export async function enviosStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getEnvios();
    if (!(await ensureEntitlement(connection, "envios_entitlement", id_tenant))) {
      return denyEntitlement(res, "Envíos");
    }
    const [[guias]] = await connection.query(
      `SELECT COUNT(*) AS c FROM envios_guia WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: { producto: "envios", enabled: true, guias: Number(guias.c) },
    });
  } catch (error) {
    console.error("envios.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * WMS
 * ======================================================================== */

export async function wmsListUbicaciones(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getWms();
    if (!(await ensureEntitlement(connection, "wms_entitlement", id_tenant))) {
      return denyEntitlement(res, "WMS");
    }
    const [rows] = await connection.query(
      `SELECT id_ubicacion, codigo, nombre FROM wms_ubicacion WHERE id_tenant = ? ORDER BY codigo`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("wms.listUbicaciones", error.message);
    return res.status(500).json({ success: false, message: "Error al listar ubicaciones" });
  } finally {
    connection?.release();
  }
}

export async function wmsCreateUbicacion(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { codigo, nombre } = req.body;
    connection = await getWms();
    if (!(await ensureEntitlement(connection, "wms_entitlement", id_tenant))) {
      return denyEntitlement(res, "WMS");
    }
    const [result] = await connection.query(
      `INSERT INTO wms_ubicacion (id_tenant, codigo, nombre) VALUES (?, ?, ?)`,
      [id_tenant, codigo, nombre]
    );
    return res.status(201).json({
      success: true,
      data: { id_ubicacion: result.insertId, codigo, nombre },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Código de ubicación ya existe" });
    }
    console.error("wms.createUbicacion", error.message);
    return res.status(500).json({ success: false, message: "Error al crear ubicación" });
  } finally {
    connection?.release();
  }
}

export async function wmsListTareas(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getWms();
    if (!(await ensureEntitlement(connection, "wms_entitlement", id_tenant))) {
      return denyEntitlement(res, "WMS");
    }
    const [rows] = await connection.query(
      `SELECT id_tarea, tipo, sku, cantidad, id_ubicacion, estado, creado_en
       FROM wms_tarea WHERE id_tenant = ? ORDER BY id_tarea DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("wms.listTareas", error.message);
    return res.status(500).json({ success: false, message: "Error al listar tareas" });
  } finally {
    connection?.release();
  }
}

export async function wmsCreateTarea(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { tipo, sku, cantidad, id_ubicacion } = req.body;
    connection = await getWms();
    if (!(await ensureEntitlement(connection, "wms_entitlement", id_tenant))) {
      return denyEntitlement(res, "WMS");
    }
    const [result] = await connection.query(
      `INSERT INTO wms_tarea (id_tenant, tipo, sku, cantidad, id_ubicacion)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tenant, tipo, sku, cantidad ?? 1, id_ubicacion ?? null]
    );
    return res.status(201).json({ success: true, data: { id_tarea: result.insertId } });
  } catch (error) {
    console.error("wms.createTarea", error.message);
    return res.status(500).json({ success: false, message: "Error al crear tarea" });
  } finally {
    connection?.release();
  }
}

export async function wmsUpdateTarea(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const id_tarea = Number(req.params.id_tarea);
    const { estado, id_ubicacion } = req.body;
    connection = await getWms();
    if (!(await ensureEntitlement(connection, "wms_entitlement", id_tenant))) {
      return denyEntitlement(res, "WMS");
    }
    const fields = ["estado = ?"];
    const params = [estado];
    if (id_ubicacion !== undefined) {
      fields.push("id_ubicacion = ?");
      params.push(id_ubicacion);
    }
    params.push(id_tarea, id_tenant);
    const [result] = await connection.query(
      `UPDATE wms_tarea SET ${fields.join(", ")} WHERE id_tarea = ? AND id_tenant = ?`,
      params
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Tarea no encontrada" });
    }
    return res.json({ success: true, data: { id_tarea, estado } });
  } catch (error) {
    console.error("wms.updateTarea", error.message);
    return res.status(500).json({ success: false, message: "Error al actualizar tarea" });
  } finally {
    connection?.release();
  }
}

export async function wmsStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getWms();
    if (!(await ensureEntitlement(connection, "wms_entitlement", id_tenant))) {
      return denyEntitlement(res, "WMS");
    }
    const [[tareas]] = await connection.query(
      `SELECT COUNT(*) AS c FROM wms_tarea WHERE id_tenant = ?`,
      [id_tenant]
    );
    const [[ubic]] = await connection.query(
      `SELECT COUNT(*) AS c FROM wms_ubicacion WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: {
        producto: "wms",
        enabled: true,
        tareas: Number(tareas.c),
        ubicaciones: Number(ubic.c),
      },
    });
  } catch (error) {
    console.error("wms.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * DESPACHO
 * ======================================================================== */

export async function despachoListRutas(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getDespacho();
    if (!(await ensureEntitlement(connection, "despacho_entitlement", id_tenant))) {
      return denyEntitlement(res, "Despacho");
    }
    const [rows] = await connection.query(
      `SELECT id_ruta, fecha, vehiculo, chofer, estado FROM despacho_ruta
       WHERE id_tenant = ? ORDER BY fecha DESC, id_ruta DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("despacho.listRutas", error.message);
    return res.status(500).json({ success: false, message: "Error al listar rutas" });
  } finally {
    connection?.release();
  }
}

export async function despachoCreateRuta(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { fecha, vehiculo, chofer } = req.body;
    connection = await getDespacho();
    if (!(await ensureEntitlement(connection, "despacho_entitlement", id_tenant))) {
      return denyEntitlement(res, "Despacho");
    }
    const [result] = await connection.query(
      `INSERT INTO despacho_ruta (id_tenant, fecha, vehiculo, chofer) VALUES (?, ?, ?, ?)`,
      [id_tenant, fecha, vehiculo, chofer]
    );
    return res.status(201).json({ success: true, data: { id_ruta: result.insertId } });
  } catch (error) {
    console.error("despacho.createRuta", error.message);
    return res.status(500).json({ success: false, message: "Error al crear ruta" });
  } finally {
    connection?.release();
  }
}

export async function despachoAddParada(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_ruta, secuencia, direccion, cliente } = req.body;
    connection = await getDespacho();
    if (!(await ensureEntitlement(connection, "despacho_entitlement", id_tenant))) {
      return denyEntitlement(res, "Despacho");
    }
    const [[ruta]] = await connection.query(
      `SELECT id_ruta FROM despacho_ruta WHERE id_ruta = ? AND id_tenant = ? LIMIT 1`,
      [id_ruta, id_tenant]
    );
    if (!ruta) return res.status(404).json({ success: false, message: "Ruta no encontrada" });
    const [result] = await connection.query(
      `INSERT INTO despacho_parada (id_ruta, id_tenant, secuencia, direccion, cliente)
       VALUES (?, ?, ?, ?, ?)`,
      [id_ruta, id_tenant, secuencia ?? 1, direccion, cliente ?? null]
    );
    return res.status(201).json({ success: true, data: { id_parada: result.insertId } });
  } catch (error) {
    console.error("despacho.addParada", error.message);
    return res.status(500).json({ success: false, message: "Error al agregar parada" });
  } finally {
    connection?.release();
  }
}

export async function despachoListChoferes(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getDespacho();
    if (!(await ensureEntitlement(connection, "despacho_entitlement", id_tenant))) {
      return denyEntitlement(res, "Despacho");
    }
    const [rows] = await connection.query(
      `SELECT id_chofer, nombre, activo FROM despacho_chofer WHERE id_tenant = ? ORDER BY nombre`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("despacho.listChoferes", error.message);
    return res.status(500).json({ success: false, message: "Error al listar choferes" });
  } finally {
    connection?.release();
  }
}

export async function despachoCreateChofer(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { nombre, pin, activo } = req.body;
    connection = await getDespacho();
    if (!(await ensureEntitlement(connection, "despacho_entitlement", id_tenant))) {
      return denyEntitlement(res, "Despacho");
    }
    const [result] = await connection.query(
      `INSERT INTO despacho_chofer (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, ?)`,
      [id_tenant, nombre, pin, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_chofer: result.insertId, nombre },
    });
  } catch (error) {
    console.error("despacho.createChofer", error.message);
    return res.status(500).json({ success: false, message: "Error al crear chofer" });
  } finally {
    connection?.release();
  }
}

export async function despachoStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getDespacho();
    if (!(await ensureEntitlement(connection, "despacho_entitlement", id_tenant))) {
      return denyEntitlement(res, "Despacho");
    }
    const [[rutas]] = await connection.query(
      `SELECT COUNT(*) AS c FROM despacho_ruta WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: { producto: "despacho", enabled: true, rutas: Number(rutas.c) },
    });
  } catch (error) {
    console.error("despacho.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * CAMPO
 * ======================================================================== */

export async function campoListVendedores(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getCampo();
    if (!(await ensureEntitlement(connection, "campo_entitlement", id_tenant))) {
      return denyEntitlement(res, "Campo");
    }
    const [rows] = await connection.query(
      `SELECT id_vendedor, nombre, activo FROM campo_vendedor WHERE id_tenant = ? ORDER BY nombre`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("campo.listVendedores", error.message);
    return res.status(500).json({ success: false, message: "Error al listar vendedores" });
  } finally {
    connection?.release();
  }
}

export async function campoCreateVendedor(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { nombre, pin, activo } = req.body;
    connection = await getCampo();
    if (!(await ensureEntitlement(connection, "campo_entitlement", id_tenant))) {
      return denyEntitlement(res, "Campo");
    }
    const [result] = await connection.query(
      `INSERT INTO campo_vendedor (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, ?)`,
      [id_tenant, nombre, pin, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_vendedor: result.insertId, nombre },
    });
  } catch (error) {
    console.error("campo.createVendedor", error.message);
    return res.status(500).json({ success: false, message: "Error al crear vendedor" });
  } finally {
    connection?.release();
  }
}

export async function campoListCheckins(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getCampo();
    if (!(await ensureEntitlement(connection, "campo_entitlement", id_tenant))) {
      return denyEntitlement(res, "Campo");
    }
    const [rows] = await connection.query(
      `SELECT c.id_checkin, c.id_vendedor, c.lat, c.lng, c.nota, c.creado_en, v.nombre AS vendedor
       FROM campo_checkin c
       LEFT JOIN campo_vendedor v ON v.id_vendedor = c.id_vendedor
       WHERE c.id_tenant = ?
       ORDER BY c.id_checkin DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("campo.listCheckins", error.message);
    return res.status(500).json({ success: false, message: "Error al listar check-ins" });
  } finally {
    connection?.release();
  }
}

export async function campoCreateCheckin(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_vendedor, lat, lng, nota } = req.body;
    connection = await getCampo();
    if (!(await ensureEntitlement(connection, "campo_entitlement", id_tenant))) {
      return denyEntitlement(res, "Campo");
    }
    const [[vend]] = await connection.query(
      `SELECT id_vendedor FROM campo_vendedor WHERE id_vendedor = ? AND id_tenant = ? LIMIT 1`,
      [id_vendedor, id_tenant]
    );
    if (!vend) return res.status(404).json({ success: false, message: "Vendedor no encontrado" });
    const [result] = await connection.query(
      `INSERT INTO campo_checkin (id_tenant, id_vendedor, lat, lng, nota)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tenant, id_vendedor, lat, lng, nota ?? null]
    );
    return res.status(201).json({ success: true, data: { id_checkin: result.insertId } });
  } catch (error) {
    console.error("campo.createCheckin", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar check-in" });
  } finally {
    connection?.release();
  }
}

export async function campoStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getCampo();
    if (!(await ensureEntitlement(connection, "campo_entitlement", id_tenant))) {
      return denyEntitlement(res, "Campo");
    }
    const [[checks]] = await connection.query(
      `SELECT COUNT(*) AS c FROM campo_checkin WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: { producto: "campo", enabled: true, checkins: Number(checks.c) },
    });
  } catch (error) {
    console.error("campo.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * MANTENIMIENTO
 * ======================================================================== */

export async function manttoListActivos(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [rows] = await connection.query(
      `SELECT id_activo, codigo, nombre, ubicacion FROM mantto_activo
       WHERE id_tenant = ? ORDER BY codigo`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mantto.listActivos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar activos" });
  } finally {
    connection?.release();
  }
}

export async function manttoCreateActivo(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { codigo, nombre, ubicacion } = req.body;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [result] = await connection.query(
      `INSERT INTO mantto_activo (id_tenant, codigo, nombre, ubicacion) VALUES (?, ?, ?, ?)`,
      [id_tenant, codigo, nombre, ubicacion ?? null]
    );
    return res.status(201).json({
      success: true,
      data: { id_activo: result.insertId, codigo, nombre },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Código de activo ya existe" });
    }
    console.error("mantto.createActivo", error.message);
    return res.status(500).json({ success: false, message: "Error al crear activo" });
  } finally {
    connection?.release();
  }
}

export async function manttoListOt(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [rows] = await connection.query(
      `SELECT id_ot, id_activo, tipo, titulo, estado, creado_en
       FROM mantto_ot WHERE id_tenant = ? ORDER BY id_ot DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mantto.listOt", error.message);
    return res.status(500).json({ success: false, message: "Error al listar OT" });
  } finally {
    connection?.release();
  }
}

export async function manttoCreateOt(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_activo, tipo, titulo } = req.body;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [[activo]] = await connection.query(
      `SELECT id_activo FROM mantto_activo WHERE id_activo = ? AND id_tenant = ? LIMIT 1`,
      [id_activo, id_tenant]
    );
    if (!activo) return res.status(404).json({ success: false, message: "Activo no encontrado" });
    const [result] = await connection.query(
      `INSERT INTO mantto_ot (id_tenant, id_activo, tipo, titulo) VALUES (?, ?, ?, ?)`,
      [id_tenant, id_activo, tipo, titulo]
    );
    return res.status(201).json({ success: true, data: { id_ot: result.insertId } });
  } catch (error) {
    console.error("mantto.createOt", error.message);
    return res.status(500).json({ success: false, message: "Error al crear OT" });
  } finally {
    connection?.release();
  }
}

export async function manttoListTecnicos(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [rows] = await connection.query(
      `SELECT id_tecnico, nombre, activo FROM mantto_tecnico WHERE id_tenant = ? ORDER BY nombre`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mantto.listTecnicos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar técnicos" });
  } finally {
    connection?.release();
  }
}

export async function manttoCreateTecnico(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { nombre, pin, activo } = req.body;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [result] = await connection.query(
      `INSERT INTO mantto_tecnico (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, ?)`,
      [id_tenant, nombre, pin, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_tecnico: result.insertId, nombre },
    });
  } catch (error) {
    console.error("mantto.createTecnico", error.message);
    return res.status(500).json({ success: false, message: "Error al crear técnico" });
  } finally {
    connection?.release();
  }
}

export async function manttoStatus(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getMantto();
    if (!(await ensureEntitlement(connection, "mantto_entitlement", id_tenant))) {
      return denyEntitlement(res, "Mantenimiento");
    }
    const [[ots]] = await connection.query(
      `SELECT COUNT(*) AS c FROM mantto_ot WHERE id_tenant = ?`,
      [id_tenant]
    );
    const [[activos]] = await connection.query(
      `SELECT COUNT(*) AS c FROM mantto_activo WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: {
        producto: "mantenimiento",
        enabled: true,
        ots: Number(ots.c),
        activos: Number(activos.c),
      },
    });
  } catch (error) {
    console.error("mantto.status", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * RECLUTA
 * ======================================================================== */

async function ensureReclutaEntitlement(connection, id_tenant, slug, nombre) {
  const [[row]] = await connection.query(
    `SELECT activo, slug, nombre FROM recluta_entitlement WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (!row) {
    if (!slug || !nombre) return { ok: false, needsSetup: true };
    await connection.query(
      `INSERT INTO recluta_entitlement (id_tenant, activo, plan_flag, slug, nombre)
       VALUES (?, 1, 'platform', ?, ?)`,
      [id_tenant, slug, nombre]
    );
    return { ok: true, slug, nombre };
  }
  return {
    ok: Number(row.activo) === 1,
    slug: row.slug,
    nombre: row.nombre,
  };
}

export async function reclutaSetup(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const slug = String(req.body.slug).toLowerCase();
    const { nombre } = req.body;
    connection = await getRecluta();
    const [[row]] = await connection.query(
      `SELECT id_tenant FROM recluta_entitlement WHERE id_tenant = ? LIMIT 1`,
      [id_tenant]
    );
    if (!row) {
      await connection.query(
        `INSERT INTO recluta_entitlement (id_tenant, activo, plan_flag, slug, nombre)
         VALUES (?, 1, 'platform', ?, ?)`,
        [id_tenant, slug, nombre]
      );
    } else {
      await connection.query(
        `UPDATE recluta_entitlement SET slug = ?, nombre = ?, activo = 1, plan_flag = 'platform'
         WHERE id_tenant = ?`,
        [slug, nombre, id_tenant]
      );
    }
    return res.json({
      success: true,
      data: { slug, nombre, portal: `/carreras/${slug}` },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug de portal ya en uso" });
    }
    console.error("recluta.setup", error.message);
    return res.status(500).json({ success: false, message: "Error al configurar Recluta" });
  } finally {
    connection?.release();
  }
}

export async function reclutaListVacantes(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getRecluta();
    const ent = await ensureReclutaEntitlement(connection, id_tenant);
    if (!ent.ok) {
      if (ent.needsSetup) {
        return res.status(400).json({
          success: false,
          message: "Configura Recluta con POST /setup (slug, nombre)",
        });
      }
      return denyEntitlement(res, "Recluta");
    }
    const [rows] = await connection.query(
      `SELECT id_vacante, titulo, descripcion, publicada, creado_en
       FROM recluta_vacante WHERE id_tenant = ? ORDER BY id_vacante DESC`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("recluta.listVacantes", error.message);
    return res.status(500).json({ success: false, message: "Error al listar vacantes" });
  } finally {
    connection?.release();
  }
}

export async function reclutaCreateVacante(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { titulo, descripcion, publicada } = req.body;
    connection = await getRecluta();
    const ent = await ensureReclutaEntitlement(connection, id_tenant);
    if (!ent.ok) {
      if (ent.needsSetup) {
        return res.status(400).json({
          success: false,
          message: "Configura Recluta con POST /setup (slug, nombre)",
        });
      }
      return denyEntitlement(res, "Recluta");
    }
    const [result] = await connection.query(
      `INSERT INTO recluta_vacante (id_tenant, titulo, descripcion, publicada)
       VALUES (?, ?, ?, ?)`,
      [id_tenant, titulo, descripcion ?? null, publicada === false ? 0 : 1]
    );
    return res.status(201).json({ success: true, data: { id_vacante: result.insertId, titulo } });
  } catch (error) {
    console.error("recluta.createVacante", error.message);
    return res.status(500).json({ success: false, message: "Error al crear vacante" });
  } finally {
    connection?.release();
  }
}

export async function reclutaListPostulaciones(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    connection = await getRecluta();
    const ent = await ensureReclutaEntitlement(connection, id_tenant);
    if (!ent.ok) {
      if (ent.needsSetup) {
        return res.status(400).json({
          success: false,
          message: "Configura Recluta con POST /setup (slug, nombre)",
        });
      }
      return denyEntitlement(res, "Recluta");
    }
    const id_vacante = req.query.id_vacante ? Number(req.query.id_vacante) : null;
    const params = [id_tenant];
    let sql = `SELECT id_postulacion, id_vacante, nombre, email, telefono, etapa, cv_url, creado_en
               FROM recluta_postulacion WHERE id_tenant = ?`;
    if (id_vacante) {
      sql += ` AND id_vacante = ?`;
      params.push(id_vacante);
    }
    sql += ` ORDER BY id_postulacion DESC LIMIT 300`;
    const [rows] = await connection.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("recluta.listPostulaciones", error.message);
    return res.status(500).json({ success: false, message: "Error al listar postulaciones" });
  } finally {
    connection?.release();
  }
}

export async function reclutaUpdatePostulacion(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const id_postulacion = Number(req.params.id_postulacion);
    const { etapa } = req.body;
    connection = await getRecluta();
    const ent = await ensureReclutaEntitlement(connection, id_tenant);
    if (!ent.ok) return denyEntitlement(res, "Recluta");
    const [result] = await connection.query(
      `UPDATE recluta_postulacion SET etapa = ? WHERE id_postulacion = ? AND id_tenant = ?`,
      [etapa, id_postulacion, id_tenant]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Postulación no encontrada" });
    }
    return res.json({ success: true, data: { id_postulacion, etapa } });
  } catch (error) {
    console.error("recluta.updatePostulacion", error.message);
    return res.status(500).json({ success: false, message: "Error al actualizar postulación" });
  } finally {
    connection?.release();
  }
}

export async function reclutaGetPublicPortal(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getRecluta();
    const [[ent]] = await connection.query(
      `SELECT id_tenant, slug, nombre FROM recluta_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!ent) {
      return res.status(404).json({ success: false, message: "Portal no encontrado" });
    }
    const [vacantes] = await connection.query(
      `SELECT id_vacante, titulo, descripcion, creado_en
       FROM recluta_vacante WHERE id_tenant = ? AND publicada = 1
       ORDER BY id_vacante DESC`,
      [ent.id_tenant]
    );
    return res.json({
      success: true,
      data: { slug: ent.slug, nombre: ent.nombre, vacantes },
    });
  } catch (error) {
    console.error("recluta.portal", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar portal" });
  } finally {
    connection?.release();
  }
}

export async function reclutaPostPublicPostulacion(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const { id_vacante, nombre, email, telefono, cv_url } = req.body;
    connection = await getRecluta();
    const [[ent]] = await connection.query(
      `SELECT id_tenant FROM recluta_entitlement WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!ent) {
      return res.status(404).json({ success: false, message: "Portal no encontrado" });
    }
    const [[vac]] = await connection.query(
      `SELECT id_vacante FROM recluta_vacante
       WHERE id_vacante = ? AND id_tenant = ? AND publicada = 1 LIMIT 1`,
      [id_vacante, ent.id_tenant]
    );
    if (!vac) {
      return res.status(404).json({ success: false, message: "Vacante no encontrada" });
    }
    const [result] = await connection.query(
      `INSERT INTO recluta_postulacion
         (id_tenant, id_vacante, nombre, email, telefono, cv_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ent.id_tenant, id_vacante, nombre, email.toLowerCase(), telefono ?? null, cv_url ?? null]
    );
    return res.status(201).json({
      success: true,
      data: { id_postulacion: result.insertId },
    });
  } catch (error) {
    console.error("recluta.postulacionPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al enviar postulación" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * PREVENTA
 * ======================================================================== */

async function ensurePreventaEntitlement(connection, id_tienda, id_tenant) {
  const [[row]] = await connection.query(
    `SELECT activo FROM preventa_entitlement WHERE id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  if (!row) {
    await connection.query(
      `INSERT INTO preventa_entitlement (id_tienda, id_tenant, activo, plan_flag)
       VALUES (?, ?, 1, 'platform')`,
      [id_tienda, id_tenant ?? null]
    );
    return true;
  }
  return Number(row.activo) === 1;
}

function resolveTiendaId(req) {
  return Number(req.body?.id_tienda || req.query?.id_tienda || req.id_tenant);
}

export async function preventaListCampanias(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const id_tienda = resolveTiendaId(req) || id_tenant;
    connection = await getPreventa();
    if (!(await ensurePreventaEntitlement(connection, id_tienda, id_tenant))) {
      return denyEntitlement(res, "Preventa");
    }
    const [rows] = await connection.query(
      `SELECT id_campania, id_tienda, slug, nombre, anticipo_pct, activo, creado_en
       FROM preventa_campania WHERE id_tienda = ? ORDER BY id_campania DESC`,
      [id_tienda]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("preventa.listCampanias", error.message);
    return res.status(500).json({ success: false, message: "Error al listar campañas" });
  } finally {
    connection?.release();
  }
}

export async function preventaCreateCampania(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { slug, nombre, anticipo_pct, activo } = req.body;
    const id_tienda = Number(req.body.id_tienda) || id_tenant;
    connection = await getPreventa();
    if (!(await ensurePreventaEntitlement(connection, id_tienda, id_tenant))) {
      return denyEntitlement(res, "Preventa");
    }
    const [result] = await connection.query(
      `INSERT INTO preventa_campania (id_tienda, slug, nombre, anticipo_pct, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tienda, slug, nombre, anticipo_pct ?? 30, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: {
        id_campania: result.insertId,
        slug,
        portal: `/preventa/${slug}`,
      },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug de campaña ya en uso" });
    }
    console.error("preventa.createCampania", error.message);
    return res.status(500).json({ success: false, message: "Error al crear campaña" });
  } finally {
    connection?.release();
  }
}

export async function preventaAddItem(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const { id_campania, sku, nombre, precio, cupo } = req.body;
    connection = await getPreventa();
    const [[camp]] = await connection.query(
      `SELECT id_campania, id_tienda FROM preventa_campania WHERE id_campania = ? LIMIT 1`,
      [id_campania]
    );
    if (!camp) {
      return res.status(404).json({ success: false, message: "Campaña no encontrada" });
    }
    if (!(await ensurePreventaEntitlement(connection, camp.id_tienda, id_tenant))) {
      return denyEntitlement(res, "Preventa");
    }
    const [result] = await connection.query(
      `INSERT INTO preventa_item (id_campania, sku, nombre, precio, cupo)
       VALUES (?, ?, ?, ?, ?)`,
      [id_campania, sku, nombre, precio, cupo ?? 100]
    );
    return res.status(201).json({ success: true, data: { id_item: result.insertId } });
  } catch (error) {
    console.error("preventa.addItem", error.message);
    return res.status(500).json({ success: false, message: "Error al agregar ítem" });
  } finally {
    connection?.release();
  }
}

export async function preventaListReservas(req, res) {
  let connection;
  try {
    const id_tenant = requireTenant(req, res);
    if (!id_tenant) return;
    const id_campania = req.query.id_campania ? Number(req.query.id_campania) : null;
    connection = await getPreventa();
    const id_tienda = resolveTiendaId(req) || id_tenant;
    if (!(await ensurePreventaEntitlement(connection, id_tienda, id_tenant))) {
      return denyEntitlement(res, "Preventa");
    }
    let sql = `SELECT r.id_reserva, r.id_campania, r.id_item, r.cliente_nombre, r.cliente_email,
                      r.cantidad, r.monto_anticipo, r.estado_pago, r.creado_en
               FROM preventa_reserva r
               INNER JOIN preventa_campania c ON c.id_campania = r.id_campania
               WHERE c.id_tienda = ?`;
    const params = [id_tienda];
    if (id_campania) {
      sql += ` AND r.id_campania = ?`;
      params.push(id_campania);
    }
    sql += ` ORDER BY r.id_reserva DESC LIMIT 300`;
    const [rows] = await connection.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("preventa.listReservas", error.message);
    return res.status(500).json({ success: false, message: "Error al listar reservas" });
  } finally {
    connection?.release();
  }
}

export async function preventaGetPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getPreventa();
    const [[camp]] = await connection.query(
      `SELECT id_campania, id_tienda, slug, nombre, anticipo_pct
       FROM preventa_campania WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!camp) {
      return res.status(404).json({ success: false, message: "Campaña no encontrada" });
    }
    const [items] = await connection.query(
      `SELECT id_item, sku, nombre, precio, cupo, reservados,
              (cupo - reservados) AS disponibles
       FROM preventa_item WHERE id_campania = ?`,
      [camp.id_campania]
    );
    return res.json({
      success: true,
      data: {
        slug: camp.slug,
        nombre: camp.nombre,
        anticipo_pct: camp.anticipo_pct,
        items,
      },
    });
  } catch (error) {
    console.error("preventa.getPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar campaña" });
  } finally {
    connection?.release();
  }
}

export async function preventaCreateReservaPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const { id_item, cliente_nombre, cliente_email, cantidad } = req.body;
    const qty = cantidad ?? 1;
    connection = await getPreventa();
    await connection.beginTransaction();

    const [[camp]] = await connection.query(
      `SELECT id_campania, anticipo_pct FROM preventa_campania
       WHERE slug = ? AND activo = 1 LIMIT 1 FOR UPDATE`,
      [slug]
    );
    if (!camp) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Campaña no encontrada" });
    }
    const [[item]] = await connection.query(
      `SELECT id_item, precio, cupo, reservados FROM preventa_item
       WHERE id_item = ? AND id_campania = ? LIMIT 1 FOR UPDATE`,
      [id_item, camp.id_campania]
    );
    if (!item) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Ítem no encontrado" });
    }
    if (Number(item.reservados) + qty > Number(item.cupo)) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Sin cupo disponible" });
    }
    const monto_anticipo =
      (Number(item.precio) * qty * Number(camp.anticipo_pct)) / 100;
    const [result] = await connection.query(
      `INSERT INTO preventa_reserva
         (id_campania, id_item, cliente_nombre, cliente_email, cantidad, monto_anticipo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [camp.id_campania, id_item, cliente_nombre, cliente_email.toLowerCase(), qty, monto_anticipo]
    );
    await connection.query(
      `UPDATE preventa_item SET reservados = reservados + ? WHERE id_item = ?`,
      [qty, id_item]
    );
    await connection.commit();
    return res.status(201).json({
      success: true,
      data: {
        id_reserva: result.insertId,
        monto_anticipo,
        estado_pago: "pendiente",
      },
    });
  } catch (error) {
    try {
      await connection?.rollback();
    } catch {
      /* ignore */
    }
    console.error("preventa.createReserva", error.message);
    return res.status(500).json({ success: false, message: "Error al crear reserva" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * TAXI
 * ======================================================================== */

export async function taxiGetPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getTaxi();
    const [[op]] = await connection.query(
      `SELECT id_operador, slug, nombre FROM taxi_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!op) return res.status(404).json({ success: false, message: "Operador no encontrado" });
    return res.json({
      success: true,
      data: { slug: op.slug, nombre: op.nombre, id_operador: op.id_operador },
    });
  } catch (error) {
    console.error("taxi.getPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar operador" });
  } finally {
    connection?.release();
  }
}

export async function taxiBootstrap(req, res) {
  let connection;
  try {
    const { slug, nombre, email, password } = req.body;
    connection = await getTaxi();
    const preferredId = req.id_tenant || null;
    const result = await bootstrapOperator({
      connection,
      entitlementTable: "taxi_entitlement",
      adminTable: "taxi_admin",
      pk: "id_operador",
      slug: String(slug).toLowerCase(),
      nombre,
      email,
      password,
      preferredId,
    });
    return res.status(201).json({
      success: true,
      data: {
        id_operador: result.ownerId,
        id_admin: result.id_admin,
        slug: String(slug).toLowerCase(),
        portal: `/taxi/${slug}`,
      },
    });
  } catch (error) {
    if (error?.code === "SLUG_EXISTS" || error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug ya en uso" });
    }
    console.error("taxi.bootstrap", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar operador" });
  } finally {
    connection?.release();
  }
}

export async function taxiAdminLogin(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getTaxi();
    const data = await loginOperatorAdmin({
      connection,
      entitlementTable: "taxi_entitlement",
      adminTable: "taxi_admin",
      pk: "id_operador",
      slug,
      email,
      password,
      aud: "horytek-taxi",
    });
    if (!data) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("taxi.adminLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function taxiListViajes(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    connection = await getTaxi();
    const [rows] = await connection.query(
      `SELECT id_viaje, id_pasajero, id_conductor, origen, destino, estado, creado_en
       FROM taxi_viaje WHERE id_operador = ? ORDER BY id_viaje DESC LIMIT 200`,
      [id_operador]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("taxi.listViajes", error.message);
    return res.status(500).json({ success: false, message: "Error al listar viajes" });
  } finally {
    connection?.release();
  }
}

export async function taxiCreateViaje(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const { origen, destino, id_pasajero } = req.body;
    connection = await getTaxi();
    const [result] = await connection.query(
      `INSERT INTO taxi_viaje (id_operador, id_pasajero, origen, destino)
       VALUES (?, ?, ?, ?)`,
      [id_operador, id_pasajero ?? null, origen, destino]
    );
    return res.status(201).json({ success: true, data: { id_viaje: result.insertId } });
  } catch (error) {
    console.error("taxi.createViaje", error.message);
    return res.status(500).json({ success: false, message: "Error al crear viaje" });
  } finally {
    connection?.release();
  }
}

export async function taxiAssignConductor(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const id_viaje = Number(req.params.id_viaje);
    const { id_conductor } = req.body;
    connection = await getTaxi();
    const [[cond]] = await connection.query(
      `SELECT id_conductor FROM taxi_conductor
       WHERE id_conductor = ? AND id_operador = ? AND activo = 1 LIMIT 1`,
      [id_conductor, id_operador]
    );
    if (!cond) {
      return res.status(404).json({ success: false, message: "Conductor no encontrado" });
    }
    const [result] = await connection.query(
      `UPDATE taxi_viaje SET id_conductor = ?, estado = 'asignado'
       WHERE id_viaje = ? AND id_operador = ?`,
      [id_conductor, id_viaje, id_operador]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Viaje no encontrado" });
    }
    return res.json({ success: true, data: { id_viaje, id_conductor, estado: "asignado" } });
  } catch (error) {
    console.error("taxi.assign", error.message);
    return res.status(500).json({ success: false, message: "Error al asignar conductor" });
  } finally {
    connection?.release();
  }
}

export async function taxiCreateConductor(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const { nombre, telefono, password } = req.body;
    connection = await getTaxi();
    const password_hash = await hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO taxi_conductor (id_operador, nombre, telefono, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id_operador, nombre, telefono ?? null, password_hash]
    );
    return res.status(201).json({
      success: true,
      data: { id_conductor: result.insertId, nombre },
    });
  } catch (error) {
    console.error("taxi.createConductor", error.message);
    return res.status(500).json({ success: false, message: "Error al crear conductor" });
  } finally {
    connection?.release();
  }
}

export async function taxiConductorLogin(req, res) {
  let connection;
  try {
    const { slug, telefono, password } = req.body;
    connection = await getTaxi();
    const [[op]] = await connection.query(
      `SELECT id_operador FROM taxi_entitlement WHERE slug = ? AND activo = 1 LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!op) return res.status(404).json({ success: false, message: "Operador no encontrado" });
    const [[cond]] = await connection.query(
      `SELECT id_conductor, nombre, password_hash, activo FROM taxi_conductor
       WHERE id_operador = ? AND telefono = ? LIMIT 1`,
      [op.id_operador, telefono]
    );
    if (!cond || !cond.activo) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, cond.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    const token = signOperatorToken({
      sub: cond.id_conductor,
      ownerId: op.id_operador,
      aud: "horytek-taxi",
      role: "conductor",
      extra: { nombre: cond.nombre },
    });
    return res.json({
      success: true,
      data: { token, conductor: { id_conductor: cond.id_conductor, nombre: cond.nombre } },
    });
  } catch (error) {
    console.error("taxi.conductorLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function taxiPasajeroLogin(req, res) {
  let connection;
  try {
    const { slug, telefono, password } = req.body;
    connection = await getTaxi();
    const [[op]] = await connection.query(
      `SELECT id_operador FROM taxi_entitlement WHERE slug = ? AND activo = 1 LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!op) return res.status(404).json({ success: false, message: "Operador no encontrado" });
    const [[pas]] = await connection.query(
      `SELECT id_pasajero, nombre, password_hash FROM taxi_pasajero
       WHERE id_operador = ? AND telefono = ? LIMIT 1`,
      [op.id_operador, telefono]
    );
    if (!pas) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, pas.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    const token = signOperatorToken({
      sub: pas.id_pasajero,
      ownerId: op.id_operador,
      aud: "horytek-taxi",
      role: "pasajero",
      extra: { nombre: pas.nombre },
    });
    return res.json({
      success: true,
      data: { token, pasajero: { id_pasajero: pas.id_pasajero, nombre: pas.nombre } },
    });
  } catch (error) {
    console.error("taxi.pasajeroLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function taxiCreatePasajero(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const { nombre, telefono, password } = req.body;
    connection = await getTaxi();
    const password_hash = await hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO taxi_pasajero (id_operador, nombre, telefono, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id_operador, nombre, telefono, password_hash]
    );
    return res.status(201).json({
      success: true,
      data: { id_pasajero: result.insertId, nombre },
    });
  } catch (error) {
    console.error("taxi.createPasajero", error.message);
    return res.status(500).json({ success: false, message: "Error al crear pasajero" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * DELIVERY
 * ======================================================================== */

export async function deliveryGetPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getDelivery();
    const [[op]] = await connection.query(
      `SELECT id_operador, slug, nombre FROM delivery_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!op) return res.status(404).json({ success: false, message: "Operador no encontrado" });
    return res.json({
      success: true,
      data: { slug: op.slug, nombre: op.nombre, id_operador: op.id_operador },
    });
  } catch (error) {
    console.error("delivery.getPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar operador" });
  } finally {
    connection?.release();
  }
}

export async function deliveryBootstrap(req, res) {
  let connection;
  try {
    const { slug, nombre, email, password } = req.body;
    connection = await getDelivery();
    const result = await bootstrapOperator({
      connection,
      entitlementTable: "delivery_entitlement",
      adminTable: "delivery_admin",
      pk: "id_operador",
      slug: String(slug).toLowerCase(),
      nombre,
      email,
      password,
      preferredId: req.id_tenant || null,
    });
    return res.status(201).json({
      success: true,
      data: {
        id_operador: result.ownerId,
        id_admin: result.id_admin,
        slug: String(slug).toLowerCase(),
        portal: `/delivery/${slug}`,
      },
    });
  } catch (error) {
    if (error?.code === "SLUG_EXISTS" || error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug ya en uso" });
    }
    console.error("delivery.bootstrap", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar operador" });
  } finally {
    connection?.release();
  }
}

export async function deliveryAdminLogin(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getDelivery();
    const data = await loginOperatorAdmin({
      connection,
      entitlementTable: "delivery_entitlement",
      adminTable: "delivery_admin",
      pk: "id_operador",
      slug,
      email,
      password,
      aud: "horytek-delivery",
    });
    if (!data) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("delivery.adminLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function deliveryListPedidos(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    connection = await getDelivery();
    const [rows] = await connection.query(
      `SELECT id_pedido, id_cliente, id_repartidor, recojo, entrega, detalle, estado, creado_en
       FROM delivery_pedido WHERE id_operador = ? ORDER BY id_pedido DESC LIMIT 200`,
      [id_operador]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("delivery.listPedidos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar pedidos" });
  } finally {
    connection?.release();
  }
}

export async function deliveryCreatePedido(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const { recojo, entrega, detalle, id_cliente } = req.body;
    connection = await getDelivery();
    const [result] = await connection.query(
      `INSERT INTO delivery_pedido (id_operador, id_cliente, recojo, entrega, detalle)
       VALUES (?, ?, ?, ?, ?)`,
      [id_operador, id_cliente ?? null, recojo, entrega, detalle ?? null]
    );
    return res.status(201).json({ success: true, data: { id_pedido: result.insertId } });
  } catch (error) {
    console.error("delivery.createPedido", error.message);
    return res.status(500).json({ success: false, message: "Error al crear pedido" });
  } finally {
    connection?.release();
  }
}

export async function deliveryAssignRepartidor(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const id_pedido = Number(req.params.id_pedido);
    const { id_repartidor } = req.body;
    connection = await getDelivery();
    const [[rep]] = await connection.query(
      `SELECT id_repartidor FROM delivery_repartidor
       WHERE id_repartidor = ? AND id_operador = ? AND activo = 1 LIMIT 1`,
      [id_repartidor, id_operador]
    );
    if (!rep) {
      return res.status(404).json({ success: false, message: "Repartidor no encontrado" });
    }
    const [result] = await connection.query(
      `UPDATE delivery_pedido SET id_repartidor = ?, estado = 'asignado'
       WHERE id_pedido = ? AND id_operador = ?`,
      [id_repartidor, id_pedido, id_operador]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    return res.json({
      success: true,
      data: { id_pedido, id_repartidor, estado: "asignado" },
    });
  } catch (error) {
    console.error("delivery.assign", error.message);
    return res.status(500).json({ success: false, message: "Error al asignar repartidor" });
  } finally {
    connection?.release();
  }
}

export async function deliveryCreateRepartidor(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const { nombre, telefono, password } = req.body;
    connection = await getDelivery();
    const password_hash = await hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO delivery_repartidor (id_operador, nombre, telefono, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id_operador, nombre, telefono ?? null, password_hash]
    );
    return res.status(201).json({
      success: true,
      data: { id_repartidor: result.insertId, nombre },
    });
  } catch (error) {
    console.error("delivery.createRepartidor", error.message);
    return res.status(500).json({ success: false, message: "Error al crear repartidor" });
  } finally {
    connection?.release();
  }
}

export async function deliveryCreateCliente(req, res) {
  let connection;
  try {
    const id_operador = req.operator.ownerId;
    const { nombre, telefono, password } = req.body;
    connection = await getDelivery();
    const password_hash = await hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO delivery_cliente (id_operador, nombre, telefono, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id_operador, nombre, telefono, password_hash]
    );
    return res.status(201).json({
      success: true,
      data: { id_cliente: result.insertId, nombre },
    });
  } catch (error) {
    console.error("delivery.createCliente", error.message);
    return res.status(500).json({ success: false, message: "Error al crear cliente" });
  } finally {
    connection?.release();
  }
}

export async function deliveryRepartidorLogin(req, res) {
  let connection;
  try {
    const { slug, telefono, password } = req.body;
    connection = await getDelivery();
    const [[op]] = await connection.query(
      `SELECT id_operador FROM delivery_entitlement WHERE slug = ? AND activo = 1 LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!op) return res.status(404).json({ success: false, message: "Operador no encontrado" });
    const [[rep]] = await connection.query(
      `SELECT id_repartidor, nombre, password_hash, activo FROM delivery_repartidor
       WHERE id_operador = ? AND telefono = ? LIMIT 1`,
      [op.id_operador, telefono]
    );
    if (!rep || !rep.activo) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, rep.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    const token = signOperatorToken({
      sub: rep.id_repartidor,
      ownerId: op.id_operador,
      aud: "horytek-delivery",
      role: "repartidor",
    });
    return res.json({
      success: true,
      data: { token, repartidor: { id_repartidor: rep.id_repartidor, nombre: rep.nombre } },
    });
  } catch (error) {
    console.error("delivery.repartidorLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function deliveryClienteLogin(req, res) {
  let connection;
  try {
    const { slug, telefono, password } = req.body;
    connection = await getDelivery();
    const [[op]] = await connection.query(
      `SELECT id_operador FROM delivery_entitlement WHERE slug = ? AND activo = 1 LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!op) return res.status(404).json({ success: false, message: "Operador no encontrado" });
    const [[cli]] = await connection.query(
      `SELECT id_cliente, nombre, password_hash FROM delivery_cliente
       WHERE id_operador = ? AND telefono = ? LIMIT 1`,
      [op.id_operador, telefono]
    );
    if (!cli) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, cli.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    const token = signOperatorToken({
      sub: cli.id_cliente,
      ownerId: op.id_operador,
      aud: "horytek-delivery",
      role: "cliente",
    });
    return res.json({
      success: true,
      data: { token, cliente: { id_cliente: cli.id_cliente, nombre: cli.nombre } },
    });
  } catch (error) {
    console.error("delivery.clienteLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * FLOTAS
 * ======================================================================== */

export async function flotasGetPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getFlotas();
    const [[op]] = await connection.query(
      `SELECT id_empresa_flota, slug, nombre FROM flotas_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!op) return res.status(404).json({ success: false, message: "Flota no encontrada" });
    return res.json({
      success: true,
      data: {
        slug: op.slug,
        nombre: op.nombre,
        id_empresa_flota: op.id_empresa_flota,
      },
    });
  } catch (error) {
    console.error("flotas.getPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar flota" });
  } finally {
    connection?.release();
  }
}

export async function flotasBootstrap(req, res) {
  let connection;
  try {
    const { slug, nombre, email, password } = req.body;
    connection = await getFlotas();
    const result = await bootstrapOperator({
      connection,
      entitlementTable: "flotas_entitlement",
      adminTable: "flotas_admin",
      pk: "id_empresa_flota",
      slug: String(slug).toLowerCase(),
      nombre,
      email,
      password,
      preferredId: req.id_tenant || null,
    });
    return res.status(201).json({
      success: true,
      data: {
        id_empresa_flota: result.ownerId,
        id_admin: result.id_admin,
        slug: String(slug).toLowerCase(),
      },
    });
  } catch (error) {
    if (error?.code === "SLUG_EXISTS" || error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug ya en uso" });
    }
    console.error("flotas.bootstrap", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar flota" });
  } finally {
    connection?.release();
  }
}

export async function flotasAdminLogin(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getFlotas();
    const data = await loginOperatorAdmin({
      connection,
      entitlementTable: "flotas_entitlement",
      adminTable: "flotas_admin",
      pk: "id_empresa_flota",
      slug,
      email,
      password,
      aud: "horytek-flotas",
    });
    if (!data) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("flotas.adminLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function flotasListVehiculos(req, res) {
  let connection;
  try {
    const id_empresa = req.operator.ownerId;
    connection = await getFlotas();
    const [rows] = await connection.query(
      `SELECT id_vehiculo, placa, marca, modelo, soat_vence, activo
       FROM flotas_vehiculo WHERE id_empresa_flota = ? ORDER BY placa`,
      [id_empresa]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("flotas.listVehiculos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar vehículos" });
  } finally {
    connection?.release();
  }
}

export async function flotasCreateVehiculo(req, res) {
  let connection;
  try {
    const id_empresa = req.operator.ownerId;
    const { placa, marca, modelo, soat_vence, activo } = req.body;
    connection = await getFlotas();
    const [result] = await connection.query(
      `INSERT INTO flotas_vehiculo
         (id_empresa_flota, placa, marca, modelo, soat_vence, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_empresa, placa, marca ?? null, modelo ?? null, soat_vence ?? null, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_vehiculo: result.insertId, placa },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Placa ya registrada" });
    }
    console.error("flotas.createVehiculo", error.message);
    return res.status(500).json({ success: false, message: "Error al crear vehículo" });
  } finally {
    connection?.release();
  }
}

export async function flotasListCombustible(req, res) {
  let connection;
  try {
    const id_empresa = req.operator.ownerId;
    connection = await getFlotas();
    const [rows] = await connection.query(
      `SELECT id_reg, id_vehiculo, litros, monto, fecha
       FROM flotas_combustible WHERE id_empresa_flota = ?
       ORDER BY fecha DESC, id_reg DESC LIMIT 200`,
      [id_empresa]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("flotas.listCombustible", error.message);
    return res.status(500).json({ success: false, message: "Error al listar combustible" });
  } finally {
    connection?.release();
  }
}

export async function flotasCreateCombustible(req, res) {
  let connection;
  try {
    const id_empresa = req.operator.ownerId;
    const { id_vehiculo, litros, monto, fecha } = req.body;
    connection = await getFlotas();
    const [[veh]] = await connection.query(
      `SELECT id_vehiculo FROM flotas_vehiculo
       WHERE id_vehiculo = ? AND id_empresa_flota = ? LIMIT 1`,
      [id_vehiculo, id_empresa]
    );
    if (!veh) return res.status(404).json({ success: false, message: "Vehículo no encontrado" });
    const [result] = await connection.query(
      `INSERT INTO flotas_combustible (id_empresa_flota, id_vehiculo, litros, monto, fecha)
       VALUES (?, ?, ?, ?, ?)`,
      [id_empresa, id_vehiculo, litros, monto, fecha]
    );
    return res.status(201).json({ success: true, data: { id_reg: result.insertId } });
  } catch (error) {
    console.error("flotas.createCombustible", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar combustible" });
  } finally {
    connection?.release();
  }
}

export async function flotasListConductores(req, res) {
  let connection;
  try {
    const id_empresa = req.operator.ownerId;
    connection = await getFlotas();
    const [rows] = await connection.query(
      `SELECT id_conductor, nombre, licencia, activo
       FROM flotas_conductor WHERE id_empresa_flota = ? ORDER BY nombre`,
      [id_empresa]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("flotas.listConductores", error.message);
    return res.status(500).json({ success: false, message: "Error al listar conductores" });
  } finally {
    connection?.release();
  }
}

export async function flotasCreateConductor(req, res) {
  let connection;
  try {
    const id_empresa = req.operator.ownerId;
    const { nombre, licencia, password, activo } = req.body;
    connection = await getFlotas();
    const password_hash = password ? await hashPassword(password) : null;
    const [result] = await connection.query(
      `INSERT INTO flotas_conductor
         (id_empresa_flota, nombre, licencia, password_hash, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [id_empresa, nombre, licencia ?? null, password_hash, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_conductor: result.insertId, nombre },
    });
  } catch (error) {
    console.error("flotas.createConductor", error.message);
    return res.status(500).json({ success: false, message: "Error al crear conductor" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * ACADEMIA
 * ======================================================================== */

export async function academiaGetPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getAcademia();
    const [[org]] = await connection.query(
      `SELECT id_org, slug, nombre FROM academia_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!org) return res.status(404).json({ success: false, message: "Academia no encontrada" });
    const [cursos] = await connection.query(
      `SELECT id_curso, titulo, descripcion FROM academia_curso
       WHERE id_org = ? AND activo = 1 ORDER BY id_curso DESC`,
      [org.id_org]
    );
    return res.json({
      success: true,
      data: { slug: org.slug, nombre: org.nombre, cursos },
    });
  } catch (error) {
    console.error("academia.getPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar academia" });
  } finally {
    connection?.release();
  }
}

export async function academiaBootstrap(req, res) {
  let connection;
  try {
    const { slug, nombre, email, password } = req.body;
    connection = await getAcademia();
    const result = await bootstrapOperator({
      connection,
      entitlementTable: "academia_entitlement",
      adminTable: "academia_admin",
      pk: "id_org",
      slug: String(slug).toLowerCase(),
      nombre,
      email,
      password,
      preferredId: req.id_tenant || null,
    });
    return res.status(201).json({
      success: true,
      data: {
        id_org: result.ownerId,
        id_admin: result.id_admin,
        slug: String(slug).toLowerCase(),
      },
    });
  } catch (error) {
    if (error?.code === "SLUG_EXISTS" || error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug ya en uso" });
    }
    console.error("academia.bootstrap", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar academia" });
  } finally {
    connection?.release();
  }
}

export async function academiaAdminLogin(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getAcademia();
    const data = await loginOperatorAdmin({
      connection,
      entitlementTable: "academia_entitlement",
      adminTable: "academia_admin",
      pk: "id_org",
      slug,
      email,
      password,
      aud: "horytek-academia",
    });
    if (!data) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("academia.adminLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function academiaListCursos(req, res) {
  let connection;
  try {
    const id_org = req.operator.ownerId;
    connection = await getAcademia();
    const [rows] = await connection.query(
      `SELECT id_curso, titulo, descripcion, activo FROM academia_curso
       WHERE id_org = ? ORDER BY id_curso DESC`,
      [id_org]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("academia.listCursos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar cursos" });
  } finally {
    connection?.release();
  }
}

export async function academiaCreateCurso(req, res) {
  let connection;
  try {
    const id_org = req.operator.ownerId;
    const { titulo, descripcion, activo } = req.body;
    connection = await getAcademia();
    const [result] = await connection.query(
      `INSERT INTO academia_curso (id_org, titulo, descripcion, activo)
       VALUES (?, ?, ?, ?)`,
      [id_org, titulo, descripcion ?? null, activo === false ? 0 : 1]
    );
    return res.status(201).json({ success: true, data: { id_curso: result.insertId, titulo } });
  } catch (error) {
    console.error("academia.createCurso", error.message);
    return res.status(500).json({ success: false, message: "Error al crear curso" });
  } finally {
    connection?.release();
  }
}

export async function academiaListAlumnos(req, res) {
  let connection;
  try {
    const id_org = req.operator.ownerId;
    connection = await getAcademia();
    const [rows] = await connection.query(
      `SELECT id_alumno, email, nombre FROM academia_alumno
       WHERE id_org = ? ORDER BY nombre`,
      [id_org]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("academia.listAlumnos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar alumnos" });
  } finally {
    connection?.release();
  }
}

export async function academiaCreateAlumno(req, res) {
  let connection;
  try {
    const id_org = req.operator.ownerId;
    const { email, nombre, password } = req.body;
    connection = await getAcademia();
    const password_hash = await hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO academia_alumno (id_org, email, nombre, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id_org, email.toLowerCase(), nombre, password_hash]
    );
    return res.status(201).json({
      success: true,
      data: { id_alumno: result.insertId, email: email.toLowerCase() },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email ya registrado" });
    }
    console.error("academia.createAlumno", error.message);
    return res.status(500).json({ success: false, message: "Error al crear alumno" });
  } finally {
    connection?.release();
  }
}

export async function academiaListInscripciones(req, res) {
  let connection;
  try {
    const id_org = req.operator.ownerId;
    connection = await getAcademia();
    const [rows] = await connection.query(
      `SELECT i.id_inscripcion, i.id_curso, i.id_alumno, i.progreso_pct,
              c.titulo AS curso, a.nombre AS alumno, a.email
       FROM academia_inscripcion i
       INNER JOIN academia_curso c ON c.id_curso = i.id_curso
       INNER JOIN academia_alumno a ON a.id_alumno = i.id_alumno
       WHERE i.id_org = ?
       ORDER BY i.id_inscripcion DESC`,
      [id_org]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("academia.listInscripciones", error.message);
    return res.status(500).json({ success: false, message: "Error al listar inscripciones" });
  } finally {
    connection?.release();
  }
}

export async function academiaCreateInscripcion(req, res) {
  let connection;
  try {
    const id_org = req.operator.ownerId;
    const { id_curso, id_alumno, progreso_pct } = req.body;
    connection = await getAcademia();
    const [[curso]] = await connection.query(
      `SELECT id_curso FROM academia_curso WHERE id_curso = ? AND id_org = ? LIMIT 1`,
      [id_curso, id_org]
    );
    const [[alumno]] = await connection.query(
      `SELECT id_alumno FROM academia_alumno WHERE id_alumno = ? AND id_org = ? LIMIT 1`,
      [id_alumno, id_org]
    );
    if (!curso || !alumno) {
      return res.status(404).json({ success: false, message: "Curso o alumno no encontrado" });
    }
    const [result] = await connection.query(
      `INSERT INTO academia_inscripcion (id_org, id_curso, id_alumno, progreso_pct)
       VALUES (?, ?, ?, ?)`,
      [id_org, id_curso, id_alumno, progreso_pct ?? 0]
    );
    return res.status(201).json({
      success: true,
      data: { id_inscripcion: result.insertId },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Alumno ya inscrito en el curso" });
    }
    console.error("academia.createInscripcion", error.message);
    return res.status(500).json({ success: false, message: "Error al crear inscripción" });
  } finally {
    connection?.release();
  }
}

export async function academiaAlumnoLogin(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getAcademia();
    const [[org]] = await connection.query(
      `SELECT id_org FROM academia_entitlement WHERE slug = ? AND activo = 1 LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!org) return res.status(404).json({ success: false, message: "Academia no encontrada" });
    const [[alumno]] = await connection.query(
      `SELECT id_alumno, email, nombre, password_hash FROM academia_alumno
       WHERE id_org = ? AND email = ? LIMIT 1`,
      [org.id_org, String(email).toLowerCase()]
    );
    if (!alumno) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, alumno.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    const token = signOperatorToken({
      sub: alumno.id_alumno,
      email: alumno.email,
      ownerId: org.id_org,
      aud: "horytek-academia",
      role: "alumno",
    });
    return res.json({
      success: true,
      data: {
        token,
        alumno: { id_alumno: alumno.id_alumno, email: alumno.email, nombre: alumno.nombre },
      },
    });
  } catch (error) {
    console.error("academia.alumnoLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

/* ========================================================================
 * AGENDA
 * ======================================================================== */

export async function agendaGetPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getAgenda();
    const [[pro]] = await connection.query(
      `SELECT id_profesional, slug, nombre FROM agenda_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!pro) {
      return res.status(404).json({ success: false, message: "Agenda no encontrada" });
    }
    const [slots] = await connection.query(
      `SELECT id_slot, inicia_en, minutos, precio, disponible
       FROM agenda_slot
       WHERE id_profesional = ? AND disponible = 1 AND inicia_en >= NOW()
       ORDER BY inicia_en ASC LIMIT 100`,
      [pro.id_profesional]
    );
    return res.json({
      success: true,
      data: { slug: pro.slug, nombre: pro.nombre, slots },
    });
  } catch (error) {
    console.error("agenda.getPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar agenda" });
  } finally {
    connection?.release();
  }
}

export async function agendaBootstrap(req, res) {
  let connection;
  try {
    const { slug, nombre, email, password } = req.body;
    connection = await getAgenda();
    const result = await bootstrapOperator({
      connection,
      entitlementTable: "agenda_entitlement",
      adminTable: "agenda_admin",
      pk: "id_profesional",
      slug: String(slug).toLowerCase(),
      nombre,
      email,
      password,
      preferredId: req.id_tenant || null,
    });
    return res.status(201).json({
      success: true,
      data: {
        id_profesional: result.ownerId,
        id_admin: result.id_admin,
        slug: String(slug).toLowerCase(),
      },
    });
  } catch (error) {
    if (error?.code === "SLUG_EXISTS" || error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug ya en uso" });
    }
    console.error("agenda.bootstrap", error.message);
    return res.status(500).json({ success: false, message: "Error al registrar agenda" });
  } finally {
    connection?.release();
  }
}

export async function agendaAdminLogin(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getAgenda();
    const data = await loginOperatorAdmin({
      connection,
      entitlementTable: "agenda_entitlement",
      adminTable: "agenda_admin",
      pk: "id_profesional",
      slug,
      email,
      password,
      aud: "horytek-agenda",
    });
    if (!data) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("agenda.adminLogin", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  } finally {
    connection?.release();
  }
}

export async function agendaListSlots(req, res) {
  let connection;
  try {
    const id_profesional = req.operator.ownerId;
    connection = await getAgenda();
    const [rows] = await connection.query(
      `SELECT id_slot, inicia_en, minutos, precio, disponible
       FROM agenda_slot WHERE id_profesional = ?
       ORDER BY inicia_en DESC LIMIT 200`,
      [id_profesional]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("agenda.listSlots", error.message);
    return res.status(500).json({ success: false, message: "Error al listar slots" });
  } finally {
    connection?.release();
  }
}

export async function agendaCreateSlot(req, res) {
  let connection;
  try {
    const id_profesional = req.operator.ownerId;
    const { inicia_en, minutos, precio, disponible } = req.body;
    connection = await getAgenda();
    const [result] = await connection.query(
      `INSERT INTO agenda_slot (id_profesional, inicia_en, minutos, precio, disponible)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_profesional,
        inicia_en,
        minutos ?? 30,
        precio ?? 0,
        disponible === false ? 0 : 1,
      ]
    );
    return res.status(201).json({ success: true, data: { id_slot: result.insertId } });
  } catch (error) {
    console.error("agenda.createSlot", error.message);
    return res.status(500).json({ success: false, message: "Error al crear slot" });
  } finally {
    connection?.release();
  }
}

export async function agendaListReservas(req, res) {
  let connection;
  try {
    const id_profesional = req.operator.ownerId;
    connection = await getAgenda();
    const [rows] = await connection.query(
      `SELECT r.id_reserva, r.id_slot, r.cliente_nombre, r.cliente_email, r.estado_pago, r.creado_en,
              s.inicia_en, s.minutos, s.precio
       FROM agenda_reserva r
       INNER JOIN agenda_slot s ON s.id_slot = r.id_slot
       WHERE r.id_profesional = ?
       ORDER BY r.id_reserva DESC LIMIT 200`,
      [id_profesional]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("agenda.listReservas", error.message);
    return res.status(500).json({ success: false, message: "Error al listar reservas" });
  } finally {
    connection?.release();
  }
}

export async function agendaCreateReservaPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const { id_slot, cliente_nombre, cliente_email } = req.body;
    connection = await getAgenda();
    await connection.beginTransaction();
    const [[pro]] = await connection.query(
      `SELECT id_profesional FROM agenda_entitlement
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!pro) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Agenda no encontrada" });
    }
    const [[slot]] = await connection.query(
      `SELECT id_slot, disponible FROM agenda_slot
       WHERE id_slot = ? AND id_profesional = ? LIMIT 1 FOR UPDATE`,
      [id_slot, pro.id_profesional]
    );
    if (!slot || !Number(slot.disponible)) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Slot no disponible" });
    }
    const [result] = await connection.query(
      `INSERT INTO agenda_reserva
         (id_profesional, id_slot, cliente_nombre, cliente_email)
       VALUES (?, ?, ?, ?)`,
      [pro.id_profesional, id_slot, cliente_nombre, cliente_email.toLowerCase()]
    );
    await connection.query(
      `UPDATE agenda_slot SET disponible = 0 WHERE id_slot = ?`,
      [id_slot]
    );
    await connection.commit();
    return res.status(201).json({
      success: true,
      data: { id_reserva: result.insertId, estado_pago: "pendiente" },
    });
  } catch (error) {
    try {
      await connection?.rollback();
    } catch {
      /* ignore */
    }
    console.error("agenda.createReserva", error.message);
    return res.status(500).json({ success: false, message: "Error al crear reserva" });
  } finally {
    connection?.release();
  }
}
