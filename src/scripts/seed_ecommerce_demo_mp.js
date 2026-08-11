import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { encryptMpToken } from "../utils/ecommerceCrypto.js";
import { MP_TEST_ACCESS_TOKEN, MP_TEST_MODO, MP_TEST_PUBLIC_KEY } from "./ecommerce_mp_test_creds.js";

const SLUG = process.env.ECOM_SYNC_SLUG || "textiles_creando_moda";

const c = await getEcommerceConnection();
try {
  const [[tienda]] = await c.query(`SELECT id_tienda, slug FROM tienda WHERE slug = ? LIMIT 1`, [SLUG]);
  if (!tienda) {
    console.error(`Tienda ${SLUG} no encontrada. Corre primero: npm run sync:empresa-ecommerce`);
    process.exitCode = 1;
    process.exit();
  }

  const enc = encryptMpToken(MP_TEST_ACCESS_TOKEN);
  await c.query(
    `INSERT INTO mp_cuenta (id_tienda, public_key, access_token_enc, modo, conectado_en)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       public_key = VALUES(public_key),
       access_token_enc = VALUES(access_token_enc),
       modo = VALUES(modo),
       conectado_en = NOW()`,
    [tienda.id_tienda, MP_TEST_PUBLIC_KEY, enc, MP_TEST_MODO]
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: tienda.slug,
        id_tienda: tienda.id_tienda,
        mp_modo: MP_TEST_MODO,
        public_key_prefix: MP_TEST_PUBLIC_KEY.slice(0, 20) + "…",
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
