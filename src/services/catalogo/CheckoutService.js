import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { createVentaInternal } from "../../controllers/ventas.controller.js";
import { decryptMpToken } from "../../utils/ecommerceCrypto.js";
import {
  liberarReservasPedido,
  marcarReservasConvertidas,
} from "./PedidoService.js";
import { liberarReservaSku } from "../inventario/stockRepository.js";

/**
 * Confirma un pedido pagado: libera reserva contable, crea venta ERP,
 * descuenta stock real vía createVentaInternal.
 * Idempotente si ya tiene id_venta.
 */
export async function confirmarPedidoPagado(cx, {
  id_tenant,
  id_pedido,
  mp_payment_id = null,
  mp_status = "approved",
  id_usuario_sistema = null,
}) {
  const [[pedido]] = await cx.query(
    `SELECT * FROM tienda_pedido WHERE id_pedido = ? AND id_tenant = ? FOR UPDATE`,
    [id_pedido, id_tenant]
  );
  if (!pedido) throw Object.assign(new Error("Pedido no encontrado"), { status: 404 });

  if (pedido.id_venta) {
    return { id_venta: pedido.id_venta, already: true, pedido };
  }

  if (["cancelado", "expirado"].includes(pedido.estado)) {
    throw Object.assign(new Error("Pedido no confirmable"), { status: 409 });
  }

  const [items] = await cx.query(
    `SELECT * FROM tienda_pedido_item WHERE id_pedido = ? AND id_tenant = ?`,
    [id_pedido, id_tenant]
  );
  if (!items.length) {
    throw Object.assign(new Error("Pedido sin ítems"), { status: 400 });
  }

  // Liberar reserva antes de restar stock real (createVentaInternal resta `stock`)
  const [reservas] = await cx.query(
    `SELECT * FROM tienda_reserva_stock
     WHERE id_tenant = ? AND id_pedido = ? AND estado = 'activa'`,
    [id_tenant, id_pedido]
  );
  for (const r of reservas) {
    await liberarReservaSku(cx, {
      id_tenant,
      id_sku: r.id_sku,
      id_almacen: r.id_almacen,
      cantidad: r.cantidad,
    });
  }
  await marcarReservasConvertidas(cx, { id_tenant, id_pedido });

  // Upsert cliente mínimo si hay comprador sin id_cliente
  let id_cliente = pedido.id_cliente || null;
  if (!id_cliente && pedido.id_comprador) {
    const [[comp]] = await cx.query(
      `SELECT * FROM tienda_comprador WHERE id_comprador = ? AND id_tenant = ?`,
      [pedido.id_comprador, id_tenant]
    );
    if (comp) {
      if (comp.id_cliente) {
        id_cliente = comp.id_cliente;
      } else {
        const [insCli] = await cx.query(
          `INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente, id_tenant, email, telefono)
           VALUES (?, NULL, ?, ?, NULL, NULL, 1, ?, ?, ?)`,
          [
            comp.documento || null,
            comp.nombres,
            comp.apellidos || "",
            id_tenant,
            comp.email,
            comp.telefono || null,
          ]
        );
        id_cliente = insCli.insertId;
        await cx.query(
          `UPDATE tienda_comprador SET id_cliente = ? WHERE id_comprador = ? AND id_tenant = ?`,
          [id_cliente, comp.id_comprador, id_tenant]
        );
      }
    }
  }

  const [[cfg]] = await cx.query(
    `SELECT emitir_cpe FROM tienda_config WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  const emitirCpe = Number(cfg?.emitir_cpe) === 1;

  const detalles = items.map((it) => ({
    id_producto: it.id_producto,
    id_sku: it.id_sku,
    cantidad: it.cantidad,
    precio: Number(it.precio_unitario),
    descuento: Number(it.descuento) || 0,
    total: Number(it.total),
    atributos_fijados:
      typeof it.attrs_snapshot === "string"
        ? JSON.parse(it.attrs_snapshot || "null")
        : it.attrs_snapshot,
  }));

  const now = new Date();
  const saleData = {
    id_sucursal: pedido.id_sucursal,
    id_almacen: pedido.id_almacen,
    id_comprobante: emitirCpe ? "Boleta" : "Nota",
    id_cliente,
    estado_venta: 1,
    f_venta: now,
    fecha: now,
    fecha_iso: now.toISOString(),
    igv: 18,
    metodo_pago: "MercadoPago",
    descuento_venta: Number(pedido.descuento) || 0,
    motivo_descuento: pedido.cupon_codigo ? `Cupón ${pedido.cupon_codigo}` : null,
    recibido: Number(pedido.total),
    vuelto: 0,
    observacion: `Tienda web ${pedido.codigo}${pedido.notas ? ` — ${pedido.notas}` : ""}`,
    estado_sunat: 0,
    idempotency_key: `tienda:${pedido.idempotency_key}`,
    id_usuario: id_usuario_sistema || 1,
    referencia_pago: mp_payment_id || pedido.mp_payment_id || pedido.codigo,
    canal: "tienda_web",
    detalles,
  };

  const ventaResult = await createVentaInternal(cx, saleData, id_tenant);
  const id_venta = ventaResult?.id_venta;

  await cx.query(
    `UPDATE tienda_pedido SET
      estado = 'pagado',
      id_venta = ?,
      id_cliente = COALESCE(id_cliente, ?),
      mp_payment_id = COALESCE(?, mp_payment_id),
      mp_status = ?,
      paid_at = NOW()
     WHERE id_pedido = ? AND id_tenant = ?`,
    [id_venta, id_cliente, mp_payment_id, mp_status, id_pedido, id_tenant]
  );

  return { id_venta, already: false, pedido };
}

export async function crearPreferenceMp(cx, {
  id_tenant,
  pedido,
  items,
  back_urls,
  notification_url,
}) {
  const [[cfg]] = await cx.query(
    `SELECT mp_access_token_enc, mp_public_key, mp_modo
     FROM tienda_config WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (!cfg?.mp_access_token_enc) {
    throw Object.assign(new Error("MercadoPago no configurado"), { status: 400 });
  }

  const accessToken = decryptMpToken(cfg.mp_access_token_enc);
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const body = {
    items: items.map((it) => ({
      id: String(it.id_producto),
      title: it.descripcion.slice(0, 120),
      quantity: Number(it.cantidad),
      unit_price: Number(it.precio_unitario),
      currency_id: "PEN",
    })),
    external_reference: `${id_tenant}:${pedido.codigo}`,
    metadata: { id_tenant, codigo: pedido.codigo, id_pedido: pedido.id_pedido },
    back_urls,
    auto_return: "approved",
    notification_url,
  };

  if (Number(pedido.costo_envio) > 0) {
    body.items.push({
      id: "envio",
      title: "Envío",
      quantity: 1,
      unit_price: Number(pedido.costo_envio),
      currency_id: "PEN",
    });
  }
  if (Number(pedido.descuento) > 0) {
    body.items.push({
      id: "descuento",
      title: "Descuento",
      quantity: 1,
      unit_price: -Number(pedido.descuento),
      currency_id: "PEN",
    });
  }

  const result = await preference.create({ body });
  const prefId = result.id || result.body?.id;
  const initPoint =
    cfg.mp_modo === "prod"
      ? result.init_point || result.body?.init_point
      : result.sandbox_init_point || result.body?.sandbox_init_point || result.init_point;

  await cx.query(
    `UPDATE tienda_pedido SET mp_preference_id = ? WHERE id_pedido = ? AND id_tenant = ?`,
    [prefId, pedido.id_pedido, id_tenant]
  );

  return {
    preference_id: prefId,
    init_point: initPoint,
    public_key: cfg.mp_public_key,
  };
}

export async function procesarWebhookMp(cx, { paymentId }) {
  // Buscar pedidos con ese payment o por external_reference vía API MP
  // El caller puede pasar paymentId; resolvemos tenant desde el pago
  const [pedidos] = await cx.query(
    `SELECT tp.*, tc.mp_access_token_enc
     FROM tienda_pedido tp
     INNER JOIN tienda_config tc ON tc.id_tenant = tp.id_tenant
     WHERE tp.mp_payment_id = ? OR tp.codigo = ?
     LIMIT 5`,
    [String(paymentId), String(paymentId)]
  );

  // Si no hay match local, intentar obtener pago con cada tenant que tenga MP
  if (!pedidos.length) {
    const [configs] = await cx.query(
      `SELECT id_tenant, mp_access_token_enc FROM tienda_config
       WHERE mp_access_token_enc IS NOT NULL AND activo = 1`
    );
    for (const cfg of configs) {
      try {
        const accessToken = decryptMpToken(cfg.mp_access_token_enc);
        const client = new MercadoPagoConfig({ accessToken });
        const paymentApi = new Payment(client);
        const payment = await paymentApi.get({ id: paymentId });
        const data = payment.body || payment;
        if (data.status !== "approved") continue;

        const ref = String(data.external_reference || "");
        const [tenStr, codigo] = ref.split(":");
        if (Number(tenStr) !== Number(cfg.id_tenant) || !codigo) continue;

        const [[pedido]] = await cx.query(
          `SELECT * FROM tienda_pedido WHERE id_tenant = ? AND codigo = ? LIMIT 1`,
          [cfg.id_tenant, codigo]
        );
        if (!pedido) continue;

        await cx.beginTransaction();
        try {
          const result = await confirmarPedidoPagado(cx, {
            id_tenant: cfg.id_tenant,
            id_pedido: pedido.id_pedido,
            mp_payment_id: String(paymentId),
            mp_status: data.status,
          });
          await cx.commit();
          return result;
        } catch (e) {
          await cx.rollback();
          throw e;
        }
      } catch (err) {
        if (err.status && err.status < 500) continue;
        console.error("Webhook MP tenant", cfg.id_tenant, err.message);
      }
    }
    return null;
  }

  // Match directo
  for (const pedido of pedidos) {
    if (pedido.id_venta) return { id_venta: pedido.id_venta, already: true };
    await cx.beginTransaction();
    try {
      const result = await confirmarPedidoPagado(cx, {
        id_tenant: pedido.id_tenant,
        id_pedido: pedido.id_pedido,
        mp_payment_id: String(paymentId),
      });
      await cx.commit();
      return result;
    } catch (e) {
      await cx.rollback();
      throw e;
    }
  }
  return null;
}

export async function cancelarPedidoExpirado(cx, { id_tenant, id_pedido }) {
  await liberarReservasPedido(cx, { id_tenant, id_pedido });
  await cx.query(
    `UPDATE tienda_pedido SET estado = 'expirado'
     WHERE id_pedido = ? AND id_tenant = ? AND estado = 'pendiente_pago'`,
    [id_pedido, id_tenant]
  );
}
