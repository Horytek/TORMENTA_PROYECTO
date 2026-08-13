export async function aplicarCupon(cx, { id_tenant, codigo, subtotal }) {
  const code = String(codigo || "").trim().toUpperCase();
  if (!code) {
    throw Object.assign(new Error("Cupón inválido"), { status: 400 });
  }

  const [[cupon]] = await cx.query(
    `SELECT * FROM tienda_cupon
     WHERE id_tenant = ? AND codigo = ? AND activo = 1
     LIMIT 1`,
    [id_tenant, code]
  );
  if (!cupon) {
    throw Object.assign(new Error("Cupón no encontrado"), { status: 404 });
  }

  const now = new Date();
  if (cupon.vigencia_desde && new Date(cupon.vigencia_desde) > now) {
    throw Object.assign(new Error("Cupón aún no vigente"), { status: 400 });
  }
  if (cupon.vigencia_hasta && new Date(cupon.vigencia_hasta) < now) {
    throw Object.assign(new Error("Cupón expirado"), { status: 400 });
  }
  if (cupon.usos_max != null && Number(cupon.usos_actual) >= Number(cupon.usos_max)) {
    throw Object.assign(new Error("Cupón agotado"), { status: 400 });
  }
  if (Number(subtotal) < Number(cupon.minimo_compra || 0)) {
    throw Object.assign(
      new Error(`Compra mínima S/ ${Number(cupon.minimo_compra).toFixed(2)}`),
      { status: 400 }
    );
  }

  let descuento = 0;
  if (cupon.tipo === "porcentaje") {
    descuento = Number(subtotal) * (Number(cupon.valor) / 100);
  } else {
    descuento = Number(cupon.valor);
  }
  descuento = Math.min(Number(subtotal), Number(descuento.toFixed(2)));

  return {
    id_cupon: cupon.id_cupon,
    codigo: cupon.codigo,
    tipo: cupon.tipo,
    valor: Number(cupon.valor),
    descuento,
  };
}

export async function registrarRedencion(cx, {
  id_tenant,
  codigo,
  id_pedido,
  id_comprador,
  monto_descuento,
}) {
  const [[cupon]] = await cx.query(
    `SELECT id_cupon FROM tienda_cupon WHERE id_tenant = ? AND codigo = ? LIMIT 1`,
    [id_tenant, String(codigo).toUpperCase()]
  );
  if (!cupon) return;

  await cx.query(
    `INSERT INTO tienda_cupon_redencion (id_tenant, id_cupon, id_pedido, id_comprador, monto_descuento)
     VALUES (?, ?, ?, ?, ?)`,
    [id_tenant, cupon.id_cupon, id_pedido, id_comprador || null, monto_descuento]
  );
  await cx.query(
    `UPDATE tienda_cupon SET usos_actual = usos_actual + 1 WHERE id_cupon = ? AND id_tenant = ?`,
    [cupon.id_cupon, id_tenant]
  );
}

export async function listarCupones(cx, id_tenant) {
  const [rows] = await cx.query(
    `SELECT * FROM tienda_cupon WHERE id_tenant = ? ORDER BY created_at DESC`,
    [id_tenant]
  );
  return rows;
}

export async function upsertCupon(cx, id_tenant, data) {
  const codigo = String(data.codigo || "").trim().toUpperCase();
  if (!codigo) throw Object.assign(new Error("Código requerido"), { status: 400 });

  if (data.id_cupon) {
    await cx.query(
      `UPDATE tienda_cupon SET
        codigo = ?, tipo = ?, valor = ?, minimo_compra = ?, usos_max = ?,
        activo = ?, vigencia_desde = ?, vigencia_hasta = ?
       WHERE id_cupon = ? AND id_tenant = ?`,
      [
        codigo,
        data.tipo || "porcentaje",
        Number(data.valor) || 0,
        Number(data.minimo_compra) || 0,
        data.usos_max ?? null,
        data.activo == null ? 1 : Number(data.activo) ? 1 : 0,
        data.vigencia_desde || null,
        data.vigencia_hasta || null,
        data.id_cupon,
        id_tenant,
      ]
    );
    return data.id_cupon;
  }

  const [ins] = await cx.query(
    `INSERT INTO tienda_cupon (
      id_tenant, codigo, tipo, valor, minimo_compra, usos_max, activo,
      vigencia_desde, vigencia_hasta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_tenant,
      codigo,
      data.tipo || "porcentaje",
      Number(data.valor) || 0,
      Number(data.minimo_compra) || 0,
      data.usos_max ?? null,
      data.activo == null ? 1 : Number(data.activo) ? 1 : 0,
      data.vigencia_desde || null,
      data.vigencia_hasta || null,
    ]
  );
  return ins.insertId;
}
