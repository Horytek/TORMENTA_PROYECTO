import { getConnection } from "../database/database.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import { encryptMpToken } from "../utils/ecommerceCrypto.js";
import { signCatalogoBuyerToken } from "../middlewares/catalogoBuyerAuth.middleware.js";
import {
  getOrCreateConfig,
  listSucursalesPublicas,
  listSucursalesAdmin,
  parseThemeJson,
  resolveTenantById,
  resolveTenantBySlug,
  toPublicStorefront,
  upsertConfig,
  upsertSucursalOverlay,
} from "../services/catalogo/TiendaConfigService.js";
import {
  getProductoDetalle,
  listarCatalogo,
  productosMasVendidos,
  productosRelacionados,
} from "../services/catalogo/CatalogoService.js";
import { crearPedido, getPedidoByCodigo, listarPedidosAdmin, listarPedidosComprador } from "../services/catalogo/PedidoService.js";
import {
  cancelarPedidoExpirado,
  confirmarPedidoPagado,
  crearPreferenceMp,
  procesarWebhookMp,
} from "../services/catalogo/CheckoutService.js";
import { aplicarCupon, listarCupones, upsertCupon } from "../services/catalogo/CuponService.js";
import {
  cotizarEntrega,
  deleteAgencia,
  deleteDestino,
  deleteZona,
  getEntregaConfig,
  listAgencias,
  listDestinos,
  listOpcionesEntrega,
  listZonas,
  saveEntregaConfig,
  upsertAgencia,
  upsertDestino,
  upsertZona,
} from "../services/catalogo/TiendaEntregaService.js";
import { uploadImage as subirAImageKit } from "../services/imagekit.service.js";

async function resolveStore(cx, { slug, id_tenant }) {
  if (slug) return resolveTenantBySlug(cx, slug);
  if (id_tenant) {
    const cfg = await resolveTenantById(cx, id_tenant);
    // Legacy: permitir catálogo aunque tienda_config no esté activa
    if (cfg && cfg.activo == null) {
      return { ...cfg, activo: 1, slug: String(id_tenant) };
    }
    if (cfg && Number(cfg.activo) === 0 && !cfg.slug) {
      return { ...cfg, activo: 1, slug: String(id_tenant) };
    }
    // Si no hay fila tienda_config, aún servir legacy
    if (cfg && !cfg.slug) {
      return { ...cfg, activo: 1, slug: String(cfg.id_tenant) };
    }
    return cfg;
  }
  return null;
}

/** GET /api/catalogo/store/:slug  |  GET /api/catalogo/:id_tenant (legacy) */
export const getStorefront = async (req, res) => {
  let connection;
  try {
    const slug = req.params.slug;
    const id_tenant = req.params.id_tenant;
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug, id_tenant });
    if (!cfg) {
      return res.status(404).json({ success: false, message: "Catálogo no encontrado" });
    }
    // Legacy path: permitir siempre; slug path requiere activo
    if (slug && Number(cfg.activo) !== 1) {
      return res.status(404).json({ success: false, message: "Tienda inactiva" });
    }

    const store = toPublicStorefront(cfg);
    const sucursales = await listSucursalesPublicas(connection, cfg.id_tenant);

    let entrega = { retiro_activo: 1, delivery_activo: 0, costo_default: 0 };
    let banners = [];
    try {
      const [[ent]] = await connection.query(
        `SELECT * FROM tienda_entrega_config WHERE id_tenant = ? LIMIT 1`,
        [cfg.id_tenant]
      );
      if (ent) entrega = ent;
      const [b] = await connection.query(
        `SELECT id_banner, titulo, subtitulo, imagen_url, link_url
         FROM tienda_banner WHERE id_tenant = ? AND activo = 1 ORDER BY orden LIMIT 10`,
        [cfg.id_tenant]
      );
      banners = b;
    } catch {
      // tablas tienda_* aún no migradas
    }

    let masVendidos = [];
    let destacados = { items: [] };
    try {
      masVendidos = await productosMasVendidos(connection, {
        id_tenant: cfg.id_tenant,
        umbral: store.stock_bajo_umbral,
      });
      destacados = await listarCatalogo(connection, {
        id_tenant: cfg.id_tenant,
        destacados: true,
        limit: 12,
        umbral: store.stock_bajo_umbral,
      });
    } catch (e) {
      console.warn("storefront extras:", e.message);
    }

    // Compat legacy: también productos planos (primera página)
    let catalogo;
    try {
      catalogo = await listarCatalogo(connection, {
        id_tenant: cfg.id_tenant,
        page: 1,
        limit: 100,
        umbral: store.stock_bajo_umbral,
        solo_stock: true,
      });
    } catch (err) {
      console.error("listarCatalogo falló, usando fallback legacy:", err.message);
      const { stockPorProducto } = await import("../services/inventario/stockRepository.js");
      const { listarPorProductos } = await import("../services/producto/productoImagenRepository.js");
      const [productos] = await connection.query(
        `SELECT PR.id_producto AS codigo, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
                PR.imagen_url, PR.undm, MA.nom_marca, CA.nom_subcat AS categoria
         FROM producto PR
         INNER JOIN marca MA ON MA.id_marca = PR.id_marca
         INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
         WHERE PR.estado_producto = 1 AND PR.id_tenant = ?
         ORDER BY PR.descripcion`,
        [cfg.id_tenant]
      );
      const stockMap = await stockPorProducto(connection, {
        id_tenant: cfg.id_tenant,
        ids_producto: productos.map((p) => p.codigo),
      });
      const imagesMap = await listarPorProductos(connection, {
        id_tenant: cfg.id_tenant,
        ids_producto: productos.map((p) => p.codigo),
      });
      const items = productos
        .map((p) => ({
          ...p,
          precio: Number(p.precio),
          stock: stockMap.get(p.codigo) ?? 0,
          images: imagesMap.get(p.codigo) ?? [],
          disponibilidad: {
            estado: (stockMap.get(p.codigo) ?? 0) > 0 ? "disponible" : "agotado",
            label: (stockMap.get(p.codigo) ?? 0) > 0 ? "Disponible" : "Agotado",
            stock: stockMap.get(p.codigo) ?? 0,
          },
        }))
        .filter((p) => p.stock > 0);
      catalogo = {
        items,
        pagination: { page: 1, limit: 100, total: items.length, pages: 1 },
        facets: { categorias: [], marcas: [], atributos: [] },
      };
    }

    return res.json({
      success: true,
      code: 1,
      data: {
        negocio: {
          nombre: store.nombre,
          telefono: store.telefono,
          logo: store.logo,
          direccion: store.direccion,
        },
        store,
        sucursales,
        entrega: entrega || { retiro_activo: 1, delivery_activo: 0, costo_default: 0 },
        banners,
        destacados: destacados.items || [],
        mas_vendidos: masVendidos,
        productos: catalogo.items,
        facets: catalogo.facets,
      },
    });
  } catch (error) {
    console.error("getStorefront:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const getCatalogoProductos = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, {
      slug: req.params.slug,
      id_tenant: req.params.id_tenant || req.query.id_tenant,
    });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const attrFilters = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k.startsWith("attr_")) attrFilters[k.slice(5)] = v;
    }

    const data = await listarCatalogo(connection, {
      id_tenant: cfg.id_tenant,
      q: req.query.q,
      categoria: req.query.cat || req.query.categoria,
      marca: req.query.marca,
      min: req.query.min,
      max: req.query.max,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit,
      id_sucursal: req.query.id_sucursal ? Number(req.query.id_sucursal) : null,
      solo_stock: req.query.stock === "1" || req.query.solo_stock === "1",
      destacados: req.query.destacados === "1",
      attrFilters,
      umbral: Number(cfg.stock_bajo_umbral ?? 5),
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("getCatalogoProductos:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const getProducto = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, {
      slug: req.params.slug,
      id_tenant: req.params.id_tenant,
    });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    let id_producto = Number(req.params.id);
    if (!Number.isInteger(id_producto) || id_producto <= 0) {
      // slug-123
      const m = String(req.params.id).match(/(\d+)$/);
      id_producto = m ? Number(m[1]) : NaN;
    }
    if (!id_producto) {
      return res.status(400).json({ success: false, message: "Producto inválido" });
    }

    const producto = await getProductoDetalle(connection, {
      id_tenant: cfg.id_tenant,
      id_producto,
      id_sucursal: req.query.id_sucursal ? Number(req.query.id_sucursal) : null,
      umbral: Number(cfg.stock_bajo_umbral ?? 5),
    });
    if (!producto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    const relacionados = await productosRelacionados(connection, {
      id_tenant: cfg.id_tenant,
      id_producto: producto.codigo,
      id_subcategoria: producto.id_subcategoria,
      id_marca: producto.id_marca,
      umbral: Number(cfg.stock_bajo_umbral ?? 5),
    });

    const [resenas] = await connection.query(
      `SELECT r.rating, r.titulo, r.cuerpo, r.created_at, c.nombres
       FROM tienda_resena r
       INNER JOIN tienda_comprador c ON c.id_comprador = r.id_comprador
       WHERE r.id_tenant = ? AND r.id_producto = ? AND r.estado = 'aprobada'
       ORDER BY r.created_at DESC LIMIT 20`,
      [cfg.id_tenant, producto.codigo]
    );

    return res.json({
      success: true,
      data: { producto, relacionados, resenas, store: toPublicStorefront(cfg) },
    });
  } catch (error) {
    console.error("getProducto:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const postConsultaWa = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, {
      slug: req.params.slug,
      id_tenant: req.params.id_tenant,
    });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const { id_producto, id_sku, id_sucursal, origen, attrs_snapshot } = req.body || {};
    await connection.query(
      `INSERT INTO tienda_consulta_wa (id_tenant, id_producto, id_sku, id_sucursal, origen, attrs_snapshot)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cfg.id_tenant,
        id_producto || null,
        id_sku || null,
        id_sucursal || null,
        origen || "whatsapp",
        attrs_snapshot ? JSON.stringify(attrs_snapshot) : null,
      ]
    );

    const store = toPublicStorefront(cfg);
    return res.json({
      success: true,
      data: { whatsapp: store.telefono },
    });
  } catch (error) {
    console.error("postConsultaWa:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const registerBuyer = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg || Number(cfg.activo) !== 1) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada" });
    }

    const { email, password, nombres, apellidos, telefono, documento } = req.body || {};
    if (!email || !password || !nombres) {
      return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    const hash = await hashPassword(password);
    try {
      const [ins] = await connection.query(
        `INSERT INTO tienda_comprador (id_tenant, email, password_hash, nombres, apellidos, telefono, documento)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cfg.id_tenant,
          String(email).trim().toLowerCase(),
          hash,
          nombres,
          apellidos || null,
          telefono || null,
          documento || null,
        ]
      );
      const [[comprador]] = await connection.query(
        `SELECT id_comprador, id_tenant, email, nombres, apellidos, telefono, documento, id_cliente
         FROM tienda_comprador WHERE id_comprador = ?`,
        [ins.insertId]
      );
      const token = signCatalogoBuyerToken(comprador);
      return res.status(201).json({ success: true, data: { token, comprador } });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ success: false, message: "Email ya registrado" });
      }
      throw e;
    }
  } catch (error) {
    console.error("registerBuyer:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const loginBuyer = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const { email, password } = req.body || {};
    const [[comprador]] = await connection.query(
      `SELECT * FROM tienda_comprador
       WHERE id_tenant = ? AND email = ? AND estado = 1 LIMIT 1`,
      [cfg.id_tenant, String(email || "").trim().toLowerCase()]
    );
    if (!comprador || !(await verifyPassword(password, comprador.password_hash))) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const token = signCatalogoBuyerToken(comprador);
    const safe = {
      id_comprador: comprador.id_comprador,
      id_tenant: comprador.id_tenant,
      email: comprador.email,
      nombres: comprador.nombres,
      apellidos: comprador.apellidos,
      telefono: comprador.telefono,
      documento: comprador.documento,
      id_cliente: comprador.id_cliente,
    };
    return res.json({ success: true, data: { token, comprador: safe } });
  } catch (error) {
    console.error("loginBuyer:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const meBuyer = async (req, res) => {
  const c = req.catalogoBuyer;
  return res.json({
    success: true,
    data: {
      id_comprador: c.id_comprador,
      id_tenant: c.id_tenant,
      email: c.email,
      nombres: c.nombres,
      apellidos: c.apellidos,
      telefono: c.telefono,
      documento: c.documento,
      id_cliente: c.id_cliente,
    },
  });
};

export const checkout = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg || Number(cfg.activo) !== 1) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Tienda no encontrada" });
    }
    if (Number(cfg.checkout_habilitado) === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Checkout deshabilitado" });
    }

    const body = req.body || {};
    const metodo = body.metodo_entrega || "retiro";
    const sucursales = await listSucursalesPublicas(connection, cfg.id_tenant);
    let idSucursal = Number(body.id_sucursal) || null;
    if (metodo === "retiro") {
      const ok = sucursales.find((s) => s.id_sucursal === idSucursal && s.allow_pickup);
      if (!ok) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Elige una sucursal de recojo." });
      }
    } else {
      const deliveryOk = sucursales.filter((s) => s.allow_delivery);
      if (idSucursal && !deliveryOk.some((s) => s.id_sucursal === idSucursal)) {
        const fallback = deliveryOk.find((s) => s.es_default) || deliveryOk[0] || sucursales.find((s) => s.es_default) || sucursales[0];
        idSucursal = fallback?.id_sucursal || idSucursal;
      } else if (!idSucursal) {
        const fallback = deliveryOk.find((s) => s.es_default) || deliveryOk[0] || sucursales[0];
        idSucursal = fallback?.id_sucursal || null;
      }
    }

    const quote = await cotizarEntrega(connection, cfg.id_tenant, {
      fulfillment: metodo === "retiro" ? "pickup" : metodo,
      distrito: body.distrito,
      id_zona: body.id_zona,
      id_destino: body.id_destino,
      subtotal: 0,
    });
    if (!quote.disponible && metodo !== "retiro") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: quote.motivo || "Entrega no disponible" });
    }
    const costo_envio = metodo === "retiro" ? 0 : Number(quote.costo || 0);

    const pedido = await crearPedido(connection, {
      id_tenant: cfg.id_tenant,
      id_comprador: req.id_comprador,
      id_cliente: req.catalogoBuyer?.id_cliente || null,
      id_sucursal: idSucursal,
      metodo_entrega: metodo,
      items: body.items,
      cupon: body.cupon_codigo ? { codigo: body.cupon_codigo } : null,
      direccion_entrega: body.direccion_entrega,
      distrito: body.distrito,
      referencia_entrega: body.referencia_entrega,
      costo_envio,
      notas: body.notas,
      idempotency_key: body.idempotency_key,
      id_destino: body.id_destino || null,
      id_agencia: body.id_agencia || null,
    });

    const full = await getPedidoByCodigo(connection, {
      id_tenant: cfg.id_tenant,
      codigo: pedido.codigo,
    });

    const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const slug = cfg.slug;
    let preference = null;
    try {
      preference = await crearPreferenceMp(connection, {
        id_tenant: cfg.id_tenant,
        pedido: full,
        items: full.items,
        back_urls: {
          success: `${origin}/s/${slug}/pago/resultado?status=success&codigo=${full.codigo}`,
          failure: `${origin}/s/${slug}/pago/resultado?status=failure&codigo=${full.codigo}`,
          pending: `${origin}/s/${slug}/pago/resultado?status=pending&codigo=${full.codigo}`,
        },
        notification_url: `${origin.replace(/:\d+$/, ":4000")}/api/catalogo/webhook/mp`,
      });
    } catch (mpErr) {
      // Si MP no está configurado, devolver pedido para pago manual / WA
      if (mpErr.status !== 400) throw mpErr;
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      data: {
        pedido: {
          codigo: full.codigo,
          estado: full.estado,
          total: Number(full.total),
          subtotal: Number(full.subtotal),
          descuento: Number(full.descuento),
          costo_envio: Number(full.costo_envio),
          pickup_qr_token: full.pickup_qr_token,
        },
        preference,
        store: toPublicStorefront(cfg),
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("checkout:", error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Error en checkout",
    });
  } finally {
    if (connection) connection.release();
  }
};

export const validateCupon = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });
    const result = await aplicarCupon(connection, {
      id_tenant: cfg.id_tenant,
      codigo: req.body?.codigo,
      subtotal: Number(req.body?.subtotal) || 0,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const cotizarEnvio = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const body = req.body || {};
    const fulfillment = body.fulfillment || (body.distrito ? "delivery" : "pickup");
    const quote = await cotizarEntrega(connection, cfg.id_tenant, {
      fulfillment,
      distrito: body.distrito || req.query.distrito,
      id_zona: body.id_zona,
      id_destino: body.id_destino,
      subtotal: body.subtotal,
    });
    return res.json({ success: true, data: quote });
  } catch (error) {
    console.error("cotizarEnvio:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const misPedidos = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const rows = await listarPedidosComprador(connection, {
      id_tenant: req.id_tenant,
      id_comprador: req.id_comprador,
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const miPedidoDetalle = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const pedido = await getPedidoByCodigo(connection, {
      id_tenant: req.id_tenant,
      codigo: req.params.codigo,
    });
    if (!pedido || Number(pedido.id_comprador) !== Number(req.id_comprador)) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    return res.json({ success: true, data: pedido });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const syncPago = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const pedido = await getPedidoByCodigo(connection, {
      id_tenant: cfg.id_tenant,
      codigo: req.params.codigo,
    });
    if (!pedido) return res.status(404).json({ success: false, message: "Pedido no encontrado" });

    if (pedido.id_venta) {
      return res.json({ success: true, data: { estado: pedido.estado, id_venta: pedido.id_venta } });
    }

    // Expiración
    if (
      pedido.estado === "pendiente_pago" &&
      pedido.expires_at &&
      new Date(pedido.expires_at) < new Date()
    ) {
      await connection.beginTransaction();
      await cancelarPedidoExpirado(connection, {
        id_tenant: cfg.id_tenant,
        id_pedido: pedido.id_pedido,
      });
      await connection.commit();
      return res.json({ success: true, data: { estado: "expirado" } });
    }

    return res.json({
      success: true,
      data: { estado: pedido.estado, total: Number(pedido.total) },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const webhookMp = async (req, res) => {
  let connection;
  try {
    const paymentId =
      req.query["data.id"] ||
      req.body?.data?.id ||
      req.query.id ||
      req.body?.id;
    if (!paymentId) return res.status(200).json({ ok: true });

    connection = await getConnection();
    await procesarWebhookMp(connection, { paymentId });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("webhookMp catalogo:", error);
    return res.status(200).json({ ok: true });
  } finally {
    if (connection) connection.release();
  }
};

// ── Favoritos ────────────────────────────────────────────────────────────

export const listFavoritos = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      `SELECT f.id_producto, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
              PR.imagen_url, PR.slug_tienda
       FROM tienda_favorito f
       INNER JOIN producto PR ON PR.id_producto = f.id_producto AND PR.id_tenant = f.id_tenant
       WHERE f.id_tenant = ? AND f.id_comprador = ?
       ORDER BY f.created_at DESC`,
      [req.id_tenant, req.id_comprador]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const addFavorito = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_producto = Number(req.body?.id_producto);
    await connection.query(
      `INSERT IGNORE INTO tienda_favorito (id_tenant, id_comprador, id_producto)
       VALUES (?, ?, ?)`,
      [req.id_tenant, req.id_comprador, id_producto]
    );
    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const removeFavorito = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.query(
      `DELETE FROM tienda_favorito
       WHERE id_tenant = ? AND id_comprador = ? AND id_producto = ?`,
      [req.id_tenant, req.id_comprador, Number(req.params.id_producto)]
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

// ── Reseñas ──────────────────────────────────────────────────────────────

export const crearResena = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { id_producto, rating, titulo, cuerpo, id_pedido } = req.body || {};
    if (!id_producto || !rating) {
      return res.status(400).json({ success: false, message: "Datos incompletos" });
    }
    const [[cfg]] = await connection.query(
      `SELECT * FROM tienda_resena_config WHERE id_tenant = ?`,
      [req.id_tenant]
    );
    const moderacion = cfg ? Number(cfg.moderacion) === 1 : true;
    const [ins] = await connection.query(
      `INSERT INTO tienda_resena (id_tenant, id_producto, id_comprador, id_pedido, rating, titulo, cuerpo, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id_tenant,
        id_producto,
        req.id_comprador,
        id_pedido || null,
        Math.min(5, Math.max(1, Number(rating))),
        titulo || null,
        cuerpo || null,
        moderacion ? "pendiente" : "aprobada",
      ]
    );
    return res.status(201).json({ success: true, data: { id_resena: ins.insertId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

// ── Admin ERP ────────────────────────────────────────────────────────────

export const adminGetConfig = async (req, res) => {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    connection = await getConnection();
    const cfg = await getOrCreateConfig(connection, id_tenant);
    const [[empresa]] = await connection.query(
      `SELECT nombreComercial, telefono, logotipo FROM empresa WHERE id_tenant = ? LIMIT 1`,
      [id_tenant]
    );
    const publicUrl = cfg.slug
      ? `${req.headers.origin || ""}/c/${cfg.slug}`
      : `${req.headers.origin || ""}/catalogo/${id_tenant}`;

    return res.json({
      success: true,
      data: {
        ...cfg,
        theme_json: parseThemeJson(cfg.theme_json),
        mp_access_token_enc: undefined,
        mp_conectado: Boolean(cfg.mp_access_token_enc),
        empresa,
        public_url: publicUrl,
      },
    });
  } catch (error) {
    console.error("adminGetConfig:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchConfig = async (req, res) => {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    connection = await getConnection();
    const body = { ...req.body };
    if (body.mp_access_token) {
      body.mp_access_token_enc = encryptMpToken(body.mp_access_token);
      delete body.mp_access_token;
    }
    if (body.slug) {
      body.slug = String(body.slug)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
    }
    if (body.theme_json) {
      const existing = await getOrCreateConfig(connection, id_tenant);
      const current = parseThemeJson(existing.theme_json) || {};
      const incoming =
        typeof body.theme_json === "object"
          ? body.theme_json
          : parseThemeJson(body.theme_json) || {};
      if (!incoming.disponibilidad && current.disponibilidad) {
        incoming.disponibilidad = current.disponibilidad;
      }
      incoming.disponibilidad = {
        ...(incoming.disponibilidad || {}),
        solicitudes_activas: false,
      };
      body.theme_json = incoming;
    }
    const cfg = await upsertConfig(connection, id_tenant, body);
    if (body.disponibilidad && typeof body.disponibilidad === "object") {
      const current = parseThemeJson(cfg.theme_json) || {};
      current.disponibilidad = {
        ...(current.disponibilidad || {}),
        ...body.disponibilidad,
        solicitudes_activas: false,
      };
      await upsertConfig(connection, id_tenant, { theme_json: current });
    }
    const fresh = await getOrCreateConfig(connection, id_tenant);
    return res.json({
      success: true,
      data: {
        ...fresh,
        theme_json: parseThemeJson(fresh.theme_json),
        mp_access_token_enc: undefined,
        mp_conectado: Boolean(fresh.mp_access_token_enc),
      },
    });
  } catch (error) {
    console.error("adminPatchConfig:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug ya en uso" });
    }
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminListPedidos = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const rows = await listarPedidosAdmin(connection, {
      id_tenant: req.id_tenant,
      estado: req.query.estado || null,
      mp_status: req.query.mp_status || null,
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdatePedidoEstado = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const estado = req.body?.estado;
    const allowed = [
      "preparando",
      "listo_retiro",
      "enviado",
      "entregado",
      "cancelado",
    ];
    if (!allowed.includes(estado)) {
      return res.status(400).json({ success: false, message: "Estado inválido" });
    }
    await connection.query(
      `UPDATE tienda_pedido SET estado = ? WHERE id_pedido = ? AND id_tenant = ?`,
      [estado, Number(req.params.id), req.id_tenant]
    );
    if (estado === "cancelado") {
      await cancelarPedidoExpirado(connection, {
        id_tenant: req.id_tenant,
        id_pedido: Number(req.params.id),
      });
      await connection.query(
        `UPDATE tienda_pedido SET estado = 'cancelado' WHERE id_pedido = ? AND id_tenant = ?`,
        [Number(req.params.id), req.id_tenant]
      );
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminValidarPickup = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const token = String(req.body?.token || req.params.token || "").trim();
    const codigo = String(req.body?.codigo || "").trim();
    if (!token && !codigo) {
      return res.status(400).json({ success: false, message: "Token o código requerido" });
    }
    const [[pedido]] = await connection.query(
      token
        ? `SELECT p.*, c.nombres AS comprador_nombre, c.email AS comprador_email,
                  c.telefono AS comprador_telefono, s.nombre_sucursal AS sucursal_nombre
           FROM tienda_pedido p
           LEFT JOIN tienda_comprador c ON c.id_comprador = p.id_comprador
           LEFT JOIN sucursal s ON s.id_sucursal = p.id_sucursal
           WHERE p.id_tenant = ? AND p.pickup_qr_token = ? LIMIT 1`
        : `SELECT p.*, c.nombres AS comprador_nombre, c.email AS comprador_email,
                  c.telefono AS comprador_telefono, s.nombre_sucursal AS sucursal_nombre
           FROM tienda_pedido p
           LEFT JOIN tienda_comprador c ON c.id_comprador = p.id_comprador
           LEFT JOIN sucursal s ON s.id_sucursal = p.id_sucursal
           WHERE p.id_tenant = ? AND p.codigo = ? LIMIT 1`,
      [req.id_tenant, token || codigo]
    );
    if (!pedido) {
      return res.status(404).json({ success: false, message: "QR o código no válido" });
    }
    if (pedido.estado === "entregado") {
      return res.json({
        success: true,
        data: {
          codigo: pedido.codigo,
          estado: "entregado",
          already_delivered: true,
          total: Number(pedido.total),
          comprador_nombre: pedido.comprador_nombre,
          sucursal_nombre: pedido.sucursal_nombre,
        },
      });
    }
    if (pedido.estado === "cancelado") {
      return res.status(400).json({ success: false, message: "Pedido cancelado" });
    }
    await connection.query(
      `UPDATE tienda_pedido SET estado = 'entregado'
       WHERE id_pedido = ? AND id_tenant = ?`,
      [pedido.id_pedido, req.id_tenant]
    );
    return res.json({
      success: true,
      data: {
        codigo: pedido.codigo,
        estado: "entregado",
        total: Number(pedido.total),
        comprador_nombre: pedido.comprador_nombre,
        comprador_email: pedido.comprador_email,
        comprador_telefono: pedido.comprador_telefono,
        sucursal_nombre: pedido.sucursal_nombre,
        metodo_entrega: pedido.metodo_entrega,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminCupones = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    if (req.method === "GET") {
      const rows = await listarCupones(connection, req.id_tenant);
      return res.json({ success: true, data: rows });
    }
    const id = await upsertCupon(connection, req.id_tenant, req.body || {});
    return res.json({ success: true, data: { id_cupon: id } });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const adminEntrega = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    if (req.method === "GET") {
      const config = await getEntregaConfig(connection, id_tenant);
      const [zonas, destinos, agencias, sucursales] = await Promise.all([
        listZonas(connection, id_tenant),
        listDestinos(connection, id_tenant).catch(() => []),
        listAgencias(connection, id_tenant).catch(() => []),
        listSucursalesAdmin(connection, id_tenant).catch(() => []),
      ]);
      return res.json({ success: true, data: { config, zonas, destinos, agencias, sucursales } });
    }

    const { config, zona, delete_zona, destino, delete_destino, agencia, delete_agencia } = req.body || {};
    if (config) await saveEntregaConfig(connection, id_tenant, config);
    if (zona) await upsertZona(connection, id_tenant, zona);
    if (delete_zona) await deleteZona(connection, id_tenant, Number(delete_zona));
    if (destino) await upsertDestino(connection, id_tenant, destino);
    if (delete_destino) await deleteDestino(connection, id_tenant, Number(delete_destino));
    if (agencia) await upsertAgencia(connection, id_tenant, agencia);
    if (delete_agencia) await deleteAgencia(connection, id_tenant, Number(delete_agencia));
    return res.json({ success: true });
  } catch (error) {
    console.error("adminEntrega:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const opcionesEnvio = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cfg = await resolveStore(connection, { slug: req.params.slug });
    if (!cfg) return res.status(404).json({ success: false, message: "Tienda no encontrada" });
    const data = await listOpcionesEntrega(connection, cfg.id_tenant, {
      subtotal: Number(req.query.subtotal) || 0,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("opcionesEnvio:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminListSucursales = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const rows = await listSucursalesAdmin(connection, req.id_tenant);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("adminListSucursales:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchSucursal = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const rows = await upsertSucursalOverlay(
      connection,
      req.id_tenant,
      Number(req.params.id),
      req.body || {}
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminUploadBrand = async (req, res) => {
  const kind = req.params.kind === "banner" ? "banner" : "logo";
  const { file, fileName } = req.body || {};
  if (!file) {
    return res.status(400).json({ success: false, message: "Archivo requerido (base64)." });
  }
  const safeName = String(fileName || `tienda-${kind}.jpg`).replace(/[^\w.\-]+/g, "_");
  const extension = safeName.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
  if (!allowed.has(extension)) {
    return res.status(400).json({
      success: false,
      message: `Tipo no permitido. Usa: ${[...allowed].join(", ")}`,
    });
  }
  let connection;
  try {
    const uploaded = await subirAImageKit({
      file,
      fileName: `erp_${kind}_${req.id_tenant}_${Date.now()}.${extension}`,
      folder: `/tienda-erp/${req.id_tenant}/brand/`,
    });
    connection = await getConnection();
    if (kind === "logo") {
      await upsertConfig(connection, req.id_tenant, { logo_url: uploaded.url });
      return res.status(201).json({ success: true, data: { url: uploaded.url, kind: "logo" } });
    }
    const cfg = await getOrCreateConfig(connection, req.id_tenant);
    const theme = parseThemeJson(cfg.theme_json) || {};
    theme.banner_url = uploaded.url;
    await upsertConfig(connection, req.id_tenant, { banner_url: uploaded.url, theme_json: theme });
    return res.status(201).json({
      success: true,
      data: { url: uploaded.url, kind: "banner", theme_json: theme },
    });
  } catch (error) {
    console.error("adminUploadBrand:", error);
    return res.status(500).json({ success: false, message: error.message || "Error al subir." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminConsultasStats = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    const empty = { total: 0, productos: [], sucursales: [], intentos_sin_stock: 0 };
    try {
      const [[tot]] = await connection.query(
        `SELECT COUNT(*) AS c FROM tienda_consulta_wa WHERE id_tenant = ?`,
        [id_tenant]
      );
      const [productos] = await connection.query(
        `SELECT c.id_producto, COALESCE(p.descripcion, CONCAT('#', c.id_producto)) AS nombre, COUNT(*) AS consultas
         FROM tienda_consulta_wa c
         LEFT JOIN producto p ON p.id_producto = c.id_producto AND p.id_tenant = c.id_tenant
         WHERE c.id_tenant = ? AND c.id_producto IS NOT NULL
         GROUP BY c.id_producto, p.descripcion
         ORDER BY consultas DESC LIMIT 10`,
        [id_tenant]
      );
      const [sucursales] = await connection.query(
        `SELECT c.id_sucursal, s.nombre_sucursal AS nombre, COUNT(*) AS consultas
         FROM tienda_consulta_wa c
         LEFT JOIN sucursal s ON s.id_sucursal = c.id_sucursal AND s.id_tenant = c.id_tenant
         WHERE c.id_tenant = ? AND c.id_sucursal IS NOT NULL
         GROUP BY c.id_sucursal, s.nombre_sucursal
         ORDER BY consultas DESC LIMIT 10`,
        [id_tenant]
      );
      return res.json({
        success: true,
        data: {
          total: Number(tot?.c || 0),
          productos,
          sucursales,
          intentos_sin_stock: 0,
        },
      });
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") {
        return res.json({ success: true, data: empty });
      }
      throw err;
    }
  } catch (error) {
    console.error("adminConsultasStats:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminModerarResena = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { estado, respuesta_comercio } = req.body || {};
    await connection.query(
      `UPDATE tienda_resena SET
        estado = COALESCE(?, estado),
        respuesta_comercio = COALESCE(?, respuesta_comercio),
        responded_at = IF(? IS NOT NULL, NOW(), responded_at)
       WHERE id_resena = ? AND id_tenant = ?`,
      [
        estado || null,
        respuesta_comercio || null,
        respuesta_comercio || null,
        Number(req.params.id),
        req.id_tenant,
      ]
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminListResenas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const estado = req.query.estado || null;
    const q = String(req.query.q || "").trim();
    const where = ["r.id_tenant = ?"];
    const params = [req.id_tenant];
    if (estado) {
      where.push("r.estado = ?");
      params.push(estado);
    }
    if (q) {
      where.push("(PR.descripcion LIKE ? OR c.nombres LIKE ? OR r.cuerpo LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    const [rows] = await connection.query(
      `SELECT r.*, PR.descripcion AS producto, c.nombres, c.email
       FROM tienda_resena r
       INNER JOIN producto PR ON PR.id_producto = r.id_producto
       INNER JOIN tienda_comprador c ON c.id_comprador = r.id_comprador
       WHERE ${where.join(" AND ")}
       ORDER BY r.created_at DESC LIMIT 100`,
      params
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminResenaStats = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [[stats]] = await connection.query(
      `SELECT
         COUNT(*) AS total,
         SUM(estado = 'pendiente') AS pendientes,
         SUM(estado = 'aprobada') AS publicadas,
         SUM(estado = 'rechazada') AS rechazadas,
         SUM(estado = 'oculta') AS ocultas,
         ROUND(AVG(CASE WHEN estado = 'aprobada' THEN rating END), 1) AS promedio
       FROM tienda_resena
       WHERE id_tenant = ?`,
      [req.id_tenant]
    );
    return res.json({
      success: true,
      data: {
        total: Number(stats?.total || 0),
        pendientes: Number(stats?.pendientes || 0),
        publicadas: Number(stats?.publicadas || 0),
        rechazadas: Number(stats?.rechazadas || 0),
        ocultas: Number(stats?.ocultas || 0),
        promedio: stats?.promedio != null ? Number(stats.promedio) : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminGetResenaConfig = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [[cfg]] = await connection.query(
      `SELECT * FROM tienda_resena_config WHERE id_tenant = ?`,
      [req.id_tenant]
    );
    return res.json({
      success: true,
      data: cfg || {
        id_tenant: req.id_tenant,
        habilitado: 1,
        requiere_compra: 1,
        moderacion: 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchResenaConfig = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const b = req.body || {};
    await connection.query(
      `INSERT INTO tienda_resena_config (id_tenant, habilitado, requiere_compra, moderacion)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         habilitado = VALUES(habilitado),
         requiere_compra = VALUES(requiere_compra),
         moderacion = VALUES(moderacion)`,
      [
        req.id_tenant,
        b.habilitado == null ? 1 : b.habilitado ? 1 : 0,
        b.requiere_compra == null ? 1 : b.requiere_compra ? 1 : 0,
        b.moderacion == null ? 1 : b.moderacion ? 1 : 0,
      ]
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminBanners = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    if (req.method === "GET") {
      const [rows] = await connection.query(
        `SELECT * FROM tienda_banner WHERE id_tenant = ? ORDER BY orden`,
        [req.id_tenant]
      );
      return res.json({ success: true, data: rows });
    }
    const b = req.body || {};
    if (b.id_banner) {
      await connection.query(
        `UPDATE tienda_banner SET titulo=?, subtitulo=?, imagen_url=?, link_url=?, activo=?, orden=?
         WHERE id_banner=? AND id_tenant=?`,
        [
          b.titulo,
          b.subtitulo || null,
          b.imagen_url || null,
          b.link_url || null,
          b.activo == null ? 1 : b.activo ? 1 : 0,
          Number(b.orden) || 0,
          b.id_banner,
          req.id_tenant,
        ]
      );
    } else {
      await connection.query(
        `INSERT INTO tienda_banner (id_tenant, titulo, subtitulo, imagen_url, link_url, activo, orden)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [
          req.id_tenant,
          b.titulo,
          b.subtitulo || null,
          b.imagen_url || null,
          b.link_url || null,
          Number(b.orden) || 0,
        ]
      );
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchProductoTienda = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { visible_tienda, destacado_tienda, slug_tienda } = req.body || {};
    await connection.query(
      `UPDATE producto SET
        visible_tienda = COALESCE(?, visible_tienda),
        destacado_tienda = COALESCE(?, destacado_tienda),
        slug_tienda = COALESCE(?, slug_tienda)
       WHERE id_producto = ? AND id_tenant = ?`,
      [
        visible_tienda == null ? null : visible_tienda ? 1 : 0,
        destacado_tienda == null ? null : destacado_tienda ? 1 : 0,
        slug_tienda || null,
        Number(req.params.id),
        req.id_tenant,
      ]
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error interno" });
  } finally {
    if (connection) connection.release();
  }
};

/** Compat: mantiene getCatalogoPublico shape */
export const getCatalogoPublico = getStorefront;

export const methods = {
  getCatalogoPublico,
  getStorefront,
  getCatalogoProductos,
  getProducto,
  postConsultaWa,
  registerBuyer,
  loginBuyer,
  meBuyer,
  checkout,
  validateCupon,
  cotizarEnvio,
  opcionesEnvio,
  misPedidos,
  miPedidoDetalle,
  syncPago,
  webhookMp,
  listFavoritos,
  addFavorito,
  removeFavorito,
  crearResena,
  adminGetConfig,
  adminPatchConfig,
  adminListPedidos,
  adminUpdatePedidoEstado,
  adminValidarPickup,
  adminCupones,
  adminEntrega,
  adminListSucursales,
  adminPatchSucursal,
  adminUploadBrand,
  adminConsultasStats,
  adminModerarResena,
  adminListResenas,
  adminResenaStats,
  adminGetResenaConfig,
  adminPatchResenaConfig,
  adminBanners,
  adminPatchProductoTienda,
};
