import {
  disponiblePorProducto,
  filasDeProducto,
  stockPorProducto,
  stockPorSku,
} from "../inventario/stockRepository.js";
import { listarPorProductos } from "../producto/productoImagenRepository.js";
import { almacenesDeSucursal } from "./TiendaConfigService.js";

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function disponibilidadEstado(stock, umbral = 5, hayEnOtra = false) {
  const n = Number(stock) || 0;
  if (n > umbral) return { estado: "disponible", label: "Disponible", stock: n };
  if (n > 0) return { estado: "ultimas_unidades", label: "Últimas unidades", stock: n };
  if (hayEnOtra) {
    return { estado: "otra_sucursal", label: "Disponible en otra sucursal", stock: 0 };
  }
  return { estado: "agotado", label: "Agotado", stock: 0 };
}

async function resolveAlmacenes(cx, id_tenant, id_sucursal) {
  if (!id_sucursal) return null;
  return almacenesDeSucursal(cx, id_sucursal, id_tenant);
}

let _colsTiendaCache = null;
async function productoTiendaColumns(cx) {
  if (_colsTiendaCache) return _colsTiendaCache;
  try {
    const [rows] = await cx.query(
      `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto'
         AND COLUMN_NAME IN ('visible_tienda','destacado_tienda','slug_tienda')`
    );
    _colsTiendaCache = new Set(rows.map((r) => r.c));
  } catch {
    _colsTiendaCache = new Set();
  }
  return _colsTiendaCache;
}

async function stockDisponibleMap(cx, opts) {
  try {
    return await disponiblePorProducto(cx, opts);
  } catch {
    return stockPorProducto(cx, opts);
  }
}

/**
 * Catálogo paginado con facets. Solo productos activos (+ visible_tienda si existe).
 */
export async function listarCatalogo(cx, {
  id_tenant,
  q = "",
  categoria = null,
  marca = null,
  min = null,
  max = null,
  sort = "nombre",
  page = 1,
  limit = 24,
  id_sucursal = null,
  solo_stock = false,
  destacados = false,
  attrFilters = {},
  umbral = 5,
}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(60, Math.max(1, Number(limit) || 24));
  const offset = (pageNum - 1) * limitNum;
  const cols = await productoTiendaColumns(cx);

  const where = [
    "PR.id_tenant = ?",
    "PR.estado_producto = 1",
  ];
  const params = [id_tenant];

  if (cols.has("visible_tienda")) {
    where.push("COALESCE(PR.visible_tienda, 1) = 1");
  }

  if (q && String(q).trim()) {
    where.push("(PR.descripcion LIKE ? OR MA.nom_marca LIKE ? OR CA.nom_subcat LIKE ?)");
    const like = `%${String(q).trim()}%`;
    params.push(like, like, like);
  }
  if (categoria) {
    where.push("CA.nom_subcat = ?");
    params.push(categoria);
  }
  if (marca) {
    where.push("MA.nom_marca = ?");
    params.push(marca);
  }
  if (min != null && min !== "" && !Number.isNaN(Number(min))) {
    where.push("PR.precio >= ?");
    params.push(Number(min));
  }
  if (max != null && max !== "" && !Number.isNaN(Number(max))) {
    where.push("PR.precio <= ?");
    params.push(Number(max));
  }
  if (destacados) {
    if (!cols.has("destacado_tienda")) {
      return {
        items: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, pages: 1 },
        facets: { categorias: [], marcas: [], atributos: [] },
      };
    }
    where.push("PR.destacado_tienda = 1");
  }

  // Filtros dinámicos por atributo (id_atributo → valor)
  const attrEntries = Object.entries(attrFilters || {}).filter(
    ([, v]) => v != null && String(v).trim() !== ""
  );
  for (const [idAttr, valor] of attrEntries) {
    where.push(`EXISTS (
      SELECT 1 FROM producto_atributo_valor pav
      INNER JOIN atributo_valor av ON av.id_valor = pav.id_valor AND av.id_tenant = pav.id_tenant
      WHERE pav.id_producto = PR.id_producto
        AND av.id_atributo = ?
        AND pav.id_tenant = PR.id_tenant
        AND av.valor = ?
    )`);
    params.push(Number(idAttr), String(valor));
  }

  const orderMap = {
    nombre: "PR.descripcion ASC",
    precio_asc: "PR.precio ASC",
    precio_desc: "PR.precio DESC",
    nuevos: "PR.id_producto DESC",
  };
  const orderBy = orderMap[sort] || orderMap.nombre;

  const fromSql = `
    FROM producto PR
    INNER JOIN marca MA ON MA.id_marca = PR.id_marca
    INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
    WHERE ${where.join(" AND ")}
  `;

  const selectExtra = [
    cols.has("destacado_tienda") ? "PR.destacado_tienda" : "0 AS destacado_tienda",
    cols.has("slug_tienda") ? "PR.slug_tienda" : "NULL AS slug_tienda",
  ].join(", ");

  const [[countRow]] = await cx.query(
    `SELECT COUNT(*) AS total ${fromSql}`,
    params
  );
  let total = Number(countRow.total) || 0;

  const [productos] = await cx.query(
    `SELECT PR.id_producto AS codigo, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
            PR.imagen_url, PR.undm, ${selectExtra},
            MA.nom_marca, CA.nom_subcat AS categoria, CA.id_subcategoria, MA.id_marca
     ${fromSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const ids = productos.map((p) => p.codigo);
  const almacenes = await resolveAlmacenes(cx, id_tenant, id_sucursal);
  const stockMap = ids.length
    ? await stockDisponibleMap(cx, {
        id_tenant,
        ids_producto: ids,
        id_almacen: almacenes && almacenes.length ? almacenes : null,
      })
    : new Map();

  const stockGlobalMap =
    id_sucursal && ids.length
      ? await stockDisponibleMap(cx, { id_tenant, ids_producto: ids })
      : stockMap;

  const imagesMap = ids.length
    ? await listarPorProductos(cx, { id_tenant, ids_producto: ids })
    : new Map();

  let items = productos.map((p) => {
    const stock = stockMap.get(p.codigo) ?? 0;
    const stockGlobal = stockGlobalMap.get(p.codigo) ?? 0;
    const disp = disponibilidadEstado(stock, umbral, stock === 0 && stockGlobal > 0);
    const images = imagesMap.get(p.codigo) ?? [];
    const slug = p.slug_tienda || `${slugify(p.descripcion)}-${p.codigo}`;
    return {
      codigo: p.codigo,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      imagen_url: p.imagen_url || images[0] || null,
      images,
      undm: p.undm,
      nom_marca: p.nom_marca,
      categoria: p.categoria,
      id_subcategoria: p.id_subcategoria,
      id_marca: p.id_marca,
      destacado: Number(p.destacado_tienda) === 1,
      slug,
      stock: disp.stock,
      disponibilidad: disp,
    };
  });

  if (solo_stock) {
    items = items.filter((p) => p.stock > 0);
    total = items.length < limitNum && pageNum === 1 ? items.length : total;
  }

  const [facetCats] = await cx.query(
    `SELECT CA.nom_subcat AS nombre, COUNT(*) AS count
     ${fromSql}
     GROUP BY CA.nom_subcat
     ORDER BY CA.nom_subcat`,
    params
  );
  const [facetMarcas] = await cx.query(
    `SELECT MA.nom_marca AS nombre, COUNT(*) AS count
     ${fromSql}
     GROUP BY MA.nom_marca
     ORDER BY MA.nom_marca`,
    params
  );

  let filtrosAttr = [];
  try {
    filtrosAttr = await listarAtributosFiltro(cx, id_tenant);
  } catch {
    filtrosAttr = [];
  }

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    },
    facets: {
      categorias: facetCats.map((r) => ({ nombre: r.nombre, count: Number(r.count) })),
      marcas: facetMarcas.map((r) => ({ nombre: r.nombre, count: Number(r.count) })),
      atributos: filtrosAttr,
    },
  };
}

export async function listarAtributosFiltro(cx, id_tenant) {
  const [attrs] = await cx.query(
    `SELECT id_atributo, nombre, codigo, tipo_input, slug
     FROM atributo
     WHERE id_tenant = ? AND es_filtro = 1 AND es_visible = 1
     ORDER BY orden, nombre`,
    [id_tenant]
  );
  if (!attrs.length) return [];

  const result = [];
  for (const a of attrs) {
    const [valores] = await cx.query(
      `SELECT DISTINCT av.valor
       FROM atributo_valor av
       INNER JOIN producto_atributo_valor pav
         ON pav.id_valor = av.id_valor AND pav.id_tenant = av.id_tenant
       WHERE av.id_atributo = ? AND av.id_tenant = ?
       ORDER BY av.valor
       LIMIT 50`,
      [a.id_atributo, id_tenant]
    );
    result.push({
      id_atributo: a.id_atributo,
      nombre: a.nombre,
      codigo: a.codigo,
      slug: a.slug,
      tipo_input: a.tipo_input,
      valores: valores.map((v) => v.valor),
    });
  }
  return result;
}

export async function getProductoDetalle(cx, {
  id_tenant,
  id_producto,
  id_sucursal = null,
  umbral = 5,
}) {
  const cols = await productoTiendaColumns(cx);
  const selectExtra = [
    cols.has("destacado_tienda") ? "PR.destacado_tienda" : "0 AS destacado_tienda",
    cols.has("slug_tienda") ? "PR.slug_tienda" : "NULL AS slug_tienda",
  ].join(", ");
  const visibleClause = cols.has("visible_tienda")
    ? "AND COALESCE(PR.visible_tienda, 1) = 1"
    : "";

  const [[p]] = await cx.query(
    `SELECT PR.id_producto AS codigo, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
            PR.imagen_url, PR.undm, ${selectExtra}, PR.stock_min,
            MA.nom_marca, CA.nom_subcat AS categoria, CA.id_subcategoria, MA.id_marca,
            PR.id_subcategoria AS id_subcat
     FROM producto PR
     INNER JOIN marca MA ON MA.id_marca = PR.id_marca
     INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
     WHERE PR.id_producto = ? AND PR.id_tenant = ? AND PR.estado_producto = 1
       ${visibleClause}
     LIMIT 1`,
    [id_producto, id_tenant]
  );
  if (!p) return null;

  const almacenes = await resolveAlmacenes(cx, id_tenant, id_sucursal);
  const stockMap = await stockDisponibleMap(cx, {
    id_tenant,
    ids_producto: [p.codigo],
    id_almacen: almacenes && almacenes.length ? almacenes : null,
  });
  const stockGlobalMap = await stockDisponibleMap(cx, {
    id_tenant,
    ids_producto: [p.codigo],
  });
  const stock = stockMap.get(p.codigo) ?? 0;
  const stockGlobal = stockGlobalMap.get(p.codigo) ?? 0;
  const disp = disponibilidadEstado(stock, umbral, stock === 0 && stockGlobal > 0);

  const imagesMap = await listarPorProductos(cx, {
    id_tenant,
    ids_producto: [p.codigo],
  });
  const images = imagesMap.get(p.codigo) ?? [];

  // Variantes / SKUs
  const idAlmacenUnico =
    almacenes && almacenes.length === 1 ? almacenes[0] : almacenes?.[0] ?? null;
  const filas = await filasDeProducto(cx, {
    id_tenant,
    id_producto: p.codigo,
    id_almacen: idAlmacenUnico,
  });

  // Si hay varios almacenes, recalcular disponible por SKU sumando
  let variantes = [];
  if (almacenes && almacenes.length > 1) {
    const [skus] = await cx.query(
      `SELECT id_sku, sku, cod_barras, CAST(precio AS DECIMAL(10,2)) AS precio, attributes_json, estado
       FROM producto_sku
       WHERE id_producto = ? AND id_tenant = ? AND (estado = 1 OR estado IS NULL)`,
      [p.codigo, id_tenant]
    );
    for (const sku of skus) {
      let disponible = 0;
      for (const alm of almacenes) {
        const row = await stockPorSku(cx, {
          id_tenant,
          id_sku: sku.id_sku,
          id_almacen: alm,
        });
        if (row) disponible += Math.max(0, row.stock - row.reservado);
      }
      variantes.push({
        id_sku: sku.id_sku,
        sku: sku.sku,
        cod_barras: sku.cod_barras,
        precio: sku.precio != null ? Number(sku.precio) : Number(p.precio),
        attributes_json:
          typeof sku.attributes_json === "string"
            ? JSON.parse(sku.attributes_json || "{}")
            : sku.attributes_json || {},
        stock: disponible,
        disponibilidad: disponibilidadEstado(disponible, umbral),
      });
    }
  } else {
    const [skus] = await cx.query(
      `SELECT id_sku, sku, cod_barras, CAST(precio AS DECIMAL(10,2)) AS precio, attributes_json, estado
       FROM producto_sku
       WHERE id_producto = ? AND id_tenant = ? AND (estado = 1 OR estado IS NULL)`,
      [p.codigo, id_tenant]
    );
    const stockBySku = new Map();
    for (const f of filas) {
      const prev = stockBySku.get(f.id_sku) || 0;
      stockBySku.set(f.id_sku, prev + Math.max(0, Number(f.stock) - Number(f.reservado || 0)));
    }
    const skuMap = new Map(skus.map((s) => [s.id_sku, s]));
    const idsSeen = new Set();
    variantes = [];
    for (const f of filas) {
      if (idsSeen.has(f.id_sku)) continue;
      idsSeen.add(f.id_sku);
      const meta = skuMap.get(f.id_sku) || {};
      const disponible = stockBySku.get(f.id_sku) ?? 0;
      variantes.push({
        id_sku: f.id_sku,
        sku: f.sku || meta.sku,
        cod_barras: f.cod_barras || meta.cod_barras,
        precio: meta.precio != null ? Number(meta.precio) : Number(p.precio),
        attributes_json:
          typeof (f.attributes_json || meta.attributes_json) === "string"
            ? JSON.parse(f.attributes_json || meta.attributes_json || "{}")
            : f.attributes_json || meta.attributes_json || {},
        stock: disponible,
        disponibilidad: disponibilidadEstado(disponible, umbral),
      });
    }
    // SKUs sin fila de inventario
    for (const sku of skus) {
      if (idsSeen.has(sku.id_sku)) continue;
      variantes.push({
        id_sku: sku.id_sku,
        sku: sku.sku,
        cod_barras: sku.cod_barras,
        precio: sku.precio != null ? Number(sku.precio) : Number(p.precio),
        attributes_json:
          typeof sku.attributes_json === "string"
            ? JSON.parse(sku.attributes_json || "{}")
            : sku.attributes_json || {},
        stock: 0,
        disponibilidad: disponibilidadEstado(0, umbral),
      });
    }
  }

  // Atributos informativos visibles
  const [attrs] = await cx.query(
    `SELECT A.id_atributo, A.nombre, A.tipo_input, A.slug, AV.valor
     FROM producto_atributo_valor PAV
     INNER JOIN atributo_valor AV ON AV.id_valor = PAV.id_valor AND AV.id_tenant = PAV.id_tenant
     INNER JOIN atributo A ON A.id_atributo = AV.id_atributo AND A.id_tenant = PAV.id_tenant
     WHERE PAV.id_producto = ? AND PAV.id_tenant = ? AND A.es_visible = 1
     ORDER BY A.orden, A.nombre`,
    [p.codigo, id_tenant]
  );

  // Ejes de variante (atributos usados en SKUs)
  const ejes = new Map();
  for (const v of variantes) {
    for (const [k, val] of Object.entries(v.attributes_json || {})) {
      if (!ejes.has(k)) ejes.set(k, new Set());
      ejes.get(k).add(String(val));
    }
  }
  let ejesNamed = [];
  if (ejes.size) {
    const idsAttr = [...ejes.keys()].map(Number).filter(Boolean);
    if (idsAttr.length) {
      const [nombres] = await cx.query(
        `SELECT id_atributo, nombre, tipo_input, slug
         FROM atributo WHERE id_tenant = ? AND id_atributo IN (${idsAttr.map(() => "?").join(",")})`,
        [id_tenant, ...idsAttr]
      );
      const nameMap = new Map(nombres.map((n) => [String(n.id_atributo), n]));
      ejesNamed = idsAttr.map((id) => {
        const meta = nameMap.get(String(id));
        return {
          id_atributo: id,
          nombre: meta?.nombre || `Atributo ${id}`,
          tipo_input: meta?.tipo_input || "SELECT",
          slug: meta?.slug || null,
          valores: [...(ejes.get(String(id)) || [])],
        };
      });
    }
  }

  // Disponibilidad por sucursal
  const [sucRows] = await cx.query(
    `SELECT s.id_sucursal, s.nombre_sucursal AS nombre, s.ubicacion AS direccion
     FROM sucursal s
     WHERE s.id_tenant = ? AND (s.estado_sucursal = 1 OR s.estado_sucursal IS NULL)`,
    [id_tenant]
  );
  const porSucursal = [];
  for (const s of sucRows) {
    const alms = await almacenesDeSucursal(cx, s.id_sucursal, id_tenant);
    const map = await disponiblePorProducto(cx, {
      id_tenant,
      ids_producto: [p.codigo],
      id_almacen: alms.length ? alms : [],
    });
    const st = map.get(p.codigo) ?? 0;
    porSucursal.push({
      id_sucursal: s.id_sucursal,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: null,
      stock: st,
      disponibilidad: disponibilidadEstado(st, umbral),
    });
  }

  const slug = p.slug_tienda || `${slugify(p.descripcion)}-${p.codigo}`;

  return {
    codigo: p.codigo,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    imagen_url: p.imagen_url || images[0] || null,
    images,
    undm: p.undm,
    nom_marca: p.nom_marca,
    categoria: p.categoria,
    id_subcategoria: p.id_subcategoria,
    id_marca: p.id_marca,
    destacado: Number(p.destacado_tienda) === 1,
    slug,
    stock: disp.stock,
    disponibilidad: disp,
    atributos: attrs.map((a) => ({
      id_atributo: a.id_atributo,
      nombre: a.nombre,
      valor: a.valor,
      tipo_input: a.tipo_input,
      slug: a.slug,
    })),
    ejes_variante: ejesNamed,
    variantes,
    stock_por_sucursal: porSucursal,
  };
}

export async function productosRelacionados(cx, {
  id_tenant,
  id_producto,
  id_subcategoria,
  id_marca,
  limit = 8,
  umbral = 5,
}) {
  const [rows] = await cx.query(
    `SELECT PR.id_producto AS codigo, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
            PR.imagen_url, PR.slug_tienda, MA.nom_marca, CA.nom_subcat AS categoria
     FROM producto PR
     INNER JOIN marca MA ON MA.id_marca = PR.id_marca
     INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
     WHERE PR.id_tenant = ? AND PR.estado_producto = 1
       AND COALESCE(PR.visible_tienda, 1) = 1
       AND PR.id_producto <> ?
       AND (PR.id_subcategoria = ? OR PR.id_marca = ?)
     ORDER BY (PR.id_subcategoria = ?) DESC, PR.destacado_tienda DESC, PR.id_producto DESC
     LIMIT ?`,
    [id_tenant, id_producto, id_subcategoria, id_marca, id_subcategoria, limit]
  );

  const ids = rows.map((r) => r.codigo);
  const stockMap = ids.length
    ? await disponiblePorProducto(cx, { id_tenant, ids_producto: ids })
    : new Map();
  const imagesMap = ids.length
    ? await listarPorProductos(cx, { id_tenant, ids_producto: ids })
    : new Map();

  return rows.map((p) => {
    const stock = stockMap.get(p.codigo) ?? 0;
    const images = imagesMap.get(p.codigo) ?? [];
    return {
      codigo: p.codigo,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      imagen_url: p.imagen_url || images[0] || null,
      images,
      nom_marca: p.nom_marca,
      categoria: p.categoria,
      slug: p.slug_tienda || `${slugify(p.descripcion)}-${p.codigo}`,
      stock,
      disponibilidad: disponibilidadEstado(stock, umbral),
    };
  });
}

export async function productosMasVendidos(cx, { id_tenant, limit = 8, umbral = 5 }) {
  const [rows] = await cx.query(
    `SELECT PR.id_producto AS codigo, PR.descripcion, CAST(PR.precio AS DECIMAL(10,2)) AS precio,
            PR.imagen_url, PR.slug_tienda, MA.nom_marca, CA.nom_subcat AS categoria,
            SUM(dv.cantidad) AS vendidos
     FROM detalle_venta dv
     INNER JOIN venta v ON v.id_venta = dv.id_venta AND v.id_tenant = ?
     INNER JOIN producto PR ON PR.id_producto = dv.id_producto AND PR.id_tenant = ?
     INNER JOIN marca MA ON MA.id_marca = PR.id_marca
     INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
     WHERE v.estado_venta = 1 AND PR.estado_producto = 1
       AND COALESCE(PR.visible_tienda, 1) = 1
       AND v.f_venta >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
     GROUP BY PR.id_producto
     ORDER BY vendidos DESC
     LIMIT ?`,
    [id_tenant, id_tenant, limit]
  );

  const ids = rows.map((r) => r.codigo);
  const stockMap = ids.length
    ? await disponiblePorProducto(cx, { id_tenant, ids_producto: ids })
    : new Map();

  return rows.map((p) => {
    const stock = stockMap.get(p.codigo) ?? 0;
    return {
      codigo: p.codigo,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      imagen_url: p.imagen_url,
      nom_marca: p.nom_marca,
      categoria: p.categoria,
      slug: p.slug_tienda || `${slugify(p.descripcion)}-${p.codigo}`,
      stock,
      vendidos: Number(p.vendidos),
      disponibilidad: disponibilidadEstado(stock, umbral),
    };
  });
}
