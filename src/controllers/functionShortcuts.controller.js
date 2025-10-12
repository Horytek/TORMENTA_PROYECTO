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
  // Kardex / Almacenes
  kardex: {
    productos: "/api/kardex",
    almacenes: "/api/kardex/almacen"
  },
  reportes: {
    ganancias: "/api/reporte/ganancias",
    productosVendidos: "/api/reporte/productos_vendidos",
    tendenciaVentas: "/api/reporte/tendencia_ventas",
    topProductosMargen: "/api/reporte/top_productos_margen",
    analisisSucursales: "/api/reporte/analisis_ganancias_sucursales",
    sucursales: "/api/reporte/sucursales",
    libroVentasSunat: "/api/reporte/libro_ventas_sunat"
  },
  // NUEVO: entidades adicionales basadas en controladores y servicios existentes
  usuarios: {
    list: "/api/usuario",
    roles: "/api/rol"
  },
  proveedores: {
    list: "/api/destinatario"
  },
  compras: {
    notasIngreso: "/api/nota_ingreso",
    destinatarios: "/api/nota_ingreso/destinatario"
  },
  // “Clientes” y “Productos” usan endpoints de reporte
  clientes: {
    registroVentasSunat: "/api/reporte/registro_ventas_sunat",
    libroVentasSunat: "/api/reporte/libro_ventas_sunat"
  },
  productos: {
    cantidadPorProducto: "/api/reporte/cantidad_por_producto",
    topProductosMargen: "/api/reporte/top_productos_margen"
  },
  almacenes: {
    analisisSucursales: "/api/reporte/analisis_ganancias_sucursales",
    sucursales: "/api/reporte/sucursales"
  }
};

// Intentos predefinidos por entidad (reduce ambigüedad para la IA)
const INTENTS = {
  ventas: [
    {
      key: "promedio_mensual_anio_actual",
      label: "Promedio mensual (año actual)",
      keywords: /promedio|media|por mes|mensual|año actual|este año/i,
      resolver: async (req, { id_sucursal }) => {
        const now = new Date();
        const year = now.getFullYear();
        // Traemos todas las ventas del año (listado normalizado)
        const rv = await getInternal(req, GETS.ventas.libroVentasSunat, {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          id_sucursal
        });
        const rows = Array.isArray(rv?.data) ? rv.data : [];

        const monthly = Array.from({ length: 12 }, (_, i) => ({
          mesIndex: i,
          mes: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i],
          count: 0,
          ingresos: 0
        }));
        for (const r of rows) {
          const d = new Date(r.fecha);
          if (!Number.isFinite(d.getTime()) || d.getFullYear() !== year) continue;
          const m = d.getMonth();
          monthly[m].count += 1;
          monthly[m].ingresos += Number(r.total) || 0;
        }
        const totCount = monthly.reduce((a,b)=>a+b.count,0);
        const totIngresos = monthly.reduce((a,b)=>a+b.ingresos,0);
        return {
          context: { year, id_sucursal: id_sucursal || null, monthly,
            totals: {
              totalCount: totCount,
              totalIngresos: totIngresos,
              avgCount: totCount/12,
              avgIngresos: totIngresos/12
            } 
          },
          prompt: "Calcula y muestra el promedio mensual de cantidad de ventas y de ingresos del año actual; lista los 12 meses y cierra con un resumen."
        };
      }
    },
    {
      key: "tendencia_ultimos_30",
      label: "Tendencia últimos 30 días",
      keywords: /tendencia|evoluci[oó]n|30 d[ií]as|[uú]ltimos 30/i,
      resolver: async (req, { id_sucursal }) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth()+1).padStart(2,"0");
        // Tendencia por día en el rango filtrado (usa controlador existente)
        const tv = await getInternal(req, GETS.ventas.tendenciaVentas, {
          id_sucursal, year, month
        });
        return {
          context: { raw: tv?.data || [], id_sucursal: id_sucursal || null, year, month },
          prompt: "Genera un breve análisis de tendencia diaria de ventas del mes actual. Destaca días pico, mínimos y el total."
        };
      }
    },
    {
      key: "top_productos_margen",
      label: "Top productos por margen",
      keywords: /top|mejores|margen|rentables/i,
      resolver: async (req, { id_sucursal, limit = 5 }) => {
        const now = new Date();
        const year = now.getFullYear();
        const tp = await getInternal(req, GETS.ventas.topProductosMargen, {
          id_sucursal, year, limit
        });
        return {
          context: { items: tp?.data || [], id_sucursal: id_sucursal || null, year },
          prompt: "Resume los top productos por margen, indicando margen% y ventas (S/). Conclusión breve y acción sugerida."
        };
      }
    },
    {
      key: "kpis_resumen",
      label: "KPIs de ventas (año actual)",
      keywords: /kpi|resumen|totales|ingresos|productos vendidos/i,
      resolver: async (req, { id_sucursal }) => {
        const year = new Date().getFullYear();
        const [gan, prod] = await Promise.all([
          getInternal(req, GETS.ventas.ganancias, { id_sucursal, year }),
          getInternal(req, GETS.ventas.productosVendidos, { id_sucursal, year })
        ]);
        return {
          context: {
            ingresos: gan?.totalRevenue ?? gan?.data ?? 0,
            productosVendidos: prod?.totalProductosVendidos ?? prod?.data ?? 0,
            comparativo: gan?.porcentaje ?? null,
            id_sucursal: id_sucursal || null,
            year
          },
          prompt: "Genera KPIs concisos: ingresos anuales, productos vendidos y variación vs periodo anterior si existe."
        };
      }
    }
  ],
  clientes: [
    {
      key: "top_clientes_ingresos_anual",
      label: "Top clientes por ingresos (año actual)",
      keywords: /top|mejores|clientes|ingresos|a[nñ]o actual|este a[nñ]o/i,
      resolver: async (req, { id_sucursal, limit = 5 }) => {
        const y = new Date().getFullYear();
        const rv = await getInternal(req, GETS.clientes.libroVentasSunat, {
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          id_sucursal
        });
        const rows = Array.isArray(rv?.data) ? rv.data : [];
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
      resolver: async (req, { id_sucursal, limit = 5 }) => {
        const y = new Date().getFullYear();
        const rv = await getInternal(req, GETS.clientes.libroVentasSunat, {
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          id_sucursal
        });
        const rows = Array.isArray(rv?.data) ? rv.data : [];
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
    }
  ],
  productos: [
    {
      key: "top_unidades_ingresos",
      label: "Top por unidades e ingresos",
      keywords: /top|productos|unidades|ingresos|m[aá]s vendidos/i,
      resolver: async (req, { id_sucursal, limit = 5, year }) => {
        const y = year || new Date().getFullYear();
        const resp = await getInternal(req, GETS.productos.cantidadPorProducto, { id_sucursal, year: y, limit: 1000 });
        const items = Array.isArray(resp?.data) ? resp.data : [];
        const ranking = items
          .map(i => ({
            nombre: i.nombre || i.descripcion,
            unidades: Number(i.cantidad_vendida) || 0,
            ingresos: Number(i.dinero_generado) || 0
          }))
          .sort((a, b) => b.unidades - a.unidades)
          .slice(0, Number(limit));
        const totU = ranking.reduce((a, b) => a + b.unidades, 0);
        const totS = ranking.reduce((a, b) => a + b.ingresos, 0);
        return {
          context: { year: y, id_sucursal: id_sucursal || null, ranking, totalUnidades: totU, totalIngresos: totS, limit },
          prompt: "Lista el top productos por unidades (y sus ingresos). Añade observaciones breves y una sugerencia de reabastecimiento."
        };
      }
    },
    {
      key: "top_margen",
      label: "Top por margen",
      keywords: /margen|rentables|ganancia|top/i,
      resolver: async (req, { id_sucursal, limit = 5, year }) => {
        const y = year || new Date().getFullYear();
        const resp = await getInternal(req, GETS.productos.topProductosMargen, { id_sucursal, year: y, limit });
        return {
          context: { year: y, id_sucursal: id_sucursal || null, items: resp?.data || [], limit },
          prompt: "Resume los productos con mayor margen (% y S/). Incluye riesgo de dependencia y propuesta de mix."
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
        const y = year || new Date().getFullYear();
        const resp = await getInternal(req, GETS.almacenes.analisisSucursales, {});
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        // Filtra por año actual y suma por sucursal
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
        // Suponemos ‘stock’ disponible; si hay ‘min_stock’ úsalo
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
    }
  ],
  reportes: [
    {
      key: "resumen_ejecutivo",
      label: "Resumen ejecutivo (ventas)",
      keywords: /resumen|ejecutivo|kpi|panorama|general/i,
      resolver: async (req, { id_sucursal }) => {
        const y = new Date().getFullYear();
        const [gan, prod, tend, top, suc] = await Promise.all([
          getInternal(req, GETS.reportes.ganancias, { id_sucursal, year: y }),
          getInternal(req, GETS.reportes.productosVendidos, { id_sucursal, year: y }),
          getInternal(req, GETS.reportes.tendenciaVentas, { id_sucursal, year: y, month: String(new Date().getMonth() + 1).padStart(2, "0") }),
          getInternal(req, GETS.reportes.topProductosMargen, { id_sucursal, year: y, limit: 3 }),
          getInternal(req, GETS.reportes.analisisSucursales, {})
        ]);
        return {
          context: {
            year: y,
            ingresos: gan?.totalRevenue ?? 0,
            productosVendidos: prod?.totalProductosVendidos ?? 0,
            tendencia: tend?.data || [],
            topMargen: top?.data || [],
            analisisSucursales: suc?.data || []
          },
          prompt: "Redacta un resumen ejecutivo breve con: ingresos YTD, unidades, tendencia mes, top margen (3) y sucursales destacadas."
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

        // Inferencia por longitud del documento: 8 = DNI (Natural), 11 = RUC (Jurídico)
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
      resolver: async (req) => {
        const y = new Date().getFullYear();
        // Trae todas las notas de ingreso (se filtra aquí por año para robustez)
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
          // Totales: usar campo disponible
          const total = Number(r.total ?? r.total_nota ?? r.monto ?? r.importe_total ?? 0) || 0;
          months[idx].monto += total;
        }

        const totalCount = months.reduce((a, b) => a + b.count, 0);
        const totalMonto = months.reduce((a, b) => a + b.monto, 0);
        return {
          context: {
            year: y,
            monthly: months,
            totals: {
              totalNotas: totalCount,
              totalMonto,
              avgNotasMes: totalCount / 12,
              avgMontoMes: totalMonto / 12
            }
          },
          prompt: "Con los datos de notas de ingreso del año actual, muestra el promedio mensual de compras (cantidad y monto) y una mini tabla por mes."
        };
      }
    },
    {
      key: "proveedores_frecuentes_anio",
      label: "Proveedores más frecuentes (año actual)",
      keywords: /proveedores|frecuencia|m[aá]s frecuentes|compras/i,
      resolver: async (req, { limit = 5 }) => {
        const y = new Date().getFullYear();
        const resp = await getInternal(req, GETS.compras.notasIngreso, {});
        const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

        const byProv = new Map();
        for (const r of rows) {
          // Posibles campos de proveedor en NI
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
          context: { year: y, ranking, limit: Number(limit) },
          prompt: "Lista los proveedores más frecuentes en el año actual (por cantidad de notas). Añade una recomendación de negociación."
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

// OpenAI redactor (no inventar, responde breve)
async function askOpenAI({ prompt, context }) {
  const messages = [
    { role: "system", content: "Eres un asistente ERP que genera mini‑reportes claros y útiles. No inventes datos: usa solo el JSON dado. Responde en español, usando viñetas y 1 párrafo final." },
    { role: "user", content: `Instrucciones: ${prompt}\nDatos JSON:\n${JSON.stringify(context)}` }
  ];
  const out = await client.chat.completions.create({ model: MODEL, messages, temperature: 0.2 });
  return out.choices?.[0]?.message?.content || "";
}

export const functionShortcutsAsk = async (req, res) => {
  try {
    const id_tenant = req.id_tenant; // Disponible por auth middleware
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

    // Ejecutar resolver (puede aglutinar varios GET existentes)
    const { context, prompt } = await intent.resolver(req, { id_sucursal, limit, id_tenant });

    // Si no hay OpenAI API key, devolvemos el JSON (degradación elegante)
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ code: 1, reply: "OpenAI no configurado. Enviando datos crudos.", data: context, intent: intentKey, entity, id_tenant });
    }

    const reply = await askOpenAI({ prompt, context });
    return res.json({ code: 1, reply, data: context, intent: intentKey, entity, id_tenant });
  } catch (err) {
    return res.status(500).json({ code: 0, message: err.message });
  }
};