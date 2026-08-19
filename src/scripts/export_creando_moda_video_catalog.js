/**
 * Exporta catálogo real de Textiles Creando Moda → creandoModa.data.generated.ts
 *
 * Uso:
 *   npm run export:creando-moda-video
 *   npm run export:creando-moda-video -- --source=db
 *   npm run export:creando-moda-video -- --api-url=https://… --json out/catalog.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEcommerceConnection } from "../database/database_ecommerce.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DEFAULT_API =
  "https://www.horycore.online/api/ecommerce/store/textiles_creando_moda";
const SLUG = "textiles_creando_moda";
const OUT_TS = path.join(
  ROOT,
  "client-v2/src/features/ecommerce/video/tiktok/creandoModa.data.generated.ts"
);

function parseArgs(argv) {
  const args = { source: "api", apiUrl: DEFAULT_API, json: null };
  for (const arg of argv) {
    if (arg.startsWith("--source=")) args.source = arg.slice(9);
    else if (arg.startsWith("--api-url=")) args.apiUrl = arg.slice(10);
    else if (arg.startsWith("--json")) {
      args.json = arg.includes("=") ? arg.slice(6) : "out/catalog.json";
    }
  }
  return args;
}

function formatPen(n) {
  return `S/ ${Number(n).toFixed(2)}`;
}

function parseAttrs(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Presets de crop para DetailZoom v2. */
const DEFAULT_CROP_REGIONS = {
  full: { objectPosition: "50% 35%", scale: 1.08 },
  detail: { objectPosition: "50% 62%", scale: 1.45 },
  texture: { objectPosition: "50% 48%", scale: 1.7 },
};

function normalizeProduct(p) {
  const attrs = parseAttrs(p.attrs_json);
  const price = Number(p.precio);
  const tonalidad = attrs.atributos?.tonalidad ?? [];
  const tallas = attrs.atributos?.talla ?? [];
  const featured = Boolean(attrs.destacado);
  const story = Boolean(attrs.story);

  return {
    id_producto: p.id_producto,
    sku: p.sku ?? null,
    name: p.nombre,
    description: p.descripcion ?? null,
    category: p.categoria ?? attrs.categoria ?? null,
    price,
    priceLabel: formatPen(price),
    stock: Number(p.stock) || 0,
    featured,
    story,
    image: p.imagen_url,
    images: p.imagen_url ? [p.imagen_url] : [],
    tallas,
    tonalidad,
    objectPosition: "50% 35%",
    cropRegions: { ...DEFAULT_CROP_REGIONS },
  };
}

function rejectUnsplash(url, ctx) {
  if (url && String(url).includes("unsplash.com")) {
    throw new Error(`URL Unsplash detectada (${ctx}): ${url}`);
  }
}

function validateProducts(products) {
  const valid = [];
  for (const p of products) {
    if (!p.image) {
      console.warn(`  ⚠ Omitido sin imagen: ${p.name} (#${p.id_producto})`);
      continue;
    }
    rejectUnsplash(p.image, p.name);
    for (const img of p.images) rejectUnsplash(img, p.name);
    valid.push(p);
  }
  if (!valid.length) throw new Error("No hay productos válidos con imagen.");
  return valid;
}

function uniqueCategories(products) {
  const set = new Set();
  for (const p of products) {
    if (p.category) set.add(p.category);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

function pickImpact(products) {
  const byCat = new Map();
  for (const p of products) {
    const cat = (p.category || "Otros").toLowerCase();
    if (!byCat.has(cat)) byCat.set(cat, p);
  }
  const varied = [...byCat.values()];
  const rest = products.filter((p) => !varied.includes(p));
  const picks = [...varied, ...rest].slice(0, 6);
  return picks.map((p) => p.id_producto);
}

function pickScenePicks(products) {
  const featured = products.find((p) => p.featured);
  const storyProducts = products.filter((p) => p.story);
  const cinematic = storyProducts[0] ?? products[0];
  const hero = featured ?? products[0];
  const secondary = products
    .filter((p) => p.id_producto !== hero.id_producto)
    .slice(0, 2)
    .map((p) => p.id_producto);

  const banner =
    storyProducts[0]?.image ??
    hero.image ??
    products[0]?.image ??
    null;

  return {
    banner,
    impact: pickImpact(products),
    editorial: { hero: hero.id_producto, secondary },
    cinematic: cinematic.id_producto,
    storefront: hero.id_producto,
  };
}

/** Selección de productos para escenas v2 (fashion reel). */
function pickScenePicksV2(products) {
  const featured = products.find((p) => p.featured);
  const storyProducts = products.filter((p) => p.story);
  const hero = featured ?? products.find((p) => p.id_producto === 70) ?? products[0];
  const hook = storyProducts[0] ?? hero ?? products[0];
  const experience = storyProducts[0] ?? hook;

  const byCat = new Map();
  for (const p of products) {
    const cat = (p.category || "Otros").toLowerCase();
    if (!byCat.has(cat)) byCat.set(cat, p);
  }
  const collection = [...byCat.values()]
    .filter((p) => p.id_producto !== hook.id_producto)
    .slice(0, 3)
    .map((p) => p.id_producto);
  while (collection.length < 3 && products.length > collection.length) {
    const next = products.find((p) => !collection.includes(p.id_producto) && p.id_producto !== hook.id_producto);
    if (!next) break;
    collection.push(next.id_producto);
  }

  const catalogCandidates = products
    .filter((p) => p.id_producto !== hero.id_producto)
    .slice(0, 6);
  const catalogScroll = catalogCandidates.slice(0, 3).map((p) => p.id_producto);

  const overlayBg = experience ?? hero;
  const overlayCard = hero;

  return {
    hook: hook.id_producto,
    collection,
    productHero: hero.id_producto,
    catalogScroll,
    experience: experience.id_producto,
    overlay: {
      background: overlayBg.id_producto,
      card: overlayCard.id_producto,
    },
  };
}

function buildBrand(tienda, products) {
  const theme = tienda.theme_json ?? {};
  const prices = products.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    name: tienda.nombre,
    slug: tienda.slug ?? SLUG,
    storeUrl: `https://www.horycore.online/tienda/${tienda.slug ?? SLUG}`,
    logoUrl: tienda.logo_url ?? null,
    whatsappViaStore: true,
    accent: tienda.color_primario ?? "#BE185D",
    bg: "#FAF7F5",
    ink: "#1C1917",
    priceFrom: formatPen(min),
    priceTo: formatPen(max),
    heroHeadline: theme.hero_headline ?? "Nueva temporada femenina",
    heroTagline: theme.hero_tagline ?? "Vestidos, blusas y denim listos para tu vitrina.",
    tagline: "Moda que habla de ti.",
    concept: "Tu estilo empieza aquí.",
    trust: {
      envio: theme.trust?.envio ?? "Envío Lima",
      pago: theme.trust?.pago ?? "Mercado Pago",
      soporte: "WhatsApp en la tienda",
    },
  };
}

async function fetchFromApi(apiUrl) {
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`API ${res.status}: ${apiUrl}`);
  const body = await res.json();
  if (!body.success || !body.data) throw new Error("Respuesta API inválida.");
  return { source: apiUrl, tienda: body.data.tienda, productosRaw: body.data.productos };
}

async function fetchFromDb() {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, color_primario, logo_url, descripcion, estado, theme_json
       FROM tienda WHERE slug = ? LIMIT 1`,
      [SLUG]
    );
    if (!tienda || tienda.estado !== "active") {
      throw new Error(`Tienda ${SLUG} no encontrada o inactiva en db_ecommerce.`);
    }
    if (typeof tienda.theme_json === "string") {
      tienda.theme_json = JSON.parse(tienda.theme_json);
    }

    const [productosRaw] = await connection.query(
      `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, p.sku, p.categoria, p.attrs_json,
         (SELECT url FROM producto_imagen i
          WHERE i.id_producto = p.id_producto AND i.id_tienda = p.id_tienda
            AND i.tipo = 'galeria'
          ORDER BY i.es_principal DESC, i.orden ASC LIMIT 1) AS imagen_url
       FROM producto p
       WHERE p.id_tienda = ? AND p.activo = 1
       ORDER BY p.nombre ASC`,
      [tienda.id_tienda]
    );

    return { source: "db_ecommerce", tienda, productosRaw };
  } finally {
    if (connection) connection.release();
  }
}

function emitTypeScript({ source, brand, products, categories, scenePicks, scenePicksV2 }) {
  const generatedAt = new Date().toISOString();
  const payload = {
    GENERATED_AT: generatedAt,
    SOURCE: source,
    BRAND: brand,
    PRODUCTS: products,
    CATEGORIES: categories,
    SCENE_PICKS: scenePicks,
    SCENE_PICKS_V2: scenePicksV2,
  };

  const lines = [
    "/** AUTO-GENERADO — npm run export:creando-moda-video */",
    "/* eslint-disable */",
    "",
    `export const GENERATED_AT = ${JSON.stringify(generatedAt)};`,
    `export const SOURCE = ${JSON.stringify(source)};`,
    "",
    "export type CreandoModaTonalidad = { hex: string; nombre: string };",
    "",
    "export type CreandoModaCropRegion = { objectPosition: string; scale: number };",
    "",
    "export type CreandoModaProduct = {",
    "  id_producto: number;",
    "  sku: string | null;",
    "  name: string;",
    "  description: string | null;",
    "  category: string | null;",
    "  price: number;",
    "  priceLabel: string;",
    "  stock: number;",
    "  featured: boolean;",
    "  story: boolean;",
    "  image: string;",
    "  images: string[];",
    "  tallas: string[];",
    "  tonalidad: CreandoModaTonalidad[];",
    "  objectPosition?: string;",
    "  cropRegions?: { full: CreandoModaCropRegion; detail: CreandoModaCropRegion; texture: CreandoModaCropRegion };",
    "};",
    "",
    `export const BRAND = ${JSON.stringify(brand, null, 2)} as const;`,
    "",
    `export const PRODUCTS: CreandoModaProduct[] = ${JSON.stringify(products, null, 2)};`,
    "",
    `export const CATEGORIES: string[] = ${JSON.stringify(categories, null, 2)};`,
    "",
    `export const SCENE_PICKS = ${JSON.stringify(scenePicks, null, 2)} as const;`,
    "",
    `export const SCENE_PICKS_V2 = ${JSON.stringify(scenePicksV2, null, 2)} as const;`,
    "",
  ];

  fs.mkdirSync(path.dirname(OUT_TS), { recursive: true });
  fs.writeFileSync(OUT_TS, lines.join("\n"), "utf8");
  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n📦 Export Creando Moda — source=${args.source}\n`);

  const raw =
    args.source === "db"
      ? await fetchFromDb()
      : await fetchFromApi(args.apiUrl);

  const products = validateProducts(raw.productosRaw.map(normalizeProduct));
  const categories = uniqueCategories(products);
  const brand = buildBrand(raw.tienda, products);
  const scenePicks = pickScenePicks(products);
  const scenePicksV2 = pickScenePicksV2(products);

  const payload = emitTypeScript({
    source: raw.source,
    brand,
    products,
    categories,
    scenePicks,
    scenePicksV2,
  });

  if (args.json) {
    const jsonPath = path.resolve(ROOT, args.json);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`  JSON → ${jsonPath}`);
  }

  console.log(`  Productos: ${products.length}`);
  console.log(`  Categorías: ${categories.join(", ")}`);
  console.log(`  Precios: ${brand.priceFrom} — ${brand.priceTo}`);
  console.log(`  Impact picks: ${scenePicks.impact.length}`);
  console.log(`  Hero editorial: #${scenePicks.editorial.hero}`);
  console.log(`  Cinematic: #${scenePicks.cinematic}`);
  console.log(`  V2 hook: #${scenePicksV2.hook}`);
  console.log(`  V2 productHero: #${scenePicksV2.productHero}`);
  console.log(`  TS → ${OUT_TS}\n`);
  console.log("✅ Export completado.\n");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
