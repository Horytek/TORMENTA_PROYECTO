/**
 * Verifica que theme_json se puede leer/escribir en demo-horytek.
 * Uso: node src/scripts/verify_ecommerce_theme.js
 */
import { getConnection } from "../database/database.js";

const theme = {
  preset: "clara",
  font_display: "outfit",
  font_body: "manrope",
  header_style: "light",
  hero_headline: "Tu vitrina, tu estilo",
  hero_tagline: "Configuración adaptativa de Demo Horytek",
  banner_url: null,
  sections: { stage: true, categories: true, trust: true, stories: false, rails: true },
  trust: { envio: "Envío Lima", pago: "Mercado Pago", soporte: "WhatsApp tienda" },
};

const c = await getConnection();
try {
  await c.query(
    `UPDATE ecommerce_tienda SET theme_json = ? WHERE slug = 'demo-horytek'`,
    [JSON.stringify(theme)]
  );
  const [[row]] = await c.query(
    `SELECT slug, JSON_EXTRACT(theme_json, '$.preset') AS preset,
            JSON_EXTRACT(theme_json, '$.sections.stories') AS stories
     FROM ecommerce_tienda WHERE slug = 'demo-horytek' LIMIT 1`
  );
  console.log(JSON.stringify({ ok: true, row }, null, 2));
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  c.release();
  process.exit(process.exitCode || 0);
}
