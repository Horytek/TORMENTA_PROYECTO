import crypto from "crypto";
import {
  liberarReservaSku,
  reservarStockSku,
  stockPorSku,
} from "../inventario/stockRepository.js";
import { almacenesDeSucursal } from "./TiendaConfigService.js";

export function generarCodigoPedido() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TW${y}${m}${day}-${rand}`;
}

async function resolverPrecioYStock(cx, { id_tenant, id_producto, id_sku, id_almacen, cantidad }) {
  const [[prod]] = await cx.query(
    `SELECT id_producto, descripcion, CAST(precio AS DECIMAL(10,2)) AS precio, estado_producto, visible_tienda
     FROM producto WHERE id_producto = ? AND id_tenant = ? LIMIT 1`,
    [id_producto, id_tenant]
  );
  if (!prod || Number(prod.estado_producto) !== 1 || Number(prod.visible_tienda ?? 1) !== 1) {
    throw Object.assign(new Error("Producto no disponible"), { status: 400 });
  }

  let precio = Number(prod.precio);
  let attrs = null;
  let skuId = id_sku || null;

  if (skuId) {
    const [[sku]] = await cx.query(
      `SELECT id_sku, CAST(precio AS DECIMAL(10,2)) AS precio, attributes_json, estado
       FROM producto_sku WHERE id_sku = ? AND id_producto = ? AND id_tenant = ? LIMIT 1`,
      [skuId, id_producto, id_tenant]
    );
    if (!sku) throw Object.assign(new Error("Variante inválida"), { status: 400 });
    if (sku.precio != null) precio = Number(sku.precio);
    attrs =
      typeof sku.attributes_json === "string"
        ? JSON.parse(sku.attributes_json || "{}")
        : sku.attributes_json;
  } else {
    // SKU base del producto si existe uno solo / primero
    const [[sku]] = await cx.query(
      `SELECT id_sku, CAST(precio AS DECIMAL(10,2)) AS precio, attributes_json
       FROM producto_sku WHERE id_producto = ? AND id_tenant = ?
       ORDER BY id_sku LIMIT 1`,
      [id_producto, id_tenant]
    );
    if (sku) {
      skuId = sku.id_sku;
      if (sku.precio != null) precio = Number(sku.precio);
      attrs =
        typeof sku.attributes_json === "string"
          ? JSON.parse(sku.attributes_json || "{}")
          : sku.attributes_json;
    }
  }

  if (!skuId) {
    throw Object.assign(new Error("Producto sin SKU en inventario"), { status: 400 });
  }

  const stockRow = await stockPorSku(cx, { id_tenant, id_sku: skuId, id_almacen });
  const disponible = stockRow
    ? Math.max(0, stockRow.stock - stockRow.reservado)
    : 0;
  if (disponible < cantidad) {
    throw Object.assign(
      new Error(`Stock insuficiente para ${prod.descripcion} (disp: ${disponible})`),
      { status: 409, disponible }
    );
  }

  return {
    id_producto,
    id_sku: skuId,
    descripcion: prod.descripcion,
    precio_unitario: precio,
    cantidad,
    total: Number((precio * cantidad).toFixed(2)),
    attrs_snapshot: attrs,
  };
}

export async function crearPedido(cx, {
  id_tenant,
  id_comprador,
  id_cliente,
  id_sucursal,
  metodo_entrega = "retiro",
  items,
  cupon = null,
  direccion_entrega = null,
  distrito = null,
  referencia_entrega = null,
  costo_envio = 0,
  notas = null,
  idempotency_key,
  id_destino = null,
  id_agencia = null,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error("El carrito está vacío"), { status: 400 });
  }
  if (!id_sucursal) {
    throw Object.assign(new Error("Sucursal requerida"), { status: 400 });
  }
  if (!idempotency_key) {
    throw Object.assign(new Error("idempotency_key requerido"), { status: 400 });
  }

  const [[existing]] = await cx.query(
    `SELECT id_pedido, codigo, estado, total, mp_preference_id
     FROM tienda_pedido WHERE id_tenant = ? AND idempotency_key = ? LIMIT 1`,
    [id_tenant, idempotency_key]
  );
  if (existing) return existing;

  const almacenes = await almacenesDeSucursal(cx, id_sucursal, id_tenant);
  if (!almacenes.length) {
    throw Object.assign(new Error("La sucursal no tiene almacén"), { status: 400 });
  }
  const id_almacen = almacenes[0];

  const lineas = [];
  for (const it of items) {
    const linea = await resolverPrecioYStock(cx, {
      id_tenant,
      id_producto: Number(it.id_producto),
      id_sku: it.id_sku ? Number(it.id_sku) : null,
      id_almacen,
      cantidad: Math.max(1, Number(it.cantidad) || 1),
    });
    lineas.push(linea);
  }

  let subtotal = lineas.reduce((s, l) => s + l.total, 0);
  let descuento = 0;
  let cuponCodigo = null;

  if (cupon?.codigo) {
    const { aplicarCupon } = await import("./CuponService.js");
    const aplicado = await aplicarCupon(cx, {
      id_tenant,
      codigo: cupon.codigo,
      subtotal,
    });
    descuento = aplicado.descuento;
    cuponCodigo = aplicado.codigo;
  }

  const envio = Number(costo_envio) || 0;
  const total = Math.max(0, Number((subtotal - descuento + envio).toFixed(2)));
  const codigo = generarCodigoPedido();
  const pickupToken = crypto.randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  const [ins] = await cx.query(
    `INSERT INTO tienda_pedido (
      id_tenant, codigo, id_comprador, id_cliente, id_sucursal, id_almacen,
      estado, metodo_entrega, direccion_entrega, distrito, referencia_entrega,
      costo_envio, subtotal, descuento, total, cupon_codigo,
      idempotency_key, pickup_qr_token, notas, expires_at, id_destino, id_agencia
    ) VALUES (?, ?, ?, ?, ?, ?, 'pendiente_pago', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_tenant,
      codigo,
      id_comprador || null,
      id_cliente || null,
      id_sucursal,
      id_almacen,
      metodo_entrega,
      direccion_entrega,
      distrito,
      referencia_entrega,
      envio,
      subtotal,
      descuento,
      total,
      cuponCodigo,
      idempotency_key,
      pickupToken,
      notas,
      expires,
      id_destino || null,
      id_agencia || null,
    ]
  );
  const id_pedido = ins.insertId;

  for (const l of lineas) {
    await cx.query(
      `INSERT INTO tienda_pedido_item (
        id_pedido, id_tenant, id_producto, id_sku, descripcion,
        cantidad, precio_unitario, descuento, total, attrs_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id_pedido,
        id_tenant,
        l.id_producto,
        l.id_sku,
        l.descripcion,
        l.cantidad,
        l.precio_unitario,
        l.total,
        l.attrs_snapshot ? JSON.stringify(l.attrs_snapshot) : null,
      ]
    );

    await reservarStockSku(cx, {
      id_tenant,
      id_sku: l.id_sku,
      id_almacen,
      cantidad: l.cantidad,
    });
    await cx.query(
      `INSERT INTO tienda_reserva_stock (id_tenant, id_pedido, id_sku, id_almacen, cantidad, estado)
       VALUES (?, ?, ?, ?, ?, 'activa')`,
      [id_tenant, id_pedido, l.id_sku, id_almacen, l.cantidad]
    );
  }

  if (cuponCodigo) {
    const { registrarRedencion } = await import("./CuponService.js");
    await registrarRedencion(cx, {
      id_tenant,
      codigo: cuponCodigo,
      id_pedido,
      id_comprador,
      monto_descuento: descuento,
    });
  }

  const [[pedido]] = await cx.query(
    `SELECT * FROM tienda_pedido WHERE id_pedido = ? AND id_tenant = ?`,
    [id_pedido, id_tenant]
  );
  return pedido;
}

export async function liberarReservasPedido(cx, { id_tenant, id_pedido }) {
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
    await cx.query(
      `UPDATE tienda_reserva_stock SET estado = 'liberada' WHERE id_reserva = ?`,
      [r.id_reserva]
    );
  }
}

export async function marcarReservasConvertidas(cx, { id_tenant, id_pedido }) {
  await cx.query(
    `UPDATE tienda_reserva_stock SET estado = 'convertida'
     WHERE id_tenant = ? AND id_pedido = ? AND estado = 'activa'`,
    [id_tenant, id_pedido]
  );
}

export async function getPedidoByCodigo(cx, { id_tenant, codigo }) {
  const [[pedido]] = await cx.query(
    `SELECT * FROM tienda_pedido WHERE id_tenant = ? AND codigo = ? LIMIT 1`,
    [id_tenant, codigo]
  );
  if (!pedido) return null;
  const [items] = await cx.query(
    `SELECT * FROM tienda_pedido_item WHERE id_pedido = ? AND id_tenant = ?`,
    [pedido.id_pedido, id_tenant]
  );
  return { ...pedido, items };
}

export async function listarPedidosComprador(cx, { id_tenant, id_comprador }) {
  const [rows] = await cx.query(
    `SELECT id_pedido, codigo, estado, metodo_entrega, total, created_at, paid_at, id_venta
     FROM tienda_pedido
     WHERE id_tenant = ? AND id_comprador = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [id_tenant, id_comprador]
  );
  return rows;
}

export async function listarPedidosAdmin(
  cx,
  { id_tenant, estado = null, mp_status = null, limit = 50 }
) {
  const where = ["p.id_tenant = ?"];
  const params = [id_tenant];
  if (estado) {
    where.push("p.estado = ?");
    params.push(estado);
  }
  if (mp_status) {
    where.push("p.mp_status = ?");
    params.push(mp_status);
  }
  params.push(Math.min(100, Number(limit) || 50));
  const [rows] = await cx.query(
    `SELECT p.*,
            c.nombres AS comprador_nombre,
            c.email AS comprador_email,
            c.telefono AS comprador_telefono,
            s.nombre_sucursal AS sucursal_nombre
     FROM tienda_pedido p
     LEFT JOIN tienda_comprador c ON c.id_comprador = p.id_comprador
     LEFT JOIN sucursal s ON s.id_sucursal = p.id_sucursal
     WHERE ${where.join(" AND ")}
     ORDER BY p.created_at DESC
     LIMIT ?`,
    params
  );
  return rows;
}
