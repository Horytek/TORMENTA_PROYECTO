/**
 * Copia empresa ERP → tienda ecommerce (logo/datos), asegura admin, MP TEST y catálogo moda femenina.
 * Uso: npm run sync:empresa-ecommerce
 */
import { getConnection } from "../database/database.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword } from "../utils/passwordUtil.js";
import { encryptMpToken } from "../utils/ecommerceCrypto.js";
import {
  MP_TEST_ACCESS_TOKEN,
  MP_TEST_MODO,
  MP_TEST_PUBLIC_KEY,
} from "./ecommerce_mp_test_creds.js";

const ID_EMPRESA = Number(process.env.ECOM_SYNC_ID_EMPRESA || 2);
const SLUG = process.env.ECOM_SYNC_SLUG || "textiles_creando_moda";
const LEGACY_SLUG = "demo-horytek";
const LEGACY_USUA = "ecom_demo";
const ADMIN_USUA = "textiles_creando_moda";
const ADMIN_CLAVE = "CreandoModa2026!";
const ADMIN_EMAIL = "admin@textilescreandomoda.local";

const THEME = {
  preset: "store",
  font_display: "outfit",
  font_body: "manrope",
  header_style: "light",
  hero_headline: "Nueva temporada femenina",
  hero_tagline: "Vestidos, blusas y denim listos para tu vitrina.",
  banner_url:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=900&fit=crop",
  color_scheme_default: "light",
  allow_visitor_scheme_toggle: true,
  quick_actions: { cart_fab: true, quick_add: true, whatsapp: true },
  trust: { envio: "Envío Lima", pago: "Mercado Pago", soporte: "WhatsApp tienda" },
  modules: [
    { id: "spotlight", type: "spotlight", enabled: true, config: { autoplay_ms: 6500, cta_label: "Ver colección" } },
    { id: "featured", type: "featured", enabled: true, config: { layout: "duo" } },
    {
      id: "rows",
      type: "rows",
      enabled: true,
      config: {
        rows: [
          { title: "Recién llegados", eyebrow: "Novedades", mode: "newest", limit: 10 },
          { title: "Vestidos", eyebrow: "Colección", mode: "category", category: "Vestidos", limit: 10 },
          { title: "Blusas", eyebrow: "Colección", mode: "category", category: "Blusas", limit: 10 },
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
        headline: "Look completo",
        body: "Prendas femeninas con filtro por categoría y precio.",
        cta_label: "Ir al catálogo",
        cta_href: "#catalogo",
      },
    },
    {
      id: "browse",
      type: "browse",
      enabled: true,
      config: {
        title: "Catálogo",
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
          { q: "¿Cómo pago?", a: "Checkout con Mercado Pago (tarjeta, Yape, etc.)." },
          { q: "¿Hacen envíos?", a: "Coordinamos entrega por WhatsApp o teléfono de la tienda." },
          { q: "¿Cambios?", a: "Escríbenos con el código de orden y lo resolvemos." },
        ],
      },
    },
  ],
};

/** @type {{ nombre: string; descripcion: string; precio: number; stock: number; sku: string; categoria: string; tags: string[]; destacado?: boolean; story?: boolean; imagenes: string[] }[]} */
const PRODUCTOS = [
  {
    nombre: "Vestido midi floral",
    descripcion: "Corte midi, tela ligera, ideal para día.",
    precio: 189.9,
    stock: 18,
    sku: "WF-001",
    categoria: "Vestidos",
    tags: ["midi", "floral", "nuevo"],
    destacado: true,
    imagenes: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Vestido negro cóctel",
    descripcion: "Silueta ajustada, elegante para noche.",
    precio: 249.0,
    stock: 12,
    sku: "WF-002",
    categoria: "Vestidos",
    tags: ["noche", "elegante"],
    destacado: true,
    story: true,
    imagenes: ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Blusa satén ivory",
    descripcion: "Manga larga, caída satín, cuello fluido.",
    precio: 129.5,
    stock: 28,
    sku: "WF-003",
    categoria: "Blusas",
    tags: ["oficina", "satin"],
    destacado: true,
    imagenes: ["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Blusa lino natural",
    descripcion: "Lino fresco, botones frontales.",
    precio: 99.0,
    stock: 35,
    sku: "WF-004",
    categoria: "Blusas",
    tags: ["casual", "lino"],
    imagenes: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Falda plisada beige",
    descripcion: "Plisado medio, cintura elástica.",
    precio: 119.0,
    stock: 22,
    sku: "WF-005",
    categoria: "Faldas",
    tags: ["plisada", "midi"],
    story: true,
    imagenes: ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Jeans wide leg",
    descripcion: "Denim suave, tiro alto, pierna ancha.",
    precio: 169.0,
    stock: 30,
    sku: "WF-006",
    categoria: "Denim",
    tags: ["wide-leg", "tiro-alto"],
    destacado: true,
    imagenes: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Jeans mom fit",
    descripcion: "Corte mom, lavado medium.",
    precio: 149.0,
    stock: 26,
    sku: "WF-007",
    categoria: "Denim",
    tags: ["mom", "casual"],
    imagenes: ["https://images.unsplash.com/photo-1582418702059-97ebaf0e3c6e?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Top crop rib",
    descripcion: "Rib elástico, escote redondo.",
    precio: 59.9,
    stock: 48,
    sku: "WF-008",
    categoria: "Tops",
    tags: ["basic", "crop"],
    imagenes: ["https://images.unsplash.com/photo-1551163943-3f75319fbc85?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Abrigo trench camel",
    descripcion: "Clásico trench, cinturón incluido.",
    precio: 329.0,
    stock: 8,
    sku: "WF-009",
    categoria: "Abrigos",
    tags: ["trench", "otoño"],
    destacado: true,
    imagenes: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Cardigan oversized",
    descripcion: "Tejido suave, silueta oversize.",
    precio: 139.0,
    stock: 20,
    sku: "WF-010",
    categoria: "Abrigos",
    tags: ["knit", "cozy"],
    imagenes: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Bolso tote cuero",
    descripcion: "Tote diario, asas largas.",
    precio: 199.0,
    stock: 14,
    sku: "WF-011",
    categoria: "Accesorios",
    tags: ["bolso", "cuero"],
    story: true,
    imagenes: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop"],
  },
  {
    nombre: "Sandalias block heel",
    descripcion: "Tacón bloque cómodo, tira cruzada.",
    precio: 159.0,
    stock: 16,
    sku: "WF-012",
    categoria: "Accesorios",
    tags: ["calzado", "verano"],
    imagenes: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1000&fit=crop"],
  },
];

function isHttpUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

async function main() {
  const erp = await getConnection();
  const ecom = await getEcommerceConnection();
  try {
    const [[empresa]] = await erp.query(
      `SELECT id_empresa, id_tenant, ruc, razonSocial, nombreComercial, email, telefono, logotipo, direccion
       FROM empresa WHERE id_empresa = ? LIMIT 1`,
      [ID_EMPRESA]
    );
    if (!empresa) {
      throw Object.assign(new Error(`Empresa id_empresa=${ID_EMPRESA} no encontrada en db_tormenta`), {
        status: 404,
      });
    }

    const nombre =
      (empresa.nombreComercial && String(empresa.nombreComercial).trim()) ||
      (empresa.razonSocial && String(empresa.razonSocial).trim()) ||
      "Textiles Creando Moda";
    const telefono = (empresa.telefono && String(empresa.telefono).trim()) || "999000111";
    const logo_url = isHttpUrl(empresa.logotipo) ? String(empresa.logotipo).trim() : null;
    const descripcion = `${nombre} · Moda femenina. Catálogo sincronizado desde ERP empresa #${ID_EMPRESA}.`;
    const color_primario = "#BE185D";
    const email = ADMIN_EMAIL;

    await ecom.beginTransaction();

    let [[tienda]] = await ecom.query(`SELECT id_tienda FROM tienda WHERE slug = ? LIMIT 1`, [SLUG]);
    if (!tienda) {
      const [[legacy]] = await ecom.query(`SELECT id_tienda FROM tienda WHERE slug = ? LIMIT 1`, [LEGACY_SLUG]);
      if (legacy) {
        await ecom.query(`UPDATE tienda SET slug = ?, email = ? WHERE id_tienda = ?`, [
          SLUG,
          email,
          legacy.id_tienda,
        ]);
        const [[newUsua]] = await ecom.query(`SELECT id_usuario FROM usuario WHERE usua = ? LIMIT 1`, [
          ADMIN_USUA,
        ]);
        if (!newUsua) {
          await ecom.query(`UPDATE usuario SET usua = ?, email = ? WHERE id_tienda = ? AND usua = ?`, [
            ADMIN_USUA,
            ADMIN_EMAIL,
            legacy.id_tienda,
            LEGACY_USUA,
          ]);
        }
        tienda = legacy;
      }
    }

    if (!tienda) {
      const [ins] = await ecom.query(
        `INSERT INTO tienda
          (id_plan, slug, nombre, email, telefono, estado, fecha_pago, descripcion, color_primario, logo_url, theme_json, legacy_tenant_id)
         VALUES (1, ?, ?, ?, ?, 'active', CURDATE(), ?, ?, ?, ?, ?)`,
        [
          SLUG,
          nombre,
          email,
          telefono,
          descripcion,
          color_primario,
          logo_url,
          JSON.stringify(THEME),
          empresa.id_tenant || null,
        ]
      );
      tienda = { id_tienda: ins.insertId };
    } else {
      await ecom.query(
        `UPDATE tienda SET
          nombre = ?, email = ?, telefono = ?, descripcion = ?, color_primario = ?,
          logo_url = COALESCE(?, logo_url), estado = 'active', theme_json = ?, legacy_tenant_id = ?
         WHERE id_tienda = ?`,
        [
          nombre,
          email,
          telefono,
          descripcion,
          color_primario,
          logo_url,
          JSON.stringify(THEME),
          empresa.id_tenant || null,
          tienda.id_tienda,
        ]
      );
    }

    const id_tienda = tienda.id_tienda;
    const hash = await hashPassword(ADMIN_CLAVE);
    await ecom.query(
      `INSERT INTO usuario (id_tienda, usua, password_hash, email, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, 'admin', 1)
       ON DUPLICATE KEY UPDATE
         id_tienda = VALUES(id_tienda),
         password_hash = VALUES(password_hash),
         email = VALUES(email),
         nombre = VALUES(nombre),
         rol = 'admin',
         estado = 1`,
      [id_tienda, ADMIN_USUA, hash, ADMIN_EMAIL, `Admin ${nombre}`]
    );
    await ecom.query(`DELETE FROM usuario WHERE id_tienda = ? AND usua = ?`, [id_tienda, LEGACY_USUA]);

    const enc = encryptMpToken(MP_TEST_ACCESS_TOKEN);
    await ecom.query(
      `INSERT INTO mp_cuenta (id_tienda, public_key, access_token_enc, modo, conectado_en)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         public_key = VALUES(public_key),
         access_token_enc = VALUES(access_token_enc),
         modo = VALUES(modo),
         conectado_en = NOW()`,
      [id_tienda, MP_TEST_PUBLIC_KEY, enc, MP_TEST_MODO]
    );

    let inserted = 0;
    for (const p of PRODUCTOS) {
      const attrs = {
        categoria: p.categoria,
        tags: p.tags,
        destacado: p.destacado || false,
        story: p.story || false,
      };
      const [[exist]] = await ecom.query(
        `SELECT id_producto FROM producto WHERE id_tienda = ? AND sku = ? LIMIT 1`,
        [id_tienda, p.sku]
      );
      let idProducto = exist?.id_producto;
      if (!idProducto) {
        const [ins] = await ecom.query(
          `INSERT INTO producto
            (id_tienda, nombre, descripcion, precio, stock, stock_min, activo, sku, categoria, attrs_json)
           VALUES (?, ?, ?, ?, ?, 5, 1, ?, ?, ?)`,
          [id_tienda, p.nombre, p.descripcion, p.precio, p.stock, p.sku, p.categoria, JSON.stringify(attrs)]
        );
        idProducto = ins.insertId;
        inserted += 1;
      } else {
        await ecom.query(
          `UPDATE producto SET
            nombre = ?, descripcion = ?, precio = ?, stock = ?, activo = 1, categoria = ?, attrs_json = ?
           WHERE id_producto = ? AND id_tienda = ?`,
          [p.nombre, p.descripcion, p.precio, p.stock, p.categoria, JSON.stringify(attrs), idProducto, id_tienda]
        );
      }

      const [imgs] = await ecom.query(
        `SELECT id_imagen, orden FROM producto_imagen WHERE id_producto = ? AND id_tienda = ? ORDER BY orden ASC`,
        [idProducto, id_tienda]
      );
      for (let i = 0; i < p.imagenes.length; i++) {
        const url = p.imagenes[i];
        const existing = imgs[i];
        if (!existing) {
          await ecom.query(
            `INSERT INTO producto_imagen (id_tienda, id_producto, url, file_id, orden, es_principal)
             VALUES (?, ?, ?, NULL, ?, ?)`,
            [id_tienda, idProducto, url, i, i === 0 ? 1 : 0]
          );
        } else {
          await ecom.query(
            `UPDATE producto_imagen SET url = ?, es_principal = ? WHERE id_imagen = ? AND id_tienda = ?`,
            [url, i === 0 ? 1 : 0, existing.id_imagen, id_tienda]
          );
        }
      }
    }

    await ecom.commit();

    const [[count]] = await ecom.query(
      `SELECT COUNT(*) AS c FROM producto WHERE id_tienda = ? AND activo = 1`,
      [id_tienda]
    );
    const [[mp]] = await ecom.query(`SELECT public_key, modo FROM mp_cuenta WHERE id_tienda = ?`, [id_tienda]);

    console.log(
      JSON.stringify(
        {
          ok: true,
          empresa: {
            id_empresa: empresa.id_empresa,
            id_tenant: empresa.id_tenant,
            nombre,
            logo: Boolean(logo_url),
          },
          tienda: { id_tienda, slug: SLUG, storefront: `/tienda/${SLUG}` },
          admin: {
            login: "/login?mode=ecommerce",
            usuario: ADMIN_USUA,
            password: ADMIN_CLAVE,
            email: ADMIN_EMAIL,
          },
          mp: { conectado: Boolean(mp), modo: mp?.modo || null, public_key_prefix: mp?.public_key?.slice(0, 20) + "…" },
          productos_activos: Number(count.c),
          productos_insertados_ahora: inserted,
        },
        null,
        2
      )
    );
  } catch (e) {
    try {
      await ecom.rollback();
    } catch {
      /* noop */
    }
    console.error(e.message || e);
    process.exitCode = 1;
  } finally {
    erp.release();
    ecom.release();
  }
}

main();
