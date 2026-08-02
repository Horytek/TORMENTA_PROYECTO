/**
 * Club de Puntos / Fidelización.
 *
 * Ganar puntos es 100% bookkeeping posterior a una venta ya confirmada — no
 * cambia el total cobrado. Canjear puntos SÍ afecta lo cobrado, pero por el
 * mecanismo que ya existe (`venta.descuento_global`, calculado en el
 * frontend); acá solo se descuenta el saldo y se audita el movimiento — la
 * misma confianza que ya se le da a un descuento manual con motivo.
 */

export class PuntosInsuficientesError extends Error {
  constructor(disponible, solicitado) {
    super(`Saldo de puntos insuficiente (disponible: ${disponible}, solicitado: ${solicitado}).`);
    this.name = "PuntosInsuficientesError";
    this.statusCode = 409;
  }
}

const DEFAULT_CONFIG = { activo: false, soles_por_punto: 10, valor_canje_por_punto: 0.1 };

export async function getConfig(cx, id_tenant) {
  const [[row]] = await cx.query(
    "SELECT activo, soles_por_punto, valor_canje_por_punto FROM puntos_config WHERE id_tenant = ? LIMIT 1",
    [id_tenant]
  );
  if (!row) return { ...DEFAULT_CONFIG };
  return {
    activo: !!row.activo,
    soles_por_punto: Number(row.soles_por_punto),
    valor_canje_por_punto: Number(row.valor_canje_por_punto),
  };
}

export async function setConfig(cx, id_tenant, { activo, soles_por_punto, valor_canje_por_punto }) {
  await cx.query(
    `INSERT INTO puntos_config (id_tenant, activo, soles_por_punto, valor_canje_por_punto)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE activo = VALUES(activo), soles_por_punto = VALUES(soles_por_punto), valor_canje_por_punto = VALUES(valor_canje_por_punto)`,
    [id_tenant, activo ? 1 : 0, soles_por_punto, valor_canje_por_punto]
  );
}

export async function getSaldoCliente(cx, { id_tenant, id_cliente }) {
  const [[row]] = await cx.query(
    "SELECT puntos_saldo FROM cliente WHERE id_cliente = ? AND id_tenant = ? LIMIT 1",
    [id_cliente, id_tenant]
  );
  return row ? Number(row.puntos_saldo) : 0;
}

/**
 * Acumula puntos por una venta ya insertada. No falla la venta si algo sale
 * raro con la config — ganar puntos es un bonus, no debe poder tumbar el
 * cobro. Devuelve cuántos puntos se otorgaron (0 si no aplica).
 */
export async function acumularPuntos(cx, { id_tenant, id_cliente, id_venta, totalVenta }) {
  if (!id_cliente || id_cliente <= 0 || !(totalVenta > 0)) return 0;

  const config = await getConfig(cx, id_tenant);
  if (!config.activo || !(config.soles_por_punto > 0)) return 0;

  const puntos = Math.floor(totalVenta / config.soles_por_punto);
  if (puntos <= 0) return 0;

  await cx.query(
    "INSERT INTO puntos_movimiento (id_tenant, id_cliente, id_venta, tipo, puntos) VALUES (?, ?, ?, 'GANADO', ?)",
    [id_tenant, id_cliente, id_venta, puntos]
  );
  await cx.query(
    "UPDATE cliente SET puntos_saldo = puntos_saldo + ? WHERE id_cliente = ? AND id_tenant = ?",
    [puntos, id_cliente, id_tenant]
  );
  return puntos;
}

/**
 * Canjea puntos de un cliente durante una venta. El descuento en soles ya lo
 * aplicó el frontend sobre `descuento_global` — esto solo mueve el saldo y
 * deja auditoría. Lanza `PuntosInsuficientesError` si no alcanza (no deja el
 * saldo negativo, mismo criterio que `restarStockSku`).
 */
export async function canjearPuntos(cx, { id_tenant, id_cliente, id_venta, puntos }) {
  if (!(puntos > 0)) return;

  const [resultado] = await cx.query(
    "UPDATE cliente SET puntos_saldo = puntos_saldo - ? WHERE id_cliente = ? AND id_tenant = ? AND puntos_saldo >= ?",
    [puntos, id_cliente, id_tenant, puntos]
  );
  if (resultado.affectedRows === 0) {
    const disponible = await getSaldoCliente(cx, { id_tenant, id_cliente });
    throw new PuntosInsuficientesError(disponible, puntos);
  }

  await cx.query(
    "INSERT INTO puntos_movimiento (id_tenant, id_cliente, id_venta, tipo, puntos) VALUES (?, ?, ?, 'CANJEADO', ?)",
    [id_tenant, id_cliente, id_venta, puntos]
  );
}

export default { getConfig, setConfig, getSaldoCliente, acumularPuntos, canjearPuntos, PuntosInsuficientesError };
