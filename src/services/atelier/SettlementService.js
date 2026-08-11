/**
 * Cálculo de comisiones Atelier — solo backend.
 * @param {number} gross
 * @param {{ percent?: number, min_fee?: number|null, max_fee?: number|null }} rule
 */
export function settleAmounts(gross, rule = {}) {
  const g = Math.round(Number(gross) * 100) / 100;
  if (!(g > 0)) throw new Error("Monto inválido");
  const percent = Number(rule.percent ?? 10);
  let fee = Math.round(g * (percent / 100) * 100) / 100;
  if (rule.min_fee != null && fee < Number(rule.min_fee)) fee = Number(rule.min_fee);
  if (rule.max_fee != null && fee > Number(rule.max_fee)) fee = Number(rule.max_fee);
  if (fee > g) fee = g;
  const creator_net = Math.round((g - fee) * 100) / 100;
  return {
    gross_amount: g,
    platform_fee: fee,
    creator_net,
    percent,
  };
}

/**
 * Resuelve regla: creator override > global.
 */
export async function resolveCommissionRule(connection, { id_creator } = {}) {
  if (id_creator) {
    const [[byCreator]] = await connection.query(
      `SELECT percent, min_fee, max_fee FROM atelier_commission_rule
       WHERE activo = 1 AND scope = 'creator' AND id_creator = ?
       ORDER BY id_rule DESC LIMIT 1`,
      [id_creator]
    );
    if (byCreator) return byCreator;
  }
  const [[global]] = await connection.query(
    `SELECT percent, min_fee, max_fee FROM atelier_commission_rule
     WHERE activo = 1 AND scope = 'global'
     ORDER BY id_rule DESC LIMIT 1`
  );
  return global || { percent: 10, min_fee: null, max_fee: null };
}
