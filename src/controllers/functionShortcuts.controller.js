import OpenAI from "openai";
import axios from "axios";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Helper: construir URL base http/https actual
const baseUrlFromReq = (req) => `${req.protocol}://${req.get("host")}`;

// Helper GET interno (propaga cookie/sesión y params)
async function getInternal(req, path, params = {}) {
  const url = baseUrlFromReq(req) + path;
  const { data } = await axios.get(url, {
    params,
    headers: req.headers.cookie ? { Cookie: req.headers.cookie } : undefined,
    withCredentials: true
  });
  return data;
}

// Catálogo de endpoints GET (solo existentes en reporte.routes)
const GETS = {
  ventas: {
    ganancias: "/api/reporte/ganancias",
    productosVendidos: "/api/reporte/productos_vendidos",
    productoTop: "/api/reporte/producto_top",
    cantidadPorProducto: "/api/reporte/cantidad_por_producto",
    cantidadPorSubcategoria: "/api/reporte/cantidad_por_subcategoria",
    analisisSucursales: "/api/reporte/analisis_ganancias_sucursales",
    libroVentasSunat: "/api/reporte/libro_ventas_sunat",
    registroVentasSunat: "/api/reporte/registro_ventas_sunat",
    sucursales: "/api/reporte/sucursales",
    rendimientoSucursal: "/api/reporte/ventas_sucursal",
    tendenciaVentas: "/api/reporte/tendencia_ventas",
    topProductosMargen: "/api/reporte/top_productos_margen"
  },
  kardex: {
    productos: "/api/kardex",
    almacenes: "/api/kardex/almacen",
    categorias: "/api/kardex/categoria",
    subcategorias: "/api/kardex/subcategoria",
    producto: "/api/kardex/producto",
    stockCritico: "/api/kardex/stock_critico",
    stockBajoUmbral: "/api/kardex/stock_bajo_umbral",
    productosSinMovimiento: "/api/kardex/productos_sin_movimiento",
    productosMayorRotacion: "/api/kardex/productos_mayor_rotacion",
    inventarioValorizado: "/api/kardex/inventario_valorizado",
    historialMovimientos: "/api/kardex/historial_movimientos"
  },
  reportes: {
    ganancias: "/api/reporte/ganancias",
    productosVendidos: "/api/reporte/productos_vendidos",
    tendenciaVentas: "/api/reporte/tendencia_ventas",
    topProductosMargen: "/api/reporte/top_productos_margen",
    analisisSucursales: "/api/reporte/analisis_ganancias_sucursales",
    sucursales: "/api/reporte/sucursales",
    libroVentasSunat: "/api/reporte/libro_ventas_sunat",
    resumenEjecutivo: "/api/reporte/resumen_ejecutivo"
  },
  usuarios: {
    list: "/api/usuario",
    roles: "/api/rol",
    resumen: "/api/usuario/resumen",
    distribucionPorRol: "/api/usuario/distribucion_rol",
    activos: "/api/usuario/activos",
    inactivos: "/api/usuario/inactivos",
    masVentas: "/api/usuario/mas_ventas",
    masRegistros: "/api/usuario/mas_registros"
  },
  proveedores: {
    list: "/api/destinatario",
    resumen: "/api/destinatario/resumen",
    topUbicaciones: "/api/destinatario/top_ubicaciones"
  },
  compras: {
    notasIngreso: "/api/nota_ingreso",
    destinatarios: "/api/nota_ingreso/destinatario",
    promedioMensual: "/api/nota_ingreso/promedio_mensual",
    proveedoresFrecuentes: "/api/nota_ingreso/proveedores_frecuentes",
    topProveedoresMonto: "/api/nota_ingreso/top_proveedores_monto",
    tendenciaMes: "/api/nota_ingreso/tendencia_mes"
  },
  clientes: {
    registroVentasSunat: "/api/reporte/registro_ventas_sunat",
    libroVentasSunat: "/api/reporte/libro_ventas_sunat",
    topIngresos: "/api/clientes/top_ingresos",
    frecuenciaCompra: "/api/clientes/frecuencia_compra",
    ticketPromedio: "/api/clientes/ticket_promedio",
    nuevosMes: "/api/clientes/nuevos_mes",
    inactivos: "/api/clientes/inactivos",
    ubicacion: "/api/clientes/ubicacion"
  },
  productos: {
    cantidadPorProducto: "/api/reporte/cantidad_por_producto",
    topProductosMargen: "/api/reporte/top_productos_margen",
    detalle: "/api/productos/detalle",
    topSubcategorias: "/api/productos/top_subcategorias"
  },
  almacenes: {
    analisisSucursales: "/api/reporte/analisis_ganancias_sucursales",
    sucursales: "/api/reporte/sucursales",
    rankingVentas: "/api/almacen/ranking_ventas",
    mayorRendimiento: "/api/almacen/mayor_rendimiento",
    mayorCrecimiento: "/api/almacen/mayor_crecimiento",
    menorStock: "/api/almacen/menor_stock",
    mayorVariedad: "/api/almacen/mayor_variedad"
  }
};

// ================= Natural Language helpers (filtros) =================
const MONTHS_MAP = {
  "enero":"01","febrero":"02","marzo":"03","abril":"04","mayo":"05","junio":"06",
  "julio":"07","agosto":"08","septiembre":"09","setiembre":"09","octubre":"10","noviembre":"11","diciembre":"12",
  "ene":"01","feb":"02","mar":"03","abr":"04","may":"05","jun":"06","jul":"07","ago":"08","sep":"09","oct":"10","nov":"11","dic":"12"
};
const norm = (s="") => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

let sucCache = { ts:0, list:[] };
async function getSucursalesLite(req) {
  const now = Date.now();
  if (now - sucCache.ts < 60_000 && sucCache.list?.length) return sucCache.list;
  const resp = await getInternal(req, GETS.almacenes.sucursales, {});
  const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
  sucCache = {
    ts: now,
    list: rows.map(r => ({
      id: r.id_sucursal || r.id,
      name: r.nombre_sucursal || r.nombre || ""
    }))
  };
  return sucCache.list;
}

async function resolveSucursalIdFromText(req, text="") {
  const t = norm(text);
  const list = await getSucursalesLite(req);
  for (const s of list) {
    const name = norm(s.name);
    if (!name) continue;
    if (t.includes(name) || t.includes("sucursal "+name) || t.includes("tienda "+name)) {
      return s.id;
    }
  }
  return null;
}

function parseYearMonthWeek(text="") {
  const t = norm(text);
  const now = new Date();
  let year, month, week;

  const yMatch = t.match(/\b(20\d{2})\b/);
  if (yMatch) year = yMatch[1];
  if (!year && (/\b(ano|año)\s+actual\b/.test(t) || /\beste\s+(ano|año)\b/.test(t))) {
    year = String(now.getFullYear());
  }

  if (/\bmes\s+actual\b/.test(t)) month = String(now.getMonth()+1).padStart(2,"0");
  for (const k of Object.keys(MONTHS_MAP)) {
    if (t.includes(` ${k} `) || t.startsWith(`${k} `) || t.endsWith(` ${k}`)) {
      month = MONTHS_MAP[k]; break;
    }
  }

  const w = t.match(/semana\s*(\d{1,2})/);
  if (w) week = `Semana ${parseInt(w[1], 10)}`;

  return { year, month, week };
}

function parseTipoComprobante(text="") {
  const t = norm(text);
  const tipos = [];
  if (/boleta(s)?/.test(t)) tipos.push("Boleta");
  if (/factura(s)?/.test(t)) tipos.push("Factura");
  if (/nota(s)?\s+de\s+venta/.test(t) || /\bnota\b/.test(t)) tipos.push("Nota de venta");
  return tipos.length ? tipos.join(",") : null;
}

function parseLimit(text="") {
  const t = norm(text);
  const m = t.match(/\btop\s*(\d{1,2})\b/) || t.match(/\bprimeros?\s*(\d{1,2})\b/);
  return m ? Number(m[1]) : null;
}

function parseCategoria(text = "") {
  const t = norm(text);
  const m =
    t.match(/categor[ií]a\s+([a-z0-9\- áéíóúñ]+)/i) ||
    t.match(/subcategor[ií]a\s+([a-z0-9\- áéíóúñ]+)/i) ||
    t.match(/solo\s+productos?\s+de\s+([a-z0-9\- áéíóúñ]+)/i);
  return m ? m[1].trim() : null;
}
function parseStockThreshold(text = "") {
  const t = norm(text);
  const m = t.match(/stock\s*(menor|<=|<|bajo|hasta)\s*(\d{1,4})/);
  return m ? Number(m[2]) : null;
}

// NUEVO: detectar nombre de producto y código de barras
function parseProductoNombre(text = "") {
  // Prioriza texto entre comillas: "AYLIN", 'AYLIN'
  const q = text.match(/["“”']([^"“”']+)["“”']/);
  if (q) return q[1].trim();
  // Luego patrones comunes: "producto AYLIN", "modelo AYLIN"
  const m =
    text.match(/producto\s+([a-zA-Z0-9\-\/., áéíóúñ]+)/i) ||
    text.match(/modelo\s+([a-zA-Z0-9\-\/., áéíóúñ]+)/i);
  return m ? m[1].trim() : null;
}
function parseCodigoBarras(text = "") {
  const m = text.match(/\b(c[oó]digo|barcode|cod|cb)\s*[:#]?\s*([a-z0-9\-]+)\b/i);
  return m ? m[2].trim() : null;
}

async function detectNaturalFilters(req, question="") {
  const { year, month, week } = parseYearMonthWeek(question);
  const tipoComprobante = parseTipoComprobante(question);
  const limit = parseLimit(question);
  const id_sucursal = await resolveSucursalIdFromText(req, question);
  const categoria = parseCategoria(question);
  const stockThreshold = parseStockThreshold(question);
  const productoNombre = parseProductoNombre(question);
  const codigoBarras = parseCodigoBarras(question);
  return { year, month, week, tipoComprobante, limit, id_sucursal, categoria, stockThreshold, productoNombre, codigoBarras };
}

// =====================================================================

// Intentos predefinidos por entidad (reduce ambigüedad para la IA)
const INTENTS = {
  ventas: [
    {
      key: "promedio_mensual_anio_actual",
      label: "Promedio mensual (año actual)",
      keywords: /promedio|media|por mes|mensual|año actual|este año/i,
      resolver: async (req, { id_sucursal, year, tipoComprobante }) => {
        const y = Number(year) || new Date().getFullYear();
        // Traemos todas las ventas del año (listado normalizado)
        const rv = await getInternal(req, GETS.ventas.libroVentasSunat, {
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          id_sucursal
        });
        let rows = Array.isArray(rv?.data) ? rv.data : [];

        // Filtro opcional por tipo de comprobante (si existe el campo en el dataset)
        if (tipoComprobante) {
          const tipos = new Set(tipoComprobante.split(",").map(s => s.trim().toLowerCase()));
          rows = rows.filter(r => tipos.has(String(r.tipoComprobante || r.tipocomprobante || "").toLowerCase()));
        }

        const monthly = Array.from({ length: 12 }, (_, i) => ({
          mesIndex: i,
          mes: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i],
          count: 0,
          ingresos: 0
        }));
        for (const r of rows) {
          const d = new Date(r.fecha);
          if (!Number.isFinite(d.getTime()) || d.getFullYear() !== y) continue;
          const m = d.getMonth();
          monthly[m].count += 1;
          monthly[m].ingresos += Number(r.total) || 0;
        }
        const totCount = monthly.reduce((a,b)=>a+b.count,0);
        const totIngresos = monthly.reduce((a,b)=>a+b.ingresos,0);
        return {
          context: { year: y, id_sucursal: id_sucursal || null, monthly,
            totals: { totalCount: totCount, totalIngresos: totIngresos, avgCount: totCount/12, avgIngresos: totIngresos/12 },
            applied: { tipoComprobante: tipoComprobante || null }
          },
          prompt: "Calcula y muestra el promedio mensual de cantidad de ventas y de ingresos del año indicado; lista los 12 meses y cierra con un resumen."
        };
      }
    },
    {
      key: "tendencia_ultimos_30",
      label: "Tendencia últimos 30 días",
      keywords: /tendencia|evoluci[oó]n|30 d[ií]as|[uú]ltimos 30/i,
      resolver: async (req, { id_sucursal, year, month }) => {
        const now = new Date();
        const y = Number(year) || now.getFullYear();
        const m = String(Number(month) || (now.getMonth()+1)).padStart(2,"0");
        const tv = await getInternal(req, GETS.ventas.tendenciaVentas, { id_sucursal, year: y, month: m });
        return {
          context: { raw: tv?.data || [], id_sucursal: id_sucursal || null, year: y, month: m },
          prompt: "Genera un breve análisis de tendencia diaria de ventas del mes indicado. Destaca días pico, mínimos y el total."
        };
      }
    },
    {
      key: "top_productos_margen",
      label: "Top productos por margen",
      keywords: /top|mejores|margen|rentables/i,
      resolver: async (req, { id_sucursal, limit = 5, year }) => {
        const y = Number(year) || new Date().getFullYear();
        const lim = Number(limit) || 5;
        const tp = await getInternal(req, GETS.ventas.topProductosMargen, { id_sucursal, year: y, limit: lim });
        return {
          context: { items: tp?.data || [], id_sucursal: id_sucursal || null, year: y, limit: lim },
          prompt: "Resume los top productos por margen, indicando margen% y ventas (S/). Conclusión breve y acción sugerida."
        };
      }
    },
    {
      key: "kpis_resumen",
      label: "KPIs de ventas (año actual)",
      keywords: /kpi|resumen|totales|ingresos|productos vendidos/i,
      resolver: async (req, { id_sucursal, year }) => {
        const y = Number(year) || new Date().getFullYear();
        const [gan, prod] = await Promise.all([
          getInternal(req, GETS.ventas.ganancias, { id_sucursal, year: y }),
          getInternal(req, GETS.ventas.productosVendidos, { id_sucursal, year: y })
        ]);
        return {
          context: {
            ingresos: gan?.totalRevenue ?? gan?.data ?? 0,
            productosVendidos: prod?.totalProductosVendidos ?? prod?.data ?? 0,
            comparativo: gan?.porcentaje ?? null,
            id_sucursal: id_sucursal || null,
            year: y
          },
          prompt: "Genera KPIs concisos: ingresos anuales, productos vendidos y variación vs periodo anterior si existe."
        };
      }
    },
     // NUEVO: Top subcategorías por cantidad (usa /cantidad_por_subcategoria)
    {
      key: "ventas_top_subcategorias",
      label: "Top subcategorías por cantidad",
      keywords: /subcategor(i|í)as?|categor(i|í)as?|top\s+sub/i,
      resolver: async (req, { id_sucursal, year, month, week, limit = 5 }) => {
        const params = { id_sucursal, year, month, week };
        const resp = await getInternal(req, GETS.ventas.cantidadPorSubcategoria, params);
        const list = Array.isArray(resp?.data) ? resp.data : [];
        const ranking = list
          .map(r => ({ subcategoria: r.nom_subcat || r.subcategoria || "-", cantidad: Number(r.cantidad_vendida) || 0 }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, Number(limit) || 5);
        const total = ranking.reduce((a, b) => a + b.cantidad, 0);
        return {
          context: { ranking, total, filtros: { year, month, week, id_sucursal, limit: Number(limit) || 5 } },
          prompt: "Muestra el top de subcategorías por cantidad vendida en el periodo y añade observaciones breves (concentración, nichos, etc.)."
        };
      }
    },

    // NUEVO: Top productos por unidades (en Ventas, alias directo)
    {
      key: "ventas_top_productos_unidades",
      label: "Top productos por unidades",
      keywords: /top\s+productos|m[aá]s\s+vendidos|ranking\s+productos/i,
      resolver: async (req, { id_sucursal, year, month, week, limit = 5 }) => {
        const params = { id_sucursal, year, month, week };
        const resp = await getInternal(req, GETS.ventas.cantidadPorProducto, params);
        const items = Array.isArray(resp?.data) ? resp.data : [];
        const ranking = items
          .map(i => ({ nombre: i.nombre || i.descripcion, unidades: Number(i.cantidad_vendida) || 0, ingresos: Number(i.dinero_generado) || 0 }))
          .sort((a, b) => b.unidades - a.unidades)
          .slice(0, Number(limit) || 5);
        const totalU = ranking.reduce((a, b) => a + b.unidades, 0);
        const totalS = ranking.reduce((a, b) => a + b.ingresos, 0);
        return {
          context: { ranking, totalUnidades: totalU, totalIngresos: totalS, filtros: { id_sucursal, year, month, week, limit: Number(limit) || 5 } },
          prompt: "Lista el top de productos por unidades e ingresos y comenta canibalización, dependencias y oportunidad de bundles."
        };
      }
    },

    // NUEVO: Ticket promedio del periodo (usa /libro_ventas_sunat)
    {
      key: "ventas_ticket_promedio",
      label: "Ticket promedio del periodo",
      keywords: /ticket\s+promedio|promedio\s+por\s+venta|avg\s+ticket/i,
      resolver: async (req, { id_sucursal, year, month, week, tipoComprobante }) => {
        // Rango: mes si viene, si no año
        const now = new Date();
        const y = Number(year) || now.getFullYear();
        const m = month ? Number(month) - 1 : null;
        const start = m !== null ? new Date(y, m, 1) : new Date(y, 0, 1);
        const end = m !== null ? new Date(y, m + 1, 0) : new Date(y, 11, 31);
        const f = d => d.toISOString().slice(0,10);

        const rv = await getInternal(req, GETS.ventas.libroVentasSunat, {
          startDate: f(start), endDate: f(end), id_sucursal
        });
        let rows = Array.isArray(rv?.data) ? rv.data : [];
        if (tipoComprobante) {
          const tipos = new Set(tipoComprobante.split(",").map(s => s.trim().toLowerCase()));
          rows = rows.filter(r => tipos.has(String(r.tipoComprobante || r.tipocomprobante || "").toLowerCase()));
        }
        const total = rows.reduce((a, r) => a + (Number(r.total) || 0), 0);
        const count = rows.length || 1;
        const avg = total / count;
        return {
          context: { year: y, month: m !== null ? String(m+1).padStart(2,"0") : null, id_sucursal: id_sucursal || null, total, ventas: count, ticketPromedio: avg },
          prompt: "Calcula el ticket promedio del periodo, comenta dispersión si total/ventas es bajo/alto y sugiere acciones para elevarlo."
        };
      }
    },

    // NUEVO: Sucursal destacada en el periodo (usa /ventas_sucursal)
    {
      key: "ventas_sucursal_destacada",
      label: "Sucursal destacada del periodo",
      keywords: /sucursal\s+(destacada|mejor)|mejor\s+sucursal|rendimiento/i,
      resolver: async (req, { year, month, week }) => {
        const resp = await getInternal(req, GETS.ventas.rendimientoSucursal, { year, month, week });
        return {
          context: resp?.data || {},
          prompt: "Redacta la sucursal con mayor rendimiento del periodo, su participación y variación vs periodo anterior."
        };
      }
    },
  ],
  clientes: [
    {
      key: "top_clientes_ingresos_anual",
      label: "Top clientes por ingresos (año actual)",
      keywords: /top|mejores|clientes|ingresos|a[nñ]o actual|este a[nñ]o/i,
      resolver: async (req, { id_sucursal, limit = 5, year, tipoComprobante }) => {
        const y = Number(year) || new Date().getFullYear();
        const rv = await getInternal(req, GETS.clientes.libroVentasSunat, {
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          id_sucursal
        });
        let rows = Array.isArray(rv?.data) ? rv.data : [];
        if (tipoComprobante) {
          const tipos = new Set(tipoComprobante.split(",").map(s => s.trim().toLowerCase()));
          rows = rows.filter(r => tipos.has(String(r.tipoComprobante || r.tipocomprobante || "").toLowerCase()));
        }
        const byClient = new Map();
        for (const r of rows) {
          const k = r.nombre_cliente || r.cliente || "SIN NOMBRE";
          const total = Number(r.total) || 0;
          byClient.set(k, (byClient.get(k) || 0) + total);
        }
        const ranking = Array.from(byClient.entries())
          .map(([nombre, ingresos]) => ({ nombre, ingresos }))
          .sort((a, b) => b.ingresos - a.ingresos)
          .slice(0, Number(limit));
        const suma = ranking.reduce((a, b) => a + b.ingresos, 0);
        return {
          context: { year: y, id_sucursal: id_sucursal || null, ranking, totalIngresosTop: suma, limit },
          prompt: "Redacta un breve ranking de clientes por ingresos del año actual. Añade porcentaje relativo dentro del top y una recomendación de fidelización."
        };
      }
    },
    {
      key: "frecuencia_clientes_anual",
      label: "Frecuencia de compra (año actual)",
      keywords: /frecuencia|recompra|veces|n[uú]mero de compras|a[nñ]o actual/i,
      resolver: async (req, { id_sucursal, limit = 5, year, tipoComprobante }) => {
        const y = Number(year) || new Date().getFullYear();
        const rv = await getInternal(req, GETS.clientes.libroVentasSunat, {
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          id_sucursal
        });
        let rows = Array.isArray(rv?.data) ? rv.data : [];
        if (tipoComprobante) {
          const tipos = new Set(tipoComprobante.split(",").map(s => s.trim().toLowerCase()));
          rows = rows.filter(r => tipos.has(String(r.tipoComprobante || r.tipocomprobante || "").toLowerCase()));
        }
        const byClient = new Map();
        for (const r of rows) {
          const k = r.nombre_cliente || r.cliente || "SIN NOMBRE";
          byClient.set(k, (byClient.get(k) || 0) + 1);
        }
        const ranking = Array.from(byClient.entries())
          .map(([nombre, veces]) => ({ nombre, veces }))
          .sort((a, b) => b.veces - a.veces)
          .slice(0, Number(limit));
        const promedio = ranking.reduce((a, b) => a + b.veces, 0) / (ranking.length || 1);
        return {
          context: { year: y, id_sucursal: id_sucursal || null, ranking, promedio, limit },
          prompt: "Resume los clientes más frecuentes del año actual y el promedio de compras. Incluye idea de campaña de suscripción o cupones."
        };
      }
    },
      {
      key: "clientes_ticket_promedio",
      label: "Clientes con mayor ticket promedio",
      keywords: /ticket\s+promedio\s+cliente|clientes\s+con\s+mayor\s+ticket/i,
      resolver: async (req, { id_sucursal, limit = 5, year, tipoComprobante }) => {
        const y = Number(year) || new Date().getFullYear();
        const rv = await getInternal(req, GETS.clientes.libroVentasSunat, {
          startDate: `${y}-01-01`, endDate: `${y}-12-31`, id_sucursal
        });
        let rows = Array.isArray(rv?.data) ? rv.data : [];
        if (tipoComprobante) {
          const tipos = new Set(tipoComprobante.split(",").map(s => s.trim().toLowerCase()));
          rows = rows.filter(r => tipos.has(String(r.tipoComprobante || r.tipocomprobante || "").toLowerCase()));
        }
        const map = new Map();
        for (const r of rows) {
          const n = r.nombre_cliente || r.cliente || "SIN NOMBRE";
          const tot = Number(r.total) || 0;
          const cur = map.get(n) || { total: 0, n: 0 };
          map.set(n, { total: cur.total + tot, n: cur.n + 1 });
        }
        const ranking = Array.from(map.entries())
          .map(([cliente, v]) => ({ cliente, ticketPromedio: v.n ? v.total / v.n : 0, compras: v.n, total: v.total }))
          .sort((a, b) => b.ticketPromedio - a.ticketPromedio)
          .slice(0, Number(limit) || 5);
        return {
          context: { year: y, id_sucursal: id_sucursal || null, ranking, limit: Number(limit) || 5 },
          prompt: "Lista los clientes con mayor ticket promedio, indicando compras y total. Concluye con acción de fidelización premium."
        };
      }
    }
  ],
  productos: [
    {
      // existente; ahora con filtro por categoría
      key: "top_unidades_ingresos",
      label: "Top por unidades e ingresos",
      keywords: /top|productos|unidades|ingresos|m[aá]s vendidos/i,
      resolver: async (req, { id_sucursal, limit = 5, year, categoria }) => {
        const y = Number(year) || new Date().getFullYear();
        const resp = await getInternal(req, GETS.productos.cantidadPorProducto, { id_sucursal, year: y, limit: 1000 });
        let items = Array.isArray(resp?.data) ? resp.data : [];
        if (categoria) {
          const t = norm(categoria);
          items = items.filter(i => norm(i.descripcion || i.nombre || "").includes(t));
        }
        const ranking = items
          .map(i => ({ nombre: i.nombre || i.descripcion, unidades: Number(i.cantidad_vendida) || 0, ingresos: Number(i.dinero_generado) || 0 }))
          .sort((a, b) => b.unidades - a.unidades)
          .slice(0, Number(limit) || 5);
        const totU = ranking.reduce((a, b) => a + b.unidades, 0);
        const totS = ranking.reduce((a, b) => a + b.ingresos, 0);
        return {
          context: { year: y, id_sucursal: id_sucursal || null, categoria: categoria || null, ranking, totalUnidades: totU, totalIngresos: totS, limit: Number(limit) || 5 },
          prompt: "Lista el top por unidades e ingresos (filtrando por categoría si aplica) y añade una recomendación de reabastecimiento."
        };
      }
    },
    // NUEVO: Detalle de un producto (línea, sublínea, estado, undm, precio, stock)
    {
      key: "detalle_producto",
      label: "Detalle de producto",
      keywords: /detalle|info|informaci[oó]n|estado|categor[ií]a|subcategor[ií]a|l[ií]nea|sub\s*l[ií]nea|undm|unidad|precio|c[oó]digo|barcode/i,
      resolver: async (req, { productoNombre, codigoBarras }) => {
        // Traer listado de productos de Kardex (filtrado por descripción si hay nombre)
        const params = {};
        if (productoNombre) params.descripcion = productoNombre;
        const resp = await getInternal(req, GETS.kardex.productos, params);
        let items = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

        // Filtrar por código de barras si fue indicado
        if (codigoBarras) {
          const cb = norm(codigoBarras);
          items = items.filter(p => norm(String(p.cod_barras || p.codigo_barras || "")).includes(cb));
        }

        // Elegir el mejor match por nombre si hay múltiples
        let found = null;
        if (items.length === 1) {
          found = items[0];
        } else if (items.length > 1 && productoNombre) {
          const q = norm(productoNombre);
          const scored = items.map(p => {
            const d = norm(p.descripcion || p.nombre || "");
            const idx = d.indexOf(q);
            const score = idx >= 0 ? 100 - idx - Math.abs(d.length - q.length) : -1;
            return { p, score };
          }).filter(x => x.score >= 0).sort((a,b)=>b.score - a.score);
          found = scored[0]?.p || items[0];
        }

        if (!found) {
          return {
            context: { notFound: true, query: { productoNombre: productoNombre || null, codigoBarras: codigoBarras || null } },
            prompt: "Indica que no se encontró el producto con los datos recibidos y sugiere verificar nombre exacto o código de barras."
          };
        }

        // Mapear categoría y subcategoría (nombres) desde catálogos Kardex si existen IDs
        let categoriaNombre = null, subcategoriaNombre = null;
        const id_categoria = Number(found.id_categoria ?? found.idCategoria ?? found.id_cat);
        const id_subcategoria = Number(found.id_subcategoria ?? found.idSubcategoria ?? found.id_subcat);

        if (Number.isFinite(id_categoria)) {
          const catsResp = await getInternal(req, GETS.kardex.categorias, {});
          const cats = Array.isArray(catsResp?.data) ? catsResp.data : (Array.isArray(catsResp) ? catsResp : []);
          const cat = cats.find(c => Number(c.id) === id_categoria);
          categoriaNombre = cat?.categoria || null;

          // Subcategorías por categoría
          const subsResp = await getInternal(req, GETS.kardex.subcategorias, { cat: id_categoria });
          const subs = Array.isArray(subsResp?.data) ? subsResp.data : (Array.isArray(subsResp) ? subsResp : []);
          const sub = subs.find(s => Number(s.id) === id_subcategoria);
          subcategoriaNombre = sub?.sub_categoria || sub?.nom_subcat || null;
        }

        const estadoRaw = found.estado_producto ?? found.estado;
        const estado = String(estadoRaw) === "1" ? "Activo" : (String(estadoRaw) === "0" ? "Inactivo" : (estadoRaw ?? "N/A"));

        const detalle = {
          id_producto: found.id_producto || found.id,
          descripcion: found.descripcion || found.nombre || "N/A",
          categoria: { id: Number.isFinite(id_categoria) ? id_categoria : null, nombre: categoriaNombre || "N/A" },
          subcategoria: { id: Number.isFinite(id_subcategoria) ? id_subcategoria : null, nombre: subcategoriaNombre || "N/A" },
          undm: found.undm || "N/A",
          precio: Number.isFinite(Number(found.precio)) ? Number(found.precio) : null,
          stock: Number.isFinite(Number(found.stock)) ? Number(found.stock) : null,
          marca: found.nom_marca || found.marca || null,
          codigo_barras: found.cod_barras || found.codigo_barras || null,
          estado
        };

        return {
          context: { producto: detalle },
          prompt: "Muestra un resumen del producto con línea (categoría), sublínea, estado, unidad de medida, precio, stock y código de barras. Cierra con una observación breve (p.ej., disponibilidad o necesidad de reposición)."
        };
      }
    },
    // NUEVO: Top subcategorías de producto
    {
      key: "top_subcategorias",
      label: "Top subcategorías (productos)",
      keywords: /subcategor(i|í)as|ranking\s+subcat/i,
      resolver: async (req, { id_sucursal, year, month, week, limit = 5 }) => {
        const params = { id_sucursal, year, month, week };
        const resp = await getInternal(req, GETS.productos.cantidadPorSubcategoria, params);
        const list = Array.isArray(resp?.data) ? resp.data : [];
        const ranking = list
          .map(r => ({ subcategoria: r.nom_subcat || "-", cantidad: Number(r.cantidad_vendida) || 0 }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, Number(limit) || 5);
        const total = ranking.reduce((a, b) => a + b.cantidad, 0);
        return {
          context: { ranking, total, filtros: { id_sucursal, year, month, week, limit: Number(limit) || 5 } },
          prompt: "Resume el top de subcategorías de productos y sugiere focos de surtido/promoción."
        };
      }
    }
  ],
  almacenes: [
    {
      key: "ranking_ventas_por_sucursal_anio",
      label: "Ranking por sucursal (año actual)",
      keywords: /sucursal|almac[eé]n|ranking|ventas|a[nñ]o actual/i,
      resolver: async (req, { year }) => {
        const y = Number(year) || new Date().getFullYear();
        const resp = await getInternal(req, GETS.almacenes.analisisSucursales, {});
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        const byBranch = new Map();
        for (const r of rows) {
          if (Number(r.anio) !== Number(y)) continue;
          const k = r.sucursal || r.nombre_sucursal;
          byBranch.set(k, (byBranch.get(k) || 0) + (Number(r.ganancias) || 0));
        }
        const ranking = Array.from(byBranch.entries())
          .map(([sucursal, ingresos]) => ({ sucursal, ingresos }))
          .sort((a, b) => b.ingresos - a.ingresos);
        const promedio = ranking.reduce((a, b) => a + b.ingresos, 0) / (ranking.length || 1);
        return {
          context: { year: y, ranking, promedio },
          prompt: "Genera un ranking de ventas por sucursal del año actual y comenta la brecha entre la 1.ª y 2.ª."
        };
      }
    },
       // NUEVO: Sucursal con mayor rendimiento (alias en Almacenes)
    {
      key: "sucursal_mayor_rendimiento",
      label: "Sucursal con mayor rendimiento",
      keywords: /mayor\s+rendimiento|top\s+sucursal|mejor\s+desempeño/i,
      resolver: async (req, { year, month, week }) => {
        const resp = await getInternal(req, GETS.ventas.rendimientoSucursal, { year, month, week });
        return {
          context: resp?.data || {},
          prompt: "Presenta la sucursal con mayor rendimiento del periodo (participación y crecimiento) y una recomendación operativa."
        };
      }
    }
  ],
  kardex: [
    {
      key: "stock_critico_resumen",
      label: "Stock crítico (resumen)",
      keywords: /stock|cr[ií]tico|bajo|reponer|inventario/i,
      resolver: async (req, { limit = 10 }) => {
        const resp = await getInternal(req, GETS.kardex.productos, {});
        const items = Array.isArray(resp?.data) ? resp.data : [];
        const cleaned = items.map(p => ({
          nombre: p.descripcion || p.nombre || `#${p.id_producto || p.codigo}`,
          stock: Number(p.stock) || 0,
          undm: p.undm || ""
        }));
        const bajos = cleaned.sort((a, b) => a.stock - b.stock).slice(0, Number(limit));
        const totalSkus = cleaned.length;
        const bajo5 = cleaned.filter(p => p.stock <= 5).length;
        return {
          context: { totalSkus, bajo5, muestra: bajos },
          prompt: "Lista productos con menor stock y sugiere umbrales/reabastecimiento. Breve y accionable."
        };
      }
    },
      // NUEVO: Stock bajo por umbral
    {
      key: "stock_bajo_umbral",
      label: "Stock bajo (umbral)",
      keywords: /stock\s+bajo|menor\s+a\s+\d+|umbral/i,
      resolver: async (req, { stockThreshold = 5, limit = 20 }) => {
        const resp = await getInternal(req, GETS.kardex.productos, {});
        const items = Array.isArray(resp?.data) ? resp.data : [];
        const threshold = Number(stockThreshold) || 5;
        const bajos = items
          .map(p => ({ nombre: p.descripcion || p.nombre || `#${p.id_producto || p.codigo}`, stock: Number(p.stock) || 0, undm: p.undm || "" }))
          .filter(p => p.stock <= threshold)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, Number(limit) || 20);
        return {
          context: { threshold, muestra: bajos, totalAfectados: bajos.length },
          prompt: "Lista artículos con stock por debajo del umbral indicado y sugiere lote/periodicidad de reposición."
        };
      }
    }
  ],
  reportes: [
    {
      key: "resumen_ejecutivo",
      label: "Resumen ejecutivo (ventas)",
      keywords: /resumen|ejecutivo|kpi|panorama|general/i,
      resolver: async (req, { id_sucursal, year, limit }) => {
        const y = Number(year) || new Date().getFullYear();
        const lim = Number(limit) || 3;
        const [gan, prod, tend, top, suc] = await Promise.all([
          getInternal(req, GETS.reportes.ganancias, { id_sucursal, year: y }),
          getInternal(req, GETS.reportes.productosVendidos, { id_sucursal, year: y }),
          getInternal(req, GETS.reportes.tendenciaVentas, { id_sucursal, year: y, month: String(new Date().getMonth() + 1).padStart(2, "0") }),
          getInternal(req, GETS.reportes.topProductosMargen, { id_sucursal, year: y, limit: lim }),
          getInternal(req, GETS.reportes.analisisSucursales, {})
        ]);
        return {
          context: {
            year: y,
            ingresos: gan?.totalRevenue ?? 0,
            productosVendidos: prod?.totalProductosVendidos ?? 0,
            tendencia: tend?.data || [],
            topMargen: top?.data || [],
            analisisSucursales: suc?.data || [],
            limit: lim
          },
          prompt: "Redacta un resumen ejecutivo breve con: ingresos YTD, unidades, tendencia mes, top margen (N) y sucursales destacadas."
        };
      }
    }
  ],
  usuarios: [
    {
      key: "resumen_usuarios",
      label: "Resumen de usuarios",
      keywords: /usuarios|resumen|total|activos|inactivos|cuantos/i,
      resolver: async (req) => {
        const usersResp = await getInternal(req, GETS.usuarios.list, {});
        const rolesResp = await getInternal(req, GETS.usuarios.roles, {});
        const users = Array.isArray(usersResp?.data) ? usersResp.data : (Array.isArray(usersResp) ? usersResp : []);
        const roles = Array.isArray(rolesResp?.data) ? rolesResp.data : (Array.isArray(rolesResp) ? rolesResp : []);
        const roleName = (id) => {
          const r = roles.find(x => Number(x.id_rol) === Number(id));
          return r?.descripcion_rol || r?.nombre || `Rol ${id ?? "-"}`;
        };
        const total = users.length;
        const activos = users.filter(u => String(u.estado_usuario ?? u.estado)?.toString() === "1" || /activo/i.test(String(u.estado_usuario_texto || ""))).length;
        const inactivos = total - activos;

        const porRolMap = new Map();
        for (const u of users) {
          const key = roleName(u.id_rol ?? u.rol_id ?? u.rol);
          porRolMap.set(key, (porRolMap.get(key) || 0) + 1);
        }
        const porRol = Array.from(porRolMap.entries()).map(([rol, cantidad]) => ({ rol, cantidad }));

        return {
          context: { total, activos, inactivos, porRol },
          prompt: "Redacta un resumen breve de usuarios: total, activos vs inactivos y un listado por rol con porcentajes."
        };
      }
    },
    {
      key: "distribucion_por_rol",
      label: "Distribución por rol",
      keywords: /roles?|distribuci[oó]n por rol|por rol/i,
      resolver: async (req) => {
        const usersResp = await getInternal(req, GETS.usuarios.list, {});
        const rolesResp = await getInternal(req, GETS.usuarios.roles, {});
        const users = Array.isArray(usersResp?.data) ? usersResp.data : (Array.isArray(usersResp) ? usersResp : []);
        const roles = Array.isArray(rolesResp?.data) ? rolesResp.data : (Array.isArray(rolesResp) ? rolesResp : []);
        const roleName = (id) => {
          const r = roles.find(x => Number(x.id_rol) === Number(id));
          return r?.descripcion_rol || r?.nombre || `Rol ${id ?? "-"}`;
        };

        const porRolMap = new Map();
        for (const u of users) {
          const key = roleName(u.id_rol ?? u.rol_id ?? u.rol);
          porRolMap.set(key, (porRolMap.get(key) || 0) + 1);
        }
        const total = users.length;
        const distribucion = Array.from(porRolMap.entries())
          .map(([rol, cantidad]) => ({ rol, cantidad, porcentaje: total ? (cantidad * 100) / total : 0 }))
          .sort((a, b) => b.cantidad - a.cantidad);

        return {
          context: { total, distribucion },
          prompt: "Muestra la distribución de usuarios por rol (cantidad y %). Añade una recomendación de balance si hay roles dominantes."
        };
      }
    }
  ],
  proveedores: [
    {
      key: "resumen_proveedores",
      label: "Resumen de proveedores",
      keywords: /proveedores|resumen|naturales|jur[ií]dicos/i,
      resolver: async (req) => {
        const resp = await getInternal(req, GETS.proveedores.list, {});
        const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        const total = list.length;

        let naturales = 0, juridicos = 0;
        const ubicacionMap = new Map();
        for (const p of list) {
          const doc = String(p.documento || "").trim();
          if (doc.length === 8) naturales += 1;
          else if (doc.length === 11) juridicos += 1;

          const ubi = (p.ubicacion || p.direccion || "").toString().trim() || "Sin ubicación";
          ubicacionMap.set(ubi, (ubicacionMap.get(ubi) || 0) + 1);
        }
        const topUbicaciones = Array.from(ubicacionMap.entries())
          .map(([ubicacion, cantidad]) => ({ ubicacion, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);

        return {
          context: { total, naturales, juridicos, topUbicaciones },
          prompt: "Resume el total de proveedores, segmenta por Naturales (DNI) y Jurídicos (RUC), y lista las 5 ubicaciones más comunes con una breve conclusión."
        };
      }
    },
    {
      key: "top_ubicaciones_proveedores",
      label: "Top ubicaciones",
      keywords: /ubicaciones|ciudades|distritos|provincias|top/i,
      resolver: async (req) => {
        const resp = await getInternal(req, GETS.proveedores.list, {});
        const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        const ubicacionMap = new Map();
        for (const p of list) {
          const ubi = (p.ubicacion || p.direccion || "").toString().trim() || "Sin ubicación";
          ubicacionMap.set(ubi, (ubicacionMap.get(ubi) || 0) + 1);
        }
        const ranking = Array.from(ubicacionMap.entries())
          .map(([ubicacion, cantidad]) => ({ ubicacion, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 10);

        return {
          context: { ranking, totalUbicaciones: ranking.length },
          prompt: "Presenta un ranking de ubicaciones de proveedores con observaciones breves para logística/compras."
        };
      }
    }
  ],
  compras: [
    {
      key: "promedio_mensual_anio_actual",
      label: "Compras: promedio mensual (año actual)",
      keywords: /compra|compras|promedio|mensual|a[nñ]o actual|este a[nñ]o/i,
      resolver: async (req, { year }) => {
        const y = Number(year) || new Date().getFullYear();
        const resp = await getInternal(req, GETS.compras.notasIngreso, {});
        const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

        const months = Array.from({ length: 12 }, (_, i) => ({
          mesIndex: i,
          mes: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i],
          count: 0,
          monto: 0
        }));

        for (const r of rows) {
          const rawDate = r.fecha || r.fecha_emi || r.fecha_emision || r.created_at || r.fec;
          const d = rawDate ? new Date(rawDate) : null;
          if (!d || !Number.isFinite(d.getTime()) || d.getFullYear() !== y) continue;
          const idx = d.getMonth();
          months[idx].count += 1;
          const total = Number(r.total ?? r.total_nota ?? r.monto ?? r.importe_total ?? 0) || 0;
          months[idx].monto += total;
        }

        const totalCount = months.reduce((a, b) => a + b.count, 0);
        const totalMonto = months.reduce((a, b) => a + b.monto, 0);
        return {
          context: {
            year: y,
            monthly: months,
            totals: { totalNotas: totalCount, totalMonto, avgNotasMes: totalCount / 12, avgMontoMes: totalMonto / 12 }
          },
          prompt: "Con los datos de notas de ingreso del año indicado, muestra el promedio mensual de compras (cantidad y monto) y una mini tabla por mes."
        };
      }
    },
    {
      key: "proveedores_frecuentes_anio",
      label: "Proveedores más frecuentes (año actual)",
      keywords: /proveedores|frecuencia|m[aá]s frecuentes|compras/i,
      resolver: async (req, { limit = 5, year }) => {
        const y = Number(year) || new Date().getFullYear();
        const resp = await getInternal(req, GETS.compras.notasIngreso, {});
        const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

        const byProv = new Map();
        for (const r of rows) {
          const nombre = r.destinatario || r.proveedor || r.cliente || r.razon_social || "SIN NOMBRE";
          const rawDate = r.fecha || r.fecha_emi || r.fecha_emision || r.created_at || r.fec;
          const d = rawDate ? new Date(rawDate) : null;
          if (!d || !Number.isFinite(d.getTime()) || d.getFullYear() !== y) continue;
          byProv.set(nombre, (byProv.get(nombre) || 0) + 1);
        }

        const ranking = Array.from(byProv.entries())
          .map(([proveedor, veces]) => ({ proveedor, veces }))
          .sort((a, b) => b.veces - a.veces)
          .slice(0, Number(limit));

        return {
          context: { year: y, ranking, limit: Number(limit) || 5 },
          prompt: "Lista los proveedores más frecuentes en el año indicado (por cantidad de notas). Añade una recomendación de negociación."
        };
      }
    },
      {
      key: "compras_top_proveedores_monto",
      label: "Top proveedores por monto",
      keywords: /top\s+proveedores\s+por\s+monto|ranking\s+proveedores/i,
      resolver: async (req, { year, limit = 5 }) => {
        const y = Number(year) || new Date().getFullYear();
        const resp = await getInternal(req, GETS.compras.notasIngreso, {});
        const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        const map = new Map();
        for (const r of rows) {
          const rawDate = r.fecha || r.fecha_emi || r.fecha_emision || r.created_at || r.fec;
          const d = rawDate ? new Date(rawDate) : null;
          if (!d || !Number.isFinite(d.getTime()) || d.getFullYear() !== y) continue;
          const prov = r.destinatario || r.proveedor || r.razon_social || "SIN NOMBRE";
          const tot = Number(r.total ?? r.total_nota ?? r.monto ?? r.importe_total ?? 0) || 0;
          map.set(prov, (map.get(prov) || 0) + tot);
        }
        const ranking = Array.from(map.entries())
          .map(([proveedor, monto]) => ({ proveedor, monto }))
          .sort((a, b) => b.monto - a.monto)
          .slice(0, Number(limit) || 5);
        const total = ranking.reduce((a, b) => a + b.monto, 0);
        return {
          context: { year: y, ranking, total, limit: Number(limit) || 5 },
          prompt: "Presenta los proveedores con mayor monto de compras en el año y propone negociación o consolidación."
        };
      }
    },

    // NUEVO: Tendencia de compras del mes (serie diaria)
    {
      key: "compras_tendencia_mes",
      label: "Tendencia de compras del mes",
      keywords: /tendencia\s+compras|evoluci[oó]n\s+compras|compras\s+mes/i,
      resolver: async (req, { year, month }) => {
        const now = new Date();
        const y = Number(year) || now.getFullYear();
        const m = Number(month) || (now.getMonth() + 1);
        const resp = await getInternal(req, GETS.compras.notasIngreso, {});
        const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        const dias = new Map(); // yyyy-mm-dd -> monto
        for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
          const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          dias.set(key, 0);
        }
        for (const r of rows) {
          const rawDate = r.fecha || r.fecha_emi || r.fecha_emision || r.created_at || r.fec;
          const dt = rawDate ? new Date(rawDate) : null;
          if (!dt || !Number.isFinite(dt.getTime())) continue;
          if (dt.getFullYear() === y && (dt.getMonth() + 1) === m) {
            const key = `${y}-${String(m).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
            const tot = Number(r.total ?? r.total_nota ?? r.monto ?? r.importe_total ?? 0) || 0;
            dias.set(key, (dias.get(key) || 0) + tot);
          }
        }
        const serie = Array.from(dias.entries()).map(([fecha, monto]) => ({ fecha, monto }));
        const total = serie.reduce((a, b) => a + b.monto, 0);
        const promedio = serie.length ? total / serie.length : 0;
        return {
          context: { year: y, month: String(m).padStart(2, "0"), serie, total, promedio },
          prompt: "Describe la tendencia diaria de compras del mes (picos y valles) y sugiere acciones de planificación."
        };
      }
    }
  ],
};

// Detección básica de entidad por palabras clave
function detectEntity(question = "") {
  const q = String(question || "").toLowerCase();
  if (/venta|ventas|factur|recaud/.test(q)) return "ventas";
  if (/usuario|usuarios|rol(es)?/.test(q)) return "usuarios";
  if (/proveedor(es)?|destinatario(s)?/.test(q)) return "proveedores";
  if (/compra|compras|nota de ingreso|notas de ingreso/.test(q)) return "compras";
  if (/kardex|inventario|stock/.test(q)) return "kardex";
  if (/almac[eé]n|sucursal(es)?/.test(q)) return "almacenes";
  if (/producto(s)?/.test(q)) return "productos";
  if (/reporte(s)?/.test(q)) return "reportes";
  return null;
}

// Selección de intento por palabras clave
function detectIntentKey(entity, question = "") {
  const intents = INTENTS[entity] || [];
  const found = intents.find(i => i.keywords.test(question || ""));
  return found?.key || null;
}

// OpenAI redactor (incluye la pregunta original)
async function askOpenAI({ prompt, context, question }) {
  const messages = [
    { role: "system", content: "Eres un asistente ERP que genera mini‑reportes claros y útiles. No inventes datos: usa solo el JSON dado. Considera sucursal/fechas/top/comprobante si están en 'applied' o filtros. Responde en español con viñetas y 1 párrafo final." },
    { role: "user", content: `Instrucciones: ${prompt}\nPregunta original: ${question || "-"}\nDatos JSON:\n${JSON.stringify(context)}` }
  ];
  const out = await client.chat.completions.create({ model: MODEL, messages, temperature: 0.2 });
  return out.choices?.[0]?.message?.content || "";
}

export const functionShortcutsAsk = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const { question = "", entity: forcedEntity, intent: forcedIntent, id_sucursal, limit } = req.body || {};

    const entity = forcedEntity || detectEntity(question);
    if (!entity || !INTENTS[entity]) {
      return res.json({ code: 0, message: "No se pudo identificar la entidad/intent." });
    }

    const intentKey = forcedIntent || detectIntentKey(entity, question) || "kpis_resumen";
    const intent = (INTENTS[entity] || []).find(i => i.key === intentKey);
    if (!intent) {
      return res.json({ code: 0, message: "Intent no soportado." });
    }

    // Detectar filtros desde lenguaje natural
    const nl = await detectNaturalFilters(req, question);
    const filters = {
      id_sucursal: id_sucursal ?? nl.id_sucursal ?? null,
      year: nl.year ?? null,
      month: nl.month ?? null,
      week: nl.week ?? null,
      limit: limit ?? nl.limit ?? null,
      tipoComprobante: nl.tipoComprobante ?? null,
      categoria: nl.categoria ?? null,
      stockThreshold: nl.stockThreshold ?? null,
      productoNombre: nl.productoNombre ?? null,
      codigoBarras: nl.codigoBarras ?? null
    };

    // Ejecutar resolver con filtros enriquecidos
    const { context, prompt } = await intent.resolver(req, filters);

    // Devolver JSON si no hay OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ code: 1, reply: "OpenAI no configurado. Enviando datos crudos.", data: context, intent: intentKey, entity, id_tenant, filters });
    }

    const reply = await askOpenAI({ prompt, context, question });
    return res.json({ code: 1, reply, data: context, intent: intentKey, entity, id_tenant, filters });
  } catch (err) {
    return res.status(500).json({ code: 0, message: err.message });
  }
};