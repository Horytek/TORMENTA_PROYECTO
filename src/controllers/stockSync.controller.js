import { getConnection } from "../database/database_sync.js";

async function ensureEntitlement(connection, id_tenant) {
  const [[row]] = await connection.query(
    `SELECT activo FROM sync_entitlement WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (!row) {
    await connection.query(
      `INSERT INTO sync_entitlement (id_tenant, activo, plan_flag) VALUES (?, 1, 'wave_a')`,
      [id_tenant]
    );
    return true;
  }
  return Number(row.activo) === 1;
}

function denyEntitlement(res) {
  return res.status(403).json({
    success: false,
    message: "Sync Stock no está habilitado para este tenant.",
  });
}

export async function listCanales(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT id_canal, codigo, nombre, activo, config_json, creado_en
       FROM sync_canal WHERE id_tenant = ? ORDER BY nombre`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("stockSync.listCanales", error.message);
    return res.status(500).json({ success: false, message: "Error al listar canales" });
  } finally {
    connection?.release();
  }
}

export async function createCanal(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    const { codigo, nombre, config_json, activo } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [result] = await connection.query(
      `INSERT INTO sync_canal (id_tenant, codigo, nombre, activo, config_json)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_tenant,
        codigo,
        nombre,
        activo === false ? 0 : 1,
        config_json ? JSON.stringify(config_json) : null,
      ]
    );
    return res.status(201).json({
      success: true,
      data: { id_canal: result.insertId, codigo, nombre },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Ya existe un canal con ese código" });
    }
    console.error("stockSync.createCanal", error.message);
    return res.status(500).json({ success: false, message: "Error al crear canal" });
  } finally {
    connection?.release();
  }
}

export async function listMapeos(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const id_canal = req.query.id_canal ? Number(req.query.id_canal) : null;
    const params = [id_tenant];
    let sql = `SELECT m.id_mapeo, m.id_canal, m.sku_origen, m.sku_destino, m.id_producto_erp, m.activo, c.codigo AS canal
               FROM sync_mapeo_sku m
               INNER JOIN sync_canal c ON c.id_canal = m.id_canal AND c.id_tenant = m.id_tenant
               WHERE m.id_tenant = ?`;
    if (id_canal) {
      sql += ` AND m.id_canal = ?`;
      params.push(id_canal);
    }
    sql += ` ORDER BY m.id_mapeo DESC LIMIT 500`;
    const [rows] = await connection.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("stockSync.listMapeos", error.message);
    return res.status(500).json({ success: false, message: "Error al listar mapeos" });
  } finally {
    connection?.release();
  }
}

export async function createMapeo(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    const { id_canal, sku_origen, sku_destino, id_producto_erp, activo } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [[canal]] = await connection.query(
      `SELECT id_canal FROM sync_canal WHERE id_canal = ? AND id_tenant = ? LIMIT 1`,
      [id_canal, id_tenant]
    );
    if (!canal) {
      return res.status(404).json({ success: false, message: "Canal no encontrado" });
    }

    const [result] = await connection.query(
      `INSERT INTO sync_mapeo_sku (id_tenant, id_canal, sku_origen, sku_destino, id_producto_erp, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_tenant,
        id_canal,
        sku_origen,
        sku_destino,
        id_producto_erp ?? null,
        activo === false ? 0 : 1,
      ]
    );
    return res.status(201).json({ success: true, data: { id_mapeo: result.insertId } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Mapeo duplicado para ese SKU/canal" });
    }
    console.error("stockSync.createMapeo", error.message);
    return res.status(500).json({ success: false, message: "Error al crear mapeo" });
  } finally {
    connection?.release();
  }
}

export async function listJobs(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT id_job, id_canal, tipo, estado, mensaje, iniciado_en, finalizado_en, creado_en
       FROM sync_job WHERE id_tenant = ? ORDER BY id_job DESC LIMIT 100`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("stockSync.listJobs", error.message);
    return res.status(500).json({ success: false, message: "Error al listar jobs" });
  } finally {
    connection?.release();
  }
}

/**
 * Encola un job de reconciliación. La ejecución real de stock se hace vía API
 * hacia ERP/Ecommerce (sin JOIN cross-DB); aquí solo persistimos el job.
 */
export async function enqueueJob(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    const { id_canal, tipo } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    if (id_canal) {
      const [[canal]] = await connection.query(
        `SELECT id_canal FROM sync_canal WHERE id_canal = ? AND id_tenant = ? LIMIT 1`,
        [id_canal, id_tenant]
      );
      if (!canal) {
        return res.status(404).json({ success: false, message: "Canal no encontrado" });
      }
    }

    const [result] = await connection.query(
      `INSERT INTO sync_job (id_tenant, id_canal, tipo, estado, mensaje, iniciado_en, finalizado_en)
       VALUES (?, ?, ?, 'ok', ?, NOW(), NOW())`,
      [
        id_tenant,
        id_canal ?? null,
        tipo,
        "Job registrado. La sincronización de cantidades se dispara por API de canal (sin JOIN cross-DB).",
      ]
    );
    return res.status(201).json({
      success: true,
      data: { id_job: result.insertId, tipo, estado: "ok" },
    });
  } catch (error) {
    console.error("stockSync.enqueueJob", error.message);
    return res.status(500).json({ success: false, message: "Error al encolar job" });
  } finally {
    connection?.release();
  }
}

export async function getStatus(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) {
      return res.status(401).json({ success: false, message: "Sesión inválida" });
    }
    connection = await getConnection();
    const enabled = await ensureEntitlement(connection, id_tenant);
    if (!enabled) return denyEntitlement(res);

    const [[canales]] = await connection.query(
      `SELECT COUNT(*) AS c FROM sync_canal WHERE id_tenant = ? AND activo = 1`,
      [id_tenant]
    );
    const [[mapeos]] = await connection.query(
      `SELECT COUNT(*) AS c FROM sync_mapeo_sku WHERE id_tenant = ? AND activo = 1`,
      [id_tenant]
    );
    const [[jobs]] = await connection.query(
      `SELECT COUNT(*) AS c FROM sync_job WHERE id_tenant = ?`,
      [id_tenant]
    );
    return res.json({
      success: true,
      data: {
        producto: "sync-stock",
        enabled: true,
        canales: Number(canales.c),
        mapeos: Number(mapeos.c),
        jobs: Number(jobs.c),
      },
    });
  } catch (error) {
    console.error("stockSync.getStatus", error.message);
    return res.status(500).json({ success: false, message: "Error al consultar estado" });
  } finally {
    connection?.release();
  }
}
