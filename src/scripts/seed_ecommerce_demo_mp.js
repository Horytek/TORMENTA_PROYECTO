import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { encryptMpToken } from "../utils/ecommerceCrypto.js";

/** Credenciales TEST MP (seller) para la tienda demo — no commitear otros secretos. */
const PUBLIC_KEY = "APP_USR-f16a9fa9-9f78-4ff7-9732-96dafdcbd619";
const ACCESS_TOKEN = "APP_USR-1716133749770429-080522-6b702966950736ef24fbe2ea653f43ad-3594962498";
const SLUG = "demo-horytek";

const c = await getEcommerceConnection();
try {
  const [[tienda]] = await c.query(`SELECT id_tienda, slug FROM tienda WHERE slug = ? LIMIT 1`, [SLUG]);
  if (!tienda) {
    console.error("Tienda demo no encontrada. Corre primero: node src/scripts/seed_ecommerce_demo.js");
    process.exitCode = 1;
    process.exit();
  }

  const enc = encryptMpToken(ACCESS_TOKEN);
  await c.query(
    `INSERT INTO mp_cuenta (id_tienda, public_key, access_token_enc, modo, conectado_en)
     VALUES (?, ?, ?, 'test', NOW())
     ON DUPLICATE KEY UPDATE
       public_key = VALUES(public_key),
       access_token_enc = VALUES(access_token_enc),
       modo = 'test',
       conectado_en = NOW()`,
    [tienda.id_tienda, PUBLIC_KEY, enc]
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: tienda.slug,
        id_tienda: tienda.id_tienda,
        mp_modo: "test",
        public_key_prefix: PUBLIC_KEY.slice(0, 20) + "…",
        message: "Credenciales MP TEST guardadas en mp_cuenta",
      },
      null,
      2
    )
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  c.release();
}
