import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { resolveTiendaBySlug } from "../middlewares/storefrontAuth.middleware.js";
import { parseConfig, parseJsonSafe, buildDisponibilidad, productHasSeleccionAttrs } from "../services/ecommerce/DisponibilidadService.js";
import { ensureDefaultVariante } from "../services/ecommerce/InventoryService.js";
import { resolveSucursalFilter, assertSucursal } from "../services/ecommerce/RbacService.js";
import {
  crearSolicitud,
  getSolicitudById,
  listSolicitudesAdmin,
  listSolicitudesBuyer,
  statsSolicitudes,
  marcarEnRevision,
  confirmarSolicitud,
  marcarEnTraslado,
  aprobarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,
  assertAutorizacionVigente,
  getStockSnapshot,
} from "../services/ecommerce/SolicitudDisponibilidadService.js";
import { resolveDisponibilidadFulfillment } from "../services/ecommerce/FulfillmentDisponibilidadService.js";
import {
  listNotificacionesCliente,
  countUnreadNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "../services/ecommerce/NotificacionClienteService.js";

function fail(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[solicitud-disp]", error);
  return res.status(status).json({ success: false, message: error.message || "Error." });
}

function mapSolicitud(row) {
  if (!row) return null;
  return {
    ...row,
    attrs_json: parseJsonSafe(row.attrs_json),
    alternativa_json: parseJsonSafe(row.alternativa_json),
    entrega_json: parseJsonSafe(row.entrega_json),
    estado_ui: row.estado === "aprobada" ? "disponible" : row.estado,
  };
}

async function loadProducto(connection, id_tienda, id_producto) {
  const [[p]] = await connection.query(
    `SELECT id_producto, id_tienda, nombre, precio, sku, attrs_json, activo
     FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  return p || null;
}

/** POST /store/:slug/solicitudes */
export const storeCrearSolicitud = async (req, res) => {
  let connection;
  try {
    const tienda = await resolveTiendaBySlug(req.params.slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    connection = await getEcommerceConnection();
    const id_tienda = tienda.id_tienda;
    const body = req.body || {};
    const id_producto = Number(body.id_producto);
    const id_sucursal = Number(body.id_sucursal);
    const cantidad = Math.max(1, Number(body.cantidad) || 1);
    if (!id_producto || !id_sucursal) {
      return res.status(400).json({ success: false, message: "Producto y sucursal son obligatorios." });
    }

    const producto = await loadProducto(connection, id_tienda, id_producto);
    if (!producto || !Number(producto.activo)) {
      return res.status(404).json({ success: false, message: "Producto no disponible." });
    }

    let id_variante = body.id_variante ? Number(body.id_variante) : null;
    if (!id_variante) {
      const def = await ensureDefaultVariante(connection, id_tienda, id_producto);
      id_variante = def?.id_variante || null;
    }

    const buyer = req.storefrontUser;
    let id_sucursal_origen = body.id_sucursal_origen ? Number(body.id_sucursal_origen) : null;
    const fulfillment = body.fulfillment || "pickup";

    if (!id_sucursal_origen && id_variante) {
      try {
        const hasSeleccion = await productHasSeleccionAttrs(connection, id_tienda, id_producto);
        const resolved = await resolveDisponibilidadFulfillment(connection, {
          id_tienda,
          id_producto,
          id_variante,
          cantidad,
          fulfillment,
          id_sucursal,
          id_zona: body.id_zona ? Number(body.id_zona) : null,
          distrito: body.distrito || null,
          lat: body.lat != null ? Number(body.lat) : null,
          lng: body.lng != null ? Number(body.lng) : null,
          subtotal: Number(producto.precio || 0) * cantidad,
          theme_json: tienda.theme_json,
          attrs_json: producto.attrs_json,
          hasSeleccionAttrs: hasSeleccion,
        });
        if (resolved.cta === "comprar") {
          return res.status(400).json({
            success: false,
            message: "Hay stock disponible. Puedes comprar ahora sin solicitud.",
          });
        }
        if (resolved.modo === "otra_ubicacion" && resolved.id_sucursal_origen) {
          id_sucursal_origen = resolved.id_sucursal_origen;
        }
        if (resolved.cta === "no_disponible" || resolved.modo === "agotado") {
          return res.status(400).json({
            success: false,
            message: "Producto no disponible actualmente.",
          });
        }
      } catch {
        /* si falla el resolver, permite crear igual */
      }
    }

    const result = await crearSolicitud(connection, {
      id_tienda,
      id_usuario: buyer.id_cliente,
      nombre_cliente: buyer.nombre,
      telefono_cliente: buyer.telefono,
      email_cliente: buyer.email,
      id_producto,
      id_variante,
      sku: producto.sku || null,
      attrs_json: body.attrs || body.attrs_json || null,
      cantidad_solicitada: cantidad,
      id_sucursal,
      id_sucursal_origen,
      fulfillment,
      direccion_entrega: body.direccion_entrega || null,
      id_zona: body.id_zona ? Number(body.id_zona) : null,
      entrega_json: body.entrega_json || null,
      precio_unitario_snapshot: producto.precio,
      theme_json: tienda.theme_json,
    });

    return res.status(result.duplicated ? 200 : 201).json({
      success: true,
      data: mapSolicitud(result.solicitud),
      duplicated: result.duplicated,
      message: result.duplicated
        ? "Ya tienes una solicitud pendiente para este producto."
        : "Solicitud enviada. Te avisaremos cuando confirmemos disponibilidad.",
    });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /store/:slug/mis-solicitudes */
export const storeListMisSolicitudes = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const rows = await listSolicitudesBuyer(connection, req.id_tienda, req.id_cliente);
    return res.json({ success: true, data: rows.map(mapSolicitud) });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /store/:slug/mis-solicitudes/:id */
export const storeGetMisSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row || Number(row.id_usuario) !== Number(req.id_cliente)) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    return res.json({ success: true, data: mapSolicitud(row) });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /store/:slug/mis-solicitudes/:id/cancelar */
export const storeCancelarSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row || Number(row.id_usuario) !== Number(req.id_cliente)) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    const updated = await cancelarSolicitud(connection, {
      id_tienda: req.id_tienda,
      id_solicitud: row.id_solicitud,
      actor_tipo: "cliente",
      actor_id: req.id_cliente,
      motivo: req.body?.motivo || "Cancelada por el cliente",
    });
    await connection.commit();
    return res.json({ success: true, data: mapSolicitud(updated) });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /store/:slug/mis-solicitudes/:id/comprar — payload para carrito contextual */
export const storeComprarDesdeSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const id_solicitud = Number(req.params.id);
    const s = await getSolicitudById(connection, req.id_tienda, id_solicitud);
    if (!s || Number(s.id_usuario) !== Number(req.id_cliente)) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    const qty = Number(s.cantidad_aprobada || s.cantidad_solicitada) || 1;
    const row = await assertAutorizacionVigente(connection, {
      id_tienda: req.id_tienda,
      id_solicitud,
      id_usuario: req.id_cliente,
      id_producto: s.id_producto,
      id_sucursal: s.id_sucursal,
      cantidad: qty,
      attrs_json: parseJsonSafe(s.attrs_json),
    });

    const producto = await loadProducto(connection, req.id_tienda, row.id_producto);
    const precio =
      row.congelar_precio && row.precio_unitario_snapshot != null
        ? Number(row.precio_unitario_snapshot)
        : Number(producto?.precio) || 0;

    return res.json({
      success: true,
      data: {
        id_solicitud: row.id_solicitud,
        codigo: row.codigo,
        id_producto: row.id_producto,
        id_variante: row.id_variante,
        id_sucursal: row.id_sucursal,
        cantidad: qty,
        attrs: parseJsonSafe(row.attrs_json),
        precio,
        producto_nombre: row.producto_nombre || producto?.nombre,
        expires_at: row.expires_at,
      },
    });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /store/:slug/mis-notificaciones */
export const storeListMisNotificaciones = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await listNotificacionesCliente(connection, req.id_tienda, req.id_cliente, {
      limit: Number(req.query.limit) || 40,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /store/:slug/mis-notificaciones/unread-count */
export const storeUnreadNotificaciones = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const count = await countUnreadNotificaciones(connection, req.id_tienda, req.id_cliente);
    return res.json({ success: true, data: { count } });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /store/:slug/mis-notificaciones/:id/leer */
export const storeLeerNotificacion = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const ok = await marcarNotificacionLeida(
      connection,
      req.id_tienda,
      req.id_cliente,
      Number(req.params.id)
    );
    if (!ok) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada." });
    }
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /store/:slug/mis-notificaciones/leer-todas */
export const storeLeerTodasNotificaciones = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const n = await marcarTodasLeidas(connection, req.id_tienda, req.id_cliente);
    return res.json({ success: true, data: { updated: n } });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /admin/solicitudes */
export const adminListSolicitudes = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const scope = resolveSucursalFilter(req.ecomAccess, req.query.id_sucursal, "s");
    if (scope.forbidden) {
      return res.status(403).json({ success: false, message: "Sin acceso a esa sucursal." });
    }
    const rows = await listSolicitudesAdmin(connection, req.id_tienda, {
      estado: req.query.estado || null,
      id_sucursal: scope.id,
      sucursal_ids:
        !scope.id && req.ecomAccess && !req.ecomAccess.acceso_global
          ? req.ecomAccess.sucursal_ids
          : undefined,
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    return res.json({ success: true, data: rows.map(mapSolicitud) });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /admin/solicitudes/stats */
export const adminStatsSolicitudes = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const scope = resolveSucursalFilter(req.ecomAccess, req.query.id_sucursal, "s");
    if (scope.forbidden) {
      return res.status(403).json({ success: false, message: "Sin acceso a esa sucursal." });
    }
    const data = await statsSolicitudes(connection, req.id_tienda, {
      id_sucursal: scope.id,
      sucursal_ids:
        !scope.id && req.ecomAccess && !req.ecomAccess.acceso_global
          ? req.ecomAccess.sucursal_ids
          : undefined,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** GET /admin/solicitudes/:id */
export const adminGetSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const stock = await getStockSnapshot(connection, {
      id_tienda: req.id_tienda,
      id_variante: row.id_variante,
      id_sucursal: row.id_sucursal,
    });
    const [[tienda]] = await connection.query(
      `SELECT theme_json FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
    );
    return res.json({
      success: true,
      data: {
        ...mapSolicitud(row),
        inventario: stock,
        disponibilidad_config: parseConfig(tienda?.theme_json),
      },
    });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /admin/solicitudes/:id/en-revision */
export const adminEnRevisionSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const updated = await marcarEnRevision(
      connection,
      req.id_tienda,
      row.id_solicitud,
      req.ecommerceUser?.id_usuario
    );
    return res.json({ success: true, data: mapSolicitud(updated) });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /admin/solicitudes/:id/confirmar */
export const adminConfirmarSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const updated = await confirmarSolicitud(connection, {
      id_tienda: req.id_tienda,
      id_solicitud: row.id_solicitud,
      id_usuario_staff: req.ecommerceUser?.id_usuario,
      id_sucursal_origen: req.body?.id_sucursal_origen
        ? Number(req.body.id_sucursal_origen)
        : null,
      observacion_stock: req.body?.observacion_stock || null,
    });
    await connection.commit();
    return res.json({
      success: true,
      data: mapSolicitud(updated),
      message: "Solicitud confirmada.",
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /admin/solicitudes/:id/en-traslado */
export const adminEnTrasladoSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const updated = await marcarEnTraslado(connection, {
      id_tienda: req.id_tienda,
      id_solicitud: row.id_solicitud,
      id_usuario_staff: req.ecommerceUser?.id_usuario,
      id_sucursal_origen: req.body?.id_sucursal_origen
        ? Number(req.body.id_sucursal_origen)
        : null,
    });
    await connection.commit();
    return res.json({
      success: true,
      data: mapSolicitud(updated),
      message: "Marcada en traslado.",
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /admin/solicitudes/:id/aprobar */
export const adminAprobarSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const [[tienda]] = await connection.query(
      `SELECT theme_json FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
    );
    const updated = await aprobarSolicitud(connection, {
      id_tienda: req.id_tienda,
      id_solicitud: row.id_solicitud,
      id_usuario_staff: req.ecommerceUser?.id_usuario,
      cantidad_aprobada: req.body?.cantidad_aprobada,
      stock_sistema: req.body?.stock_sistema,
      stock_fisico: req.body?.stock_fisico,
      observacion_stock: req.body?.observacion_stock,
      crear_reserva: req.body?.crear_reserva,
      congelar_precio: req.body?.congelar_precio,
      id_sucursal_origen: req.body?.id_sucursal_origen
        ? Number(req.body.id_sucursal_origen)
        : null,
      theme_json: tienda?.theme_json,
    });
    await connection.commit();
    return res.json({
      success: true,
      data: mapSolicitud(updated),
      message: "Producto disponible. El cliente puede comprar hasta la hora de expiración.",
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /admin/solicitudes/:id/rechazar */
export const adminRechazarSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const updated = await rechazarSolicitud(connection, {
      id_tienda: req.id_tienda,
      id_solicitud: row.id_solicitud,
      id_usuario_staff: req.ecommerceUser?.id_usuario,
      motivo_rechazo: req.body?.motivo_rechazo,
      comentario_cliente: req.body?.comentario_cliente,
      stock_sistema: req.body?.stock_sistema,
      stock_fisico: req.body?.stock_fisico,
      observacion_stock: req.body?.observacion_stock,
    });
    await connection.commit();
    return res.json({ success: true, data: mapSolicitud(updated) });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /admin/solicitudes/:id/cancelar */
export const adminCancelarSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const row = await getSolicitudById(connection, req.id_tienda, Number(req.params.id));
    if (!row) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    assertSucursal(req.ecomAccess, row.id_sucursal);
    const updated = await cancelarSolicitud(connection, {
      id_tienda: req.id_tienda,
      id_solicitud: row.id_solicitud,
      actor_tipo: "staff",
      actor_id: req.ecommerceUser?.id_usuario,
      motivo: req.body?.motivo || "Cancelada por staff",
    });
    await connection.commit();
    return res.json({ success: true, data: mapSolicitud(updated) });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

/** Helper exportable para checkout: exige solicitud si el producto lo requiere */
export async function gateCheckoutSolicitud(connection, {
  id_tienda,
  id_cliente,
  producto,
  id_sucursal,
  cantidad,
  attrs,
  id_solicitud,
  theme_json,
  sucursalRequiereConfirmacion,
  stock,
}) {
  const disp = buildDisponibilidad(stock, producto.attrs_json, parseConfig(theme_json), {
    sucursalRequiereConfirmacion,
    tieneAutorizacionVigente: false,
  });
  if (!disp.cta?.requiresSolicitud && !disp.cta?.showEnviarSolicitud) {
    return null;
  }
  if (!id_solicitud) {
    throw Object.assign(
      new Error("Este producto requiere confirmación de disponibilidad antes de comprar."),
      { status: 400 }
    );
  }
  return assertAutorizacionVigente(connection, {
    id_tienda,
    id_solicitud: Number(id_solicitud),
    id_usuario: id_cliente,
    id_producto: producto.id_producto,
    id_sucursal,
    cantidad,
    attrs_json: attrs,
  });
}
