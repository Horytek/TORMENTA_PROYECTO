/**
 * Añade theme_json a ecommerce_tienda vía pool de la app.
 * Uso: node src/scripts/migrate_ecommerce_theme_json.js
 */
import { getConnection } from "../database/database.js";
import { DATABASE } from "../config.js";

const c = await getConnection();
try {
  const [filas] = await c.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ecommerce_tienda' AND COLUMN_NAME = 'theme_json'`,
    [DATABASE]
  );
  if (filas.length > 0) {
    console.log(JSON.stringify({ ok: true, skipped: true, column: "theme_json" }));
  } else {
    await c.query(`ALTER TABLE ecommerce_tienda ADD COLUMN theme_json JSON NULL AFTER logo_url`);
    console.log(JSON.stringify({ ok: true, created: "theme_json" }));
  }
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  c.release();
  process.exit(process.exitCode || 0);
}
