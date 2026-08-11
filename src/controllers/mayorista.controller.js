import jwt from "jsonwebtoken";
import { getConnection } from "../database/database_mayorista.js";
import { TOKEN_SECRET } from "../config.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";

async function ensureEntitlement(connection, id_tenant) {
  const [[row]] = await connection.query(
    `SELECT activo FROM mayorista_entitlement WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (!row) {
    await connection.query(
      `INSERT INTO mayorista_entitlement (id_tenant, activo, plan_flag) VALUES (?, 1, 'wave_a')`,
      [id_tenant]
    );
    return true;
  }
  return Number(row.activo) === 1;
}

function denyEntitlement(res) {
  return res.status(403).json({
    success: false,
    message: "Mayorista no está habilitado para este tenant.",
  });
}

function signCompradorToken(comprador) {
  return jwt.sign(
    {
      sub: comprador.id_comprador,
      email: comprador.email,
      ten: comprador.id_tenant,
      tienda: comprador.id_tienda,
      lista: comprador.id_lista,
      aud: "horytek-mayorista",
      iss: "horytek-backend",
    },
    TOKEN_SECRET,
    { expiresIn: "12h", algorithm: "HS256" }
  );
}

export function authMayoristaComprador(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Token requerido" });
    }
    const payload = jwt.verify(token, TOKEN_SECRET, {
      algorithms: ["HS256"],
      audience: "horytek-mayorista",
      issuer: "horytek-backend",
    });
    req.mayorista = {
      id_comprador: payload.sub,
      email: payload.email,
      id_tenant: payload.ten,
      id_tienda: payload.tienda,
      id_lista: payload.lista,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Sesión B2B inválida" });
  }
}

/* ——— Admin ERP ——— */

export async function listTiendas(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT id_tienda, slug, nombre, activo, whatsapp, creado_en
       FROM mayorista_tienda WHERE id_tenant = ? ORDER BY nombre`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mayorista.listTiendas", error.message);
    return res.status(500).json({ success: false, message: "Error al listar tiendas B2B" });
  } finally {
    connection?.release();
  }
}

export async function createTienda(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    const { slug, nombre, whatsapp, activo } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [result] = await connection.query(
      `INSERT INTO mayorista_tienda (id_tenant, slug, nombre, whatsapp, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tenant, slug, nombre, whatsapp ?? null, activo === false ? 0 : 1]
    );
    return res.status(201).json({
      success: true,
      data: { id_tienda: result.insertId, slug, nombre, portal: `/b2b/${slug}` },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Slug de portal ya en uso" });
    }
    console.error("mayorista.createTienda", error.message);
    return res.status(500).json({ success: false, message: "Error al crear tienda B2B" });
  } finally {
    connection?.release();
  }
}

export async function createLista(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    const { id_tienda, nombre, moneda } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [[tienda]] = await connection.query(
      `SELECT id_tienda FROM mayorista_tienda WHERE id_tienda = ? AND id_tenant = ? LIMIT 1`,
      [id_tienda, id_tenant]
    );
    if (!tienda) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const [result] = await connection.query(
      `INSERT INTO mayorista_lista_precio (id_tenant, id_tienda, nombre, moneda)
       VALUES (?, ?, ?, ?)`,
      [id_tenant, id_tienda, nombre, moneda || "PEN"]
    );
    return res.status(201).json({ success: true, data: { id_lista: result.insertId } });
  } catch (error) {
    console.error("mayorista.createLista", error.message);
    return res.status(500).json({ success: false, message: "Error al crear lista" });
  } finally {
    connection?.release();
  }
}

export async function listListas(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT l.id_lista, l.id_tienda, l.nombre, l.moneda, l.activo, t.slug AS tienda_slug
       FROM mayorista_lista_precio l
       INNER JOIN mayorista_tienda t ON t.id_tienda = l.id_tienda
       WHERE l.id_tenant = ? ORDER BY l.id_lista DESC`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mayorista.listListas", error.message);
    return res.status(500).json({ success: false, message: "Error al listar listas" });
  } finally {
    connection?.release();
  }
}

export async function addListaItem(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    const { id_lista, sku, nombre, precio, min_cantidad } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [[lista]] = await connection.query(
      `SELECT id_lista FROM mayorista_lista_precio WHERE id_lista = ? AND id_tenant = ? LIMIT 1`,
      [id_lista, id_tenant]
    );
    if (!lista) return res.status(404).json({ success: false, message: "Lista no encontrada" });

    const [result] = await connection.query(
      `INSERT INTO mayorista_lista_item (id_lista, id_tenant, sku, nombre, precio, min_cantidad)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_lista, id_tenant, sku, nombre, precio, min_cantidad ?? 1]
    );
    return res.status(201).json({ success: true, data: { id_item: result.insertId } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "SKU ya existe en la lista" });
    }
    console.error("mayorista.addListaItem", error.message);
    return res.status(500).json({ success: false, message: "Error al agregar ítem" });
  } finally {
    connection?.release();
  }
}

export async function listListaItems(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    const id_lista = Number(req.params.id_lista);
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT id_item, sku, nombre, precio, min_cantidad, activo
       FROM mayorista_lista_item WHERE id_lista = ? AND id_tenant = ? ORDER BY nombre`,
      [id_lista, id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mayorista.listListaItems", error.message);
    return res.status(500).json({ success: false, message: "Error al listar ítems" });
  } finally {
    connection?.release();
  }
}

export async function createComprador(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    const { id_tienda, email, password, razon_social, ruc, id_lista } = req.body;
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [[tienda]] = await connection.query(
      `SELECT id_tienda FROM mayorista_tienda WHERE id_tienda = ? AND id_tenant = ? LIMIT 1`,
      [id_tienda, id_tenant]
    );
    if (!tienda) return res.status(404).json({ success: false, message: "Tienda no encontrada" });

    const password_hash = await hashPassword(password);
    const [result] = await connection.query(
      `INSERT INTO mayorista_comprador
         (id_tenant, id_tienda, email, password_hash, razon_social, ruc, id_lista)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_tenant, id_tienda, email.toLowerCase(), password_hash, razon_social, ruc ?? null, id_lista ?? null]
    );
    return res.status(201).json({
      success: true,
      data: { id_comprador: result.insertId, email: email.toLowerCase() },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email ya registrado en el portal" });
    }
    console.error("mayorista.createComprador", error.message);
    return res.status(500).json({ success: false, message: "Error al crear comprador" });
  } finally {
    connection?.release();
  }
}

export async function listCompradores(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT c.id_comprador, c.email, c.razon_social, c.ruc, c.activo, c.id_lista, c.creado_en,
              t.id_tienda, t.slug AS tienda_slug, t.nombre AS tienda_nombre,
              l.nombre AS lista_nombre
       FROM mayorista_comprador c
       INNER JOIN mayorista_tienda t ON t.id_tienda = c.id_tienda AND t.id_tenant = c.id_tenant
       LEFT JOIN mayorista_lista_precio l ON l.id_lista = c.id_lista AND l.id_tenant = c.id_tenant
       WHERE c.id_tenant = ?
       ORDER BY c.razon_social ASC, c.email ASC
       LIMIT 500`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mayorista.listCompradores", error.message);
    return res.status(500).json({ success: false, message: "Error al listar compradores" });
  } finally {
    connection?.release();
  }
}

export async function listPedidosAdmin(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [rows] = await connection.query(
      `SELECT p.id_pedido, p.estado, p.total, p.notas, p.creado_en,
              c.razon_social, c.email, t.slug AS tienda_slug
       FROM mayorista_pedido p
       INNER JOIN mayorista_comprador c ON c.id_comprador = p.id_comprador
       INNER JOIN mayorista_tienda t ON t.id_tienda = p.id_tienda
       WHERE p.id_tenant = ?
       ORDER BY p.id_pedido DESC LIMIT 200`,
      [id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mayorista.listPedidosAdmin", error.message);
    return res.status(500).json({ success: false, message: "Error al listar pedidos" });
  } finally {
    connection?.release();
  }
}

export async function updatePedidoEstado(req, res) {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    if (!id_tenant) return res.status(401).json({ success: false, message: "Sesión inválida" });
    const id_pedido = Number(req.params.id_pedido);
    const estado = String(req.body.estado || "");
    const allowed = ["enviado", "confirmado", "rechazado", "despachado"];
    if (!allowed.includes(estado)) {
      return res.status(400).json({ success: false, message: "Estado inválido" });
    }
    connection = await getConnection();
    if (!(await ensureEntitlement(connection, id_tenant))) return denyEntitlement(res);

    const [result] = await connection.query(
      `UPDATE mayorista_pedido SET estado = ? WHERE id_pedido = ? AND id_tenant = ?`,
      [estado, id_pedido, id_tenant]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    return res.json({ success: true, data: { id_pedido, estado } });
  } catch (error) {
    console.error("mayorista.updatePedidoEstado", error.message);
    return res.status(500).json({ success: false, message: "Error al actualizar pedido" });
  } finally {
    connection?.release();
  }
}

/* ——— Portal B2B (público + sesión comprador) ——— */

export async function getPortalPublic(req, res) {
  let connection;
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    connection = await getConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, id_tenant, slug, nombre, whatsapp
       FROM mayorista_tienda WHERE slug = ? AND activo = 1 LIMIT 1`,
      [slug]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Portal B2B no encontrado" });
    }
    if (!(await ensureEntitlement(connection, tienda.id_tenant))) {
      return res.status(403).json({ success: false, message: "Portal no disponible" });
    }
    return res.json({
      success: true,
      data: {
        slug: tienda.slug,
        nombre: tienda.nombre,
        whatsapp: tienda.whatsapp,
      },
    });
  } catch (error) {
    console.error("mayorista.getPortalPublic", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar portal" });
  } finally {
    connection?.release();
  }
}

export async function loginComprador(req, res) {
  let connection;
  try {
    const { slug, email, password } = req.body;
    connection = await getConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, id_tenant, slug, nombre FROM mayorista_tienda
       WHERE slug = ? AND activo = 1 LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Portal no encontrado" });
    }
    if (!(await ensureEntitlement(connection, tienda.id_tenant))) {
      return res.status(403).json({ success: false, message: "Portal no disponible" });
    }

    const [[comprador]] = await connection.query(
      `SELECT id_comprador, id_tenant, id_tienda, email, password_hash, razon_social, id_lista, activo
       FROM mayorista_comprador
       WHERE id_tienda = ? AND email = ? LIMIT 1`,
      [tienda.id_tienda, String(email).toLowerCase()]
    );
    if (!comprador || !comprador.activo) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, comprador.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const token = signCompradorToken(comprador);
    return res.json({
      success: true,
      data: {
        token,
        comprador: {
          email: comprador.email,
          razon_social: comprador.razon_social,
          id_lista: comprador.id_lista,
        },
        tienda: { slug: tienda.slug, nombre: tienda.nombre },
      },
    });
  } catch (error) {
    console.error("mayorista.loginComprador", error.message);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión B2B" });
  } finally {
    connection?.release();
  }
}

export async function catalogoComprador(req, res) {
  let connection;
  try {
    const { id_tenant, id_tienda, id_lista } = req.mayorista;
    connection = await getConnection();

    let listaId = id_lista;
    if (!listaId) {
      const [[fallback]] = await connection.query(
        `SELECT id_lista FROM mayorista_lista_precio
         WHERE id_tienda = ? AND id_tenant = ? AND activo = 1
         ORDER BY id_lista ASC LIMIT 1`,
        [id_tienda, id_tenant]
      );
      listaId = fallback?.id_lista ?? null;
    }
    if (!listaId) {
      return res.json({ success: true, data: { items: [], id_lista: null } });
    }

    const [items] = await connection.query(
      `SELECT sku, nombre, precio, min_cantidad
       FROM mayorista_lista_item
       WHERE id_lista = ? AND id_tenant = ? AND activo = 1
       ORDER BY nombre`,
      [listaId, id_tenant]
    );
    return res.json({ success: true, data: { id_lista: listaId, items } });
  } catch (error) {
    console.error("mayorista.catalogoComprador", error.message);
    return res.status(500).json({ success: false, message: "Error al cargar catálogo B2B" });
  } finally {
    connection?.release();
  }
}

export async function crearPedidoComprador(req, res) {
  let connection;
  try {
    const { id_tenant, id_tienda, id_comprador, id_lista } = req.mayorista;
    const { items, notas } = req.body;
    connection = await getConnection();
    await connection.beginTransaction();

    let listaId = id_lista;
    if (!listaId) {
      const [[fallback]] = await connection.query(
        `SELECT id_lista FROM mayorista_lista_precio
         WHERE id_tienda = ? AND id_tenant = ? AND activo = 1
         ORDER BY id_lista ASC LIMIT 1`,
        [id_tienda, id_tenant]
      );
      listaId = fallback?.id_lista ?? null;
    }
    if (!listaId) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Sin lista de precios asignada" });
    }

    const skus = items.map((i) => i.sku);
    const [catalog] = await connection.query(
      `SELECT sku, nombre, precio, min_cantidad FROM mayorista_lista_item
       WHERE id_lista = ? AND id_tenant = ? AND activo = 1 AND sku IN (?)`,
      [listaId, id_tenant, skus]
    );
    const bySku = new Map(catalog.map((r) => [r.sku, r]));

    const lines = [];
    let total = 0;
    for (const line of items) {
      const prod = bySku.get(line.sku);
      if (!prod) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `SKU no disponible: ${line.sku}` });
      }
      if (Number(line.cantidad) < Number(prod.min_cantidad)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Cantidad mínima de ${prod.sku} es ${prod.min_cantidad}`,
        });
      }
      const subtotal = Number(prod.precio) * Number(line.cantidad);
      total += subtotal;
      lines.push({
        sku: prod.sku,
        nombre: prod.nombre,
        cantidad: Number(line.cantidad),
        precio_unit: Number(prod.precio),
        subtotal,
      });
    }

    const [pedidoResult] = await connection.query(
      `INSERT INTO mayorista_pedido (id_tenant, id_tienda, id_comprador, estado, total, notas)
       VALUES (?, ?, ?, 'enviado', ?, ?)`,
      [id_tenant, id_tienda, id_comprador, total, notas ?? null]
    );
    const id_pedido = pedidoResult.insertId;

    for (const line of lines) {
      await connection.query(
        `INSERT INTO mayorista_pedido_item
           (id_pedido, id_tenant, sku, nombre, cantidad, precio_unit, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_pedido, id_tenant, line.sku, line.nombre, line.cantidad, line.precio_unit, line.subtotal]
      );
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      data: { id_pedido, total, estado: "enviado", items: lines },
    });
  } catch (error) {
    try {
      await connection?.rollback();
    } catch {
      /* ignore */
    }
    console.error("mayorista.crearPedidoComprador", error.message);
    return res.status(500).json({ success: false, message: "Error al crear pedido" });
  } finally {
    connection?.release();
  }
}

export async function misPedidosComprador(req, res) {
  let connection;
  try {
    const { id_tenant, id_comprador } = req.mayorista;
    connection = await getConnection();
    const [rows] = await connection.query(
      `SELECT id_pedido, estado, total, notas, creado_en
       FROM mayorista_pedido
       WHERE id_tenant = ? AND id_comprador = ?
       ORDER BY id_pedido DESC LIMIT 50`,
      [id_tenant, id_comprador]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("mayorista.misPedidosComprador", error.message);
    return res.status(500).json({ success: false, message: "Error al listar pedidos" });
  } finally {
    connection?.release();
  }
}
