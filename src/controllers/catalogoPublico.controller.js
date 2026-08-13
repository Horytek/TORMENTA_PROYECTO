import { getConnection } from "../database/database.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import { encryptMpToken } from "../utils/ecommerceCrypto.js";
import { signCatalogoBuyerToken } from "../middlewares/catalogoBuyerAuth.middleware.js";
import {
  getOrCreateConfig,
  listSucursalesPublicas,
  resolveTenantById,
  resolveTenantBySlug,
  toPublicStorefront,
  upsertConfig,
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
    let costo_envio = 0;
    if (body.metodo_entrega === "delivery") {
      const distrito = body.distrito;
      const [zonas] = await connection.query(
        `SELECT * FROM tienda_delivery_zona WHERE id_tenant = ? AND activo = 1`,
        [cfg.id_tenant]
      );
      const zona = zonas.find((z) => {
        const dists = typeof z.distritos === "string" ? JSON.parse(z.distritos || "[]") : z.distritos || [];
        return dists.some((d) => String(d).toLowerCase() === String(distrito || "").toLowerCase());
      });
      if (zona) costo_envio = Number(zona.costo);
      else {
        const [[ent]] = await connection.query(
          `SELECT costo_default FROM tienda_entrega_config WHERE id_tenant = ?`,
          [cfg.id_tenant]
        );
        costo_envio = Number(ent?.costo_default || 0);
      }
    }

    const pedido = await crearPedido(connection, {
      id_tenant: cfg.id_tenant,
      id_comprador: req.id_comprador,
      id_cliente: req.catalogoBuyer?.id_cliente || null,
      id_sucursal: body.id_sucursal,
      metodo_entrega: body.metodo_entrega || "retiro",
      items: body.items,
      cupon: body.cupon_codigo ? { codigo: body.cupon_codigo } : null,
      direccion_entrega: body.direccion_entrega,
      distrito: body.distrito,
      referencia_entrega: body.referencia_entrega,
      costo_envio,
      notas: body.notas,
      idempotency_key: body.idempotency_key,
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
          success: `${origin}/c/${slug}/pago/resultado?status=success&codigo=${full.codigo}`,
          failure: `${origin}/c/${slug}/pago/resultado?status=failure&codigo=${full.codigo}`,
          pending: `${origin}/c/${slug}/pago/resultado?status=pending&codigo=${full.codigo}`,
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

    const distrito = req.body?.distrito || req.query.distrito;
    const [zonas] = await connection.query(
      `SELECT id_zona, nombre, distritos, costo FROM tienda_delivery_zona
       WHERE id_tenant = ? AND activo = 1 ORDER BY orden`,
      [cfg.id_tenant]
    );
    const zona = zonas.find((z) => {
      const dists = typeof z.distritos === "string" ? JSON.parse(z.distritos || "[]") : z.distritos || [];
      return dists.some((d) => String(d).toLowerCase() === String(distrito || "").toLowerCase());
    });
    const [[ent]] = await connection.query(
      `SELECT * FROM tienda_entrega_config WHERE id_tenant = ?`,
      [cfg.id_tenant]
    );
    return res.json({
      success: true,
      data: {
        costo: zona ? Number(zona.costo) : Number(ent?.costo_default || 0),
        zona: zona ? { id_zona: zona.id_zona, nombre: zona.nombre } : null,
        retiro_activo: Number(ent?.retiro_activo ?? 1) === 1,
        delivery_activo: Number(ent?.delivery_activo ?? 0) === 1,
        zonas: zonas.map((z) => ({
          id_zona: z.id_zona,
          nombre: z.nombre,
          costo: Number(z.costo),
          distritos: typeof z.distritos === "string" ? JSON.parse(z.distritos || "[]") : z.distritos,
        })),
      },
    });
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
    const cfg = await upsertConfig(connection, id_tenant, body);
    return res.json({
      success: true,
      data: { ...cfg, mp_access_token_enc: undefined, mp_conectado: Boolean(cfg.mp_access_token_enc) },
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
    const token = req.body?.token || req.params.token;
    const [[pedido]] = await connection.query(
      `SELECT * FROM tienda_pedido
       WHERE id_tenant = ? AND pickup_qr_token = ? LIMIT 1`,
      [req.id_tenant, token]
    );
    if (!pedido) {
      return res.status(404).json({ success: false, message: "QR no válido" });
    }
    await connection.query(
      `UPDATE tienda_pedido SET estado = 'entregado'
       WHERE id_pedido = ? AND id_tenant = ?`,
      [pedido.id_pedido, req.id_tenant]
    );
    return res.json({
      success: true,
      data: { codigo: pedido.codigo, estado: "entregado" },
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
      const [[cfg]] = await connection.query(
        `SELECT * FROM tienda_entrega_config WHERE id_tenant = ?`,
        [id_tenant]
      );
      const [zonas] = await connection.query(
        `SELECT * FROM tienda_delivery_zona WHERE id_tenant = ? ORDER BY orden`,
        [id_tenant]
      );
      return res.json({ success: true, data: { config: cfg, zonas } });
    }

    const { config, zona } = req.body || {};
    if (config) {
      await connection.query(
        `INSERT INTO tienda_entrega_config (id_tenant, retiro_activo, delivery_activo, costo_default, tiempo_preparacion_min)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           retiro_activo = VALUES(retiro_activo),
           delivery_activo = VALUES(delivery_activo),
           costo_default = VALUES(costo_default),
           tiempo_preparacion_min = VALUES(tiempo_preparacion_min)`,
        [
          id_tenant,
          config.retiro_activo ? 1 : 0,
          config.delivery_activo ? 1 : 0,
          Number(config.costo_default) || 0,
          Number(config.tiempo_preparacion_min) || 60,
        ]
      );
    }
    if (zona) {
      if (zona.id_zona) {
        await connection.query(
          `UPDATE tienda_delivery_zona SET nombre=?, distritos=?, costo=?, activo=?, orden=?
           WHERE id_zona=? AND id_tenant=?`,
          [
            zona.nombre,
            JSON.stringify(zona.distritos || []),
            Number(zona.costo) || 0,
            zona.activo == null ? 1 : zona.activo ? 1 : 0,
            Number(zona.orden) || 0,
            zona.id_zona,
            id_tenant,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO tienda_delivery_zona (id_tenant, nombre, distritos, costo, activo, orden)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id_tenant,
            zona.nombre,
            JSON.stringify(zona.distritos || []),
            Number(zona.costo) || 0,
            1,
            Number(zona.orden) || 0,
          ]
        );
      }
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("adminEntrega:", error);
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
    const [rows] = await connection.query(
      `SELECT r.*, PR.descripcion AS producto, c.nombres, c.email
       FROM tienda_resena r
       INNER JOIN producto PR ON PR.id_producto = r.id_producto
       INNER JOIN tienda_comprador c ON c.id_comprador = r.id_comprador
       WHERE r.id_tenant = ?
       ORDER BY r.created_at DESC LIMIT 100`,
      [req.id_tenant]
    );
    return res.json({ success: true, data: rows });
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
  adminModerarResena,
  adminListResenas,
  adminBanners,
  adminPatchProductoTienda,
};
