/**
 * Seed idempotente catálogo demo + theme_json modular (preset store).
 * Uso: node src/scripts/seed_ecommerce_demo_catalog.js
 */
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword } from "../utils/passwordUtil.js";

const slug = "demo-horytek";
const email = "demo-ecommerce@horytek.test";
const usua = "ecom_demo";
const clave = "DemoEcom2026!";

const TIENDA = {
  nombre: "Demo Horytek Shop",
  descripcion: "Destacados esta semana · Tecnología, hogar, moda y deporte.",
  color_primario: "#0E7C7B",
  logo_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
  telefono: "999000111",
};

const THEME = {
  preset: "store",
  font_display: "outfit",
  font_body: "manrope",
  header_style: "dark",
  hero_headline: "Destacados esta semana",
  hero_tagline: "Portadas, filtros y checkout con Mercado Pago.",
  banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop",
  color_scheme_default: "system",
  allow_visitor_scheme_toggle: true,
  quick_actions: { cart_fab: true, quick_add: true, whatsapp: true },
  trust: { envio: "Envío Lima", pago: "Mercado Pago", soporte: "WhatsApp tienda" },
  modules: [
    { id: "spotlight", type: "spotlight", enabled: true, config: { autoplay_ms: 6500, cta_label: "Ver catálogo" } },
    { id: "featured", type: "featured", enabled: true, config: { layout: "duo" } },
    {
      id: "rows",
      type: "rows",
      enabled: true,
      config: {
        rows: [
          { title: "Recién llegados", eyebrow: "Novedades", mode: "newest", limit: 10 },
          { title: "Tecnología", eyebrow: "Colección", mode: "category", category: "Tecnología", limit: 10 },
          { title: "Últimas unidades", eyebrow: "Stock", mode: "low_stock", limit: 8 },
        ],
      },
    },
    { id: "categories", type: "categories", enabled: true, config: { style: "chips" } },
    { id: "trust", type: "trust", enabled: true, config: {} },
    {
      id: "promo",
      type: "promo",
      enabled: true,
      config: {
        headline: "Armá tu setup",
        body: "Filtros por precio, stock y categoría en el browse.",
        cta_label: "Ir al catálogo",
        cta_href: "#catalogo",
      },
    },
    {
      id: "browse",
      type: "browse",
      enabled: true,
      config: {
        title: "Browse",
        layout: "sidebar",
        facets: ["category", "price", "stock", "tags"],
        dense_default: true,
      },
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      config: {
        items: [
          { q: "¿Cómo pago?", a: "Checkout con Mercado Pago (tarjeta, Yape, etc. según tu cuenta)." },
          { q: "¿Hacen envíos?", a: "Coordinamos entrega por WhatsApp o teléfono de la tienda." },
          { q: "¿Puedo cambiar un producto?", a: "Escríbenos con el código de orden y lo resolvemos." },
        ],
      },
    },
  ],
};

/** @type {{ nombre: string; descripcion: string; precio: number; stock: number; sku: string; categoria: string; tags: string[]; destacado?: boolean; story?: boolean; imagenes: string[] }[]} */
const PRODUCTOS = [
  {
    nombre: "Auriculares inalámbricos Nova",
    descripcion: "ANC y 30 h de batería.",
    precio: 189.9,
    stock: 24,
    sku: "TEC-AUR-001",
    categoria: "Tecnología",
    tags: ["audio", "nuevo"],
    destacado: true,
    imagenes: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
    ],
  },
  {
    nombre: "Smartwatch Pulse 3",
    descripcion: "GPS y AMOLED.",
    precio: 349.0,
    stock: 15,
    sku: "TEC-WAT-002",
    categoria: "Tecnología",
    tags: ["wearable"],
    destacado: true,
    story: true,
    imagenes: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=800&fit=crop",
    ],
  },
  {
    nombre: "Parlante Echo Mini",
    descripcion: "Bluetooth 5.3, 12 h.",
    precio: 129.5,
    stock: 40,
    sku: "TEC-SPK-003",
    categoria: "Tecnología",
    tags: ["audio"],
    imagenes: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Cámara StormCam",
    descripcion: "4K60 sumergible.",
    precio: 499.0,
    stock: 8,
    sku: "TEC-CAM-004",
    categoria: "Tecnología",
    tags: ["foto"],
    destacado: true,
    imagenes: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
    ],
  },
  {
    nombre: "Teclado mecánico Flux",
    descripcion: "Switches táctiles, RGB.",
    precio: 259.0,
    stock: 18,
    sku: "TEC-KEY-005",
    categoria: "Tecnología",
    tags: ["pc"],
    imagenes: ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Mouse inalámbrico Orbit",
    descripcion: "Ergonómico, 2.4 GHz.",
    precio: 89.0,
    stock: 35,
    sku: "TEC-MOU-006",
    categoria: "Tecnología",
    tags: ["pc"],
    imagenes: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Lámpara Arc",
    descripcion: "LED regulable.",
    precio: 79.9,
    stock: 32,
    sku: "HOG-LAM-001",
    categoria: "Hogar",
    tags: ["iluminacion"],
    story: true,
    imagenes: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop",
    ],
  },
  {
    nombre: "Set vasos Nord",
    descripcion: "6 pzas templado.",
    precio: 59.0,
    stock: 50,
    sku: "HOG-VAS-002",
    categoria: "Hogar",
    tags: ["cocina"],
    imagenes: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Silla Loom",
    descripcion: "Ergonómica malla.",
    precio: 689.0,
    stock: 6,
    sku: "HOG-SIL-003",
    categoria: "Hogar",
    tags: ["oficina"],
    destacado: true,
    imagenes: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Difusor Nube",
    descripcion: "Ultrasónico + aromas.",
    precio: 94.5,
    stock: 28,
    sku: "HOG-DIF-004",
    categoria: "Hogar",
    tags: ["bienestar"],
    imagenes: ["https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Organizador Desk",
    descripcion: "Bambú, 3 bandejas.",
    precio: 49.0,
    stock: 40,
    sku: "HOG-ORG-005",
    categoria: "Hogar",
    tags: ["oficina"],
    imagenes: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Chaqueta Meridian",
    descripcion: "Corte slim, wind.",
    precio: 219.0,
    stock: 18,
    sku: "MOD-CHA-001",
    categoria: "Moda",
    tags: ["abrigo"],
    story: true,
    imagenes: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=800&fit=crop",
    ],
  },
  {
    nombre: "Zapatillas Daily Run",
    descripcion: "Amortiguadas.",
    precio: 279.9,
    stock: 22,
    sku: "MOD-ZAP-002",
    categoria: "Moda",
    tags: ["calzado", "nuevo"],
    destacado: true,
    imagenes: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Mochila City Pack",
    descripcion: "Laptop 15\", impermeable.",
    precio: 159.0,
    stock: 35,
    sku: "MOD-MOC-003",
    categoria: "Moda",
    tags: ["bolsos"],
    imagenes: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Gafas Coast",
    descripcion: "UV400 polarizadas.",
    precio: 119.0,
    stock: 3,
    sku: "MOD-GAF-004",
    categoria: "Moda",
    tags: ["accesorios"],
    imagenes: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Gorra Trail",
    descripcion: "Secado rápido.",
    precio: 45.0,
    stock: 55,
    sku: "MOD-GOR-005",
    categoria: "Moda",
    tags: ["accesorios"],
    imagenes: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Mat yoga Grip Pro",
    descripcion: "6 mm antideslizante.",
    precio: 89.0,
    stock: 45,
    sku: "DEP-MAT-001",
    categoria: "Deportes",
    tags: ["yoga"],
    imagenes: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Botella Trail 750ml",
    descripcion: "Acero, frío 24 h.",
    precio: 69.9,
    stock: 60,
    sku: "DEP-BOT-002",
    categoria: "Deportes",
    tags: ["hidratación"],
    imagenes: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Banda resistencia Pack",
    descripcion: "3 tensiones.",
    precio: 55.0,
    stock: 70,
    sku: "DEP-BAN-003",
    categoria: "Deportes",
    tags: ["fuerza"],
    imagenes: ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Cuerda saltar Pro",
    descripcion: "Rodamientos, cable.",
    precio: 39.0,
    stock: 80,
    sku: "DEP-CUE-004",
    categoria: "Deportes",
    tags: ["cardio"],
    imagenes: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Guantes gym Flex",
    descripcion: "Agarre silicona.",
    precio: 49.0,
    stock: 42,
    sku: "DEP-GUA-005",
    categoria: "Deportes",
    tags: ["fuerza"],
    imagenes: ["https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&h=800&fit=crop"],
  },
  {
    nombre: "Balón basketball Street",
    descripcion: "Outdoor, talla 7.",
    precio: 99.0,
    stock: 20,
    sku: "DEP-BAL-006",
    categoria: "Deportes",
    tags: ["ball"],
    imagenes: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=800&fit=crop"],
  },
];

const c = await getEcommerceConnection();
try {
  await c.beginTransaction();

  let [[tienda]] = await c.query(`SELECT id_tienda FROM tienda WHERE slug = ? LIMIT 1`, [slug]);

  if (!tienda) {
    const hash = await hashPassword(clave);
    const [insT] = await c.query(
      `INSERT INTO tienda
        (id_plan, slug, nombre, email, telefono, estado, fecha_pago, descripcion, color_primario, logo_url, theme_json)
       VALUES (1, ?, ?, ?, ?, 'active', CURDATE(), ?, ?, ?, ?)`,
      [
        slug,
        TIENDA.nombre,
        email,
        TIENDA.telefono,
        TIENDA.descripcion,
        TIENDA.color_primario,
        TIENDA.logo_url,
        JSON.stringify(THEME),
      ]
    );
    await c.query(
      `INSERT INTO usuario (id_tienda, usua, password_hash, email, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, 'admin', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), estado = 1`,
      [insT.insertId, usua, hash, email, "Admin Demo"]
    );
    [[tienda]] = await c.query(`SELECT id_tienda FROM tienda WHERE slug = ? LIMIT 1`, [slug]);
  }

  const id_tienda = tienda.id_tienda;

  await c.query(
    `UPDATE tienda SET
      nombre = ?, descripcion = ?, color_primario = ?, logo_url = ?, telefono = ?, estado = 'active', theme_json = ?
     WHERE id_tienda = ?`,
    [
      TIENDA.nombre,
      TIENDA.descripcion,
      TIENDA.color_primario,
      TIENDA.logo_url,
      TIENDA.telefono,
      JSON.stringify(THEME),
      id_tienda,
    ]
  );

  let inserted = 0;
  for (const p of PRODUCTOS) {
    const attrs = {
      categoria: p.categoria,
      tags: p.tags,
      destacado: p.destacado || false,
      story: p.story || false,
    };
    const [[exist]] = await c.query(`SELECT id_producto FROM producto WHERE id_tienda = ? AND sku = ? LIMIT 1`, [
      id_tienda,
      p.sku,
    ]);
    let idProducto = exist?.id_producto;
    if (!idProducto) {
      const [ins] = await c.query(
        `INSERT INTO producto
          (id_tienda, nombre, descripcion, precio, stock, stock_min, activo, sku, categoria, attrs_json)
         VALUES (?, ?, ?, ?, ?, 5, 1, ?, ?, ?)`,
        [id_tienda, p.nombre, p.descripcion, p.precio, p.stock, p.sku, p.categoria, JSON.stringify(attrs)]
      );
      idProducto = ins.insertId;
      inserted += 1;
    } else {
      await c.query(
        `UPDATE producto SET
          nombre = ?, descripcion = ?, precio = ?, stock = ?, activo = 1, categoria = ?, attrs_json = ?
         WHERE id_producto = ? AND id_tienda = ?`,
        [p.nombre, p.descripcion, p.precio, p.stock, p.categoria, JSON.stringify(attrs), idProducto, id_tienda]
      );
    }

    const [imgs] = await c.query(
      `SELECT id_imagen, orden FROM producto_imagen WHERE id_producto = ? AND id_tienda = ? ORDER BY orden ASC`,
      [idProducto, id_tienda]
    );
    for (let i = 0; i < p.imagenes.length; i++) {
      const url = p.imagenes[i];
      const existing = imgs[i];
      if (!existing) {
        await c.query(
          `INSERT INTO producto_imagen (id_tienda, id_producto, url, file_id, orden, es_principal)
           VALUES (?, ?, ?, NULL, ?, ?)`,
          [id_tienda, idProducto, url, i, i === 0 ? 1 : 0]
        );
      } else {
        await c.query(
          `UPDATE producto_imagen SET url = ?, es_principal = ? WHERE id_imagen = ? AND id_tienda = ?`,
          [url, i === 0 ? 1 : 0, existing.id_imagen, id_tienda]
        );
      }
    }
  }

  await c.commit();

  const [[finalCount]] = await c.query(
    `SELECT COUNT(*) AS c FROM producto WHERE id_tienda = ? AND activo = 1`,
    [id_tienda]
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug,
        id_tienda,
        productos_activos: Number(finalCount.c),
        insertados_ahora: inserted,
        theme: "store",
        storefront: `/tienda/${slug}`,
      },
      null,
      2
    )
  );
} catch (e) {
  try {
    await c.rollback();
  } catch {
    /* noop */
  }
  console.error(e);
  process.exitCode = 1;
} finally {
  c.release();
  process.exit(process.exitCode || 0);
}
