import { getConnection } from "../database/database.js";
import { sumarStockSku, restarStockSku } from "../services/inventario/stockRepository.js";
import { esErrorDeStock } from "../services/inventario/errores.js";
import {
  TRANSICIONES,
  puedeTransicionar,
  cantidadDisponible,
  devueltoPrevio,
  importeItem,
  totalDevolucion,
  diferenciaCambio,
  evaluarDevolucion,
  estadoInicial,
  POLITICA_DEFAULT,
} from "../services/devoluciones/reglas.js";

const MOTIVOS = new Set([
  "producto_defectuoso", "talla_incorrecta", "color_incorrecto", "producto_equivocado",
  "dano_transporte", "insatisfaccion", "error_despacho", "producto_incompleto", "otro",
]);
const CONDICIONES = new Set(["nuevo", "abierto", "usado", "danado", "incompleto"]);
const DESTINOS = new Set([
  "stock_disponible", "revision", "danados", "cuarentena", "reparacion",
  "merma", "devolucion_proveedor", "baja_definitiva",
]);
const RESOLUCIONES = new Set([
  "reembolso_original", "reembolso_efectivo", "nota_credito", "saldo_favor",
  "cambio_producto", "reposicion", "reembolso_parcial", "rechazo",
]);
const CANALES = new Set(["tienda", "ecommerce", "movil", "delivery", "otro"]);

// ── SELECT compartido: cabecera + items agregados en JSON ──────────────────
const SELECT_DEVOLUCION = `
  SELECT
    d.id_devolucion, d.codigo, d.id_venta,
    com.num_comprobante, tp.nom_tipocomp AS tipo_comprobante,
    v.id_cliente,
    COALESCE(cl.razon_social, CONCAT(cl.nombres, ' ', cl.apellidos)) AS nom_cliente,
    d.id_sucursal, suc.nombre_sucursal,
    d.canal, d.fecha, d.estado, d.resolucion, d.total, d.diferencia_cambio,
    d.metodo_reembolso, d.observaciones, d.evidencias,
    ucrea.usua AS responsable, uaprueba.usua AS aprobador,
    JSON_ARRAYAGG(JSON_OBJECT(
      'id_detalle', dd.id_detalle_venta,
      'id_producto', dd.id_producto,
      'descripcion', p.descripcion,
      'sku', ps.sku,
      'nom_talla', tal.nombre,
      'nom_tonalidad', ton.nombre,
      'cantidad', dd.cantidad,
      'precio_unitario', dd.precio_unitario,
      'descuento', dd.descuento,
      'importe', dd.importe,
      'motivo', dd.motivo,
      'motivo_detalle', dd.motivo_detalle,
      'condicion', dd.condicion,
      'destino', dd.destino,
      'producto_cambio', dd.producto_cambio
    )) AS items
  FROM devolucion d
  LEFT JOIN venta v ON v.id_venta = d.id_venta AND v.id_tenant = d.id_tenant
  LEFT JOIN comprobante com ON com.id_comprobante = v.id_comprobante
  LEFT JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
  LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente
  LEFT JOIN sucursal suc ON suc.id_sucursal = d.id_sucursal
  LEFT JOIN usuario ucrea ON ucrea.id_usuario = d.id_usuario_crea
  LEFT JOIN usuario uaprueba ON uaprueba.id_usuario = d.id_usuario_aprueba
  INNER JOIN devolucion_detalle dd ON dd.id_devolucion = d.id_devolucion
  INNER JOIN producto p ON p.id_producto = dd.id_producto
  LEFT JOIN producto_sku ps ON ps.id_sku = dd.id_sku
  LEFT JOIN talla tal ON tal.id_talla = dd.id_talla
  LEFT JOIN tonalidad ton ON ton.id_tonalidad = dd.id_tonalidad
`;

const mapRow = (row) => ({
  id_devolucion: row.id_devolucion,
  codigo: row.codigo,
  id_venta: row.id_venta,
  num_comprobante: row.num_comprobante,
  tipo_comprobante: row.tipo_comprobante,
  id_cliente: row.id_cliente,
  nom_cliente: row.nom_cliente,
  id_sucursal: row.id_sucursal,
  nombre_sucursal: row.nombre_sucursal,
  canal: row.canal,
  fecha: row.fecha,
  estado: row.estado,
  resolucion: row.resolucion,
  total: Number(row.total),
  diferencia_cambio: row.diferencia_cambio != null ? Number(row.diferencia_cambio) : undefined,
  responsable: row.responsable,
  aprobador: row.aprobador,
  observaciones: row.observaciones,
  evidencias: Array.isArray(row.evidencias) ? row.evidencias : (row.evidencias ? JSON.parse(row.evidencias) : []),
  items: (Array.isArray(row.items) ? row.items : JSON.parse(row.items || "[]")).map((i) => ({
    ...i,
    cantidad: Number(i.cantidad),
    precio_unitario: Number(i.precio_unitario),
    descuento: Number(i.descuento),
    importe: Number(i.importe),
    producto_cambio: typeof i.producto_cambio === "string" ? JSON.parse(i.producto_cambio) : i.producto_cambio,
  })),
});

// ── GET /devoluciones ────────────────────────────────────────────────────
const getDevoluciones = async (req, res) => {
  const { estado, id_sucursal, fecha_inicio, fecha_fin, q } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const where = ["d.id_tenant = ?"];
    const params = [id_tenant];

    if (estado) {
      const lista = String(estado).split(",").filter(Boolean);
      where.push(`d.estado IN (${lista.map(() => "?").join(",")})`);
      params.push(...lista);
    }
    if (id_sucursal) { where.push("d.id_sucursal = ?"); params.push(id_sucursal); }
    if (fecha_inicio) { where.push("d.fecha >= ?"); params.push(fecha_inicio); }
    if (fecha_fin) { where.push("d.fecha <= ?"); params.push(fecha_fin); }
    if (q) {
      where.push("(d.codigo LIKE ? OR com.num_comprobante LIKE ? OR cl.nombres LIKE ? OR cl.apellidos LIKE ? OR cl.razon_social LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    const [rows] = await connection.query(
      `${SELECT_DEVOLUCION} WHERE ${where.join(" AND ")} GROUP BY d.id_devolucion ORDER BY d.fecha DESC LIMIT 200`,
      params
    );
    res.json({ success: true, data: rows.map(mapRow) });
  } catch (error) {
    console.error("Error en getDevoluciones:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET /devoluciones/:id ────────────────────────────────────────────────
const getDevolucionDetalle = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      `${SELECT_DEVOLUCION} WHERE d.id_devolucion = ? AND d.id_tenant = ? GROUP BY d.id_devolucion`,
      [id, id_tenant]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Devolución no encontrada" });
    }

    const [historial] = await connection.query(
      `SELECT dh.estado_anterior AS de, dh.estado_nuevo AS a, dh.nota, dh.fecha, usu.usua AS usuario
       FROM devolucion_historial dh
       LEFT JOIN usuario usu ON usu.id_usuario = dh.id_usuario
       WHERE dh.id_devolucion = ? AND dh.id_tenant = ?
       ORDER BY dh.fecha ASC`,
      [id, id_tenant]
    );

    res.json({ success: true, data: { ...mapRow(rows[0]), historial } });
  } catch (error) {
    console.error("Error en getDevolucionDetalle:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET /devoluciones/por_venta/:id ──────────────────────────────────────
const getDevolucionesPorVenta = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      `${SELECT_DEVOLUCION} WHERE d.id_venta = ? AND d.id_tenant = ? GROUP BY d.id_devolucion ORDER BY d.fecha DESC`,
      [id, id_tenant]
    );
    res.json({ success: true, data: rows.map(mapRow) });
  } catch (error) {
    console.error("Error en getDevolucionesPorVenta:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// ── POST /devoluciones ───────────────────────────────────────────────────
// El servidor NO confía en `estado`/`total`/`importe` que mande el cliente:
// se recalculan acá con las mismas reglas que el frontend (reglas.js), igual
// que `agregar_venta` no confía en el total que manda el POS.
const crearDevolucion = async (req, res) => {
  const id_tenant = req.id_tenant;
  const id_usuario = req.user?.id_usuario ?? null;
  const { id_venta, canal, resolucion, items: itemsBody, observaciones, evidencias } = req.body;

  if (!id_venta || !Array.isArray(itemsBody) || itemsBody.length === 0) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios de la devolución" });
  }
  if (!RESOLUCIONES.has(resolucion)) {
    return res.status(400).json({ success: false, message: "Resolución inválida" });
  }
  const canalFinal = CANALES.has(canal) ? canal : "tienda";

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[venta]] = await connection.query(
      "SELECT id_venta, id_sucursal, f_venta, estado_venta FROM venta WHERE id_venta = ? AND id_tenant = ? FOR UPDATE",
      [id_venta, id_tenant]
    );
    if (!venta) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Venta no encontrada" });
    }
    if (Number(venta.estado_venta) === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "No se puede devolver una venta anulada" });
    }

    const [detallesVenta] = await connection.query(
      `SELECT dv.id_detalle, dv.id_producto, dv.id_sku, dv.id_tonalidad, dv.id_talla, dv.cantidad, dv.precio, dv.descuento, p.descripcion
       FROM detalle_venta dv INNER JOIN producto p ON p.id_producto = dv.id_producto
       WHERE dv.id_venta = ? AND dv.id_tenant = ?`,
      [id_venta, id_tenant]
    );
    const detallePorId = new Map(detallesVenta.map((d) => [d.id_detalle, d]));

    const [previasRows] = await connection.query(
      `SELECT d.estado, dd.id_detalle_venta AS id_detalle, dd.cantidad
       FROM devolucion d INNER JOIN devolucion_detalle dd ON dd.id_devolucion = d.id_devolucion
       WHERE d.id_venta = ? AND d.id_tenant = ?`,
      [id_venta, id_tenant]
    );
    const previasPorDetalle = new Map();
    for (const r of previasRows) {
      if (["rechazada", "cancelada", "borrador"].includes(r.estado)) continue;
      previasPorDetalle.set(r.id_detalle, (previasPorDetalle.get(r.id_detalle) ?? 0) + Number(r.cantidad));
    }

    // Precio real de cada producto de cambio: nunca el que mande el cliente
    // (mismo criterio que el precio de venta, que siempre sale del servidor).
    const idsProductoCambio = resolucion === "cambio_producto"
      ? [...new Set(itemsBody.map((r) => Number(r.producto_cambio?.id_producto)).filter(Boolean))]
      : [];
    const preciosCambio = new Map();
    if (idsProductoCambio.length > 0) {
      const [productos] = await connection.query(
        `SELECT id_producto, descripcion, precio FROM producto WHERE id_tenant = ? AND id_producto IN (${idsProductoCambio.map(() => "?").join(",")})`,
        [id_tenant, ...idsProductoCambio]
      );
      for (const p of productos) preciosCambio.set(p.id_producto, p);
    }

    // Dueño de cada SKU de cambio, para no aceptar una variante que pertenece a
    // otro producto: se cobraría el precio de uno y saldría del stock del otro.
    const idsSkuCambio = resolucion === "cambio_producto"
      ? [...new Set(itemsBody.map((r) => Number(r.producto_cambio?.id_sku)).filter(Boolean))]
      : [];
    const productoDelSkuCambio = new Map();
    if (idsSkuCambio.length > 0) {
      const [filas] = await connection.query(
        `SELECT id_sku, id_producto FROM producto_sku WHERE id_tenant = ? AND id_sku IN (${idsSkuCambio.map(() => "?").join(",")})`,
        [id_tenant, ...idsSkuCambio]
      );
      for (const f of filas) productoDelSkuCambio.set(Number(f.id_sku), Number(f.id_producto));
    }

    const items = [];
    for (const raw of itemsBody) {
      const detalle = detallePorId.get(Number(raw.id_detalle));
      if (!detalle) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `El detalle ${raw.id_detalle} no pertenece a esta venta` });
      }
      if (!MOTIVOS.has(raw.motivo) || !CONDICIONES.has(raw.condicion) || !DESTINOS.has(raw.destino)) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Motivo, condición o destino inválido" });
      }

      let productoCambio = null;
      if (resolucion === "cambio_producto" && raw.producto_cambio) {
        const productoReal = preciosCambio.get(Number(raw.producto_cambio.id_producto));
        if (!productoReal) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "El producto de cambio no existe" });
        }
        const cantidadCambio = Number(raw.producto_cambio.cantidad);
        if (!Number.isFinite(cantidadCambio) || cantidadCambio <= 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Cantidad de cambio inválida" });
        }
        // La variante es lo que hace expresable el caso real de una tienda de
        // ropa: cambiar una M por una L es el MISMO producto. Sin `id_sku` no
        // hay forma de saber qué prenda sale del almacén.
        const idSkuCambio = Number(raw.producto_cambio.id_sku) || null;
        if (idSkuCambio) {
          const duenio = productoDelSkuCambio.get(idSkuCambio);
          if (duenio === undefined) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: `La variante ${idSkuCambio} no existe` });
          }
          if (duenio !== Number(productoReal.id_producto)) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `La variante ${idSkuCambio} no pertenece al producto ${productoReal.id_producto}`,
            });
          }
        }

        productoCambio = {
          id_producto: productoReal.id_producto,
          id_sku: idSkuCambio,
          descripcion: productoReal.descripcion,
          precio_unitario: Number(productoReal.precio),
          cantidad: cantidadCambio,
        };
      }

      const cantidad = Number(raw.cantidad);
      const cantidad_devuelta_previa = previasPorDetalle.get(detalle.id_detalle) ?? 0;
      const cantidadVendida = Number(detalle.cantidad);
      const descuentoProrateado = cantidadVendida > 0
        ? Math.round((Number(detalle.descuento) * cantidad / cantidadVendida) * 100) / 100
        : 0;

      const item = {
        id_detalle: detalle.id_detalle,
        id_producto: detalle.id_producto,
        id_sku: detalle.id_sku,
        id_tonalidad: detalle.id_tonalidad,
        id_talla: detalle.id_talla,
        descripcion: detalle.descripcion,
        cantidad_vendida: cantidadVendida,
        cantidad_devuelta_previa,
        cantidad,
        precio_unitario: Number(detalle.precio),
        descuento: descuentoProrateado,
        importe: importeItem(cantidad, Number(detalle.precio), descuentoProrateado),
        motivo: raw.motivo,
        motivo_detalle: raw.motivo_detalle || null,
        condicion: raw.condicion,
        destino: raw.destino,
        producto_cambio: productoCambio,
      };
      items.push(item);
    }

    const evaluacion = evaluarDevolucion({
      fecha_venta: venta.f_venta, items, politica: POLITICA_DEFAULT, canal: canalFinal,
    });
    if (!evaluacion.permitida) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: evaluacion.errores.join(" ") });
    }

    const estado = estadoInicial(evaluacion);
    const total = totalDevolucion(items);
    const diferencia_cambio = resolucion === "cambio_producto" ? diferenciaCambio(items) : null;

    const [[ultima]] = await connection.query(
      "SELECT codigo FROM devolucion WHERE id_tenant = ? ORDER BY id_devolucion DESC LIMIT 1",
      [id_tenant]
    );
    const siguienteNumero = ultima ? parseInt(ultima.codigo.split("-")[1], 10) + 1 : 1;
    const codigo = `DEV-${String(siguienteNumero).padStart(6, "0")}`;

    const [devolucionResult] = await connection.query(
      `INSERT INTO devolucion
       (id_tenant, codigo, id_venta, id_sucursal, canal, estado, resolucion, total, diferencia_cambio, observaciones, evidencias, id_usuario_crea)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_tenant, codigo, id_venta, venta.id_sucursal, canalFinal, estado, resolucion, total, diferencia_cambio,
        observaciones || null, JSON.stringify(Array.isArray(evidencias) ? evidencias : []), id_usuario,
      ]
    );
    const id_devolucion = devolucionResult.insertId;

    const detalleValues = [];
    const detalleParams = [];
    for (const it of items) {
      detalleValues.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      detalleParams.push(
        id_devolucion, it.id_detalle, it.id_producto, it.id_sku, it.id_tonalidad, it.id_talla,
        it.cantidad, it.precio_unitario, it.descuento, it.importe, it.motivo, it.motivo_detalle,
        it.condicion, it.destino, it.producto_cambio ? JSON.stringify(it.producto_cambio) : null, id_tenant
      );
    }
    await connection.query(
      `INSERT INTO devolucion_detalle
       (id_devolucion, id_detalle_venta, id_producto, id_sku, id_tonalidad, id_talla, cantidad, precio_unitario, descuento, importe, motivo, motivo_detalle, condicion, destino, producto_cambio, id_tenant)
       VALUES ${detalleValues.join(", ")}`,
      detalleParams
    );

    await connection.query(
      "INSERT INTO devolucion_historial (id_devolucion, id_tenant, estado_anterior, estado_nuevo, nota, id_usuario) VALUES (?, ?, NULL, ?, ?, ?)",
      [id_devolucion, id_tenant, estado, "Devolución registrada", id_usuario]
    );

    await connection.commit();
    res.json({ success: true, id_devolucion, codigo, message: "Devolución registrada" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en crearDevolucion:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// Reintegra stock de las líneas con destino=stock_disponible y marca la
// devolución como completada. Comparte código entre la transición manual
// ("completar") y `procesarReembolso` para que el reingreso de stock ocurra
// en un solo lugar (root-cause: dos copias del mismo movimiento es como
// terminó vaciándose el catálogo del POS una vez, ver stockRepository.js).
async function completarDevolucion(connection, { id_tenant, id_devolucion, id_usuario, notaExtra }) {
  const [[devolucion]] = await connection.query(
    "SELECT id_devolucion, id_venta, id_sucursal, estado FROM devolucion WHERE id_devolucion = ? AND id_tenant = ? FOR UPDATE",
    [id_devolucion, id_tenant]
  );
  if (!devolucion) return { ok: false, status: 404, message: "Devolución no encontrada" };
  if (devolucion.estado === "completada") return { ok: true, yaCompletada: true };
  if (!puedeTransicionar(devolucion.estado, "completada")) {
    return { ok: false, status: 400, message: `No se puede completar una devolución en estado "${devolucion.estado}"` };
  }

  const [detalles] = await connection.query(
    "SELECT id_producto, id_sku, id_tonalidad, id_talla, cantidad, destino, producto_cambio FROM devolucion_detalle WHERE id_devolucion = ? AND id_tenant = ?",
    [id_devolucion, id_tenant]
  );

  const [[almacenRow]] = await connection.query(
    "SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal = ?",
    [devolucion.id_sucursal]
  );
  const id_almacen = almacenRow?.id_almacen ?? null;

  for (const d of detalles) {
    if (d.destino !== "stock_disponible") continue;
    if (!d.id_sku || !id_almacen) continue; // sin SKU o sin almacén resuelto: no hay a dónde reintegrar
    const cantidad = Math.round(Number(d.cantidad));
    if (cantidad <= 0) continue;

    const movimiento = await sumarStockSku(connection, { id_tenant, id_sku: d.id_sku, id_almacen, cantidad });
    await connection.query(
      `INSERT INTO bitacora_nota (id_producto, id_sku, id_almacen, entra, stock_anterior, stock_actual, fecha, id_venta, id_tenant, id_tonalidad, id_talla)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [d.id_producto, d.id_sku, id_almacen, cantidad, movimiento.stockAnterior, movimiento.stockActual, devolucion.id_venta, id_tenant, d.id_tonalidad, d.id_talla]
    );
  }

  // La prenda que el cliente SE LLEVA en un cambio también tiene que salir del
  // almacén. Antes solo se reintegraba la devuelta: la tienda entregaba una
  // prenda y el sistema seguía contándola, así que el inventario se inflaba en
  // silencio con cada cambio — el peor error posible, porque hace creer que hay
  // mercadería que ya no está.
  if (id_almacen) {
    for (const d of detalles) {
      const cambio = typeof d.producto_cambio === "string" ? JSON.parse(d.producto_cambio) : d.producto_cambio;
      const idSkuCambio = Number(cambio?.id_sku) || null;
      const cantidadCambio = Math.round(Number(cambio?.cantidad));
      // Sin `id_sku` no se sabe qué variante sale: se omite en vez de descontar
      // de una talla al azar. Son las devoluciones creadas antes de este cambio.
      if (!idSkuCambio || !Number.isFinite(cantidadCambio) || cantidadCambio <= 0) continue;

      let salida;
      try {
        salida = await restarStockSku(connection, {
          id_tenant, id_sku: idSkuCambio, id_almacen, cantidad: cantidadCambio,
        });
      } catch (error) {
        // Sin stock de la talla que el cliente quiere: la devolución NO se
        // completa. Es preferible que el cajero lo vea y elija otra variante a
        // dejar el inventario en negativo o entregar sin registrar la salida.
        if (esErrorDeStock(error)) {
          return { ok: false, status: 409, message: `No hay stock de la variante de cambio: ${error.message}` };
        }
        throw error;
      }

      await connection.query(
        `INSERT INTO bitacora_nota (id_producto, id_sku, id_almacen, sale, stock_anterior, stock_actual, fecha, id_venta, id_tenant)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [cambio.id_producto, idSkuCambio, id_almacen, cantidadCambio, salida.stockAnterior, salida.stockActual, devolucion.id_venta, id_tenant]
      );
    }
  }

  await connection.query("UPDATE devolucion SET estado = 'completada' WHERE id_devolucion = ? AND id_tenant = ?", [id_devolucion, id_tenant]);
  await connection.query(
    "INSERT INTO devolucion_historial (id_devolucion, id_tenant, estado_anterior, estado_nuevo, nota, id_usuario) VALUES (?, ?, ?, 'completada', ?, ?)",
    [id_devolucion, id_tenant, devolucion.estado, notaExtra || "Productos recibidos, devolución completada", id_usuario]
  );

  return { ok: true, yaCompletada: false };
}

// ── PATCH /devoluciones/:id/estado ───────────────────────────────────────
const cambiarEstadoDevolucion = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;
  const id_usuario = req.user?.id_usuario ?? null;
  const { estado: nuevoEstado, nota } = req.body;

  if (!nuevoEstado || !TRANSICIONES[nuevoEstado]) {
    return res.status(400).json({ success: false, message: "Estado destino inválido" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    if (nuevoEstado === "completada") {
      const resultado = await completarDevolucion(connection, { id_tenant, id_devolucion: id, id_usuario, notaExtra: nota });
      if (!resultado.ok) {
        await connection.rollback();
        return res.status(resultado.status).json({ success: false, message: resultado.message });
      }
      await connection.commit();
      return res.json({ success: true, message: resultado.yaCompletada ? "Ya estaba completada" : "Devolución completada" });
    }

    const [[devolucion]] = await connection.query(
      "SELECT estado, id_usuario_aprueba FROM devolucion WHERE id_devolucion = ? AND id_tenant = ? FOR UPDATE",
      [id, id_tenant]
    );
    if (!devolucion) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Devolución no encontrada" });
    }
    if (!puedeTransicionar(devolucion.estado, nuevoEstado)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `No se puede pasar de "${devolucion.estado}" a "${nuevoEstado}"` });
    }

    const aprobadorParams = nuevoEstado === "aprobada" ? [id_usuario] : [devolucion.id_usuario_aprueba];
    await connection.query(
      "UPDATE devolucion SET estado = ?, id_usuario_aprueba = ? WHERE id_devolucion = ? AND id_tenant = ?",
      [nuevoEstado, ...aprobadorParams, id, id_tenant]
    );
    await connection.query(
      "INSERT INTO devolucion_historial (id_devolucion, id_tenant, estado_anterior, estado_nuevo, nota, id_usuario) VALUES (?, ?, ?, ?, ?, ?)",
      [id, id_tenant, devolucion.estado, nuevoEstado, nota || null, id_usuario]
    );

    await connection.commit();
    res.json({ success: true, message: "Estado actualizado" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en cambiarEstadoDevolucion:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// ── POST /devoluciones/:id/reembolso ─────────────────────────────────────
// Registro interno (efectivo / nota de crédito interna / ajuste de cuenta por
// cobrar si la venta fue a crédito) — NO emite ningún documento SUNAT.
// Idempotente: reintentar sobre una devolución ya completada no repite el
// reintegro de stock ni el ajuste de cuenta.
const procesarReembolso = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;
  const id_usuario = req.user?.id_usuario ?? null;
  const { metodo } = req.body;

  if (!metodo) {
    return res.status(400).json({ success: false, message: "Falta el método de reembolso" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[devolucion]] = await connection.query(
      "SELECT id_devolucion, id_venta, total, resolucion, estado, metodo_reembolso FROM devolucion WHERE id_devolucion = ? AND id_tenant = ? FOR UPDATE",
      [id, id_tenant]
    );
    if (!devolucion) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Devolución no encontrada" });
    }

    if (devolucion.estado === "completada") {
      await connection.commit();
      return res.json({ success: true, message: "El reembolso ya había sido procesado" });
    }

    const resultado = await completarDevolucion(connection, {
      id_tenant, id_devolucion: id, id_usuario, notaExtra: `Reembolso procesado (${metodo})`,
    });
    if (!resultado.ok) {
      await connection.rollback();
      return res.status(resultado.status).json({ success: false, message: resultado.message });
    }

    await connection.query("UPDATE devolucion SET metodo_reembolso = ? WHERE id_devolucion = ? AND id_tenant = ?", [metodo, id, id_tenant]);

    // Ajuste de cuenta por cobrar: solo si el negocio lo pidió explícitamente
    // (la venta original fue a crédito y el reembolso reduce lo que debe).
    if (metodo === "ajuste_cuenta_por_cobrar" && devolucion.resolucion !== "cambio_producto") {
      const [[cxc]] = await connection.query(
        "SELECT id_cuenta_por_cobrar, saldo FROM cuenta_por_cobrar WHERE id_venta = ? AND id_tenant = ? FOR UPDATE",
        [devolucion.id_venta, id_tenant]
      );
      if (cxc) {
        const nuevoSaldo = Math.max(0, Math.round((Number(cxc.saldo) - Number(devolucion.total)) * 100) / 100);
        const nuevoEstadoCxc = nuevoSaldo <= 0 ? "pagada" : "pagada_parcial";
        await connection.query(
          "UPDATE cuenta_por_cobrar SET saldo = ?, estado = ? WHERE id_cuenta_por_cobrar = ? AND id_tenant = ?",
          [nuevoSaldo, nuevoEstadoCxc, cxc.id_cuenta_por_cobrar, id_tenant]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Reembolso procesado" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en procesarReembolso:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getDevoluciones,
  getDevolucionDetalle,
  getDevolucionesPorVenta,
  crearDevolucion,
  cambiarEstadoDevolucion,
  procesarReembolso,
};
