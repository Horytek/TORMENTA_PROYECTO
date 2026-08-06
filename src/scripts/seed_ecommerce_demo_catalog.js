/**
 * Seed idempotente del catálogo demo para Vitrina Escénica.
 * Tenant/slug: demo-horytek (800001) — crea tienda si no existe y pobla 14 productos.
 *
 * Uso: node src/scripts/seed_ecommerce_demo_catalog.js
 */
import { getConnection } from "../database/database.js";
import { hashPassword } from "../utils/passwordUtil.js";

const slug = "demo-horytek";
const email = "demo-ecommerce@horytek.test";
const usua = "ecom_demo";
const clave = "DemoEcom2026!";
const id_tenant = 800001;

const TIENDA = {
  nombre: "Demo Horytek Shop",
  descripcion:
    "Vitrina de prueba con productos reales de Tecnología, Hogar, Moda y Deportes. Explora, filtra y paga con Mercado Pago en modo test.",
  color_primario: "#0E7C7B",
  logo_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
  telefono: "999000111",
};

/** @type {{ nombre: string; descripcion: string; precio: number; stock: number; sku: string; categoria: string; imagen: string }[]} */
const PRODUCTOS = [
  {
    nombre: "Auriculares inalámbricos Nova",
    descripcion:
      "Sonido envolvente con cancelación activa de ruido y hasta 30 h de batería. Ideales para oficina, viaje o gym.",
    precio: 189.9,
    stock: 24,
    sku: "TEC-AUR-001",
    categoria: "Tecnología",
    imagen: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
  },
  {
    nombre: "Smartwatch Pulse 3",
    descripcion:
      "Monitoreo cardíaco, GPS y notificaciones. Pantalla AMOLED resistente al agua. Correa intercambiable.",
    precio: 349.0,
    stock: 15,
    sku: "TEC-WAT-002",
    categoria: "Tecnología",
    imagen: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
  },
  {
    nombre: "Parlante portátil Echo Mini",
    descripcion: "Bluetooth 5.3, graves profundos y 12 h de reproducción. Compacto para llevar a donde quieras.",
    precio: 129.5,
    stock: 40,
    sku: "TEC-SPK-003",
    categoria: "Tecnología",
    imagen: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop",
  },
  {
    nombre: "Cámara de acción StormCam",
    descripcion: "4K60, estabilización electrónica y carcasa sumergible. Captura cada salida sin complicaciones.",
    precio: 499.0,
    stock: 8,
    sku: "TEC-CAM-004",
    categoria: "Tecnología",
    imagen: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop",
  },
  {
    nombre: "Lámpara de escritorio Arc",
    descripcion: "Luz LED regulable con tres temperaturas de color. Brazo flexible y base antideslizante.",
    precio: 79.9,
    stock: 32,
    sku: "HOG-LAM-001",
    categoria: "Hogar",
    imagen: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
  },
  {
    nombre: "Set de vasos Nord 6 pzas",
    descripcion: "Vidrio templado de líneas limpias. Aptos para lavavajillas. Presentación en caja de regalo.",
    precio: 59.0,
    stock: 50,
    sku: "HOG-VAS-002",
    categoria: "Hogar",
    imagen: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop",
  },
  {
    nombre: "Silla ergonómica Loom",
    descripcion: "Soporte lumbar ajustable, malla transpirable y ruedas silenciosas. Pensada para jornadas largas.",
    precio: 689.0,
    stock: 6,
    sku: "HOG-SIL-003",
    categoria: "Hogar",
    imagen: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=800&fit=crop",
  },
  {
    nombre: "Difusor aromático Nube",
    descripcion: "Ultrasónico con temporizador y luz ambiente. Incluye kit de aromas de bienvenida.",
    precio: 94.5,
    stock: 28,
    sku: "HOG-DIF-004",
    categoria: "Hogar",
    imagen: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&h=800&fit=crop",
  },
  {
    nombre: "Chaqueta urbana Meridian",
    descripcion: "Corte slim, tejido resistente al viento y bolsillos internos. Disponible en tonos neutros.",
    precio: 219.0,
    stock: 18,
    sku: "MOD-CHA-001",
    categoria: "Moda",
    imagen: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop",
  },
  {
    nombre: "Zapatillas Daily Run",
    descripcion: "Suela amortiguada y upper liviano. Perfectas para caminar la ciudad o entrenamientos suaves.",
    precio: 279.9,
    stock: 22,
    sku: "MOD-ZAP-002",
    categoria: "Moda",
    imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
  },
  {
    nombre: "Mochila City Pack 20L",
    descripcion: "Compartimento laptop 15\", bolsillo antirrebo y tela impermeable. Diseño minimalista.",
    precio: 159.0,
    stock: 35,
    sku: "MOD-MOC-003",
    categoria: "Moda",
    imagen: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
  },
  {
    nombre: "Gafas polarizadas Coast",
    descripcion: "Lentes UV400 con montura ligera. Incluye estuche rígido y paño de microfibra.",
    precio: 119.0,
    stock: 3,
    sku: "MOD-GAF-004",
    categoria: "Moda",
    imagen: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
  },
  {
    nombre: "Mat de yoga Grip Pro",
    descripcion: "6 mm de densidad, superficie antideslizante y correa de transporte. Fácil de limpiar.",
    precio: 89.0,
    stock: 45,
    sku: "DEP-MAT-001",
    categoria: "Deportes",
    imagen: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop",
  },
  {
    nombre: "Botella térmica Trail 750ml",
    descripcion: "Acero inoxidable, mantiene frío 24 h y calor 12 h. Tapa hermética con asa.",
    precio: 69.9,
    stock: 60,
    sku: "DEP-BOT-002",
    categoria: "Deportes",
    imagen: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop",
  },
];

const c = await getConnection();
try {
  await c.beginTransaction();

  let [[tienda]] = await c.query(
    "SELECT id_tienda, id_tenant FROM ecommerce_tienda WHERE slug = ? LIMIT 1",
    [slug]
  );

  if (!tienda) {
    const hash = await hashPassword(clave);
    await c.query(
      `INSERT INTO ecommerce_tienda
        (id_tenant, id_plan, slug, nombre, email, telefono, estado, fecha_pago, descripcion, color_primario, logo_url)
       VALUES (?, 1, ?, ?, ?, ?, 'active', CURDATE(), ?, ?, ?)`,
      [
        id_tenant,
        slug,
        TIENDA.nombre,
        email,
        TIENDA.telefono,
        TIENDA.descripcion,
        TIENDA.color_primario,
        TIENDA.logo_url,
      ]
    );
    await c.query(
      `INSERT INTO ecommerce_usuario
        (id_tenant, usua, password_hash, clave_acceso, email, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), estado = 1`,
      [id_tenant, usua, hash, clave, email, "Admin Demo"]
    );
    [[tienda]] = await c.query(
      "SELECT id_tienda, id_tenant FROM ecommerce_tienda WHERE slug = ? LIMIT 1",
      [slug]
    );
  }

  const tenantId = tienda.id_tenant;

  await c.query(
    `UPDATE ecommerce_tienda SET
      nombre = ?, descripcion = ?, color_primario = ?, logo_url = ?, telefono = ?, estado = 'active'
     WHERE id_tienda = ?`,
    [
      TIENDA.nombre,
      TIENDA.descripcion,
      TIENDA.color_primario,
      TIENDA.logo_url,
      TIENDA.telefono,
      tienda.id_tienda,
    ]
  );

  // Desactivar productos basura de prueba
  await c.query(
    `UPDATE ecommerce_producto SET activo = 0
     WHERE id_tenant = ? AND (nombre LIKE 'asdasd%' OR nombre LIKE 'test%' OR CHAR_LENGTH(TRIM(nombre)) < 4)`,
    [tenantId]
  );

  const [[cntClean]] = await c.query(
    `SELECT COUNT(*) AS c FROM ecommerce_producto
     WHERE id_tenant = ? AND activo = 1 AND sku REGEXP '^(TEC|HOG|MOD|DEP)-'`,
    [tenantId]
  );

  let inserted = 0;
  if (Number(cntClean.c) < 12) {
    for (const p of PRODUCTOS) {
      const [[exist]] = await c.query(
        `SELECT id_producto FROM ecommerce_producto WHERE id_tenant = ? AND sku = ? LIMIT 1`,
        [tenantId, p.sku]
      );
      let idProducto = exist?.id_producto;
      if (!idProducto) {
        const [ins] = await c.query(
          `INSERT INTO ecommerce_producto
            (id_tenant, nombre, descripcion, precio, stock, stock_min, activo, sku, attrs_json)
           VALUES (?, ?, ?, ?, ?, 5, 1, ?, ?)`,
          [
            tenantId,
            p.nombre,
            p.descripcion,
            p.precio,
            p.stock,
            p.sku,
            JSON.stringify({ categoria: p.categoria }),
          ]
        );
        idProducto = ins.insertId;
        inserted += 1;
      } else {
        await c.query(
          `UPDATE ecommerce_producto SET
            nombre = ?, descripcion = ?, precio = ?, stock = ?, activo = 1, attrs_json = ?
           WHERE id_producto = ? AND id_tenant = ?`,
          [
            p.nombre,
            p.descripcion,
            p.precio,
            p.stock,
            JSON.stringify({ categoria: p.categoria }),
            idProducto,
            tenantId,
          ]
        );
      }

      const [[img]] = await c.query(
        `SELECT id_imagen FROM ecommerce_producto_imagen
         WHERE id_producto = ? AND id_tenant = ? LIMIT 1`,
        [idProducto, tenantId]
      );
      if (!img) {
        await c.query(
          `INSERT INTO ecommerce_producto_imagen
            (id_tenant, id_producto, url, file_id, orden, es_principal)
           VALUES (?, ?, ?, NULL, 0, 1)`,
          [tenantId, idProducto, p.imagen]
        );
      } else {
        await c.query(
          `UPDATE ecommerce_producto_imagen SET url = ?, es_principal = 1
           WHERE id_imagen = ? AND id_tenant = ?`,
          [p.imagen, img.id_imagen, tenantId]
        );
      }
    }
  } else {
    // Refrescar attrs/imágenes de los seed SKUs existentes
    for (const p of PRODUCTOS) {
      const [[exist]] = await c.query(
        `SELECT id_producto FROM ecommerce_producto WHERE id_tenant = ? AND sku = ? LIMIT 1`,
        [tenantId, p.sku]
      );
      if (!exist) continue;
      await c.query(
        `UPDATE ecommerce_producto SET attrs_json = ?, activo = 1
         WHERE id_producto = ? AND id_tenant = ?`,
        [JSON.stringify({ categoria: p.categoria }), exist.id_producto, tenantId]
      );
    }
  }

  await c.commit();

  const [[finalCount]] = await c.query(
    `SELECT COUNT(*) AS c FROM ecommerce_producto WHERE id_tenant = ? AND activo = 1`,
    [tenantId]
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug,
        id_tenant: tenantId,
        storefront: `/tienda/${slug}`,
        productos_activos: Number(finalCount.c),
        insertados_ahora: inserted,
        skipped_bulk: Number(cntClean.c) >= 12,
        admin: { login: "/login?mode=ecommerce", usuario: usua, password: clave },
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
}
