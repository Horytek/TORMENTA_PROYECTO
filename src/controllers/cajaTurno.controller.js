import { getConnection } from "./../database/database.js";

/**
 * Arqueo de caja por turno de cajero (POS).
 *
 * Un turno se abre con un monto inicial y se cierra con un conteo ciego: el
 * cajero declara cuánto contó por método de pago SIN ver antes lo que el
 * sistema espera. El "esperado" se calcula recién al cerrar, a partir de
 * `venta.metodo_pago` de las ventas vigentes de esa sucursal dentro de la
 * ventana [fecha_apertura, fecha_cierre] — no requiere tocar la venta al
 * crearla (venta no tiene columna de turno ni de cajero-terminal).
 */

// Mismo vocabulario que `parseMetodoPago` en reporte.controller.js, pero sin
// agrupar en efectivo/electrónico: acá interesa el desglose por método tal
// cual lo declara el cajero.
const desglosePorMetodo = (metodoPago) => {
  const totales = {};
  if (!metodoPago) return totales;
  for (const parte of String(metodoPago).split(",")) {
    const [tipo, monto] = parte.split(":").map((s) => s.trim());
    if (!tipo) continue;
    const valor = parseFloat(monto) || 0;
    totales[tipo] = (totales[tipo] || 0) + valor;
  }
  return totales;
};

const sumarDesgloses = (desgloses) => {
  const total = {};
  for (const d of desgloses) {
    for (const [tipo, monto] of Object.entries(d)) {
      total[tipo] = (total[tipo] || 0) + monto;
    }
  }
  return total;
};

const restarDesgloses = (declarado, esperado) => {
  const tipos = new Set([...Object.keys(declarado || {}), ...Object.keys(esperado || {})]);
  const diferencia = {};
  for (const tipo of tipos) {
    diferencia[tipo] = Math.round(((declarado?.[tipo] || 0) - (esperado?.[tipo] || 0)) * 100) / 100;
  }
  return diferencia;
};

const parseJsonCol = (val) => (typeof val === "string" ? JSON.parse(val) : (val || null));

const abrirTurno = async (req, res) => {
  let connection;
  try {
    const { id_sucursal, monto_inicial } = req.body;
    const idSucursal = Number(id_sucursal);
    const montoInicial = Number(monto_inicial);
    if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
      return res.status(400).json({ code: 0, message: "id_sucursal inválido" });
    }
    if (!Number.isFinite(montoInicial) || montoInicial < 0) {
      return res.status(400).json({ code: 0, message: "monto_inicial inválido" });
    }

    connection = await getConnection();

    const [[abierto]] = await connection.query(
      "SELECT id_turno FROM caja_turno WHERE id_tenant = ? AND id_sucursal = ? AND estado = 'abierto' LIMIT 1",
      [req.id_tenant, idSucursal]
    );
    if (abierto) {
      return res.status(409).json({ code: 0, message: "Ya hay un turno abierto en esta sucursal.", id_turno: abierto.id_turno });
    }

    const [result] = await connection.query(
      `INSERT INTO caja_turno (id_tenant, id_sucursal, id_usuario_apertura, monto_inicial, estado)
       VALUES (?, ?, ?, ?, 'abierto')`,
      [req.id_tenant, idSucursal, req.user.id_usuario, montoInicial]
    );

    res.json({ code: 1, id_turno: result.insertId, message: "Turno abierto" });
  } catch (error) {
    console.error("Error en abrirTurno:", error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getTurnoActivo = async (req, res) => {
  let connection;
  try {
    const idSucursal = Number(req.query.id_sucursal);
    if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
      return res.status(400).json({ code: 0, message: "id_sucursal inválido" });
    }
    connection = await getConnection();
    const [[turno]] = await connection.query(
      "SELECT * FROM caja_turno WHERE id_tenant = ? AND id_sucursal = ? AND estado = 'abierto' LIMIT 1",
      [req.id_tenant, idSucursal]
    );
    res.json({ code: 1, data: turno || null });
  } catch (error) {
    console.error("Error en getTurnoActivo:", error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const cerrarTurno = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const declarado = req.body?.declarado && typeof req.body.declarado === "object" ? req.body.declarado : {};
    const observaciones = req.body?.observaciones || null;

    connection = await getConnection();

    const [[turno]] = await connection.query(
      "SELECT * FROM caja_turno WHERE id_turno = ? AND id_tenant = ? AND estado = 'abierto' LIMIT 1",
      [id, req.id_tenant]
    );
    if (!turno) {
      return res.status(404).json({ code: 0, message: "Turno no encontrado o ya cerrado" });
    }

    // "Esperado" recién se calcula ahora, DESPUÉS de que el cajero ya declaró
    // (el body de este mismo request) — es lo que hace el arqueo ciego.
    const [ventas] = await connection.query(
      `SELECT metodo_pago FROM venta
       WHERE id_tenant = ? AND id_sucursal = ? AND estado_venta != 0
         AND fecha_iso >= ? AND fecha_iso <= NOW()`,
      [req.id_tenant, turno.id_sucursal, turno.fecha_apertura]
    );
    const esperado = sumarDesgloses(ventas.map((v) => desglosePorMetodo(v.metodo_pago)));
    // El efectivo esperado incluye el fondo con el que se abrió el turno.
    esperado.EFECTIVO = Math.round(((esperado.EFECTIVO || 0) + Number(turno.monto_inicial)) * 100) / 100;

    const declaradoLimpio = Object.fromEntries(
      Object.entries(declarado).map(([k, v]) => [String(k).toUpperCase(), Number(v) || 0])
    );
    const diferencia = restarDesgloses(declaradoLimpio, esperado);

    await connection.query(
      `UPDATE caja_turno SET
         estado = 'cerrado', id_usuario_cierre = ?, fecha_cierre = NOW(),
         declarado_json = ?, esperado_json = ?, diferencia_json = ?, observaciones = ?
       WHERE id_turno = ? AND id_tenant = ?`,
      [req.user.id_usuario, JSON.stringify(declaradoLimpio), JSON.stringify(esperado), JSON.stringify(diferencia), observaciones, id, req.id_tenant]
    );

    res.json({ code: 1, message: "Turno cerrado", data: { declarado: declaradoLimpio, esperado, diferencia } });
  } catch (error) {
    console.error("Error en cerrarTurno:", error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getHistorialTurnos = async (req, res) => {
  let connection;
  try {
    const idSucursal = Number(req.query.id_sucursal);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    connection = await getConnection();

    const where = ["id_tenant = ?"];
    const params = [req.id_tenant];
    if (Number.isInteger(idSucursal) && idSucursal > 0) {
      where.push("id_sucursal = ?");
      params.push(idSucursal);
    }

    const [turnos] = await connection.query(
      `SELECT * FROM caja_turno WHERE ${where.join(" AND ")} ORDER BY fecha_apertura DESC LIMIT ?`,
      [...params, limit]
    );

    const data = turnos.map((t) => ({
      ...t,
      declarado_json: parseJsonCol(t.declarado_json),
      esperado_json: parseJsonCol(t.esperado_json),
      diferencia_json: parseJsonCol(t.diferencia_json),
    }));

    res.json({ code: 1, data });
  } catch (error) {
    console.error("Error en getHistorialTurnos:", error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { abrirTurno, getTurnoActivo, cerrarTurno, getHistorialTurnos };
